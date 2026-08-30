"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { FiEdit2, FiPlus } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useAppDispatch } from "@/store/hooks";
import { createBucket, updateBucket } from "@/store/slices/bucketSlice";
import type { BucketSummary } from "@/types/bucket.types";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

export function bucketErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message ?? fallback);
  }
  return fallback;
}

type FormValues = {
  name: string;
  icon: string;
};

type BucketFormProps = {
  bucket?: BucketSummary | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function BucketForm({ bucket, onSuccess, onCancel }: BucketFormProps) {
  const dispatch = useAppDispatch();
  const { resolvedTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(bucket);

  const emojiPickerTheme = resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: bucket?.name ?? "",
      icon: bucket?.icon ?? "📁",
    },
  });

  const iconValue = watch("icon");

  const handleEmojiClick = useCallback(
    (emojiObject: { emoji: string }) => {
      setValue("icon", emojiObject.emoji);
    },
    [setValue],
  );

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && bucket?._id) {
        await dispatch(
          updateBucket({
            id: bucket._id,
            name: values.name.trim(),
            icon: values.icon || "📁",
          }),
        ).unwrap();
        toast.success("Bucket renamed");
      } else {
        await dispatch(
          createBucket({
            name: values.name.trim(),
            icon: values.icon || "📁",
          }),
        ).unwrap();
        toast.success(`Bucket "${values.name.trim()}" created`);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(
        bucketErrorMessage(err, isEditing ? "Failed to rename bucket" : "Failed to create bucket"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Name</label>
        <Input {...register("name")} placeholder="Weekend trip" autoFocus={!isEditing} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Icon</label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-lg hover:bg-[var(--color-surface-muted)] transition-colors"
              aria-label="Pick emoji"
            >
              {iconValue || "📁"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="max-h-[40vh] overflow-y-auto">
              <EmojiPicker theme={emojiPickerTheme} onEmojiClick={handleEmojiClick} />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className={onCancel ? "flex-1" : "w-full"} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" />
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            <>
              <FiEdit2 className="mr-1.5 h-4 w-4" />
              Save
            </>
          ) : (
            <>
              <FiPlus className="mr-1.5 h-4 w-4" />
              Create
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
