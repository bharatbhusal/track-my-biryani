"use client";

import { FiX } from "react-icons/fi";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchSectionProps = {
  q: string;
  onChange: (q: string) => void;
};

export function SearchSection({ q, onChange }: SearchSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Search</h3>
      </div>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search..."
          value={q}
          maxLength={120}
          onChange={(e) => onChange(e.target.value)}
        />
        {q ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={() => onChange("")}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          >
            <FiX className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
