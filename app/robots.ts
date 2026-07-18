import type { MetadataRoute } from 'next';

/**
 * Robots policy. Marketing + auth pages are crawlable; the authenticated app and API are not
 * (they require a session anyway and shouldn't appear in search).
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://fitcore.ai';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/today',
          '/workout',
          '/exercises',
          '/diet',
          '/progress',
          '/momentum',
          '/story',
          '/achievements',
          '/chat',
          '/profile',
          '/welcome',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
