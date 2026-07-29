  "use client";

  import Modal from "./Modal";

  export default function PublishModal({
    open,
    onCancel,
    onSaveDraft,
    onPublish,
    loading,
  }: {
    open: boolean;
    onCancel: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
    loading: boolean;
  }) {
    return (
      <Modal open={open} onClose={onCancel}>
        <h2 className="text-base font-bold text-ink">Your Blog is done!</h2>
        <p className="text-sm text-muted">Publish it now, or keep it as a draft to finish later.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onSaveDraft}
            disabled={loading}
            className="rounded-md border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-[#E7E2D9] transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={onPublish}
            disabled={loading}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-[#3A3A3A] transition-colors disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </Modal>
    );
  }

  
  