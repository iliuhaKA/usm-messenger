import { axiosInstance } from './axios';

import type { User } from '../types/user.types';

export interface LoginPayload {
  login: string;
  password: string;
}

export async function loginRequest(payload: LoginPayload): Promise<User> {
  const { data } = await axiosInstance.post<User>('/auth/login', payload);
  return data;
}
