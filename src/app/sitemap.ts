import type { MetadataRoute } from "next";
import { getProducts } from "@/services/catalog";
import { env } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/store`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/promo`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const products = await getProducts();
    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${base}/store/${product.slug}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
