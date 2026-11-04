import axios, { type AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

export function isAdminLoginRequest(url?: string): boolean {
  return Boolean(url?.replace(/\/$/, '').endsWith('/auth/admin'));
}

export function isUnauthorizedError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      isUnauthorizedError(error) &&
      !isAdminLoginRequest(error.config?.url)
    ) {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível concluir a operação. Tente novamente.';
}
