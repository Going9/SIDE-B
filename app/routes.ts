import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/_layout.tsx", [
    index("routes/_index.tsx"),
    route(":category", "routes/$category.tsx"),
    route("article/:slug", "routes/article.$slug.tsx"),
    route("admin/login", "routes/admin.login.tsx"),
    route("admin/dashboard", "routes/admin.dashboard.tsx"),
    route("admin/write", "routes/admin.write.tsx"),
    route("admin/edit/:id", "routes/admin.edit.$id.tsx"),
    route("admin/categories", "routes/admin.categories.tsx"),
  ]),
] satisfies RouteConfig;
