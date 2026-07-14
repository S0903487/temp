import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { usePasswordReset } from '../hooks/useAuth';
import { AuthShell } from '../components/AuthShell';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const { mutate: resetPassword, isPending, error } = usePasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    resetPassword(
      { email: data.email },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        },
      }
    );
  };

  const serverError = error instanceof Error ? error.message : null;

  if (submitted) {
    return (
      <AuthShell title="Reset Password">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15">
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Check your email</h2>
            <p className="mt-2 text-sm text-slate-400">
              We sent a password reset link to{' '}
              <span className="font-medium text-slate-200">{getValues('email')}</span>
            </p>
            <p className="mt-4 text-sm text-slate-500">Redirecting to login in a few seconds...</p>
          </div>
          <Link to="/login" className="mt-2 font-medium text-violet-300 hover:text-violet-200">
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your email and we'll send you a link to reset your password."
      footer={
        <Link to="/login" className="font-medium text-violet-300 hover:text-violet-200">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-sm">{serverError}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="mt-1.5 block w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/20 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-400 px-4 py-2.5 font-medium text-slate-950 shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthShell>
  );
}
