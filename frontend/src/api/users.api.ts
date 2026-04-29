import { axiosInstance } from './axios';

import type { User } from '../types/user.types';

export async function searchUsers(query: string): Promise<User[]> {
  const { data } = await axiosInstance.get<User[]>('/users/search', { params: { q: query } });
  return data;
}
