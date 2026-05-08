import { AuthForm } from '@/features/auth/components/auth-form';

export const metadata = {
  title: 'Sign Up',
};

export default function SignupPage() {
  return (
    <section className="py-6">
      <AuthForm mode="signup" />
    </section>
  );
}
