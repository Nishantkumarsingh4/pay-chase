import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  tokenVersion?: number;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  return session.user as CurrentUser;
}
