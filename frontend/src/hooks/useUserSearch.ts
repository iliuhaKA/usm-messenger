import { useQuery } from '@tanstack/react-query';

import { searchUsers } from '../api/users.api';

export function useUserSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () => searchUsers(q),
    enabled: q.length >= 2,
  });
}
