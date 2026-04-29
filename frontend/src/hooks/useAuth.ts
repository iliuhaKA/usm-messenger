import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import { loginRequest, logoutRequest } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (res) => setSession(res.user, res.token, res.expiresAtEpochMs),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
}
