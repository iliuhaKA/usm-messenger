export interface User {
  id: number;
  idnp: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatarUrl?: string;
  createdAt: string;
  lastSeen?: string;
  isPasswordSet: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}