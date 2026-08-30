"use client";

import { useEffect, useRef } from "react";

type MultiSelectProps = {
  options: { value: string; label: string; icon?: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel?: string;
  isAll: boolean;
  onAllChange: (isAll: boolean) => void;
  emptyLabel?: string;
};

const rowClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-muted)]";

export function MultiSelect({
  options,
  selected,
  onChange,
  allLabel = "All",
  isAll,
  onAllChange,
  emptyLabel = "Nothing to select",
}: MultiSelectProps) {
  const allValues = options.map((o) => o.value);
  const isAllChecked = isAll || (allValues.length > 0 && selected.length === allValues.length);
  const isIndeterminate =
    !isAllChecked && selected.length > 0 && selected.length < allValues.length;

  const allRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  const toggle = (value: string) => {
    if (isAllChecked) {
      // All was checked → uncheck All and keep N-1
      onAllChange(false);
      onChange(allValues.filter((v) => v !== value));
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    if (next.length === allValues.length && allValues.length > 0) {
      onAllChange(true);
    } else {
      onChange(next);
    }
  };

  return (
    <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-[var(--color-border)] p-1">
      <label className={rowClass}>
        <input
          ref={allRef}
          type="checkbox"
          checked={isAllChecked}
          onChange={(e) => onAllChange(e.target.checked)}
          className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
        />
        <span className="font-medium">{allLabel}</span>
      </label>
      {options.length === 0 ? (
        <p className="px-3 py-2 text-xs text-[var(--color-muted)]">{emptyLabel}</p>
      ) : null}
      {options.map((o) => (
        <label key={o.value} className={rowClass}>
          <input
            type="checkbox"
            checked={isAllChecked || selected.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
          />
          {o.icon ? <span>{o.icon}</span> : null}
          <span className="truncate">{o.label}</span>
        </label>
      ))}
    </div>
  );
}
