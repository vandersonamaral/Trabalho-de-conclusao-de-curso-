import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
}

export default function Snackbar({
  visible,
  message,
  type = "info",
}: SnackbarProps) {
  if (!visible) return null;
  const icon =
    type === "success" ? "check-circle" : type === "error" ? "error" : "info";
  const bgColor =
    type === "success"
      ? colors.success
      : type === "error"
      ? colors.error
      : colors.info;
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <MaterialIcons
        name={icon}
        size={22}
        color="#fff"
        style={{ marginRight: 8 }}
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 32,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    zIndex: 999,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  text: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
  },
});
