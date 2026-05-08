'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Category = {
  _id: string;
  name: string;
  color: string;
};

export function CategoryManager() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      const payload = (await response.json()) as { data: Category[] };
      return payload.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (value: string) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      return response.json();
    },
    onSuccess: () => {
      setName('');
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Category deleted');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return (
    <Card>
      <CardTitle className="mb-4">Categories</CardTitle>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createMutation.mutate(name);
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Food, Transport..." />
        <Button type="submit" disabled={createMutation.isPending}>
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
            deleteMutation.mutate(deleteId);
          }
        }}
      />
    </Card>
  );
}
