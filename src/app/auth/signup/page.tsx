import { AuthForm } from '@/features/auth/components/auth-form';

export const metadata = {
  title: 'Sign Up',
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <section className="py-6">
      <AuthForm mode="signup" nextPath={next} />
    </section>
  );
}
