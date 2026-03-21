"use client";

import { Archive, ArchiveRestore } from "lucide-react";

import { Button } from "@/components/ui/button";

type ArchiveNavigationButtonProps = {
  archived: boolean;
  archivedLabel: string;
  activeLabel: string;
  onClick: () => void;
};

export function ArchiveNavigationButton({
  archived,
  archivedLabel,
  activeLabel,
  onClick,
}: ArchiveNavigationButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto rounded-full px-2 text-zinc-500 hover:bg-transparent hover:text-zinc-900"
      onClick={onClick}
    >
      {archived ? (
        <ArchiveRestore className="size-3.5" />
      ) : (
        <Archive className="size-3.5" />
      )}
      {archived ? activeLabel : archivedLabel}
    </Button>
  );
}
