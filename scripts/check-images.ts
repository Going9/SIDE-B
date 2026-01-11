/**
 * 데이터베이스 이미지 상태 확인 스크립트
 * 
 * 실행 방법:
 * npx tsx scripts/check-images.ts
 * 
 * 또는 환경 변수 설정:
 * VITE_SUPABASE_URL=your_url VITE_SUPABASE_ANON_KEY=your_key npx tsx scripts/check-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// .env 파일 읽기 시도
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
    // .env 파일이 없으면 무시
    return {};
  }
}

const envFile = loadEnvFile();

// 환경 변수 확인 (process.env 우선, 그 다음 .env 파일)
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
  console.error("VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.");
  process.exit(1);
}

// Service role key가 있으면 사용 (더 많은 데이터 접근 가능)
const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, supabaseAnonKey);

async function checkImages() {
  console.log("🔍 이미지 데이터베이스 상태 확인 중...\n");

  // 마크다운에서 이미지 URL 추출하는 함수
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

  // Storage에서 파일 존재 여부 확인하는 함수
  async function checkStorageFileExists(storagePath: string): Promise<{ exists: boolean; error?: string }> {
    try {
      // 파일 다운로드를 시도해서 존재 여부 확인
      const { data, error } = await supabase.storage
        .from("images")
        .download(storagePath);
      
      if (error) {
        // 404는 파일이 없다는 의미
        if (error.message.includes("404") || error.message.includes("not found") || error.statusCode === "404") {
          return { exists: false, error: "404 Not Found" };
        }
        // 다른 오류
        return { exists: false, error: error.message };
      }
      
      return { exists: data !== null };
    } catch (error) {
      return { exists: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
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

  try {
    // 1. 전체 이미지 통계
    const { data: allImages, error: allError } = await supabase
      .from("images")
      .select("id, storage_path, public_url, status, created_at")
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("❌ 이미지 조회 실패:", allError.message);
      return;
    }

    console.log(`📊 전체 이미지 수: ${allImages?.length || 0}\n`);

    // 2. 상태별 통계
    const statusCounts = {
      temp: 0,
      active: 0,
      deleted: 0,
    };

    allImages?.forEach((img) => {
      statusCounts[img.status as keyof typeof statusCounts]++;
    });

    console.log("📈 상태별 이미지 수:");
    console.log(`  - temp: ${statusCounts.temp}`);
    console.log(`  - active: ${statusCounts.active}`);
    console.log(`  - deleted: ${statusCounts.deleted}\n`);

    // 3. 24시간 이상 된 temp 이미지 확인
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oldTempImages = allImages?.filter(
      (img) => img.status === "temp" && img.created_at < twentyFourHoursAgo
    );

    console.log(`⏰ 24시간 이상 된 temp 이미지: ${oldTempImages?.length || 0}`);
    if (oldTempImages && oldTempImages.length > 0) {
      console.log("\n  삭제 대상 이미지들:");
      oldTempImages.slice(0, 10).forEach((img) => {
        console.log(`    - ${img.storage_path} (생성: ${img.created_at})`);
      });
      if (oldTempImages.length > 10) {
        console.log(`    ... 외 ${oldTempImages.length - 10}개`);
      }
    }

    // 4. 특정 게시글의 이미지 확인
    console.log("\n\n📝 특정 게시글의 이미지 확인:");
    
    // 'a-side-b' 게시글 찾기
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, title, slug, content, cover_image")
      .eq("slug", "a-side-b")
      .single();

    if (postError || !post) {
      console.log("  'a-side-b' 게시글을 찾을 수 없습니다.");
    } else {
      console.log(`  게시글: ${post.title}`);
      console.log(`  Slug: ${post.slug}`);
      
      // 마크다운에서 이미지 URL 추출
      const imageUrls = extractImageUrlsFromMarkdown(post.content);

      console.log(`  마크다운에 포함된 이미지 URL 수: ${imageUrls.length}`);
      if (imageUrls.length > 0) {
        console.log("\n  이미지 URL들:");
        imageUrls.forEach((url) => {
          console.log(`    - ${url}`);
        });

        // 각 이미지가 images 테이블에 있는지 확인 및 Storage 확인
        console.log("\n  images 테이블 및 Storage 확인:");
        for (const url of imageUrls) {
          const matchingImage = allImages?.find((img) => img.public_url === url);
          const storagePath = extractStoragePathFromUrl(url);
          
          if (matchingImage) {
            console.log(`    ✅ ${url}`);
            console.log(`       상태: ${matchingImage.status}, 경로: ${matchingImage.storage_path}`);
            // 모든 상태에서 Storage 확인
            const result = await checkStorageFileExists(matchingImage.storage_path);
            if (result.exists) {
              if (matchingImage.status === "deleted") {
                console.log(`       ⚠️  Storage에는 파일이 존재하지만 상태가 'deleted'임`);
              } else if (matchingImage.status === "active") {
                console.log(`       ✅ Storage에 파일 존재함`);
              }
            } else {
              console.log(`       ❌ Storage에 파일 없음 (삭제됨)`);
              if (result.error) {
                console.log(`          오류: ${result.error}`);
              }
            }
          } else {
            console.log(`    ❌ ${url} - images 테이블에 없음`);
            if (storagePath) {
              console.log(`       Storage 경로: ${storagePath}`);
              const result = await checkStorageFileExists(storagePath);
              if (result.exists) {
                console.log(`       ✅ Storage에 파일 존재함`);
              } else {
                console.log(`       ❌ Storage에 파일 없음 (삭제됨)`);
                if (result.error) {
                  console.log(`          오류: ${result.error}`);
                }
              }
            }
          }
        }
      }
    }

    // 5. 'why-drive-mini-cooper-in-tesla-era' 게시글도 확인
    console.log("\n\n📝 'why-drive-mini-cooper-in-tesla-era' 게시글 확인:");
    const { data: post2, error: post2Error } = await supabase
      .from("posts")
      .select("id, title, slug, content, cover_image")
      .eq("slug", "why-drive-mini-cooper-in-tesla-era")
      .single();

    if (post2Error || !post2) {
      console.log("  게시글을 찾을 수 없습니다.");
    } else {
      console.log(`  게시글: ${post2.title}`);
      const imageUrls2 = extractImageUrlsFromMarkdown(post2.content);
      console.log(`  마크다운에 포함된 이미지 URL 수: ${imageUrls2.length}`);
      if (imageUrls2.length > 0) {
        console.log("\n  이미지 URL들:");
        imageUrls2.forEach((url) => {
          console.log(`    - ${url}`);
        });
        console.log("\n  images 테이블 및 Storage 확인:");
        for (const url of imageUrls2) {
          const matchingImage = allImages?.find((img) => img.public_url === url);
          const storagePath = extractStoragePathFromUrl(url);
          
          if (matchingImage) {
            console.log(`    ✅ ${url}`);
            console.log(`       상태: ${matchingImage.status}, 경로: ${matchingImage.storage_path}`);
            // 모든 상태에서 Storage 확인
            const result = await checkStorageFileExists(matchingImage.storage_path);
            if (result.exists) {
              if (matchingImage.status === "deleted") {
                console.log(`       ⚠️  Storage에는 파일이 존재하지만 상태가 'deleted'임`);
              } else if (matchingImage.status === "active") {
                console.log(`       ✅ Storage에 파일 존재함`);
              }
            } else {
              console.log(`       ❌ Storage에 파일 없음 (삭제됨)`);
              if (result.error) {
                console.log(`          오류: ${result.error}`);
              }
            }
          } else {
            console.log(`    ❌ ${url} - images 테이블에 없음`);
            if (storagePath) {
              console.log(`       Storage 경로: ${storagePath}`);
              const result = await checkStorageFileExists(storagePath);
              if (result.exists) {
                console.log(`       ✅ Storage에 파일 존재함`);
              } else {
                console.log(`       ❌ Storage에 파일 없음 (삭제됨)`);
                if (result.error) {
                  console.log(`          오류: ${result.error}`);
                }
              }
            }
          }
        }
      }
    }

  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

checkImages();
