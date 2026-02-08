const th = (v) => `rgb(var(--color-${v}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        th: {
          base:    th("bg-base"),
          surface: th("bg-surface"),
          raised:  th("bg-raised"),
          inset:   th("bg-inset"),
          overlay: th("bg-overlay"),

          text:      th("text"),
          "text-sub":  th("text-sub"),
          "text-dim":  th("text-dim"),
          "text-muted": th("text-muted"),

          border:  th("border"),
          hl:      th("hl"),

          input:   th("input"),

          accent:  th("accent"),
          cta:     th("cta"),
        },
      },
      borderColor: {
        "th-border":     "var(--color-border-val)",
        "th-border-dim": "var(--color-border-dim-val)",
      },
    },
  },
  plugins: [],
};
