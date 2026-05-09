'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { z } from 'zod';

import { ReceiptUpload } from '@/components/uploads/receipt-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCategoriesQuery, useExpenseMutations } from '@/hooks/api/use-expenses-api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { getDeviceDateTimeLocalInputValue, localDateTimeInputToUtcIso } from '@/lib/datetime';
import { useUIStore } from '@/store/ui-store';

const formSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  dateTime: z.string().min(1),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ExpenseFormProps = {
  submitLabel?: string;
  onSuccess?: () => void;
};

export function ExpenseForm({ submitLabel = 'Add expense', onSuccess }: ExpenseFormProps) {
  const { detect, isLoading: isDetectingLocation } = useGeolocation();
  const currency = useUIStore((state) => state.currency);
  const [images, setImages] = useState<string[]>([]);
  const { createExpense } = useExpenseMutations();

  const defaultValues = useMemo(
    () => ({
      dateTime: getDeviceDateTimeLocalInputValue(),
      address: '',
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const categoriesQuery = useCategoriesQuery();

  const onSubmit = async (values: FormValues) => {
    try {
      const location = await detect();

      await createExpense.mutateAsync({
        title: values.title,
        amount: values.amount,
        categoryId: values.categoryId,
        images,
        dateTime: localDateTimeInputToUtcIso(values.dateTime),
        currency,
        location: {
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
          address: values.address,
        },
      });

      toast.success('Expense added');
      reset(defaultValues);
      setImages([]);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save expense');
    }
  };

  return (
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
        {createExpense.isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
