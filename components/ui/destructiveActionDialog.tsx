"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DestructiveActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
  alternativeLabel?: string;
  onAlternative?: () => void;
  alternativePending?: boolean;
};

export function DestructiveActionDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  isPending = false,
  alternativeLabel,
  onAlternative,
  alternativePending = false,
}: DestructiveActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[min(32rem,calc(100vw-2rem))] max-w-[min(32rem,calc(100vw-2rem))] rounded-[1.75rem] border-none p-0 shadow-2xl"
      >
        <div className="rounded-[1.75rem] border border-zinc-100 bg-white p-7 sm:p-8">
          <DialogHeader className="gap-3 text-start">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-950">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-zinc-600">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              onClick={() => onOpenChange(false)}
              disabled={isPending || alternativePending}
            >
              {cancelLabel}
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              {alternativeLabel && onAlternative ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                  onClick={onAlternative}
                  disabled={isPending || alternativePending}
                >
                  {alternativePending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {alternativeLabel}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl px-6 font-semibold"
                onClick={onConfirm}
                disabled={isPending || alternativePending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {confirmLabel}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
