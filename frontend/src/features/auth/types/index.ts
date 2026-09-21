export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface UserSession {
  user: User | null;
  accessToken: string | null;
}

export interface AuthError {
  message: string;
  status?: number;
}
