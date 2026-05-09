'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { analyticsApi } from '@/lib/api/analytics';
import { useSettingsMutations } from '@/hooks/api/use-analytics-api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CURRENCY_CODE_REGEX } from '@/lib/validation-constants';
import { useUIStore } from '@/store/ui-store';

const schema = z.object({
  locale: z.string().min(2),
  currency: z.string().regex(CURRENCY_CODE_REGEX),
  timezone: z.string().min(3),
  theme: z.enum(['light', 'dark', 'system']),
  hapticFeedback: z.boolean(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsForm() {
  const locale = useUIStore((state) => state.locale);
  const currency = useUIStore((state) => state.currency);
  const timezone = useUIStore((state) => state.timezone);
  const hapticFeedback = useUIStore((state) => state.hapticFeedback);
  const setPreferences = useUIStore((state) => state.setPreferences);
  const { setTheme } = useTheme();
  const { updateSettings, importData: importDataMutation } = useSettingsMutations();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      locale,
      currency,
      timezone,
      theme: 'system',
      hapticFeedback,
      currentPassword: '',
      newPassword: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateSettings.mutateAsync({
        locale: values.locale,
        currency: values.currency.toUpperCase(),
        timezone: values.timezone,
        theme: values.theme,
        hapticFeedback: values.hapticFeedback,
        password:
          values.currentPassword && values.newPassword
              ? { currentPassword: values.currentPassword, newPassword: values.newPassword }
              : undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update settings');
      return;
    }

    setTheme(values.theme);
    setPreferences({
      locale: values.locale,
      currency: values.currency.toUpperCase(),
      timezone: values.timezone,
      hapticFeedback: values.hapticFeedback,
    });
    toast.success('Settings updated');
  };

  const handleExportDownload = async (format: 'json' | 'csv') => {
    try {
      const payload = await analyticsApi.exportData(format);
      const blob = new Blob([payload.data], { type: payload.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = payload.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      await importDataMutation.mutateAsync(JSON.parse(text));
      toast.success('Import completed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed');
    }
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
          <span>Timezone</span>
          <Input {...register('timezone')} />
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
          <Button variant="outline" aria-label="Export data as JSON" onClick={() => void handleExportDownload('json')}>
            Export JSON
          </Button>
          <Button variant="outline" aria-label="Export data as CSV" onClick={() => void handleExportDownload('csv')}>
            Export CSV
          </Button>
        </div>
        <div className="mt-2">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importData} />
          </label>
        </div>
    </Card>
  );
}
