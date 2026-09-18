import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  pageName: string;
  children: ReactNode;
}

export default function LegalLayout({ eyebrow, title, description, pageName, children }: LegalLayoutProps) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 pt-4 sm:pt-6 pb-16 sm:pb-24">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: pageName },
          ]}
        />

        <div className="max-w-3xl mx-auto text-center mt-8 sm:mt-12 mb-10 sm:mb-16">
          <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">{eyebrow}</span>
          <h1 className="font-headline-lg text-[26px] sm:text-display-md text-primary mt-2">{title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-4 leading-relaxed">{description}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-10 sm:space-y-14">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({ title, icon, children }: { title: string; icon?: string; children: ReactNode }) {
  return (
    <section className="border-t border-outline-variant/30 pt-8 sm:pt-10 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <span className="material-symbols-outlined text-secondary text-[24px]">{icon}</span>
        )}
        <h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2>
      </div>
      <div className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-primary [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
