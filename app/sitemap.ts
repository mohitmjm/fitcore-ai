import type { MetadataRoute } from 'next';

/** Sitemap of the public, indexable pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://fitcore.ai';
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
