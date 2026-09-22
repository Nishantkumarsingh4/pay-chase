import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://paychase.app';
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/invoices/',
          '/clients/',
          '/api/',
          '/pay/',
          '/reset-password/',
        ],
      },
    ],
    sitemap: `${cleanBaseUrl}/sitemap.xml`,
  };
}
