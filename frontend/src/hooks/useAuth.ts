import { useMutation } from '@tanstack/react-query';

import { loginRequest } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (user) => setUser(user),
  });
}
