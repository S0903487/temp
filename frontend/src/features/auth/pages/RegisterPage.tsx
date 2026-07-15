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
          <Link to="/login" className="font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2">
            Sign in here
          </Link>
        </>
      }
      footer={
        <span className="text-[10px] text-slate-400">
          Sarmad Hussain's Influencer Marketing Agency OS
        </span>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
