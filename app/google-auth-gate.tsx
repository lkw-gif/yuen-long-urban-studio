'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { verifyGoogleIdToken } from '@/lib/verify-google-id-token';

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

function restoreCredential() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as { credential?: string; exp?: number } | null;
    if (saved?.credential && saved.exp && saved.exp > Date.now()) {
      return saved.credential;
    }
  } catch {
    // A blocked or malformed storage entry simply means the user signs in again.
  }
  return null;
}

async function verifyCredential(credential: string) {
  return verifyGoogleIdToken(credential, clientId, ALLOWED_DOMAIN);
}

export default function GoogleAuthGate({ children }: { children: ReactNode }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GateState>(() => (clientId ? 'loading' : 'missing-config'));
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!clientId) return;
    let disposed = false;
    const restored = restoreCredential();
    if (restored) {
      void verifyCredential(restored).then(({ allowed, email: savedEmail }) => {
        if (disposed) return;
        if (allowed) {
          setEmail(savedEmail);
          setState('allowed');
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          setState('signed-out');
        }
      }).catch(() => {
        if (!disposed) {
          sessionStorage.removeItem(SESSION_KEY);
          setState('signed-out');
        }
      });
    }
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
            // Verify Google's signature and the intended audience and Workspace domain.
            const verified = await verifyCredential(response.credential);
            if (!verified.allowed) {
              setState('denied');
              setEmail(verified.email);
              setMessage('此網站只開放予 @keilong.edu.hk 學校帳戶。');
              return;
            }
            try {
              sessionStorage.setItem(SESSION_KEY, JSON.stringify({ credential: response.credential, exp: verified.exp }));
            } catch {
              // The authenticated state still works for this page when storage is blocked.
            }
            setEmail(verified.email);
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
      if (!restored) setState('signed-out');
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
            {state === 'checking' && <output className="google-auth-status">{message}</output>}
            {state === 'denied' && <p className="google-auth-error" role="alert">{message}</p>}
            <div ref={buttonRef} className="google-auth-button" aria-label="使用 Google 登入" />
            {state === 'denied' && <button className="access-gate-action google-auth-retry" type="button" onClick={signOut}>更換帳戶</button>}
          </>
        )}
      </section>
    </main>
  );
}
