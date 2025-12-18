import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/admin.settings";
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
import { getAllSiteSettings, updateSiteSetting } from "../utils/site-settings";
import type { SiteSetting } from "../types/db";
import { logError, formatErrorMessage } from "../utils/error-handler";

export function meta({}: Route.MetaArgs) {
  return [{ title: "사이트 설정 | Admin | SIDE B" }];
}

function AdminSettingsContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});

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
      await fetchSettings();
    }

    checkAuth();
  }, [navigate]);

  async function fetchSettings() {
    try {
      const allSettings = await getAllSiteSettings();
      setSettings(allSettings);
      const initialData: Record<string, string> = {};
      allSettings.forEach((setting) => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminSettings", action: "fetchSettings" });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updatePromises = Object.entries(formData).map(([key, value]) =>
        updateSiteSetting(key, value)
      );

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every((result) => result === true);

      if (allSuccess) {
        showToast("설정이 성공적으로 저장되었습니다!", "success");
        await fetchSettings();
      } else {
        throw new Error("일부 설정 저장에 실패했습니다.");
      }
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setError(errorMsg);
      showToast(errorMsg, "error");
      logError(err, { component: "AdminSettings", action: "handleSubmit" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return <LoadingScreen message="인증 확인 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-4 transition-colors">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] dark:text-gray-100">
            사이트 설정
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
            <CardTitle className="text-lg sm:text-xl">사이트 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded text-sm">
                  {error}
                </div>
              )}

              {settings.map((setting) => (
                <div key={setting.id}>
                  <label
                    htmlFor={setting.key}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {setting.description || setting.key}
                  </label>
                  {setting.key === "site_description" ? (
                    <textarea
                      id={setting.key}
                      name={setting.key}
                      value={formData[setting.key] || ""}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                      placeholder={setting.description || setting.key}
                    />
                  ) : (
                    <input
                      id={setting.key}
                      name={setting.key}
                      type="text"
                      value={formData[setting.key] || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-[#111111] dark:text-gray-100"
                      placeholder={setting.description || setting.key}
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminSettings({}: Route.ComponentProps) {
  return (
    <ToastProvider>
      <AdminSettingsContent />
    </ToastProvider>
  );
}

