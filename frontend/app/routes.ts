import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/about", "routes/about.tsx"),
  route("/articles", "routes/articles.tsx"),
  route("/articles/:id", "routes/articles.$id.tsx"),
  route("/history", "routes/history.tsx"),
  route("/history/:id", "routes/history.$id.tsx"),
  route("/detection", "routes/detection.tsx"),
  route("/profile", "routes/profile.tsx"),
  route("/login", "routes/login.tsx"),
  route("/register", "routes/register.tsx"),
  route("/forgot-password", "routes/forgot-password.tsx"),
  route("/reset-password", "routes/reset-password.tsx"),
  route("/auth/callback", "routes/auth.callback.tsx"),
  route("/articles/content", "routes/articlecontent.tsx"),
] satisfies RouteConfig;
