'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useCategoriesQuery, useExpenseMutations } from '@/hooks/api/use-expenses-api';
import { Input } from '@/components/ui/input';

export function CategoryManager() {
  const [name, setName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const categoriesQuery = useCategoriesQuery();
  const { createCategory, deleteCategory } = useExpenseMutations();

  return (
    <Card>
      <CardTitle className="mb-4">Categories</CardTitle>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createCategory.mutate(name, {
            onSuccess: () => {
              setName('');
              toast.success('Category created');
            },
            onError: (error) => {
              toast.error(error instanceof Error ? error.message : 'Failed to create category');
            },
          });
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Food, Transport..." />
        <Button type="submit" disabled={createCategory.isPending}>
          Add
        </Button>
      </form>

      <ul className="space-y-2">
        {(categoriesQuery.data ?? []).map((category) => (
          <li key={category._id} className="flex items-center justify-between rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
              <span>{category.name}</span>
            </div>
            <Button variant="ghost" className="text-red-600" onClick={() => setDeleteId(category._id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete category"
        description="This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteCategory.mutate(deleteId, {
              onSuccess: () => {
                toast.success('Category deleted');
                setDeleteId(null);
              },
              onError: (error) => {
                toast.error(error instanceof Error ? error.message : 'Failed to delete category');
              },
            });
          }
        }}
      />
    </Card>
  );
}
