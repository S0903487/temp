import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../validators/loginSchema';
import { useLogin } from '../hooks/useAuth';

const inputClass =
  'mt-1.5 block w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/20 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30';

export function LoginForm() {
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        navigate('/dashboard');
      },
    });
  };

  const serverError = error instanceof Error ? error.message : null;

  return (
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
          className={inputClass}
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className={inputClass}
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-400 px-4 py-2.5 font-medium text-slate-950 shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
