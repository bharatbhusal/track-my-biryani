import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center">
      <Card className="w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Daily Expenses Tracker</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Fast, mobile-first expense management with charts, audit logs, and secure auth.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/auth/signup">
            <Button>Get Started</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline">Login</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
