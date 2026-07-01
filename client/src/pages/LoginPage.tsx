import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginFields = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, loginVerify2fa, verifyOtp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 2FA login states
  const [show2FA, setShow2FA] = useState(false);
  const [temp2faToken, setTemp2faToken] = useState<string | null>(null);
  const [code2fa, setCode2fa] = useState('');
  const [submitting2fa, setSubmitting2fa] = useState(false);

  // OTP login states
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [submittingOtp, setSubmittingOtp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setServerError(null);
    try {
      const res = await login(data);
      if (res && res.requireOtp) {
        setOtpUserId(res.userId || null);
        setShowOtp(true);
      } else if (res && res.require2FA) {
        setTemp2faToken(res.temp2faToken || null);
        setShow2FA(true);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || err.message || 'Incorrect email or password.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpUserId || otpCode.length !== 6) return;

    setSubmittingOtp(true);
    setServerError(null);
    try {
      const res = await verifyOtp(otpUserId, otpCode);
      if (res && res.require2FA) {
        setShowOtp(false);
        setTemp2faToken(res.temp2faToken || null);
        setShow2FA(true);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || err.message || 'Invalid OTP code.');
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temp2faToken || code2fa.length !== 6) return;

    setSubmitting2fa(true);
    setServerError(null);
    try {
      await loginVerify2fa(temp2faToken, code2fa);
    } catch (err: any) {
      setServerError(err.response?.data?.error || err.message || 'Invalid 2FA code.');
    } finally {
      setSubmitting2fa(false);
    }
  };

  const resetOtpState = () => {
    setShowOtp(false);
    setOtpUserId(null);
    setOtpCode('');
    setServerError(null);
  };

  const reset2faState = () => {
    setShow2FA(false);
    setTemp2faToken(null);
    setCode2fa('');
    setServerError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        {/* Title / Logo Area */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-widest text-red-650 dark:text-red-500">
            AYE
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            Your personal command centre dashboard
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-8 shadow-xl backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#111111]/60">
          
          {show2FA ? (
            // 2FA Verification Form
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center gap-1 text-slate-450 dark:text-slate-500 mb-2">
                <button
                  onClick={reset2faState}
                  className="flex items-center gap-1 text-xs hover:text-slate-700 dark:hover:text-slate-350"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Sign In
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-red-655 dark:text-red-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Two-Factor Verification
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                This account is secured with 2FA. Please enter the 6-digit authenticator code from your device.
              </p>

              <form onSubmit={handle2faSubmit} className="mt-6 space-y-4">
                {serverError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code2fa}
                    onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, ''))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white/50 py-2.5 text-center text-lg font-bold tracking-[0.6em] text-slate-900 placeholder-slate-300 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting2fa || code2fa.length !== 6}
                  className="group flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting2fa ? 'Verifying...' : 'Verify & Enter'}
                </button>
              </form>
            </div>
          ) : showOtp ? (
            // OTP Verification Form
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center gap-1 text-slate-450 dark:text-slate-500 mb-2">
                <button
                  onClick={resetOtpState}
                  className="flex items-center gap-1 text-xs hover:text-slate-700 dark:hover:text-slate-350"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to Sign In
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-red-655 dark:text-red-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Verify Login OTP
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                A one-time password has been sent to your registered email address. Enter the code below to sign in.
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4">
                {serverError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white/50 py-2.5 text-center text-lg font-bold tracking-[0.6em] text-slate-900 placeholder-slate-300 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingOtp || otpCode.length !== 6}
                  className="group flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {submittingOtp ? 'Verifying...' : 'Verify & Enter'}
                </button>
              </form>
            </div>
          ) : (
            // Standard Credentials Login Form
            <div className="animate-in fade-in duration-200">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Welcome back
              </h2>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                Sign in to access your widgets and settings
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                {serverError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Email Address
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full rounded-lg border border-slate-300 bg-white/50 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
                      placeholder="name@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="w-full rounded-lg border border-slate-300 bg-white/50 py-2 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing in...' : (
                    <>
                      Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
