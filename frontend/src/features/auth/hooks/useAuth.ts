import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RegisterCredentials, LoginCredentials, PasswordResetRequest } from '../types/auth';
import {
  loginUser,
  registerUser,
  verifyToken,
  logoutUser,
  requestPasswordReset,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from '../services/authService';

const AUTH_QUERY_KEY = ['auth'];

/**
 * Hook to get the current authenticated user
 */
export function useAuthUser() {
  const token = getAuthToken();

  return useQuery({
    queryKey: [...AUTH_QUERY_KEY, 'user'],
    queryFn: () => {
      if (!token) {
        return null;
      }
      return verifyToken(token);
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginUser(credentials),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData([...AUTH_QUERY_KEY, 'user'], data.user);
    },
  });
}

/**
 * Hook for register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => registerUser(credentials),
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData([...AUTH_QUERY_KEY, 'user'], data.user);
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      clearAuthToken();
      queryClient.setQueryData([...AUTH_QUERY_KEY, 'user'], null);
      queryClient.clear();
    },
    onError: () => {
      // Even if the server call fails (expired session, network hiccup),
      // still clear local state so the user isn't stuck "logged in".
      clearAuthToken();
      queryClient.setQueryData([...AUTH_QUERY_KEY, 'user'], null);
      queryClient.clear();
    },
  });
}

/**
 * Hook for password reset request
 */
export function usePasswordReset() {
  return useMutation({
    mutationFn: (data: PasswordResetRequest) => requestPasswordReset(data),
  });
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useAuthUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
