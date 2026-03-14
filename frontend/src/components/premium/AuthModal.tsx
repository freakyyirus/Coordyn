import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

type AuthModalProps = {
  open: boolean;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authLoading: boolean;
  signupName: string;
  setSignupName: (value: string) => void;
  signupEmail: string;
  setSignupEmail: (value: string) => void;
  signupPassword: string;
  setSignupPassword: (value: string) => void;
  signupConfirmPassword: string;
  setSignupConfirmPassword: (value: string) => void;
  signupCompany: string;
  setSignupCompany: (value: string) => void;
  signupUseCase: string;
  setSignupUseCase: (value: string) => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  authMode,
  setAuthMode,
  authLoading,
  signupName,
  setSignupName,
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  signupConfirmPassword,
  setSignupConfirmPassword,
  signupCompany,
  setSignupCompany,
  signupUseCase,
  setSignupUseCase,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  onSubmit,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <article className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-platform-accent/15 bg-platform-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-platform-accent">
              <Sparkles size={12} /> Coordyn access
            </div>
            <h3 className="mt-4">{authMode === 'signup' ? 'Create your workspace' : 'Enter your workspace'}</h3>
            <p>Access simulations, logs, and resource controls from a single interface.</p>
          </div>
          <div className="grid gap-2 rounded-[20px] border border-slate-200 bg-slate-50 p-1 sm:grid-cols-2">
            <button className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${authMode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} onClick={() => setAuthMode('signup')}>
              Sign up
            </button>
            <button className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`} onClick={() => setAuthMode('login')}>
              Login
            </button>
          </div>
        </div>
        <div className="form-grid">
          {authMode === 'signup' && (
            <label>
              Full Name
              <input value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Your name" />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={authMode === 'signup' ? signupEmail : loginEmail}
              onChange={(e) => (authMode === 'signup' ? setSignupEmail(e.target.value) : setLoginEmail(e.target.value))}
              placeholder="you@company.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={authMode === 'signup' ? signupPassword : loginPassword}
              onChange={(e) => (authMode === 'signup' ? setSignupPassword(e.target.value) : setLoginPassword(e.target.value))}
              placeholder="••••••••"
            />
          </label>
          {authMode === 'signup' && (
            <>
              <label>
                Confirm Password
                <input
                  type="password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <label>
                Company / Organization (optional)
                <input value={signupCompany} onChange={(e) => setSignupCompany(e.target.value)} placeholder="Your company" />
              </label>
              <label>
                Use Case
                <select value={signupUseCase} onChange={(e) => setSignupUseCase(e.target.value)}>
                  <option>Supply Chain</option>
                  <option>Finance</option>
                  <option>Logistics</option>
                  <option>Research</option>
                  <option>Other</option>
                </select>
              </label>
            </>
          )}
        </div>
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-[#fcfcfb] p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Workspace capabilities</div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">Live negotiation graph</div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">Round-by-round logs</div>
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">Resource utilization metrics</div>
          </div>
        </div>
        <div className="modal-actions mt-6">
          <button className="action-btn start" onClick={onSubmit} disabled={authLoading}>
            {authLoading ? 'Please wait...' : authMode === 'signup' ? 'Create account' : 'Continue'} <ArrowRight size={14} />
          </button>
          <button className="action-btn" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>
            {authMode === 'signup' ? 'Already have an account? Switch to login' : 'Need an account? Switch to sign up'}
          </button>
        </div>
      </article>
    </div>
  );
};
