"use client";

import Modal from "./Modal";

export default function DeleteModal({
  open,
  postTitle,
  onCancel,
  onConfirm,
  loading,
}: {
  open: boolean;
  postTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-ink">Delete article?</h2>
        <p className="text-sm text-muted">
          "{postTitle}" — this action can't be undone
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-ink hover:text-olive transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-md border border-danger bg-danger px-4 py-2 text-sm font-medium text-cream hover:bg-[#A93226] hover:border-[#A93226] transition-colors disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
