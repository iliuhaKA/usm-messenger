import { axiosInstance } from './axios';

export async function fetchPresence(userIds: number[]): Promise<Record<number, string>> {
  if (userIds.length === 0) return {};
  const { data } = await axiosInstance.get<Record<number, string>>('/presence', {
    params: { ids: userIds.join(',') },
  });
  return data;
}
