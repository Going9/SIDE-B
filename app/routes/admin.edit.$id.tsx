import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/admin.edit.$id";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MENU_ITEMS } from "../config/navigation";
import type { Post } from "../types/db";
import { markdownToHtml } from "../utils/markdown";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit Post | Admin | SIDE B" }];
}

export default function AdminEdit({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const postId = params.id;
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingContentImages, setIsUploadingContentImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalCoverImage, setOriginalCoverImage] = useState<string | null>(null);
  const [uploadedContentImages, setUploadedContentImages] = useState<
    Array<{ id: string; url: string; name: string; storagePath: string }>
  >([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "mobility" as Post["category"],
    subtitle: "",
    description: "",
    content: "",
    cover_image: "",
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
      await fetchPost();
    }

    checkAuth();
  }, [navigate]);

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function fetchPost() {
    try {
      const { data, error: fetchError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (fetchError) {
        setError(`Error loading post: ${fetchError.message}`);
        setIsLoading(false);
        return;
      }

      if (data) {
        const coverImage = data.cover_image || "";
        setFormData({
          title: data.title || "",
          slug: data.slug || "",
          category: (data.category as Post["category"]) || "mobility",
          subtitle: data.subtitle || "",
          description: data.description || "",
          content: data.content || "",
          cover_image: coverImage,
        });
        setOriginalCoverImage(coverImage || null);
        if (coverImage) {
          setImagePreview(coverImage);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred while loading the post.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      // Reset to original image if available
      setImagePreview(originalCoverImage);
    }
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `content/${fileName}`;

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

  async function handleContentImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingContentImages(true);
    setError(null);

    try {
      const uploadPromises = files.map((file) => uploadContentImage(file));
      const results = await Promise.all(uploadPromises);
      setUploadedContentImages((prev) => [...prev, ...results]);
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : "Failed to upload images");
    } finally {
      setIsUploadingContentImages(false);
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
        currentContent.substring(0, start) + markdown + "\n" + currentContent.substring(end);
      setFormData((prev) => ({ ...prev, content: newContent }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + markdown.length + 1, start + markdown.length + 1);
      }, 0);
    }
  }

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

  async function syncImageStatus(content: string): Promise<void> {
    const imageUrls = extractImageUrlsFromMarkdown(content);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

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

    const usedImageIds: string[] = [];
    const unusedImageIds: string[] = [];

    userImages.forEach((img) => {
      if (imageUrls.includes(img.public_url)) {
        if (img.status === "temp") {
          usedImageIds.push(img.id);
        }
      } else {
        if (img.status === "active") {
          unusedImageIds.push(img.id);
        }
      }
    });

    if (usedImageIds.length > 0) {
      const { error: activateError } = await supabase
        .from("images")
        .update({ status: "active" })
        .in("id", usedImageIds);

      if (activateError) {
        console.error("Failed to activate images:", activateError);
      }
    }

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
      let coverImageUrl = originalCoverImage;

      // Upload image only if a new file was selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          coverImageUrl = await uploadImage(selectedFile);
        } catch (uploadErr) {
          setError(uploadErr instanceof Error ? uploadErr.message : "Failed to upload image");
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }
        setIsUploading(false);
      }

      const { error: updateError } = await supabase
        .from("posts")
        .update({
          title: formData.title,
          slug: formData.slug,
          category: formData.category,
          subtitle: formData.subtitle,
          description: formData.description || formData.subtitle,
          content: formData.content,
          cover_image: coverImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      // Sync image status: activate used images, deactivate unused images
      await syncImageStatus(formData.content);

      navigate("/admin/dashboard");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#111111]">Edit Post</h1>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                  placeholder="post-slug-url"
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly version of the title</p>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white"
                >
                  {MENU_ITEMS.map((item) => (
                    <option key={item.category} value={item.category}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle *
                </label>
                <input
                  id="subtitle"
                  name="subtitle"
                  type="text"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                  placeholder="Enter post subtitle"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                  placeholder="Enter post description (for list views)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Used in list views. If empty, subtitle will be used.
                </p>
              </div>

              <div>
                <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image
                </label>
                <input
                  id="cover_image"
                  name="cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2563eb] file:text-white hover:file:bg-[#1d4ed8] cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs max-h-48 rounded-lg border border-gray-300 object-cover"
                      />
                    </div>
                  </div>
                )}
                {isUploading && (
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Content * (Markdown 지원)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "편집" : "미리보기"}
                  </Button>
                </div>
                {showPreview ? (
                  <div className="w-full min-h-[400px] px-4 py-2 border border-gray-300 rounded-lg bg-white prose prose-slate max-w-none">
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
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none resize-y font-mono text-sm"
                    placeholder="마크다운 형식으로 작성하세요. 예: ![이미지 설명](이미지URL)"
                  />
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Insert Images</h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="content_images"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#2563eb] file:text-white hover:file:bg-[#1d4ed8] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Uploaded Images ({uploadedContentImages.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {uploadedContentImages.map((image, index) => (
                          <div
                            key={index}
                            className="border border-gray-300 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                          >
                            <div className="relative aspect-square mb-2 rounded overflow-hidden bg-gray-100">
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs text-gray-600 truncate mb-2" title={image.name}>
                              {image.name}
                            </p>
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => copyMarkdownToClipboard(image.url, image.name)}
                                className="text-xs py-1 h-auto"
                              >
                                Copy Markdown
                              </Button>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={() => insertMarkdownToEditor(image.url, image.name)}
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

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading || isUploadingContentImages}>
                  {isUploadingContentImages ? "Uploading..." : isUploading ? "Uploading..." : isSubmitting ? "Updating..." : "Update Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

