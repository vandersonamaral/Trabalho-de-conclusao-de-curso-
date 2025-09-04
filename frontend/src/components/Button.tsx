import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../theme/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary" | "danger";
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  variant = "primary",
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return [styles.button, styles.secondary, style];
      case "danger":
        return [styles.button, styles.danger, style];
      default:
        return [styles.button, style];
    }
  };
  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return [styles.text, styles.textSecondary, textStyle];
      case "danger":
        return [styles.text, styles.textDanger, textStyle];
      default:
        return [styles.text, textStyle];
    }
  };
  return (
    <TouchableOpacity
      style={[...getButtonStyle(), (loading || disabled) && styles.disabled]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" ? colors.primary : colors.secondary}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  text: {
    color: colors.secondary,
    fontWeight: "bold",
    fontSize: 16,
  },
  textSecondary: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.secondary,
  },
  disabled: {
    opacity: 0.7,
  },
});
