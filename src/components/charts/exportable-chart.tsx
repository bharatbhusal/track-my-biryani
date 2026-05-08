'use client';

import { toPng } from 'html-to-image';
import { ReactNode, useRef } from 'react';

import { Button } from '@/components/ui/button';

type ExportableChartProps = {
  title: string;
  children: ReactNode;
};

export function ExportableChart({ title, children }: ExportableChartProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const exportPng = async () => {
    if (!ref.current) {
      return;
    }

    const dataUrl = await toPng(ref.current);
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="outline" onClick={exportPng}>
          Export PNG
        </Button>
      </div>
      <div ref={ref} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
        {children}
      </div>
    </div>
  );
}
