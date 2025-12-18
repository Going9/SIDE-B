import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/admin.authors";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LoadingScreen, LoadingSpinner } from "../components/ui/loading-spinner";
import { ToastProvider, useToast } from "../components/ui/toast";
import { getAllAuthors, type Author } from "../utils/authors";
import { logError, formatErrorMessage } from "../utils/error-handler";
import AuthorProfile from "../components/author-profile";
import { createAuthorSlug } from "../utils/slug";

export function meta({}: Route.MetaArgs) {
  return [{ title: "작성자 관리 | Admin | SIDE B" }];
}

function AdminAuthorsContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    profile_image_url: "",
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
      await fetchAuthors();
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

  async function fetchAuthors() {
    try {
      const allAuthors = await getAllAuthors();
      setAuthors(allAuthors);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminAuthors", action: "fetchAuthors" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  }

  async function uploadProfileImage(file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `profiles/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(fileName);

    return publicUrl;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("인증이 필요합니다.");
        setIsSubmitting(false);
        return;
      }

      let profileImageUrl = formData.profile_image_url || null;

      // Upload image if a new file was selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          profileImageUrl = await uploadProfileImage(selectedFile);
        } catch (uploadErr) {
          const errorMsg = formatErrorMessage(uploadErr);
          setError(errorMsg);
          showToast(errorMsg, "error");
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }
        setIsUploading(false);
      }

      const slug = createAuthorSlug(formData.display_name);
      
      if (editingId) {
        // Update existing author
        const { error: updateError } = await supabase
          .from("authors")
          .update({
            display_name: formData.display_name,
            bio: formData.bio || null,
            profile_image_url: profileImageUrl,
            slug: slug,
          })
          .eq("id", editingId);

        if (updateError) {
          const errorMsg = formatErrorMessage(updateError);
          setError(errorMsg);
          showToast(errorMsg, "error");
          setIsSubmitting(false);
          return;
        }
        showToast("작성자 정보가 수정되었습니다.", "success");
      } else {
        // Create new author (id will be auto-generated, user_id tracks creator)
        const insertData: Record<string, unknown> = {
          user_id: session.user.id,
          display_name: formData.display_name,
          bio: formData.bio || null,
          profile_image_url: profileImageUrl,
          slug: slug,
        };
        
        const { error: insertError } = await supabase.from("authors").insert(insertData);

        if (insertError) {
          // If error is about slug column not existing, retry without it
          if (insertError.message.includes("slug") || insertError.code === "42703") {
            delete insertData.slug;
            const { error: retryError } = await supabase.from("authors").insert(insertData);
            if (retryError) {
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
        showToast("작성자 프로필이 생성되었습니다.", "success");
      }

      // Reset form and refresh
      setFormData({ display_name: "", bio: "", profile_image_url: "" });
      setSelectedFile(null);
      setImagePreview(null);
      setEditingId(null);
      await fetchAuthors();
      setIsSubmitting(false);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminAuthors", action: "submitAuthor" });
      setIsSubmitting(false);
    }
  }

  function startEdit(author: Author) {
    setEditingId(author.id);
    setFormData({
      display_name: author.display_name,
      bio: author.bio || "",
      profile_image_url: author.profile_image_url || "",
    });
    if (author.profile_image_url) {
      setImagePreview(author.profile_image_url);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ display_name: "", bio: "", profile_image_url: "" });
    setSelectedFile(null);
    setImagePreview(null);
  }

  if (isCheckingAuth || isLoading) {
    return <LoadingScreen message="로딩 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-4 transition-colors">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] dark:text-gray-100">작성자 관리</h1>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")} className="w-full sm:w-auto">
              대시보드로
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authors List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">작성자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {authors.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  작성자가 없습니다.
                </p>
              ) : (
                <div className="space-y-4">
                  {authors.map((author) => (
                    <div
                      key={author.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <AuthorProfile author={author} date={author.created_at} size="sm" />
                        <div className="flex-1"></div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(author)}
                          className="w-full sm:w-auto"
                        >
                          수정
                        </Button>
                      </div>
                      {author.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {author.bio}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Author Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                {editingId ? "작성자 정보 수정" : "새 작성자 프로필 생성"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="display_name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    표시 이름 *
                  </label>
                  <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                    placeholder="예: 강현모"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    소개
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none resize-y bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                    placeholder="작성자에 대한 간단한 소개를 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile_image"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    프로필 이미지
                  </label>
                  <input
                    id="profile_image"
                    name="profile_image"
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
                          className="w-20 h-20 rounded-full border border-gray-300 dark:border-gray-700 object-cover"
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

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit} className="w-full sm:w-auto">
                      취소
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting || isUploading} className="w-full sm:w-auto">
                    {isSubmitting || isUploading
                      ? "저장 중..."
                      : editingId
                        ? "수정하기"
                        : "프로필 생성"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminAuthors() {
  return (
    <ToastProvider>
      <AdminAuthorsContent />
    </ToastProvider>
  );
}

