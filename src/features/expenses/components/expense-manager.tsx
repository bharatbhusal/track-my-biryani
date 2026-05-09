'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { ReceiptUpload } from '@/components/uploads/receipt-upload';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useCategoriesQuery, useExpenseMutations, useExpensesQuery } from '@/hooks/api/use-expenses-api';
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
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function getDefaultDateTimeLocal(): string {
  return new Date().toISOString().slice(0, 16);
}

export function ExpenseManager() {
  const { detect, isLoading: isDetectingLocation } = useGeolocation();
  const currency = useUIStore((state) => state.currency);
  const locale = useUIStore((state) => state.locale);
  const timezone = useUIStore((state) => state.timezone);
  const [images, setImages] = useState<string[]>([]);
  const { createExpense } = useExpenseMutations();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateTime: getDefaultDateTimeLocal(),
      address: '',
    },
  });

  const categoriesQuery = useCategoriesQuery();
  const expensesQuery = useExpensesQuery(1, 20);

  const onSubmit = async (values: FormValues) => {
    try {
      const location = await detect();

      await createExpense.mutateAsync({
        title: values.title,
        amount: values.amount,
        categoryId: values.categoryId,
        images,
        dateTime: new Date(values.dateTime).toISOString(),
        currency,
        location: {
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
          address: values.address,
        },
      });

      toast.success('Expense added');
      reset();
      setImages([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save expense');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle className="mb-3">Quick Add Expense</CardTitle>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
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

          <div className="space-y-1 text-sm">
            <span>Receipts</span>
            <ReceiptUpload value={images} onChange={setImages} />
          </div>

          <label className="block space-y-1 text-sm">
            <span>Address (optional)</span>
            <Input {...register('address')} placeholder="Address" />
          </label>

          <Button type="submit" className="w-full" disabled={isSubmitting || createExpense.isPending || isDetectingLocation}>
            {createExpense.isPending ? 'Saving...' : 'Add expense'}
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
                <p className="text-xs text-zinc-500">{formatDate(expense.dateTime, locale, timezone)}</p>
              </div>
              <p className="font-semibold">{formatCurrency(expense.amount, expense.currency, locale)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
