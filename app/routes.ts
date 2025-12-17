import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/_index.tsx"),
    route("article/:slug", "routes/article.$slug.tsx"),
    route("page/:slug", "routes/page.$slug.tsx"),
    route(":slug", "routes/$slug.tsx"), // Dynamic route for pages, categories, and authors
        route("admin/login", "routes/admin.login.tsx"),
        route("admin/dashboard", "routes/admin.dashboard.tsx"),
        route("admin/write", "routes/admin.write.tsx"),
        route("admin/edit/:id", "routes/admin.edit.$id.tsx"),
        route("admin/categories", "routes/admin.categories.tsx"),
        route("admin/authors", "routes/admin.authors.tsx"),
        route("admin/settings", "routes/admin.settings.tsx"),
        route("admin/pages", "routes/admin.pages.tsx"),
  ]),
] satisfies RouteConfig;
