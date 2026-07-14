import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '../validators/registerSchema';
import { useRegister } from '../hooks/useAuth';

const inputClass =
  'mt-1.5 block w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/20 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30';

export function RegisterForm() {
  const navigate = useNavigate();
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    register(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
      }
    );
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
        <label htmlFor="name" className="block text-sm font-medium text-slate-300">
          Full Name
        </label>
        <input
          {...registerField('name')}
          type="text"
          id="name"
          className={inputClass}
          placeholder="John Doe"
        />
        {errors.name && <p className="mt-1.5 text-sm text-red-400">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          {...registerField('email')}
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
          {...registerField('password')}
          type="password"
          id="password"
          className={inputClass}
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
          Confirm Password
        </label>
        <input
          {...registerField('confirmPassword')}
          type="password"
          id="confirmPassword"
          className={inputClass}
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-400 px-4 py-2.5 font-medium text-slate-950 shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
