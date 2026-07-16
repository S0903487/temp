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
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 border border-slate-200">
            <CheckCircle className="h-5 w-5 text-slate-800" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Check your email</h2>
            <p className="mt-1.5 text-xs text-slate-600">
              We sent a password reset link to{' '}
              <span className="font-semibold text-slate-900">{getValues('email')}</span>
            </p>
            <p className="mt-3 text-[11px] text-slate-400">Redirecting to login in a few seconds...</p>
          </div>
          <Link to="/login" className="mt-2 font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2 text-xs">
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
        <Link to="/login" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="text-xs">{serverError}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="block w-full rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-black"
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-850 active:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60 text-sm shadow-sm"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </AuthShell>
  );
}
