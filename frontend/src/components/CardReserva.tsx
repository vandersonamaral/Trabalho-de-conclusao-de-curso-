import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

interface CardReservaProps {
  dia: string;
  hora: string;
  status: "APROVADA" | "CANCELADA" | "PENDENTE";
  onDetalhes: () => void;
  onQRCode: () => void;
  onCancelar: () => void;
  podeCancelar: boolean;
}

const statusInfo = {
  APROVADA: { color: "#43a047", icon: "check-circle", label: "Aprovada" },
  CANCELADA: { color: "#e53935", icon: "cancel", label: "Cancelada" },
  PENDENTE: { color: "#fbc02d", icon: "hourglass-empty", label: "Pendente" },
};

export default function CardReserva({
  dia,
  hora,
  status,
  onDetalhes,
  onQRCode,
  onCancelar,
  podeCancelar,
}: CardReservaProps) {
  const info = statusInfo[status];
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <MaterialIcons name="event" size={22} color="#1976d2" />
        <Text style={styles.data}>{dia}</Text>
        <View
          style={[styles.statusChip, { backgroundColor: info.color + "22" }]}
        >
          <MaterialIcons name={info.icon} size={16} color={info.color} />
          <Text style={[styles.statusText, { color: info.color }]}>
            {info.label}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <MaterialIcons name="schedule" size={18} color="#1976d2" />
        <Text style={styles.hora}>{hora}</Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onDetalhes}>
          <MaterialIcons name="visibility" size={28} color="#1976d2" />
          <Text style={styles.actionLabel}>Detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onQRCode}
          disabled={status !== "APROVADA"}
        >
          <MaterialCommunityIcons
            name="qrcode"
            size={28}
            color={status === "APROVADA" ? "#388e3c" : "#bdbdbd"}
          />
          <Text
            style={[
              styles.actionLabel,
              { color: status === "APROVADA" ? "#388e3c" : "#bdbdbd" },
            ]}
          >
            QR Code
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onCancelar}
          disabled={!podeCancelar}
        >
          <MaterialIcons
            name="cancel"
            size={28}
            color={podeCancelar ? "#e53935" : "#bdbdbd"}
          />
          <Text
            style={[
              styles.actionLabel,
              { color: podeCancelar ? "#e53935" : "#bdbdbd" },
            ]}
          >
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginVertical: 10,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  data: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    marginLeft: 8,
    flex: 1,
  },
  hora: {
    fontSize: 15,
    color: "#1976d2",
    marginLeft: 6,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  statusText: {
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  actionBtn: {
    alignItems: "center",
    flex: 1,
  },
  actionLabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
});
