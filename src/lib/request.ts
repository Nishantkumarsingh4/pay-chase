import { headers } from 'next/headers';

/**
 * Extracts client IP securely.
 * Note on spoofing: On public cloud / reverse proxies, only the leftmost IP from
 * x-forwarded-for should be trusted if the proxy is properly configured.
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headersList.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export async function getUserAgent(): Promise<string> {
  const headersList = await headers();
  const ua = headersList.get('user-agent') || 'Unknown';
  return ua.slice(0, 255);
}
