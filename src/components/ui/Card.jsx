// src/components/ui/Card.jsx
export function Card({
  variant = "secondary",
  className = "",
  children,
}) {
  const shadow = "shadow-[var(--shadow-card)]";

  const variants = {
    primary:
      `bg-gradient-to-br from-th-raised via-th-surface to-th-base border border-th-accent/30 dark:shadow-[0_0_40px_rgba(127,90,240,.18)] ${shadow}`,

    secondary:
      `bg-gradient-to-b from-th-raised to-th-base border border-th-border ${shadow}`,

    passive:
      `bg-th-base border border-th-border-dim ${shadow}`,
  };

  return (
    <div className={`rounded-2xl ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
