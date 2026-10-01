import { useAuthStore } from '@/store/authStore';
import { ROLE_HOME } from '@/constants/roles';

/** Auth state and actions for components (wraps the Zustand store). */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    status,
    isAuthenticated: Boolean(user),
    role: user?.role ?? null,
    homePath: user ? ROLE_HOME[user.role] : '/',
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    login,
    register,
    logout,
    setUser,
  };
}
