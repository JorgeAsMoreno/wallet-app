export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}
