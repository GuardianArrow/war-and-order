import "./globals.css";
export const metadata = { title: "AMS Web" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased bg-neutral-950 text-neutral-200">
        {children}
      </body>
    </html>
  );
}
