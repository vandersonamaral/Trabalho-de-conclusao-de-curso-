import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import api from "../services/api";
import CardReserva from "../components/CardReserva";
import { SafeAreaView as SafeAreaViewRN } from "react-native-safe-area-context";

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "MinhasReservas">;
};

interface Reserva {
  id: number;
  data: string;
  status: string;
  viagemId?: number;
  viagem?: {
    motoristaId: string;
    data: string;
    status: string;
  };
  vaiIda?: boolean;
  vaiVolta?: boolean;
}

export default function MinhasReservas({ navigation }: Props) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<
    | "TODAS"
    | "PENDENTE"
    | "APROVADA"
    | "CANCELADA"
    | "EMBARCADO"
    | "DESEMBARCADO"
  >("TODAS");

  const loadReservas = async () => {
    try {
      const response = await api.get("/alunos/reservas");
      setReservas(response.data);
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
      Alert.alert("Erro", "Não foi possível carregar suas reservas");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReservas();
    setRefreshing(false);
  };

  useEffect(() => {
    loadReservas();
  }, []);

  if (loading) {
    return (
      <>
        <SafeAreaViewRN
          edges={["top"]}
          style={{ backgroundColor: "#667eea" }}
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </>
    );
  }

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

  // Função para cancelar ida, volta ou ambos (soft delete)
  const cancelarReserva = async (
    id: number,
    tipo: "ida" | "volta" | "ambos" = "ambos"
  ) => {
    try {
      setModalLoading(true);
      await api.patch(`/reservas/${id}/cancelar`, { tipo });
      Alert.alert("Sucesso", `Reserva (${tipo}) cancelada com sucesso!`);
      setModalVisible(false);
      setReservaSelecionada(null);
      await loadReservas();
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err.response?.data?.error || "Erro ao cancelar reserva"
      );
    } finally {
      setModalLoading(false);
    }
  };

  const renderReserva = ({ item }: { item: Reserva }) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataReserva = new Date(item.data);
    dataReserva.setHours(0, 0, 0, 0);
    const podeAlterar =
      ["APROVADA", "PENDENTE"].includes(item.status) && dataReserva >= hoje;
    return (
      <CardReserva
        dia={formatDate(item.data)}
        hora={formatTime(item.data)}
        status={
          item.status === "APROVADA" || item.status === "PENDENTE"
            ? item.status
            : "CANCELADA"
        }
        onDetalhes={() =>
          navigation.navigate("DetalheReserva", { reserva: item })
        }
        onQRCode={() =>
          navigation.navigate("QRCodeReserva", { reservaId: String(item.id) })
        }
        onCancelar={() => {
          setReservaSelecionada(item);
          setModalVisible(true);
        }}
        podeCancelar={podeAlterar}
      />
    );
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="event-busy" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Nenhuma reserva encontrada</Text>
      <Text style={styles.emptySubtitle}>
        Você ainda não possui reservas de transporte
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate("SolicitarReserva")}
      >
        <Text style={styles.createButtonText}>Criar Primeira Reserva</Text>
      </TouchableOpacity>
    </View>
  );

  const screenWidth = Dimensions.get("window").width;

  // Filtrar as reservas antes de renderizar
  const reservasFiltradas =
    filtroStatus === "TODAS"
      ? reservas
      : reservas.filter((r) => r.status === filtroStatus);

  return (
    <>
      <SafeAreaViewRN edges={["top"]} style={{ backgroundColor: "#667eea" }} />
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Minhas Reservas</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("SolicitarReserva")}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Adicionar filtro visual acima da lista */}
        {/* Ajustar o ScrollView horizontal do filtro para não afetar o header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12, maxHeight: 40, alignSelf: "center" }}
          contentContainerStyle={{ alignItems: "center", paddingHorizontal: 8 }}
        >
          {[
            "TODAS",
            "PENDENTE",
            "APROVADA",
            "CANCELADA",
            "EMBARCADO",
            "DESEMBARCADO",
          ].map((status) => (
            <TouchableOpacity
              key={status}
              style={{
                backgroundColor:
                  filtroStatus === status ? "#1976d2" : "#e3f2fd",
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginHorizontal: 4,
              }}
              onPress={() => setFiltroStatus(status as any)}
            >
              <Text
                style={{
                  color: filtroStatus === status ? "#fff" : "#1976d2",
                  fontWeight: "bold",
                }}
              >
                {status === "TODAS"
                  ? "Todas"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Reservas */}
        <View style={styles.content}>
          <FlatList
            data={reservasFiltradas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReserva}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Modal premium de alteração/cancelamento de ida/volta */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                padding: 32,
                borderRadius: 24,
                width: screenWidth > 400 ? 380 : screenWidth - 32,
                alignItems: "center",
                elevation: 8,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 22,
                  marginBottom: 20,
                  color: "#222",
                  textAlign: "center",
                }}
              >
                O que deseja fazer com esta reserva?
              </Text>
              {modalLoading && (
                <ActivityIndicator
                  size="large"
                  color="#667eea"
                  style={{ marginBottom: 16 }}
                />
              )}
              {reservaSelecionada && !modalLoading && (
                <>
                  <Text
                    style={{
                      marginBottom: 8,
                      fontSize: 16,
                      color: "#333",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(reservaSelecionada.data)} -{" "}
                    {formatTime(reservaSelecionada.data)}
                  </Text>
                  <Text
                    style={{
                      marginBottom: 18,
                      color: "#666",
                      textAlign: "center",
                    }}
                  >
                    Status: {getStatusText(reservaSelecionada.status)}
                  </Text>
                  <View style={{ width: "100%" }}>
                    {reservaSelecionada.vaiIda !== false && (
                      <TouchableOpacity
                        style={[
                          styles.modalBtnPremium,
                          {
                            backgroundColor: "#ffeaea",
                            borderColor: "#d32f2f",
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() =>
                          cancelarReserva(reservaSelecionada.id, "ida")
                        }
                      >
                        <MaterialIcons
                          name="arrow-forward"
                          size={24}
                          color="#d32f2f"
                        />
                        <Text
                          style={[
                            styles.modalBtnTextPremium,
                            { color: "#d32f2f" },
                          ]}
                        >
                          Cancelar Ida
                        </Text>
                      </TouchableOpacity>
                    )}
                    {reservaSelecionada.vaiVolta !== false && (
                      <TouchableOpacity
                        style={[
                          styles.modalBtnPremium,
                          {
                            backgroundColor: "#ffeaea",
                            borderColor: "#d32f2f",
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() =>
                          cancelarReserva(reservaSelecionada.id, "volta")
                        }
                      >
                        <MaterialIcons
                          name="arrow-back"
                          size={24}
                          color="#d32f2f"
                        />
                        <Text
                          style={[
                            styles.modalBtnTextPremium,
                            { color: "#d32f2f" },
                          ]}
                        >
                          Cancelar Volta
                        </Text>
                      </TouchableOpacity>
                    )}
                    {reservaSelecionada.vaiIda !== false &&
                      reservaSelecionada.vaiVolta !== false && (
                        <TouchableOpacity
                          style={[
                            styles.modalBtnPremium,
                            {
                              backgroundColor: "#ffeaea",
                              borderColor: "#d32f2f",
                              borderWidth: 1,
                            },
                          ]}
                          onPress={() =>
                            cancelarReserva(reservaSelecionada.id, "ambos")
                          }
                        >
                          <MaterialIcons
                            name="block"
                            size={24}
                            color="#d32f2f"
                          />
                          <Text
                            style={[
                              styles.modalBtnTextPremium,
                              { color: "#d32f2f" },
                            ]}
                          >
                            Cancelar Ida e Volta
                          </Text>
                        </TouchableOpacity>
                      )}
                    {(reservaSelecionada.vaiIda === false ||
                      reservaSelecionada.vaiVolta === false) && (
                      <TouchableOpacity
                        style={[
                          styles.modalBtnPremium,
                          {
                            backgroundColor: "#e6f9ed",
                            borderColor: "#388e3c",
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() =>
                          cancelarReserva(reservaSelecionada.id, "ambos")
                        }
                      >
                        <MaterialIcons
                          name="refresh"
                          size={24}
                          color="#388e3c"
                        />
                        <Text
                          style={[
                            styles.modalBtnTextPremium,
                            { color: "#388e3c" },
                          ]}
                        >
                          Reativar Reserva
                        </Text>
                      </TouchableOpacity>
                    )}
                    {/* Botão para reativar ida */}
                    {reservaSelecionada.vaiIda === false &&
                      reservaSelecionada.vaiVolta !== false && (
                        <TouchableOpacity
                          style={[
                            styles.modalBtnPremium,
                            {
                              backgroundColor: "#e3fbe3",
                              borderColor: "#43a047",
                              borderWidth: 1,
                            },
                          ]}
                          onPress={async () => {
                            try {
                              setModalLoading(true);
                              await api.patch(
                                `/reservas/${reservaSelecionada.id}`,
                                {
                                  vaiIda: true,
                                  vaiVolta: reservaSelecionada.vaiVolta,
                                }
                              );
                              Alert.alert(
                                "Sucesso",
                                "Ida reativada com sucesso!"
                              );
                              setModalVisible(false);
                              setReservaSelecionada(null);
                              await loadReservas();
                            } catch (err: any) {
                              Alert.alert(
                                "Erro",
                                err.response?.data?.error ||
                                  "Erro ao reativar ida"
                              );
                            } finally {
                              setModalLoading(false);
                            }
                          }}
                        >
                          <MaterialIcons
                            name="arrow-forward"
                            size={24}
                            color="#43a047"
                          />
                          <Text
                            style={[
                              styles.modalBtnTextPremium,
                              { color: "#43a047" },
                            ]}
                          >
                            Reativar Ida
                          </Text>
                        </TouchableOpacity>
                      )}
                    {/* Botão para reativar volta */}
                    {reservaSelecionada.vaiVolta === false &&
                      reservaSelecionada.vaiIda !== false && (
                        <TouchableOpacity
                          style={[
                            styles.modalBtnPremium,
                            {
                              backgroundColor: "#e3fbe3",
                              borderColor: "#43a047",
                              borderWidth: 1,
                            },
                          ]}
                          onPress={async () => {
                            try {
                              setModalLoading(true);
                              await api.patch(
                                `/reservas/${reservaSelecionada.id}`,
                                {
                                  vaiIda: reservaSelecionada.vaiIda,
                                  vaiVolta: true,
                                }
                              );
                              Alert.alert(
                                "Sucesso",
                                "Volta reativada com sucesso!"
                              );
                              setModalVisible(false);
                              setReservaSelecionada(null);
                              await loadReservas();
                            } catch (err: any) {
                              Alert.alert(
                                "Erro",
                                err.response?.data?.error ||
                                  "Erro ao reativar volta"
                              );
                            } finally {
                              setModalLoading(false);
                            }
                          }}
                        >
                          <MaterialIcons
                            name="arrow-back"
                            size={24}
                            color="#43a047"
                          />
                          <Text
                            style={[
                              styles.modalBtnTextPremium,
                              { color: "#43a047" },
                            ]}
                          >
                            Reativar Volta
                          </Text>
                        </TouchableOpacity>
                      )}
                    {/* Botão para reativar ambos */}
                    {reservaSelecionada.vaiIda === false &&
                      reservaSelecionada.vaiVolta === false && (
                        <TouchableOpacity
                          style={[
                            styles.modalBtnPremium,
                            {
                              backgroundColor: "#e3fbe3",
                              borderColor: "#43a047",
                              borderWidth: 1,
                            },
                          ]}
                          onPress={async () => {
                            try {
                              setModalLoading(true);
                              await api.patch(
                                `/reservas/${reservaSelecionada.id}`,
                                { vaiIda: true, vaiVolta: true }
                              );
                              Alert.alert(
                                "Sucesso",
                                "Ida e Volta reativadas com sucesso!"
                              );
                              setModalVisible(false);
                              setReservaSelecionada(null);
                              await loadReservas();
                            } catch (err: any) {
                              Alert.alert(
                                "Erro",
                                err.response?.data?.error ||
                                  "Erro ao reativar ida e volta"
                              );
                            } finally {
                              setModalLoading(false);
                            }
                          }}
                        >
                          <MaterialIcons
                            name="autorenew"
                            size={24}
                            color="#43a047"
                          />
                          <Text
                            style={[
                              styles.modalBtnTextPremium,
                              { color: "#43a047" },
                            ]}
                          >
                            Reativar Ida e Volta
                          </Text>
                        </TouchableOpacity>
                      )}
                    <TouchableOpacity
                      style={[
                        styles.modalBtnPremium,
                        {
                          backgroundColor: "#eee",
                          borderColor: "#bbb",
                          borderWidth: 1,
                        },
                      ]}
                      onPress={() => {
                        setModalVisible(false);
                        setReservaSelecionada(null);
                      }}
                    >
                      <MaterialIcons name="close" size={24} color="#333" />
                      <Text
                        style={[styles.modalBtnTextPremium, { color: "#333" }]}
                      >
                        Fechar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </>
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
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  reservaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reservaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    textTransform: "capitalize",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  reservaDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  reservaActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  actionText: {
    fontSize: 12,
    color: "#667eea",
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: "#667eea",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  actionCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 32,
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  actionLabel: {
    fontSize: 12,
    color: "#667eea",
    marginTop: 4,
    fontWeight: "500",
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 10,
    width: "100%",
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  reservaCardPremium: {
    backgroundColor: "#fff",
    borderRadius: 12, // menor e mais delicado
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  dateTextPremium: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    flexShrink: 1,
    minWidth: 0,
  },
  statusBadgePremium: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginLeft: 6,
  },
  statusTextPremium: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 3,
  },
  infoRowPremium: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  infoItemPremium: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextPremium: {
    fontSize: 13,
    color: "#666",
    marginLeft: 5,
  },
  actionRowPremium: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 7,
    marginBottom: 0,
  },
  actionCirclePremium: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 22,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginHorizontal: 6,
  },
  actionLabelPremium: {
    fontSize: 11,
    color: "#667eea",
    marginTop: 2,
    fontWeight: "500",
  },
  modalBtnPremium: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 8,
    marginBottom: 8,
    width: "100%",
  },
  modalBtnTextPremium: {
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
