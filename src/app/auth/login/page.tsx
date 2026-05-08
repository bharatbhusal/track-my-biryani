import { AuthForm } from '@/features/auth/components/auth-form';

export const metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <section className="py-6">
      <AuthForm mode="login" />
    </section>
  );
}
