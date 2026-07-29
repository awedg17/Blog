"use client";

import { ReactNode, useEffect } from "react";

/**
 * Shared modal shell. Built with flex + gap (no fixed/absolute child
 * positioning) so spacing stays consistent regardless of content length —
 * this is the fix for the "modal items don't use auto layout" issue in the
 * original Figma file.
 */
export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-cream p-6 shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}
