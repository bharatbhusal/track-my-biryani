'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useAuthActions } from '@/hooks/api/use-auth-api';
import { Input } from '@/components/ui/input';

type AuthMode = 'login' | 'signup';

const signupFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type SignupValues = z.infer<typeof signupFormSchema>;
type LoginValues = z.infer<typeof loginFormSchema>;

export function AuthForm({ mode, nextPath }: { mode: AuthMode; nextPath?: string }) {
  const router = useRouter();
  const { login, signup } = useAuthActions();
  const schema = mode === 'signup' ? signupFormSchema : loginFormSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues | LoginValues>({
    resolver: zodResolver(schema),
  });
  const fieldErrors = errors as Record<string, { message?: string }>;
  const getFieldError = (field: string) => fieldErrors[field]?.message;

  const onSubmit = async (values: SignupValues | LoginValues) => {
    try {
      if (mode === 'signup') {
        await signup.mutateAsync(values as SignupValues);
      } else {
        await login.mutateAsync(values as LoginValues);
      }

      toast.success(mode === 'signup' ? 'Account created' : 'Welcome back');
      const destination = nextPath?.startsWith('/') ? nextPath : '/dashboard';
      router.replace(destination);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardTitle className="mb-4 text-lg">{mode === 'signup' ? 'Create account' : 'Login'}</CardTitle>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        {mode === 'signup' && (
          <label className="block space-y-1 text-sm">
            <span>Name</span>
            <Input {...register('name' as const)} aria-invalid={Boolean(getFieldError('name'))} />
            {getFieldError('name') && <span className="text-xs text-red-600">{getFieldError('name')}</span>}
          </label>
        )}

        <label className="block space-y-1 text-sm">
          <span>Email</span>
          <Input type="email" {...register('email' as const)} aria-invalid={Boolean(getFieldError('email'))} />
          {getFieldError('email') && <span className="text-xs text-red-600">{getFieldError('email')}</span>}
        </label>

        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <Input type="password" {...register('password' as const)} aria-invalid={Boolean(getFieldError('password'))} />
          {getFieldError('password') && <span className="text-xs text-red-600">{getFieldError('password')}</span>}
        </label>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Login'}
        </Button>
      </form>
      <p className="mt-4 text-xs text-zinc-500">
        {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link href={mode === 'signup' ? '/auth/login' : '/auth/signup'} className="underline">
          {mode === 'signup' ? 'Login' : 'Sign up'}
        </Link>
      </p>
    </Card>
  );
}
