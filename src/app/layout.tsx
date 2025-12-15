import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Live Studio Pro',
  description: 'Real-time creator studio for live streaming.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        {/* Banuba SDK Scripts */}
        <Script src="https://cdn.jsdelivr.net/npm/@banuba/webar/dist/banuba.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@banuba/webar/dist/webar/banuba.wasm.js" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@banuba/webar/dist/webar/banuba.wasm.wasm" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@banuba/webar/dist/webar/banuba.simd.wasm" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/@banuba/webar/dist/webar/banuba.simd.js" strategy="beforeInteractive" />

      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
