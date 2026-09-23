import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { sitePath } from '@/lib/site-path';
import { LanguageProvider } from '@/components/language-provider';
import { chatGPTSignOutPath, requireChatGPTUser } from './chatgpt-auth';
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

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const returnTo = requestHeaders.get('x-invoke-path') ?? requestHeaders.get('x-forwarded-uri') ?? '/';
  const user = await requireChatGPTUser(returnTo);
  const allowed = user.email.trim().toLowerCase().endsWith('@keilong.edu.hk');

  return (
    <html lang="zh-Hant" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>{allowed ? children : <AccessDenied email={user.email} />}</LanguageProvider>
      </body>
    </html>
  );
}

function AccessDenied({ email }: { email: string }) {
  return (
    <main className="access-gate">
      <section className="access-gate-card" aria-labelledby="access-gate-title">
        <div className="access-gate-eyebrow">KEILONG COLLEGE · YUEN LONG URBAN STUDIO</div>
        <h1 id="access-gate-title">中華基督教會基朗中學</h1>
        <h2>元朗街區設計工具</h2>
        <p>此網站只開放予使用 <strong>@keilong.edu.hk</strong> 電郵的帳戶。</p>
        <p className="access-gate-account">目前登入：{email}</p>
        <a className="access-gate-action" href={chatGPTSignOutPath('/')}>登出並更換帳戶</a>
      </section>
    </main>
  );
}


