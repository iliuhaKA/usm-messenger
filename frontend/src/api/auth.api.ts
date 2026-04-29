import { axiosInstance } from './axios';

import type { User } from '../types/user.types';

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAtEpochMs: number;
  user: User;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function logoutRequest(): Promise<void> {
  await axiosInstance.post('/auth/logout', {});
}
