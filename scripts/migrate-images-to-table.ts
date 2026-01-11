/**
 * 기존 게시글의 이미지를 images 테이블에 등록하는 마이그레이션 스크립트
 * 
 * 실행 방법:
 * npm run migrate-images
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// .env 파일 읽기
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), ".env");
    const envContent = readFileSync(envPath, "utf-8");
    const envVars: Record<string, string> = {};
    
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    return {};
  }
}

const envFile = loadEnvFile();

const supabaseUrl = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  envFile.VITE_SUPABASE_URL || 
  envFile.SUPABASE_URL;
  
const supabaseAnonKey = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  envFile.VITE_SUPABASE_ANON_KEY || 
  envFile.SUPABASE_ANON_KEY;
  
const supabaseServiceKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  envFile.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, supabaseAnonKey);

// 마크다운에서 이미지 URL 추출
function extractImageUrlsFromMarkdown(content: string): string[] {
  const imageUrlRegex = /!\[.*?\]\((.*?)\)/g;
  const imageUrls: string[] = [];
  let match;
  while ((match = imageUrlRegex.exec(content)) !== null) {
    const url = match[1];
    if (url && !imageUrls.includes(url)) {
      imageUrls.push(url);
    }
  }
  return imageUrls;
}

// URL에서 storage_path 추출
function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

// Storage에서 파일 존재 여부 확인
async function checkStorageFileExists(storagePath: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from("images")
      .download(storagePath);
    
    if (error) {
      return false;
    }
    
    return data !== null;
  } catch (error) {
    return false;
  }
}

async function migrateImages() {
  console.log("🔄 이미지 마이그레이션 시작...\n");

  try {
    // 현재 세션 확인 (user_id 필요)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("❌ 인증 세션이 필요합니다. 관리자로 로그인해주세요.");
      console.error("   또는 SUPABASE_SERVICE_ROLE_KEY를 환경 변수로 설정하세요.");
      return;
    }

    const userId = session.user.id;
    console.log(`✅ 사용자 ID: ${userId}\n`);

    // 모든 게시글 가져오기
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, title, slug, content, cover_image, author_id");

    if (postsError) {
      console.error("❌ 게시글 조회 실패:", postsError.message);
      return;
    }

    console.log(`📝 총 ${posts?.length || 0}개의 게시글 발견\n`);

    // 모든 이미지 URL 수집
    const allImageUrls = new Set<string>();
    const postImageMap = new Map<string, string[]>(); // post_id -> image_urls[]

    posts?.forEach((post) => {
      const imageUrls = extractImageUrlsFromMarkdown(post.content || "");
      imageUrls.forEach((url) => allImageUrls.add(url));
      if (imageUrls.length > 0) {
        postImageMap.set(post.id, imageUrls);
      }
    });

    console.log(`🖼️  총 ${allImageUrls.size}개의 고유 이미지 URL 발견\n`);

    // 기존 images 테이블의 이미지 확인
    const { data: existingImages, error: existingError } = await supabase
      .from("images")
      .select("public_url");

    if (existingError) {
      console.error("❌ 기존 이미지 조회 실패:", existingError.message);
      return;
    }

    const existingUrls = new Set(existingImages?.map((img) => img.public_url) || []);
    console.log(`📊 기존 images 테이블에 등록된 이미지: ${existingUrls.size}개\n`);

    // 등록되지 않은 이미지 찾기
    const newImageUrls = Array.from(allImageUrls).filter((url) => !existingUrls.has(url));
    console.log(`🆕 등록되지 않은 이미지: ${newImageUrls.length}개\n`);

    if (newImageUrls.length === 0) {
      console.log("✅ 모든 이미지가 이미 등록되어 있습니다.");
      return;
    }

    // 각 이미지를 확인하고 등록
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    console.log("📦 이미지 등록 시작...\n");

    for (const imageUrl of newImageUrls) {
      const storagePath = extractStoragePathFromUrl(imageUrl);
      
      if (!storagePath) {
        console.log(`⚠️  URL 파싱 실패: ${imageUrl}`);
        skipCount++;
        continue;
      }

      // Storage에 파일이 있는지 확인
      const exists = await checkStorageFileExists(storagePath);
      
      if (!exists) {
        console.log(`⏭️  Storage에 없음 (건너뜀): ${storagePath}`);
        skipCount++;
        continue;
      }

      // images 테이블에 등록
      // 게시글에 사용 중이므로 'active' 상태로 등록
      const { error: insertError } = await supabase
        .from("images")
        .insert({
          user_id: userId,
          storage_path: storagePath,
          public_url: imageUrl,
          status: "active", // 게시글에 사용 중이므로 active
        });

      if (insertError) {
        console.error(`❌ 등록 실패: ${storagePath} - ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`✅ 등록 완료: ${storagePath}`);
        successCount++;
      }
    }

    console.log("\n📊 마이그레이션 결과:");
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ⏭️  건너뜀: ${skipCount}개 (Storage에 없음)`);
    console.log(`  ❌ 실패: ${errorCount}개`);

  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

migrateImages();
