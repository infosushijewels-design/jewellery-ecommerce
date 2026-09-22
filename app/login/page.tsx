import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import AuthPanel from '@/components/auth/AuthPanel';

export default function LoginPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-14 flex items-center justify-center">
        <Suspense fallback={null}>
          <AuthPanel initialMode="login" />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
