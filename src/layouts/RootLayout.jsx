import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { Toaster } from '@/components/common/Toaster';
import { useAuthStore } from '@/store/authStore';

/** App root: session restore, scroll restoration, toasts and skip link. */
export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to main content
      </a>
      <Outlet />
      <Toaster />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </>
  );
}
