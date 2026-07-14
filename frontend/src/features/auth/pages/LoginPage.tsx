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
          <Link to="/register" className="font-medium text-violet-300 hover:text-violet-200">
            create a new account
          </Link>
        </>
      }
      footer={
        <>
          Forgot your password?{' '}
          <Link to="/forgot-password" className="font-medium text-violet-300 hover:text-violet-200">
            Reset it here
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
