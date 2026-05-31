import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithRedirect, resetPassword, confirmResetPassword, getCurrentUser } from 'aws-amplify/auth';
import useAuthStore from '../../store/authStore.js';
import useI18n from '../../i18n/index.js';

export default function Login() {
  const [step, setStep]         = useState('login'); // 'login' | 'forgot' | 'reset'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login }               = useAuthStore();
  const navigate                = useNavigate();
  const t                       = useI18n((s) => s.t);

  useEffect(() => {
    getCurrentUser()
      .then(() => navigate('/', { replace: true }))
      .catch(() => {});
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of reset — send code to email
  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await resetPassword({ username: email });
      setSuccess(`Reset code sent to ${email}`);
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of reset — confirm code + new password
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await confirmResetPassword({
        username:         email,
        confirmationCode: code,
        newPassword,
      });
      setSuccess('Password reset successful! Please login.');
      setStep('login');
      setPassword('');
      setCode('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password — enter email ──
  if (step === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-4xl mb-2">🔑</p>
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter your email and we'll send you a reset code
            </p>
          </div>

          <form onSubmit={handleForgot} className="space-y-4">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              required
              autoFocus
            />
            {error   && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <button
            onClick={() => { setStep('login'); setError(''); }}
            className="w-full text-center text-sm text-gray-400 mt-4"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  // ── Reset password — enter code + new password ──
  if (step === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-4xl mb-2">📧</p>
            <h1 className="text-2xl font-bold">Enter Reset Code</h1>
            {success && <p className="text-green-600 text-sm mt-1">{success}</p>}
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="text"
              placeholder="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-center tracking-widest text-lg"
              required
              autoFocus
            />
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 px-1">
                Min 8 characters, include uppercase, number and special character
              </p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !code || !newPassword}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <button
            onClick={() => { setStep('forgot'); setError(''); setSuccess(''); }}
            className="w-full text-center text-sm text-gray-400 mt-4"
          >
            ← Resend code
          </button>
        </div>
      </div>
    );
  }

  // ── Login ──
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">{t('auth.welcome')}</h1>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
            required
          />
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-xl px-4 py-3 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setStep('forgot'); setError(''); setSuccess(''); }}
              className="text-xs text-blue-500 mt-1 px-1 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold"
          >
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <hr className="flex-1" /><span className="text-gray-400 text-sm">or</span><hr className="flex-1" />
        </div>

        <div className="space-y-3">
          <button
            onClick={async () => {
              setError('');
              try {
                await getCurrentUser();
                navigate('/', { replace: true });
                return;
              } catch {
                await signInWithRedirect({ provider: 'Google' });
              }
            }}
            className="w-full border py-3 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <img src="/favicon.svg" className="w-4 h-4" alt="" />
            {t('auth.google')}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-black font-semibold underline">{t('auth.signup')}</Link>
        </p>
      </div>
    </div>
  );
}
