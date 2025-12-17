import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/admin.categories";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LoadingScreen } from "../components/ui/loading-spinner";
import { ToastProvider, useToast } from "../components/ui/toast";
import { logError, formatErrorMessage } from "../utils/error-handler";

interface Category {
  id: string;
  slug: string;
  label: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "카테고리 관리 | Admin | SIDE B" }];
}

function AdminCategoriesContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    label: "",
    description: "",
    display_order: 0,
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
      await fetchCategories();
    }

    checkAuth();
  }, [navigate]);

  async function fetchCategories() {
    try {
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (fetchError) {
        const errorMsg = formatErrorMessage(fetchError);
        setError(errorMsg);
        showToast(errorMsg, "error");
        logError(fetchError, { component: "AdminCategories", action: "fetchCategories" });
        return;
      }

      setCategories((data || []) as Category[]);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminCategories", action: "fetchCategories" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "display_order" ? parseInt(value, 10) || 0 : value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        // Update existing category
        const { error: updateError } = await supabase
          .from("categories")
          .update({
            slug: formData.slug,
            label: formData.label,
            description: formData.description,
            display_order: formData.display_order,
          })
          .eq("id", editingId);

        if (updateError) {
          const errorMsg = formatErrorMessage(updateError);
          setError(errorMsg);
          showToast(errorMsg, "error");
          setIsSubmitting(false);
          return;
        }
        showToast("카테고리가 수정되었습니다.", "success");
      } else {
        // Create new category
        const { error: insertError } = await supabase.from("categories").insert({
          slug: formData.slug,
          label: formData.label,
          description: formData.description,
          display_order: formData.display_order,
          is_active: true,
        });

        if (insertError) {
          const errorMsg = formatErrorMessage(insertError);
          setError(errorMsg);
          showToast(errorMsg, "error");
          setIsSubmitting(false);
          return;
        }
        showToast("카테고리가 추가되었습니다.", "success");
      }

      // Reset form and refresh
      setFormData({ slug: "", label: "", description: "", display_order: 0 });
      setEditingId(null);
      await fetchCategories();
      setIsSubmitting(false);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminCategories", action: "submitCategory" });
      setIsSubmitting(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setFormData({
      slug: category.slug,
      label: category.label,
      description: category.description,
      display_order: category.display_order,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ slug: "", label: "", description: "", display_order: 0 });
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      const errorMsg = formatErrorMessage(error);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(error, { component: "AdminCategories", action: "toggleActive" });
      return;
    }

    showToast(`카테고리가 ${!currentStatus ? "활성화" : "비활성화"}되었습니다.`, "success");
    await fetchCategories();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("정말 이 카테고리를 삭제하시겠습니까?")) {
      return;
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      const errorMsg = formatErrorMessage(error);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(error, { component: "AdminCategories", action: "deleteCategory" });
      return;
    }

    showToast("카테고리가 삭제되었습니다.", "success");
    await fetchCategories();
  }

  if (isCheckingAuth || isLoading) {
    return <LoadingScreen message="로딩 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#111111] dark:text-gray-100">카테고리 관리</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
              대시보드로
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category List */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">카테고리가 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{category.label}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                category.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {category.is_active ? "활성" : "비활성"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{category.slug}</p>
                          <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            순서: {category.display_order}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(category)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(category.id, category.is_active)}
                            className={
                              category.is_active
                                ? "text-orange-600 hover:text-orange-700"
                                : "text-green-600 hover:text-green-700"
                            }
                          >
                            {category.is_active ? "비활성화" : "활성화"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Form */}
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "카테고리 수정" : "새 카테고리 추가"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL) *
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                    placeholder="예: new-category"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    소문자, 숫자, 하이픈만 사용 가능
                  </p>
                </div>

                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                    라벨 (표시명) *
                  </label>
                  <input
                    id="label"
                    name="label"
                    type="text"
                    value={formData.label}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                    placeholder="예: 새 카테고리"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    설명 *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none resize-y"
                    placeholder="카테고리에 대한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label
                    htmlFor="display_order"
                    className="block text-sm font-medium text-gray-700 mb-1"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">숫자가 작을수록 앞에 표시됩니다</p>
                </div>

                <div className="flex gap-4">
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      취소
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "저장 중..." : editingId ? "수정하기" : "카테고리 추가"}
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

export default function AdminCategories() {
  return (
    <ToastProvider>
      <AdminCategoriesContent />
    </ToastProvider>
  );
}

