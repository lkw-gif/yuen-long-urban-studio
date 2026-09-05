import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { sitePath } from '@/lib/site-path';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '元朗街區 · Urban Studio',
  description: '沿街道邊緣探索元朗康樂路的互動 3D 街區，並匯入 Blender。',
  icons: { icon: sitePath('/favicon.svg') },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}


