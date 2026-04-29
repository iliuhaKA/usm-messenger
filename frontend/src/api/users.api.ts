import { axiosInstance } from './axios';

import type { User } from '../types/user.types';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function searchUsers(query: string): Promise<User[]> {
  const { data } = await axiosInstance.get<User[]>('/users/search', { params: { q: query } });
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await axiosInstance.get<User>('/users/me');
  return data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await axiosInstance.patch<User>('/users/me', payload);
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await axiosInstance.post('/users/me/password', payload);
}

export async function setUserAvatar(fileId: string): Promise<User> {
  const { data } = await axiosInstance.put<User>('/users/me/avatar', null, { params: { fileId } });
  return data;
}
