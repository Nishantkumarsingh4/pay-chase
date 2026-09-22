import Stripe from 'stripe';

/**
 * Get configured Stripe server client instance
 */
export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.includes('your_secret_key')) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}
