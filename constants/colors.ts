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

export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top" as const,
  },
  row: {
    flexDirection: "row" as const,
    gap: 12,
  },
  addButton: {
    backgroundColor: primary,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    backgroundColor: "#10b981",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center" as const,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  deleteButton: {
    padding: 8,
  },
  typeChips: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeChipActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10b981",
  },
  addImageButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: primary,
    borderRadius: 12,
    borderStyle: "dashed" as const,
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreviewWrapper: {
    position: "relative" as const,
    marginRight: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageButton: {
    position: "absolute" as const,
    top: -6,
    right: -6,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
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
