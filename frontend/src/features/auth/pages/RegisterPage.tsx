import { Link } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { AuthShell } from '../components/AuthShell';

export function RegisterPage() {
  return (
    <AuthShell
      title="Create Account"
      subtitle={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Sign in here
          </Link>
        </>
      }
      footer={
        <span className="text-xs text-slate-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </span>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
