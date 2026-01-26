// src/components/ui/Card.jsx
export function Card({
  variant = "secondary",
  className = "",
  children,
}) {
  const variants = {
    primary:
      `
      bg-gradient-to-br
      from-[#0b1120]
      via-[#0f172a]
      to-[#020617]
      border border-[#7f5af0]/30
      shadow-[0_0_40px_rgba(127,90,240,.18)]
      `,

    secondary:
      `
      bg-gradient-to-b
      from-[#0b1120]
      to-[#020617]
      border border-white/10
      `,

    passive:
      `
      bg-[#020617]
      border border-white/5
      `,
  };

  return (
    <div
      className={`
        rounded-2xl
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
