import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://paychase.app';
  // Strip trailing slash if present
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  const routes = [
    '',
    '/login',
    '/signup',
    '/forgot-password',
    '/contact',
    '/privacy',
    '/terms',
  ];

  const currentDate = new Date().toISOString();

  return routes.map((route) => ({
    url: `${cleanBaseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : route === '/signup' || route === '/login' ? 0.8 : 0.5,
  }));
}
