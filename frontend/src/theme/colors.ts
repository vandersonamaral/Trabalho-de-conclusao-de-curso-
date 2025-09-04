export const colors = {
  // Cores principais
  primary: "#2563eb", // Azul principal
  primaryDark: "#1e40af", // Azul escuro
  secondary: "#fff", // Branco

  // Gradientes
  gradient: ["#2563eb", "#1e40af"] as const,

  // Cores de texto
  textPrimary: "#222",
  textSecondary: "#666",
  textLight: "#999",
  textWhite: "#fff",

  // Cores de fundo
  background: "#f8f9fa",
  backgroundWhite: "#fff",
  backgroundCard: "#fff",

  // Cores de status
  success: "#22c55e",
  warning: "#ffc107",
  error: "#ef4444",
  info: "#2563eb",

  // Cores de borda
  border: "#e5e7eb",
  borderLight: "#f1f3f4",

  // Cores adicionais (para compatibilidade)
  white: "#fff",
  gray: "#6c757d",
  dark: "#212529",
  lightGray: "#f8f9fa",
  lightBlue: "#e3f2fd",

  // Cores de sombra
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowPrimary: "rgba(37, 99, 235, 0.2)",

  // Cores de overlay
  overlay: "rgba(255, 255, 255, 0.2)",
  overlayDark: "rgba(0, 0, 0, 0.5)",

  // Cores de status específicas
  status: {
    pendente: "#ffc107",
    aprovado: "#22c55e",
    rejeitado: "#ef4444",
    embarcado: "#2563eb",
    desembarcado: "#6c757d",
    cancelado: "#ef4444",
  },

  // Cores de botões
  button: {
    primary: "#2563eb",
    secondary: "#fff",
    danger: "#ef4444",
    success: "#22c55e",
    warning: "#ffc107",
  },
};

export const statusColors = {
  PENDENTE: colors.status.pendente,
  APROVADO: colors.status.aprovado,
  REJEITADO: colors.status.rejeitado,
  EMBARCADO: colors.status.embarcado,
  DESEMBARCADO: colors.status.desembarcado,
  CANCELADO: colors.status.cancelado,
};

export const statusTexts = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
  EMBARCADO: "Em Viagem",
  DESEMBARCADO: "Finalizada",
  CANCELADO: "Cancelada",
};

export const statusIcons = {
  PENDENTE: "schedule",
  APROVADO: "check-circle",
  REJEITADO: "cancel",
  EMBARCADO: "directions-bus",
  DESEMBARCADO: "flag",
  CANCELADO: "close",
};
