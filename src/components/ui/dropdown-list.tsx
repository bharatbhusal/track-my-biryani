"use client";

import * as React from "react";

import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
  icon?: string;
};

type DropdownListProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange" | "children" | "onClick"
> & {
  options: DropdownOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  addLabel?: string;
  onAddNew?: () => void;
  trigger?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

const ADD_NEW_VALUE = "__add_new__";

export function DropdownList({
  options,
  value,
  onValueChange,
  placeholder,
  addLabel,
  onAddNew,
  trigger,
  className,
  onClick,
  ...rest
}: DropdownListProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!trigger) {
    // ponytail: visible native select, label text only — emoji live in the
    // trigger/menu world, not inside <option>.
    return (
      <Select
        className={className}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === ADD_NEW_VALUE) {
            onAddNew?.();
            return;
          }
          onValueChange(next);
        }}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {addLabel && onAddNew && <option value={ADD_NEW_VALUE}>+ {addLabel}</option>}
      </Select>
    );
  }

  const ariaLabel = (rest as Record<string, unknown>)["aria-label"] ?? placeholder ?? "Options";
  const current = options.find((o) => o.value === value);

  const choose = (next: string) => {
    if (next === ADD_NEW_VALUE) {
      onAddNew?.();
    } else {
      onValueChange(next);
    }
    setOpen(false);
  };

  return (
    <div
      ref={menuRef}
      onClick={onClick}
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel as string}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center"
      >
        <span aria-hidden="true" className="flex items-center justify-center">
          {trigger}
        </span>
        <span className="sr-only">{current?.label ?? placeholder ?? "Actions"}</span>
      </button>
      {open ? (
        <ul
          role="menu"
          aria-label={ariaLabel as string}
          className="absolute top-full right-0 z-50 mt-1 min-w-40 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.value} role="none">
              <button
                type="button"
                role="menuitem"
                aria-current={option.value === value || undefined}
                onClick={() => choose(option.value)}
                className="flex min-h-[44px] w-full items-center gap-2 px-3 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                {option.icon ? (
                  <span aria-hidden="true" className="shrink-0">
                    {option.icon}
                  </span>
                ) : null}
                <span className="truncate">{option.label}</span>
              </button>
            </li>
          ))}
          {addLabel && onAddNew ? (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(ADD_NEW_VALUE)}
                className="flex min-h-[44px] w-full items-center px-3 text-left text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                + {addLabel}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
