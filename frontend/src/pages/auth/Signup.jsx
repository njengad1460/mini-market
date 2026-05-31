import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { confirmSignUp, getCurrentUser, signInWithRedirect } from 'aws-amplify/auth';
import useAuthStore from '../../store/authStore.js';

export default function Signup() {
  const [searchParams]        = useSearchParams();
  const [step, setStep]       = useState('signup'); // 'signup' | 'verify'
  const [form, setForm]       = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, login }   = useAuthStore();
  const navigate              = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then(() => navigate('/', { replace: true }))
      .catch(() => {});
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      if (form.referralCode) sessionStorage.setItem('referralCode', form.referralCode);
      await register(form.email, form.password, form.name, form.phone, form.referralCode);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const username = sessionStorage.getItem('pendingUsername');
      await confirmSignUp({ username, confirmationCode: code });
      try {
        await getCurrentUser();
      } catch {
        // auto login using email (alias) only when there is no active session
        await login(form.email, form.password);
      }
      sessionStorage.removeItem('pendingUsername');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-4xl mb-2">📧</p>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-gray-500 text-sm mt-1">
              We sent a verification code to <strong>{form.email}</strong>
            </p>
            <div className="mt-4 bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200">
              <p>Can't find the email? Please check your <strong>Spam</strong> or <strong>Junk</strong> folder.</p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-center text-lg tracking-widest"
              required
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || !code}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>

          <button
            onClick={() => setStep('signup')}
            className="w-full text-center text-sm text-gray-400 mt-4"
          >
            ← Back to signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-xl mb-6">
          <p><strong>Note:</strong> Verification emails may sometimes land in your <strong>Spam</strong> folder. For a faster and smoother experience, we recommend signing up with Google!</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
            required
          />
          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone e.g. 0712345678"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3"
              required
            />
            <p className="text-xs text-gray-400 mt-1 px-1">
              Enter your Kenyan number starting with 07 or 01
            </p>
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password (min 8 characters)"
              value={form.password}
              onChange={handleChange}
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

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 pr-10"
              required
              minLength={8}
            />
          </div>

          <input
            type="text"
            name="referralCode"
            placeholder="Referral code (optional)"
            value={form.referralCode}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
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
                if (form.referralCode) sessionStorage.setItem('referralCode', form.referralCode);
                await signInWithRedirect({ provider: 'Google' });
              }
            }}
            className="w-full border py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <img src="/favicon.svg" className="w-4 h-4" alt="" />
            Sign up with Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-black font-semibold underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
