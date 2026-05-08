'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CURRENCY_CODE_REGEX } from '@/lib/validation-constants';
import { useUIStore } from '@/store/ui-store';

const schema = z.object({
  locale: z.string().min(2),
  currency: z.string().regex(CURRENCY_CODE_REGEX),
  theme: z.enum(['light', 'dark', 'system']),
  hapticFeedback: z.boolean(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsForm() {
  const locale = useUIStore((state) => state.locale);
  const currency = useUIStore((state) => state.currency);
  const hapticFeedback = useUIStore((state) => state.hapticFeedback);
  const setPreferences = useUIStore((state) => state.setPreferences);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      locale,
      currency,
      theme: 'system',
      hapticFeedback,
      currentPassword: '',
      newPassword: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: values.locale,
        currency: values.currency.toUpperCase(),
        theme: values.theme,
        hapticFeedback: values.hapticFeedback,
        password:
          values.currentPassword && values.newPassword
            ? { currentPassword: values.currentPassword, newPassword: values.newPassword }
            : undefined,
      }),
    });

    if (!response.ok) {
      toast.error('Unable to update settings');
      return;
    }

    setPreferences({ locale: values.locale, currency: values.currency.toUpperCase(), hapticFeedback: values.hapticFeedback });
    toast.success('Settings updated');
  };

  const exportData = async () => {
    const response = await fetch('/api/export');
    if (!response.ok) {
      toast.error('Export failed');
      return;
    }

    const payload = (await response.json()) as { data: unknown };
    const blob = new Blob([JSON.stringify(payload.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const response = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: text,
    });

    if (!response.ok) {
      toast.error('Import failed');
      return;
    }

    toast.success('Import completed');
  };

  return (
    <Card>
      <CardTitle className="mb-4">Settings</CardTitle>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm">
          <span>Locale</span>
          <Input {...register('locale')} />
        </label>
        <label className="block text-sm">
          <span>Currency</span>
          <Input {...register('currency')} />
        </label>
        <label className="block text-sm">
          <span>Theme</span>
          <Select {...register('theme')}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('hapticFeedback')} />
          <span>Haptic feedback</span>
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Input type="password" {...register('currentPassword')} placeholder="Current password" />
          <Input type="password" {...register('newPassword')} placeholder="New password" />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Save settings
        </Button>
      </form>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        <Button variant="outline" onClick={exportData}>
          Export JSON
        </Button>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
          Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={importData} />
        </label>
      </div>
    </Card>
  );
}
