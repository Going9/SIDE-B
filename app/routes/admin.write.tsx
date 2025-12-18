import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/admin.write";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  LoadingScreen,
  LoadingSpinner,
} from "../components/ui/loading-spinner";
import { ToastProvider, useToast } from "../components/ui/toast";
import { getActiveCategories, type Category } from "../utils/categories";
import { getAllAuthors } from "../utils/authors";
import type { Post, Author } from "../types/db";
import { markdownToHtml } from "../utils/markdown";
import { logError, formatErrorMessage } from "../utils/error-handler";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Write New Post | Admin | SIDE B" }];
}

function AdminWriteContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingContentImages, setIsUploadingContentImages] =
    useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedContentImages, setUploadedContentImages] = useState<
    Array<{ id: string; url: string; name: string; storagePath: string }>
  >([]);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "",
    author_id: "",
    subtitle: "",
    description: "",
    content: "",
    cover_image: "",
    background_color: "",
  });

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/admin/login");
        return;
      }

      setIsCheckingAuth(false);

      // Load categories and authors
      try {
        const [activeCategories, allAuthors] = await Promise.all([
          getActiveCategories(),
          getAllAuthors(),
        ]);

        setCategories(activeCategories);
        setAuthors(allAuthors);

        if (activeCategories.length > 0) {
          setFormData((prev) => ({
            ...prev,
            category: activeCategories[0].slug,
          }));
        }

        // Set current user as default author if available
        if (allAuthors.length > 0 && session.user) {
          const currentUserAuthor = allAuthors.find(
            (a) => a.id === session.user.id
          );
          if (currentUserAuthor) {
            setFormData((prev) => ({
              ...prev,
              author_id: currentUserAuthor.id,
            }));
          } else if (allAuthors.length > 0) {
            setFormData((prev) => ({ ...prev, author_id: allAuthors[0].id }));
          }
        }
      } catch (err) {
        logError(err, { component: "AdminWrite", action: "loadCategories" });
        showToast("데이터를 불러오는데 실패했습니다.", "error");
      } finally {
        setIsLoadingCategories(false);
      }
    }

    checkAuth();
  }, [navigate, showToast]);

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleInputChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    // Auto-generate slug from title
    if (name === "title" && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, [name]: value, slug }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  }

  /**
   * Extract dominant color from an image
   * Uses Canvas API to sample pixels and find the most common color
   */
  async function extractDominantColor(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context not available"));
            return;
          }

          // Resize for performance (sample smaller image)
          const maxSize = 100;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Sample pixels (every 5th pixel for performance)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          const colorCounts: Record<string, number> = {};
          const sampleStep = 5;

          for (let i = 0; i < pixels.length; i += sampleStep * 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Skip transparent pixels
            if (a < 128) continue;

            // Quantize colors to reduce color space (group similar colors)
            const qr = Math.round(r / 10) * 10;
            const qg = Math.round(g / 10) * 10;
            const qb = Math.round(b / 10) * 10;
            const colorKey = `${qr},${qg},${qb}`;

            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
          }

          // Find most common color
          let maxCount = 0;
          let dominantColor = "255,255,255"; // Default to white

          for (const [color, count] of Object.entries(colorCounts)) {
            if (count > maxCount) {
              maxCount = count;
              dominantColor = color;
            }
          }

          // Convert to hex
          const [r, g, b] = dominantColor.split(",").map(Number);
          const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

          // Lighten the color for better readability (blend with white)
          const lightenFactor = 0.85; // 85% original + 15% white
          const lightR = Math.round(
            r * lightenFactor + 255 * (1 - lightenFactor)
          );
          const lightG = Math.round(
            g * lightenFactor + 255 * (1 - lightenFactor)
          );
          const lightB = Math.round(
            b * lightenFactor + 255 * (1 - lightenFactor)
          );
          const lightHex = `#${[lightR, lightG, lightB].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

          resolve(lightHex);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = imageUrl;
    });
  }

  async function uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return publicUrl;
  }

  async function uploadContentImage(
    file: File
  ): Promise<{ id: string; url: string; name: string; storagePath: string }> {
    // Get current user session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `content/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    // Insert record into images table with 'temp' status
    const { data: imageRecord, error: dbError } = await supabase
      .from("images")
      .insert({
        user_id: session.user.id,
        storage_path: filePath,
        public_url: publicUrl,
        status: "temp",
      })
      .select("id")
      .single();

    if (dbError) {
      // If DB insert fails, try to clean up the uploaded file
      await supabase.storage.from("images").remove([filePath]);
      throw new Error(`Failed to record image: ${dbError.message}`);
    }

    return {
      id: imageRecord.id,
      url: publicUrl,
      name: file.name,
      storagePath: filePath,
    };
  }

  async function handleContentImagesChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingContentImages(true);
    setError(null);

    try {
      const uploadPromises = files.map((file) => uploadContentImage(file));
      const results = await Promise.all(uploadPromises);
      setUploadedContentImages((prev) => [...prev, ...results]);
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error
          ? uploadErr.message
          : "Failed to upload images"
      );
    } finally {
      setIsUploadingContentImages(false);
      // Reset file input
      e.target.value = "";
    }
  }

  function copyMarkdownToClipboard(url: string, altText: string = "image") {
    const markdown = `![${altText}](${url})`;
    navigator.clipboard.writeText(markdown);
  }

  function insertMarkdownToEditor(url: string, altText: string = "image") {
    const markdown = `![${altText}](${url})`;
    const textarea = document.getElementById("content") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      const newContent =
        currentContent.substring(0, start) +
        markdown +
        "\n" +
        currentContent.substring(end);
      setFormData((prev) => ({ ...prev, content: newContent }));
      // Set cursor position after inserted markdown
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + markdown.length + 1,
          start + markdown.length + 1
        );
      }, 0);
    }
  }

  /**
   * Extract image URLs from markdown content
   * Matches patterns like: ![alt](url) or [![alt](url)](link)
   */
  function extractImageUrlsFromMarkdown(content: string): string[] {
    const imageUrlRegex = /!\[.*?\]\((.*?)\)/g;
    const urls: string[] = [];
    let match;

    while ((match = imageUrlRegex.exec(content)) !== null) {
      const url = match[1];
      if (url && !urls.includes(url)) {
        urls.push(url);
      }
    }

    return urls;
  }

  /**
   * Update image status: activate used images, deactivate unused images
   */
  async function syncImageStatus(content: string): Promise<void> {
    const imageUrls = extractImageUrlsFromMarkdown(content);

    // Get current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    // Get all user's images that are temp or active
    const { data: userImages, error: fetchError } = await supabase
      .from("images")
      .select("id, public_url, status")
      .eq("user_id", session.user.id)
      .in("status", ["temp", "active"]);

    if (fetchError) {
      console.error("Failed to fetch user images:", fetchError);
      return;
    }

    if (!userImages || userImages.length === 0) {
      return;
    }

    // Separate images into used and unused
    const usedImageIds: string[] = [];
    const unusedImageIds: string[] = [];

    userImages.forEach((img) => {
      if (imageUrls.includes(img.public_url)) {
        // Image is used in content
        if (img.status === "temp") {
          usedImageIds.push(img.id);
        }
      } else {
        // Image is not used in content
        if (img.status === "active") {
          unusedImageIds.push(img.id);
        }
      }
    });

    // Activate used images (temp -> active)
    if (usedImageIds.length > 0) {
      const { error: activateError } = await supabase
        .from("images")
        .update({ status: "active" })
        .in("id", usedImageIds);

      if (activateError) {
        console.error("Failed to activate images:", activateError);
      }
    }

    // Deactivate unused images (active -> temp)
    if (unusedImageIds.length > 0) {
      const { error: deactivateError } = await supabase
        .from("images")
        .update({ status: "temp" })
        .in("id", unusedImageIds);

      if (deactivateError) {
        console.error("Failed to deactivate images:", deactivateError);
      }
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let coverImageUrl = formData.cover_image || null;

      // Upload image if a new file was selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          coverImageUrl = await uploadImage(selectedFile);
        } catch (uploadErr) {
          setError(
            uploadErr instanceof Error
              ? uploadErr.message
              : "Failed to upload image"
          );
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }
        setIsUploading(false);
      }

      // Insert post
      const insertData: Record<string, unknown> = {
        title: formData.title,
        slug: formData.slug,
        category: formData.category,
        author_id: formData.author_id || null,
        subtitle: formData.subtitle,
        description: formData.description || formData.subtitle,
        content: formData.content,
        cover_image: coverImageUrl,
      };

      // Only include background_color if it's set (field may not exist in DB yet)
      // Try to insert with background_color, but handle gracefully if field doesn't exist
      if (
        formData.background_color &&
        formData.background_color.trim() !== ""
      ) {
        insertData.background_color = formData.background_color;
      }

      const { error: insertError, data } = await supabase
        .from("posts")
        .insert(insertData);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        console.error("Insert data:", insertData);

        // If error is about unknown column, try again without background_color
        if (
          insertError.message &&
          (insertError.message.includes("column") ||
            insertError.code === "42703") &&
          insertData.background_color
        ) {
          console.warn(
            "background_color column not found, retrying without it"
          );
          const retryData = { ...insertData };
          delete retryData.background_color;
          const { error: retryError } = await supabase
            .from("posts")
            .insert(retryData);
          if (retryError) {
            console.error("Retry insert error:", retryError);
            const errorMsg = formatErrorMessage(retryError);
            setError(errorMsg);
            showToast(errorMsg, "error");
            setIsSubmitting(false);
            return;
          }
        } else {
          const errorMsg = formatErrorMessage(insertError);
          setError(errorMsg);
          showToast(errorMsg, "error");
          setIsSubmitting(false);
          return;
        }
      }

      // Sync image status: activate used images, deactivate unused images
      await syncImageStatus(formData.content);

      showToast("게시글이 성공적으로 작성되었습니다!", "success");
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminWrite", action: "submitPost" });
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth || isLoadingCategories) {
    return <LoadingScreen message="인증 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-4 transition-colors">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] dark:text-gray-100">
            Write New Post
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/dashboard")}
            className="w-full sm:w-auto"
          >
            대시보드로
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Post Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Slug *
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  pattern="[a-z0-9\-]+"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                  placeholder="post-slug-url"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  제목에서 자동 생성되거나 수동으로 입력하세요
                </p>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                >
                  {categories.length === 0 ? (
                    <option value="">카테고리 로딩 중...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="author_id"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Author
                </label>
                <select
                  id="author_id"
                  name="author_id"
                  value={formData.author_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                >
                  <option value="">작성자 선택 (선택사항)</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.display_name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  게시글 작성자를 선택하세요. 선택하지 않으면 작성자 없음으로
                  표시됩니다.
                </p>
              </div>

              <div>
                <label
                  htmlFor="subtitle"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Subtitle *
                </label>
                <input
                  id="subtitle"
                  name="subtitle"
                  type="text"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                  placeholder="Enter post subtitle"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Description
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                  placeholder="Enter post description (for list views)"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Used in list views. If empty, subtitle will be used.
                </p>
              </div>

              <div>
                <label
                  htmlFor="cover_image"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Cover Image
                </label>
                <input
                  id="cover_image"
                  name="cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2563eb] file:text-white hover:file:bg-[#1d4ed8] cursor-pointer bg-white dark:bg-gray-800"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preview:
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs max-h-48 rounded-lg border border-gray-300 dark:border-gray-700 object-cover"
                      />
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <LoadingSpinner size="sm" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <label
                    htmlFor="background_color"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Background Color (상세 페이지 우측 배경)
                  </label>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!imagePreview) return;
                        try {
                          const color =
                            await extractDominantColor(imagePreview);
                          setFormData((prev) => ({
                            ...prev,
                            background_color: color,
                          }));
                          showToast(
                            "색상이 자동으로 추출되었습니다!",
                            "success"
                          );
                        } catch (err) {
                          showToast("색상 추출에 실패했습니다.", "error");
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      자동 추출
                    </Button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    id="background_color"
                    name="background_color"
                    type="color"
                    value={formData.background_color || "#faf9f6"}
                    onChange={handleInputChange}
                    className="h-10 w-full sm:w-20 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-white dark:bg-gray-800"
                  />
                  <input
                    type="text"
                    value={formData.background_color || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        background_color: e.target.value,
                      }))
                    }
                    placeholder="#faf9f6"
                    className="flex-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, background_color: "" }))
                    }
                    className="w-full sm:w-auto"
                  >
                    초기화
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  상세 페이지 우측 배경색을 설정합니다. 비워두면 기본
                  색상(#faf9f6)이 사용됩니다. 자동 추출 버튼으로 썸네일
                  이미지에서 주요 색상을 추출할 수 있습니다.
                </p>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Content * (Markdown 지원)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full sm:w-auto"
                  >
                    {showPreview ? "편집" : "미리보기"}
                  </Button>
                </div>
                {showPreview ? (
                  <div className="w-full min-h-[400px] px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 prose prose-slate dark:prose-invert max-w-none markdown-content">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: markdownToHtml(formData.content),
                      }}
                    />
                  </div>
                ) : (
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none resize-y font-mono text-sm bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                    placeholder="마크다운 형식으로 작성하세요. 예: ![이미지 설명](이미지URL)"
                  />
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Insert Images
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="content_images"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Upload Images (Multiple)
                    </label>
                    <input
                      id="content_images"
                      name="content_images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleContentImagesChange}
                      disabled={isUploadingContentImages}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2563eb] file:text-white hover:file:bg-[#1d4ed8] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
                    />
                    {isUploadingContentImages && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Uploading images...</span>
                      </div>
                    )}
                  </div>

                  {uploadedContentImages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Uploaded Images ({uploadedContentImages.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {uploadedContentImages.map((image, index) => (
                          <div
                            key={index}
                            className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                          >
                            <div className="relative aspect-square mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p
                              className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2"
                              title={image.name}
                            >
                              {image.name}
                            </p>
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  copyMarkdownToClipboard(image.url, image.name)
                                }
                                className="text-xs py-1 h-auto"
                              >
                                Copy Markdown
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  insertMarkdownToEditor(image.url, image.name)
                                }
                                className="text-xs py-1 h-auto"
                              >
                                Insert to Editor
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading || !formData.category}
                  className="w-full sm:w-auto"
                >
                  {isUploading || isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      {isUploading ? "이미지 업로드 중..." : "게시 중..."}
                    </span>
                  ) : (
                    "Publish Post"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminWrite() {
  return (
    <ToastProvider>
      <AdminWriteContent />
    </ToastProvider>
  );
}
