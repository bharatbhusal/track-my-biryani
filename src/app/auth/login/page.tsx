import { AuthForm } from '@/features/auth/components/auth-form';

export const metadata = {
  title: 'Login',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <section className="py-6">
      <AuthForm mode="login" nextPath={next} />
    </section>
  );
}
