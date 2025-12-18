import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/admin.pages";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { LoadingScreen } from "../components/ui/loading-spinner";
import { ToastProvider, useToast } from "../components/ui/toast";
import { getAllPages, upsertPage } from "../utils/pages";
import type { Page } from "../types/db";
import { logError, formatErrorMessage } from "../utils/error-handler";

export function meta({}: Route.MetaArgs) {
  return [{ title: "페이지 관리 | Admin | SIDE B" }];
}

function AdminPagesContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    section: "정보",
    image_url: "",
    display_order: 0,
    is_active: true,
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
      await fetchPages();
    }

    checkAuth();
  }, [navigate]);

  async function fetchPages() {
    try {
      const allPages = await getAllPages();
      setPages(allPages);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminPages", action: "fetchPages" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "display_order" ? parseInt(value, 10) || 0 : value,
    }));
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleEdit(page: Page) {
    setEditingId(page.id);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      section: page.section || "정보",
      image_url: page.image_url || "",
      display_order: page.display_order || 0,
      is_active: page.is_active,
    });
    setImagePreview(page.image_url || null);
    setSelectedFile(null);
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({
      slug: "",
      title: "",
      content: "",
      section: "정보",
      image_url: "",
      display_order: 0,
      is_active: true,
    });
    setImagePreview(null);
    setSelectedFile(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = formData.image_url || null;

      // Upload image if a new file was selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          imageUrl = await uploadImage(selectedFile);
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

      const result = await upsertPage(
        formData.slug,
        formData.title,
        formData.content,
        formData.section,
        imageUrl,
        formData.display_order,
        formData.is_active
      );

      if (result) {
        showToast("페이지가 성공적으로 저장되었습니다!", "success");
        await fetchPages();
        handleCancel();
      } else {
        throw new Error("페이지 저장에 실패했습니다.");
      }
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminPages", action: "handleSubmit" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth || isLoading) {
    return <LoadingScreen message="인증 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-4 transition-colors">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] dark:text-gray-100">
            페이지 관리
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

        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              {editingId ? "페이지 수정" : "새 페이지 추가"}
            </CardTitle>
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
                  disabled={!!editingId}
                  pattern="[a-z0-9\-]+"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  placeholder="예: about"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  URL에 사용될 고유한 식별자입니다. 수정할 수 없습니다.
                </p>
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  제목 *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                  placeholder="예: 소개"
                />
              </div>

              <div>
                <label
                  htmlFor="section"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  섹션 *
                </label>
                <input
                  id="section"
                  name="section"
                  type="text"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                  placeholder="예: 정보, 법적고지, editors 등"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Footer에서 그룹화에 사용됩니다. 같은 섹션의 페이지들이 함께 표시됩니다.
                </p>
              </div>

              <div>
                <label
                  htmlFor="display_order"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  표시 순서
                </label>
                <input
                  id="display_order"
                  name="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  같은 섹션 내에서의 표시 순서입니다. 숫자가 작을수록 먼저 표시됩니다.
                </p>
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  이미지
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
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
                        className="max-w-xs max-h-48 rounded-lg"
                      />
                    </div>
                  </div>
                )}
                {formData.image_url && !imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Image:
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={formData.image_url}
                        alt="Current"
                        className="max-w-xs max-h-48 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  내용 * (Markdown 지원)
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100 font-mono text-sm"
                  placeholder="Markdown 형식으로 작성하세요"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-[#2563eb] bg-gray-100 border-gray-300 rounded focus:ring-[#2563eb] dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  활성화
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "저장 중..." : editingId ? "수정" : "추가"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">페이지 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  페이지가 없습니다.
                </p>
              ) : (
                pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="font-semibold text-[#111111] dark:text-gray-100 text-base">
                          {page.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          /{page.slug}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {page.section || "정보"}
                        </span>
                        {page.is_active ? (
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                            활성
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {page.content.substring(0, 100)}...
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(page)}
                      className="w-full sm:w-auto"
                    >
                      수정
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPages({}: Route.ComponentProps) {
  return (
    <ToastProvider>
      <AdminPagesContent />
    </ToastProvider>
  );
}

