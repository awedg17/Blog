import { ReactNode } from "react";

/**
 * Icon-only button that expands to show its label on hover/focus.
 * Idle state shows icon only with no background (except danger variant).
 * On hover, background appears and label expands.
 */
export default function HoverActionButton({
  icon,
  label,
  onClick,
  variant = "default",
  type = "button",
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger" | "primary";
  type?: "button" | "submit";
}) {
  const variantClasses =
    variant === "danger"
      ? "text-danger border-transparent hover:bg-[#C0392B] hover:text-cream hover:border-[#C0392B]"
      : variant === "primary"
      ? "bg-ink text-cream border-ink hover:bg-[#3A3A3A] hover:border-[#3A3A3A]"
      : "text-ink border-transparent hover:bg-[#E7E2D9] hover:border-[#E7E2D9]";

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      className={`group inline-flex items-center gap-1.5 overflow-hidden rounded-md border border-border px-2 py-1.5 transition-colors duration-150 ${variantClasses}`}
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className="max-w-0 whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  );
}
