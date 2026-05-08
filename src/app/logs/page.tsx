import { ActivityList } from '@/features/logs/components/activity-list';

export const metadata = {
  title: 'Activities',
};

export default function LogsPage() {
  return (
    <section className="space-y-4 py-4">
      <h1 className="text-xl font-semibold">Recent Activities</h1>
      <ActivityList />
    </section>
  );
}
