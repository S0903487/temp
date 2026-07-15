import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '../validators/registerSchema';
import { useRegister } from '../hooks/useAuth';

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-black/60 focus:ring-2 focus:ring-black/10';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-xs">{serverError}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Full Name
        </label>
        <input
          {...registerField('name')}
          type="text"
          id="name"
          className={inputClass}
          placeholder="John Doe"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Email
        </label>
        <input
          {...registerField('email')}
          type="email"
          id="email"
          className={inputClass}
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          Password
        </label>
        <input
          {...registerField('password')}
          type="password"
          id="password"
          className={inputClass}
          placeholder="••••••••"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
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
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-850 active:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60 text-sm shadow-sm"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
