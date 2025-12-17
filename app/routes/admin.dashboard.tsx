import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/admin.dashboard";
import { supabase } from "../utils/supabase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LoadingScreen, LoadingSpinner } from "../components/ui/loading-spinner";
import { ToastProvider, useToast } from "../components/ui/toast";
import type { Post } from "../types/db";
import { formatDateKSTFull } from "../utils/date";
import { logError, formatErrorMessage } from "../utils/error-handler";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Dashboard | SIDE B" }];
}

function AdminDashboardContent() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      await fetchPosts();
    }

    checkAuth();
  }, [navigate]);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });

      if (error) {
        logError(error, { component: "AdminDashboard", action: "fetchPosts" });
        showToast(formatErrorMessage(error), "error");
        return;
      }

      setPosts((data || []) as Post[]);
    } catch (err) {
      logError(err, { component: "AdminDashboard", action: "fetchPosts" });
      showToast("게시글을 불러오는데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Extract image URLs from markdown content
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
   * Delete images associated with a post
   */
  async function deletePostImages(post: Post): Promise<void> {
    const imageUrls: string[] = [];

    // Extract images from content
    if (post.content) {
      const contentUrls = extractImageUrlsFromMarkdown(post.content);
      imageUrls.push(...contentUrls);
    }

    // Add cover image if exists
    if (post.cover_image) {
      imageUrls.push(post.cover_image);
    }

    if (imageUrls.length === 0) {
      return;
    }

    // Find all images with these URLs
    const { data: images, error: fetchError } = await supabase
      .from("images")
      .select("id, storage_path")
      .in("public_url", imageUrls);

    if (fetchError) {
      console.error("Failed to fetch images for deletion:", fetchError);
      return;
    }

    if (!images || images.length === 0) {
      return;
    }

    // Delete from Storage and mark as deleted in DB
    for (const image of images) {
      try {
        // Delete from Storage
        const { error: storageError } = await supabase.storage
          .from("images")
          .remove([image.storage_path]);

        if (storageError) {
          console.error(`Failed to delete ${image.storage_path} from storage:`, storageError);
        }

        // Mark as deleted in database
        await supabase
          .from("images")
          .update({ status: "deleted" })
          .eq("id", image.id);
      } catch (err) {
        console.error(`Error deleting image ${image.id}:`, err);
      }
    }
  }

  async function handleDelete(postId: string, title: string) {
    if (!window.confirm(`정말 "${title}" 게시글을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(postId);

    try {
      // Find the post first to get its content and images
      const post = posts.find((p) => p.id === postId);
      if (!post) {
        showToast("게시글을 찾을 수 없습니다.", "error");
        setDeletingId(null);
        return;
      }

      // Delete associated images
      await deletePostImages(post);

      // Delete the post
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) {
        showToast(formatErrorMessage(error), "error");
        logError(error, { component: "AdminDashboard", action: "deletePost", metadata: { postId } });
        setDeletingId(null);
        return;
      }

      setPosts(posts.filter((post) => post.id !== postId));
      showToast("게시글이 삭제되었습니다.", "success");
    } catch (err) {
      showToast("게시글 삭제 중 오류가 발생했습니다.", "error");
      logError(err, { component: "AdminDashboard", action: "deletePost", metadata: { postId } });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }


  if (isCheckingAuth || isLoading) {
    return <LoadingScreen message="로딩 중..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#111111] dark:text-gray-100">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link to="/admin/categories">
              <Button variant="outline">카테고리 관리</Button>
            </Link>
            <Link to="/admin/authors">
              <Button variant="outline">작성자 관리</Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline">사이트 설정</Button>
            </Link>
            <Link to="/admin/pages">
              <Button variant="outline">페이지 관리</Button>
            </Link>
            <Link to="/admin/write">
              <Button>Write New Post</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>게시글이 없습니다. 첫 번째 게시글을 작성해보세요!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#111111] dark:text-gray-100">{post.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{post.slug}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{post.category}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{formatDateKSTFull(post.created_at)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/edit/${post.id}`)}
                              disabled={deletingId === post.id}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(post.id, post.title)}
                              disabled={deletingId === post.id}
                              className="text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                            >
                              {deletingId === post.id ? (
                                <span className="flex items-center gap-1">
                                  <LoadingSpinner size="sm" />
                                  삭제 중...
                                </span>
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ToastProvider>
      <AdminDashboardContent />
    </ToastProvider>
  );
}

