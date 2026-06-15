import type { MetadataRoute } from "next";

const siteUrl = "https://copilotopyme.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/ventajas",
          "/precio",
          "/contactenos",
          "/demo",
          "/privacidad",
          "/terminos",
          "/tratamiento-datos",
          "/cookies"
        ],
        disallow: [
          "/admin",
          "/api",
          "/billing",
          "/dashboard",
          "/figma-dashboard-preview",
          "/internal",
          "/login",
          "/onboarding",
          "/recuperar-contrasena",
          "/register",
          "/restablecer-contrasena",
          "/waitlist"
        ]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
