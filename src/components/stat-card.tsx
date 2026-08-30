import { Card } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
};

export function StatCard({ title, value }: StatCardProps) {
  return (
    <Card key={title} className="min-w-[100px] flex-1">
      <p className="truncate text-xs text-[var(--color-muted)]">{title}</p>
      <p className="truncate font-medium tabular-nums">{value}</p>
    </Card>
  );
}
