export * from './auth.types';
import type { UserProfile } from './auth.types';

export interface UserSession {
  user: UserProfile | null;
  accessToken: string | null;
}

export interface AuthError {
  message: string;
  status?: number;
}
