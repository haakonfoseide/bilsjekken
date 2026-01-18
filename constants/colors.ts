const primary = "#2563eb";
const secondary = "#1e40af";
const accent = "#3b82f6";

export const typography = {
  pageTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 15,
    fontWeight: "500" as const,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
};

export default {
  primary,
  secondary,
  accent,
  background: "#f8fafc",
  cardBackground: "#ffffff",
  text: {
    primary: "#0f172a",
    secondary: "#64748b",
    light: "#94a3b8",
    tertiary: "#cbd5e1",
  },
  border: "#e2e8f0",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  tabIconDefault: "#94a3b8",
  tabIconSelected: primary,
};
