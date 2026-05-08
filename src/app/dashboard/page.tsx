import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <section className="space-y-4 py-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <DashboardOverview />
    </section>
  );
}
