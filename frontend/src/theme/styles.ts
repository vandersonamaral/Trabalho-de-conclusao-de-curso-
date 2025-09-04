import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
  },

  // Headers
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textWhite,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },

  // Cards
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardLarge: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  // Inputs
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },

  // Buttons
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  buttonSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.button.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.button.primary,
  },

  buttonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  buttonTextSecondary: {
    color: colors.button.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  // Text
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Info cards
  infoCard: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: colors.textWhite,
    fontSize: 16,
    marginTop: 16,
  },

  // Success states
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  successIcon: {
    marginBottom: 24,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textWhite,
    marginBottom: 16,
    textAlign: "center",
  },

  successMessage: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },

  successActions: {
    width: "100%",
  },

  successButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  secondaryButton: {
    backgroundColor: colors.overlay,
  },

  successButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: colors.button.primary,
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  // Actions
  actionsContainer: {
    marginTop: 20,
    gap: 12,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.button.primary,
    fontWeight: "600",
  },

  // Status badges
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  // Icons
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    alignSelf: "center",
  },

  // Form sections
  formSection: {
    marginBottom: 20,
  },

  // Helper text
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },

  // Disabled states
  disabledInput: {
    backgroundColor: colors.borderLight,
    borderColor: colors.border,
  },

  disabledInputText: {
    color: colors.textLight,
  },

  disabledButton: {
    opacity: 0.7,
  },
});
