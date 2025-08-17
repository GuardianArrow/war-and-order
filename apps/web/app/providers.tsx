'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="default"
      enableSystem={false}
      storageKey="wao-theme"
    >
      {children}
    </ThemeProvider>
  );
}