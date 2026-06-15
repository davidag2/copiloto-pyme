import type { MetadataRoute } from "next";

const siteUrl = "https://copilotopyme.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = [
    { path: "/", priority: 1 },
    { path: "/ventajas", priority: 0.9 },
    { path: "/precio", priority: 0.9 },
    { path: "/contactenos", priority: 0.8 },
    { path: "/demo", priority: 0.7 },
    { path: "/privacidad", priority: 0.5 },
    { path: "/terminos", priority: 0.5 },
    { path: "/tratamiento-datos", priority: 0.5 },
    { path: "/cookies", priority: 0.4 }
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.priority
  }));
}
