export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: number;
  idnp?: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string | null;
  avatarFileId?: string | null;
  lastSeen?: string | null;
}
