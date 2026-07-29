"use client";

import Modal from "./Modal";

export default function UnsavedChangesModal({
  open,
  onCancel,
  onDiscard,
  onSave,
  saving,
}: {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-ink">Unsaved Changes!</h2>
        <p className="text-sm text-muted">Save your work before leaving?</p>
      </div>
      <div className="flex justify-end gap-4 pt-2">
        <button
          onClick={onCancel}
          className="text-sm font-medium text-ink hover:text-olive transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDiscard}
          className="text-sm font-medium text-ink hover:text-danger transition-colors"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-[#3A3A3A] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
