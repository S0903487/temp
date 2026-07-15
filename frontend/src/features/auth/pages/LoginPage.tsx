import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { AuthShell } from '../components/AuthShell';

export function LoginPage() {
  return (
    <AuthShell
      title="Sign In"
      subtitle={
        <>
          Or{' '}
          <Link to="/register" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
            create a new account
          </Link>
        </>
      }
      footer={
        <>
          Forgot your password?{' '}
          <Link to="/forgot-password" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
            Reset it here
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
