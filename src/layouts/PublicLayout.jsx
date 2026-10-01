import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { LoadingState } from '@/components/common/States';

/** Public marketplace shell: fixed Stitch header, page content, footer. */
export default function PublicLayout() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-[calc(100vh-80px)] w-full bg-surface pt-20">
        <Suspense fallback={<LoadingState label="Loading page" className="min-h-[60vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
