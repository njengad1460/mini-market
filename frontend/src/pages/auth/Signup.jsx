import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { confirmSignUp, getCurrentUser, signInWithRedirect } from 'aws-amplify/auth';
import useAuthStore from '../../store/authStore.js';

export default function Signup() {
  const [searchParams]        = useSearchParams();
  const [step, setStep]       = useState('signup'); // 'signup' | 'verify'
  const [form, setForm]       = useState({
    name: '', email: '', phone: '', password: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
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
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-3"
            required
            minLength={8}
          />
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
            <img src="frontend/public/favicon.svg " className="w-4 h-4" alt="" />
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
