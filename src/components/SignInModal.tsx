import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import LogoIcon from './LogoIcon';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SignInModal({ isOpen, onClose, onSuccess }: SignInModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listener for successful Google OAuth
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      // Allow local development, container domains, and Vercel domains
      const origin = event.origin;
      if (
        origin !== window.location.origin &&
        !origin.endsWith('.run.app') &&
        !origin.endsWith('.vercel.app') &&
        !origin.includes('localhost') &&
        !origin.includes('127.0.0.1')
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        onSuccess();
        onClose();
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onSuccess, onClose]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const originParam = encodeURIComponent(window.location.origin);
      const response = await fetch(`/api/auth/google/url?origin=${originParam}`);
      if (!response.ok) {
        throw new Error('ไม่สามารถขอ URL สัญญาณการเข้าระบบได้');
      }
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'pea_oauth_popup',
        'width=500,height=600,status=no,toolbar=no,menubar=no,location=yes'
      );

      if (!authWindow) {
        setError('เบราว์เซอร์บล็อกป๊อปอัป กรุณาเปิดสิทธิ์ให้เปิดระบบป๊อปอัปสเปซสำหรับการล็อกอิน');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-In');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="signin-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div id="signin-modal-container" className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Brand Accent Header Banner */}
        <div className="h-2 pea-gradient w-full"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          style={{ width: '32px', height: '32px' }}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mx-auto">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex mb-4 transition-transform hover:scale-105 duration-300">
              <LogoIcon size={64} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-center justify-center flex items-center gap-1.5 outfit">
              <span>เข้าสู่ระบบ</span>
              <span className="text-[#131024] font-extrabold">Your</span>
              <span className="text-[#7c3aed] font-extrabold">Prompt</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">คลังคัดสรรและจัดเก็บคำสั่ง AI ส่วนตัวและการใช้งานอย่างเป็นระบบ</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Real Google SSO Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" style={{ width: '20px', height: '20px' }}>
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.052 14.914 0 12 0 7.354 0 3.307 2.67 1.303 6.568l3.963 3.197z"
              />
              <path
                fill="#4285F4"
                d="M16.04 15.345c-1.077.732-2.432 1.164-4.04 1.164a4.905 4.905 0 0 1-4.733-3.345L3.303 16.36A11.954 11.954 0 0 0 12 24c3.245 0 6.136-1.08 8.168-2.925l-4.128-5.73z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235A4.905 4.905 0 0 1 4.909 12c0-.795.137-1.555.357-2.235L1.303 6.568A11.954 11.954 0 0 0 0 12c0 2.01.496 3.914 1.303 5.64l3.963-3.405z"
              />
              <path
                fill="#34A853"
                d="M23.52 12.3c0-.825-.075-1.613-.21-2.385H12v4.545h6.48c-.28 1.485-1.12 2.744-2.38 3.585l4.128 5.73c2.415-2.228 3.8-5.502 3.8-9.475z"
              />
            </svg>
            <span>ลงชื่อเข้าใช้ด้วยบัญชี Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
