'use client';

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#14b8a6', '#8b5cf6', '#f97316', '#f43f5e', '#0ea5e9', '#22c55e'];

type DataPoint = {
  name: string;
  value: number;
};

export function CategoryPieChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
