// apps/web/app/layout.tsx
import type { ReactNode } from 'react';
import { Inter, Lora } from 'next/font/google';

// Global Tailwind base + theme globals (fonts/radii/shadows)
import './globals.css';
import './(public)/design/globals.css';

export const metadata = { title: 'AMS Web' };

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-inter',
});

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif-lora',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-dvh antialiased bg-neutral-950 text-neutral-200">
        {children}
      </body>
    </html>
  );
}