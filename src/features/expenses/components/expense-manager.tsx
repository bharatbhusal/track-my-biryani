'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useGeolocation } from '@/hooks/use-geolocation';
import { formatCurrency, formatDate } from '@/lib/format';
import { useUIStore } from '@/store/ui-store';

const formSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  dateTime: z.string().min(1),
  images: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Category = { _id: string; name: string };

type Expense = {
  _id: string;
  title: string;
  amount: number;
  currency: string;
  dateTime: string;
  categoryId: string;
};

export function ExpenseManager() {
  const queryClient = useQueryClient();
  const { detect, isLoading: isDetectingLocation } = useGeolocation();
  const currency = useUIStore((state) => state.currency);
  const locale = useUIStore((state) => state.locale);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      images: '',
      address: '',
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      const payload = (await response.json()) as { data: Category[] };
      return payload.data;
    },
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await fetch('/api/expenses?limit=20&page=1');
      const payload = (await response.json()) as { data: { items: Expense[] } };
      return payload.data.items;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const location = await detect();
      const imageUrls = values.images
        ? values.images
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          amount: values.amount,
          categoryId: values.categoryId,
          images: imageUrls,
          dateTime: new Date(values.dateTime).toISOString(),
          currency,
          location: {
            latitude: location?.latitude ?? 0,
            longitude: location?.longitude ?? 0,
            address: values.address,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Expense added');
      reset();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle className="mb-3">Quick Add Expense</CardTitle>
        <form className="space-y-3" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <Input {...register('title')} />
            {errors.title?.message && <span className="text-xs text-red-600">{errors.title.message}</span>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span>Amount</span>
              <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
              {errors.amount?.message && <span className="text-xs text-red-600">{errors.amount.message}</span>}
            </label>
            <label className="space-y-1 text-sm">
              <span>Date & Time</span>
              <Input type="datetime-local" {...register('dateTime')} />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span>Category</span>
            <Select {...register('categoryId')}>
              <option value="">Select</option>
              {(categoriesQuery.data ?? []).map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
            {errors.categoryId?.message && <span className="text-xs text-red-600">{errors.categoryId.message}</span>}
          </label>

          <label className="block space-y-1 text-sm">
            <span>Image URLs (comma separated)</span>
            <Input {...register('images')} placeholder="https://..." />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Address (optional)</span>
            <Input {...register('address')} placeholder="Address" />
          </label>

          <Button type="submit" className="w-full" disabled={isSubmitting || createMutation.isPending || isDetectingLocation}>
            {createMutation.isPending ? 'Saving...' : 'Add expense'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-3">Recent Expenses</CardTitle>
        <ul className="space-y-2 text-sm">
          {(expensesQuery.data ?? []).map((expense) => (
            <li key={expense._id} className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <p className="font-medium">{expense.title}</p>
                <p className="text-xs text-zinc-500">{formatDate(expense.dateTime, locale)}</p>
              </div>
              <p className="font-semibold">{formatCurrency(expense.amount, expense.currency, locale)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
