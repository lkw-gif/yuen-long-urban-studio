'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const ALLOWED_DOMAIN = 'keilong.edu.hk';
const SESSION_KEY = 'yuen-long-urban-studio-google-session';
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';

type GoogleCredentialResponse = { credential?: string };
type GoogleButtonOptions = {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            hd?: string;
            ux_mode?: 'popup' | 'redirect';
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

type GateState = 'loading' | 'signed-out' | 'checking' | 'allowed' | 'denied' | 'missing-config';

function isAllowedEmail(email: string, hostedDomain: string, verified: boolean, audience: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    audience === clientId &&
    verified &&
    hostedDomain.trim().toLowerCase() === ALLOWED_DOMAIN &&
    normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`)
  );
}

function restoreSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as { email?: string; exp?: number } | null;
    if (saved?.email && saved.exp && saved.exp > Date.now() && saved.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      return saved.email;
    }
  } catch {
    // A blocked or malformed storage entry simply means the user signs in again.
  }
  return null;
}

export default function GoogleAuthGate({ children }: { children: ReactNode }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GateState>(() => (clientId ? 'loading' : 'missing-config'));
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!clientId) return;
    const restored = restoreSession();
    if (restored) {
      setEmail(restored);
      setState('allowed');
      return;
    }

    let disposed = false;
    const showButton = () => {
      if (disposed || !window.google || !buttonRef.current) return;
      buttonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        hd: ALLOWED_DOMAIN,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          if (!response.credential) {
            setState('denied');
            setMessage('Google 沒有返回有效的登入憑證，請再試一次。');
            return;
          }
          setState('checking');
          setMessage('正在確認學校帳戶…');
          try {
            // tokeninfo makes Google validate the signature and expiry before this
            // static page checks the audience and hosted domain.
            const result = await fetch(
              `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(response.credential)}`,
              { cache: 'no-store' },
            );
            if (!result.ok) throw new Error('Google token validation failed');
            const claims = (await result.json()) as {
              aud?: string;
              email?: string;
              email_verified?: boolean | string;
              exp?: string;
              hd?: string;
            };
            const accountEmail = claims.email?.trim() ?? '';
            const verified = claims.email_verified === true || claims.email_verified === 'true';
            if (!isAllowedEmail(accountEmail, claims.hd ?? '', verified, claims.aud ?? '')) {
              setState('denied');
              setEmail(accountEmail);
              setMessage('此網站只開放予 @keilong.edu.hk 學校帳戶。');
              return;
            }
            try {
              sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: accountEmail, exp: Number(claims.exp) * 1000 }));
            } catch {
              // The authenticated state still works for this page when storage is blocked.
            }
            setEmail(accountEmail);
            setMessage('');
            setState('allowed');
          } catch {
            setState('denied');
            setMessage('無法確認 Google 登入狀態，請檢查網絡後再試。');
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 300,
      });
      setState('signed-out');
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) {
      if (window.google) showButton();
      else existing.addEventListener('load', showButton, { once: true });
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.addEventListener('load', showButton, { once: true });
      document.head.appendChild(script);
    }
    return () => {
      disposed = true;
    };
  }, []);

  if (state === 'allowed') return <>{children}</>;

  const signOut = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Ignore blocked storage. */ }
    window.google?.accounts.id.disableAutoSelect();
    setEmail('');
    setMessage('');
    setState('signed-out');
    window.location.reload();
  };

  return (
    <main className="google-auth-gate">
      <section className="google-auth-card" aria-labelledby="google-auth-title">
        <div className="access-gate-eyebrow">KEILONG COLLEGE · YUEN LONG URBAN STUDIO</div>
        <h1 id="google-auth-title">中華基督教會基朗中學</h1>
        <h2>元朗街區設計工具</h2>
        {state === 'missing-config' ? (
          <>
            <p>網站尚未設定 Google Web Client ID，請通知網站管理員完成設定。</p>
            <p className="google-auth-help">只接受結尾為 <strong>@keilong.edu.hk</strong> 的學校帳戶。</p>
          </>
        ) : (
          <>
            <p>請使用學校 Google 帳戶登入，才可進入設計工具。</p>
            <p className="google-auth-help">只接受結尾為 <strong>@keilong.edu.hk</strong> 的帳戶。</p>
            {email && <p className="access-gate-account">目前帳戶：{email}</p>}
            {state === 'checking' && <p className="google-auth-status" role="status">{message}</p>}
            {state === 'denied' && <p className="google-auth-error" role="alert">{message}</p>}
            <div ref={buttonRef} className="google-auth-button" aria-label="使用 Google 登入" />
            {state === 'denied' && <button className="access-gate-action google-auth-retry" type="button" onClick={signOut}>更換帳戶</button>}
          </>
        )}
      </section>
    </main>
  );
}
