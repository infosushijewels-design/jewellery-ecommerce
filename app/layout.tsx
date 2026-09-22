import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/context/CartContext";
import CartSidebar from "@/components/cart/CartSidebar";
import { AuthProvider } from "@/lib/context/AuthContext";
import { WishlistProvider } from "@/lib/context/WishlistContext";
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ['normal', 'italic'],
});

import { ToastProvider } from "@/lib/context/ToastContext";
import { getPublicStoreSettings } from "@/lib/supabase/public";

export async function generateMetadata(): Promise<Metadata> {
  // Title, description, keywords and favicon are editable in Admin → Settings → SEO
  const { seo, store } = await getPublicStoreSettings();
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.keywords || undefined,
    ...(store.faviconUrl ? { icons: { icon: store.faviconUrl } } : {}),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${manrope.variable} ${playfair.variable}`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-fixed min-h-screen flex flex-col overflow-x-hidden">
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <CartSidebar />
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
