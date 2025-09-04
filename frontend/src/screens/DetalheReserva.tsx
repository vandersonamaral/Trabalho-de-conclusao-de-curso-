import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import { RouteProp } from "@react-navigation/native";

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "DetalheReserva">;
  route: RouteProp<RootStackParamList, "DetalheReserva">;
};

interface Reserva {
  id: number;
  data: string;
  status: string;
  viagemId?: number;
  user?: {
    nome: string;
    matricula: string;
  };
  viagem?: {
    motoristaId: string;
    data: string;
    status: string;
  };
}

export default function DetalheReserva({ navigation, route }: Props) {
  const reserva: Reserva = route.params?.reserva || {
    id: 1,
    data: "2024-07-10T07:00:00.000Z",
    status: "APROVADA",
    user: {
      nome: "João Silva",
      matricula: "2024001234",
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "#ffc107";
      case "APROVADA":
        return "#28a745";
      case "REJEITADA":
        return "#dc3545";
      case "EMBARCADO":
        return "#17a2b8";
      case "DESEMBARCADO":
        return "#6c757d";
      case "CANCELADA":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "Pendente";
      case "APROVADA":
        return "Aprovada";
      case "REJEITADA":
        return "Rejeitada";
      case "EMBARCADO":
        return "Em Viagem";
      case "DESEMBARCADO":
        return "Finalizada";
      case "CANCELADA":
        return "Cancelada";
      default:
        return "Desconhecido";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "schedule";
      case "APROVADA":
        return "check-circle";
      case "REJEITADA":
        return "cancel";
      case "EMBARCADO":
        return "directions-bus";
      case "DESEMBARCADO":
        return "flag";
      case "CANCELADA":
        return "close";
      default:
        return "help";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Reserva</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <MaterialIcons
                name={getStatusIcon(reserva.status)}
                size={32}
                color={getStatusColor(reserva.status)}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>Status da Reserva</Text>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(reserva.status) },
                  ]}
                >
                  {getStatusText(reserva.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Informações da Reserva */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações da Reserva</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  color="#667eea"
                />
                <Text style={styles.infoLabel}>ID da Reserva:</Text>
                <Text style={styles.infoValue}>#{reserva.id}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={20} color="#667eea" />
                <Text style={styles.infoLabel}>Data:</Text>
                <Text style={styles.infoValue}>{formatDate(reserva.data)}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={20} color="#667eea" />
                <Text style={styles.infoLabel}>Horário:</Text>
                <Text style={styles.infoValue}>{formatTime(reserva.data)}</Text>
              </View>
            </View>
          </View>

          {/* Informações do Passageiro */}
          {reserva.user && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações do Passageiro</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="person" size={20} color="#667eea" />
                  <Text style={styles.infoLabel}>Nome:</Text>
                  <Text style={styles.infoValue}>{reserva.user.nome}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="school" size={20} color="#667eea" />
                  <Text style={styles.infoLabel}>Matrícula:</Text>
                  <Text style={styles.infoValue}>{reserva.user.matricula}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Informações da Viagem */}
          {reserva.viagem && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações da Viagem</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <FontAwesome5 name="bus" size={18} color="#667eea" />
                  <Text style={styles.infoLabel}>ID da Viagem:</Text>
                  <Text style={styles.infoValue}>#{reserva.viagemId}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="person" size={20} color="#667eea" />
                  <Text style={styles.infoLabel}>Motorista ID:</Text>
                  <Text style={styles.infoValue}>
                    {reserva.viagem.motoristaId}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="info" size={20} color="#667eea" />
                  <Text style={styles.infoLabel}>Status da Viagem:</Text>
                  <Text style={styles.infoValue}>{reserva.viagem.status}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ações */}
          <View style={styles.actionsSection}>
            {reserva.status === "APROVADA" && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  navigation.navigate("QRCodeReserva", {
                    reservaId: String(reserva.id),
                  })
                }
              >
                <MaterialIcons name="qr-code" size={20} color="#667eea" />
                <Text style={styles.actionButtonText}>Ver QR Code</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("AppTabs", {
                  screen: "MinhasReservas",
                } as never)
              }
            >
              <MaterialIcons name="list" size={20} color="#667eea" />
              <Text style={styles.actionButtonText}>Minhas Reservas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("AppTabs", { screen: "HomeAluno" })
              }
            >
              <MaterialIcons name="home" size={20} color="#667eea" />
              <Text style={styles.actionButtonText}>Voltar para Início</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    marginRight: 8,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    textTransform: "capitalize",
  },
  actionsSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#667eea",
    fontWeight: "600",
  },
});
