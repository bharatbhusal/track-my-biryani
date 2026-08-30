"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type FilterOwner = {
  id: string;
  name: string;
  username: string;
};

type OwnerFilterSectionProps = {
  ownerIds: string[];
  owners: FilterOwner[];
  onChange: (ids: string[]) => void;
  onClear: () => void;
  isLoading?: boolean;
};

const rowClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]";

export function OwnerFilterSection({
  ownerIds,
  owners,
  onChange,
  onClear,
  isLoading,
}: OwnerFilterSectionProps) {
  const allIds = owners.map((o) => o.id);
  const allChecked = allIds.length > 0 && ownerIds.length === allIds.length;
  const indeterminate = ownerIds.length > 0 && ownerIds.length < allIds.length;
  const allRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const toggle = (id: string, checked: boolean) => {
    if (checked) onChange([...new Set([...ownerIds, id])]);
    else onChange(ownerIds.filter((v) => v !== id));
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          Posted by
          {isLoading ? <Spinner className="h-3 w-3" /> : null}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="shrink-0 text-[var(--color-muted)]"
        >
          Clear
        </Button>
      </div>

      <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-[var(--color-border)] p-1">
        <label className={rowClass}>
          <input
            ref={allRef}
            type="checkbox"
            checked={allChecked}
            onChange={(e) => onChange(e.target.checked ? [...allIds] : [])}
            className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
          />
          <span className="font-medium">All users</span>
        </label>
        {owners.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[var(--color-muted)]">
            {isLoading ? "Loading users…" : "No members in the selected buckets"}
          </p>
        ) : null}
        {owners.map((o) => (
          <label key={o.id} className={rowClass}>
            <input
              type="checkbox"
              checked={ownerIds.includes(o.id)}
              onChange={(e) => toggle(o.id, e.target.checked)}
              className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
            />
            <span className="truncate">{o.name || o.username}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
