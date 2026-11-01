import { create } from "zustand";
import { persist } from "zustand/middleware";

const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "lookshow";

interface AuthState {
  authed: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      authed: false,
      login: (password) => {
        const ok = password === ADMIN_PASSWORD;
        if (ok) set({ authed: true });
        return ok;
      },
      logout: () => set({ authed: false }),
    }),
    { name: "lookshow:auth" },
  ),
);
