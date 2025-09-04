import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator,
  Modal,
  StatusBar,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import { RouteProp } from "@react-navigation/native";
import api from "../services/api";
import { colors } from "../theme/colors";
import Button from "../components/Button";
import { globalStyles } from "../theme/styles";
import { decode as atob, encode as btoa } from "base-64";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "QRCodeReserva">;
  route: RouteProp<RootStackParamList, "QRCodeReserva">;
};

interface ReservaInfo {
  id: number;
  data: string;
  status: string;
  user: {
    nome: string;
    matricula: string;
  };
  vaiIda: boolean;
  vaiVolta: boolean;
}

export default function QRCodeReserva({ navigation, route }: Props) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [reservaInfo, setReservaInfo] = useState<ReservaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const reservaId = route.params?.reservaId;

  useEffect(() => {
    if (reservaId) {
      loadQRCode();
      loadReservaInfo();
    }
  }, [reservaId]);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/reservas/${reservaId}/qrcode`, {
        responseType: "arraybuffer",
        headers: {
          Accept: "image/png",
        },
      });

      // Converter arraybuffer para base64 (React Native)
      const base64 = arrayBufferToBase64(response.data);
      const dataUrl = `data:image/png;base64,${base64}`;
      setQrCodeUrl(dataUrl);
    } catch (error: any) {
      console.error("Erro ao carregar QR Code:", error);

      // Se o erro for específico sobre status da reserva, mostrar mensagem mais clara
      if (error.response?.data?.error?.includes("QR Code só pode ser gerado")) {
        setError(
          "Esta reserva não pode gerar QR Code no momento. Verifique o status da reserva."
        );
      } else {
        setError("Erro ao carregar QR Code. Tente novamente.");
      }

      // Fallback para QR mock apenas se for erro de rede
      if (error.code === "NETWORK_ERROR" || !error.response) {
        setQrCodeUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ReservaID:${reservaId}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReservaInfo = async () => {
    try {
      const response = await api.get(`/alunos/reservas`);
      const reserva = response.data.find((r: any) => r.id === reservaId);
      if (reserva) {
        setReservaInfo(reserva);
      }
    } catch (error) {
      console.error("Erro ao carregar informações da reserva:", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `QR Code da minha reserva de transporte - ID: ${reservaId}`,
        title: "QR Code Reserva",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar o QR Code");
    }
  };

  const cancelarReserva = async (tipo: "ida" | "volta" | "ambos" = "ambos") => {
    Alert.alert(
      "Cancelar Reserva",
      tipo === "ambos"
        ? "Tem certeza que deseja cancelar esta reserva?"
        : `Tem certeza que deseja cancelar apenas a ${tipo}?`,
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/reservas/${reservaId}?tipo=${tipo}`);
              Alert.alert(
                "Sucesso",
                `Reserva (${tipo}) cancelada com sucesso!`,
                [
                  {
                    text: "OK",
                    onPress: () => navigation.navigate("MinhasReservas"),
                  },
                ]
              );
            } catch (error: any) {
              console.error("Erro ao cancelar reserva:", error);
              Alert.alert(
                "Erro",
                error.response?.data?.error || "Erro ao cancelar reserva"
              );
            }
          },
        },
      ]
    );
  };

  const canCancelReserva = () => {
    if (!reservaInfo) return false;

    // Só pode cancelar reservas aprovadas
    if (reservaInfo.status !== "APROVADA") {
      return false;
    }

    // Verificar se a data da reserva já passou
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataReserva = new Date(reservaInfo.data);
    dataReserva.setHours(0, 0, 0, 0);

    return dataReserva >= hoje;
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

  // Remover a função atualizarReserva e seu uso, pois agora o cancelamento é feito via DELETE.

  return (
    <>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.gradient[0] }}
      />
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={globalStyles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Code da Reserva</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <MaterialIcons name="share" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Conteúdo Principal */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#e3f2fd",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
            onPress={() =>
              navigation.navigate("AppTabs", { screen: "HomeAluno" } as never)
            }
          >
            <MaterialIcons name="home" size={22} color="#1976d2" />
            <Text
              style={{ color: "#1976d2", fontWeight: "bold", marginLeft: 8 }}
            >
              Voltar para Início
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <View style={styles.qrContainer}>
            <View style={styles.qrCard}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.loadingText}>Gerando QR Code...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error" size={48} color="#ff6b6b" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.qrImageContainer}>
                    <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
                  </View>
                  <Text style={styles.qrInstructions}>
                    Apresente este QR Code ao motorista para embarcar
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Informações da Reserva */}
          {reservaInfo && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Informações da Reserva</Text>

              {/* Avatar do Aluno */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {reservaInfo.user?.fotoPerfilUrl ? (
                    <Image 
                      source={{ uri: reservaInfo.user.fotoPerfilUrl }} 
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarDefault}>
                      <MaterialIcons name="person" size={40} color="#667eea" />
                    </View>
                  )}
                </View>
                <View style={styles.avatarInfo}>
                  <Text style={styles.avatarName}>
                    {reservaInfo.user ? reservaInfo.user.nome : "-"}
                  </Text>
                  <Text style={styles.avatarMatricula}>
                    Matrícula: {reservaInfo.user ? reservaInfo.user.matricula : "-"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="event" size={20} color="#667eea" />
                  <Text style={styles.infoLabel}>Data:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(reservaInfo.data)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="access-time" size={20} color="#667eea" />
                  <Text style={styles.infoLabel}>Horário:</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(reservaInfo.data)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="confirmation-number"
                    size={20}
                    color="#667eea"
                  />
                  <Text style={styles.infoLabel}>ID da Reserva:</Text>
                  <Text style={styles.infoValue}>#{reservaInfo.id}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ações */}
          <View style={styles.actionsContainer}>
            <Button
              title="Ver Detalhes"
              onPress={() =>
                navigation.navigate("DetalheReserva", { reserva: reservaInfo })
              }
              variant="secondary"
              style={{ marginBottom: 8 }}
            />
            <Button
              title="Minhas Reservas"
              onPress={() =>
                navigation.navigate("AppTabs", {
                  screen: "MinhasReservas",
                } as never)
              }
              variant="secondary"
              style={{ marginBottom: 8 }}
            />
            {canCancelReserva() && (
              <Button
                title="Cancelar Reserva"
                onPress={() => setModalVisible(true)}
                variant="danger"
                style={{ marginBottom: 8 }}
              />
            )}
            {reservaInfo &&
              ["APROVADA", "PENDENTE"].includes(reservaInfo.status) &&
              new Date(reservaInfo.data).setHours(0, 0, 0, 0) >=
                new Date().setHours(0, 0, 0, 0) && (
                <Button
                  title="Alterar Ida/Volta"
                  onPress={() => setModalVisible(true)}
                  variant="secondary"
                  style={{ marginBottom: 8 }}
                />
              )}
          </View>
        </View>

        {/* Modal de alteração de ida/volta */}
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
                padding: 24,
                borderRadius: 16,
                width: 320,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}
              >
                Alterar Ida/Volta
              </Text>
              {reservaInfo && (
                <>
                  <Text style={{ marginBottom: 8 }}>
                    Data: {formatDate(reservaInfo.data)}
                  </Text>
                  <Text style={{ marginBottom: 16 }}>
                    Status atual: {reservaInfo.status}
                  </Text>
                  <TouchableOpacity
                    style={{
                      marginBottom: 8,
                      backgroundColor: "#e3f2fd",
                      padding: 10,
                      borderRadius: 8,
                      width: "100%",
                    }}
                    disabled={modalLoading || reservaInfo.vaiIda === false}
                    onPress={() => cancelarReserva("ida")}
                  >
                    <Text
                      style={{
                        color: "#1976d2",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Cancelar Ida
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      marginBottom: 8,
                      backgroundColor: "#e3f2fd",
                      padding: 10,
                      borderRadius: 8,
                      width: "100%",
                    }}
                    disabled={modalLoading || reservaInfo.vaiVolta === false}
                    onPress={() => cancelarReserva("volta")}
                  >
                    <Text
                      style={{
                        color: "#1976d2",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Cancelar Volta
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      marginBottom: 8,
                      backgroundColor: "#e3f2fd",
                      padding: 10,
                      borderRadius: 8,
                      width: "100%",
                    }}
                    disabled={
                      modalLoading ||
                      (reservaInfo.vaiIda === false &&
                        reservaInfo.vaiVolta === false)
                    }
                    onPress={() => cancelarReserva("ambos")}
                  >
                    <Text
                      style={{
                        color: "#d32f2f",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Cancelar Ida e Volta
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#eee",
                      padding: 10,
                      borderRadius: 8,
                      width: "100%",
                    }}
                    disabled={modalLoading}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text
                      style={{
                        color: "#333",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Fechar
                    </Text>
                  </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  shareButton: {
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
    padding: 20,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 300,
    justifyContent: "center",
  },
  qrImageContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  qrInstructions: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
  infoContainer: {
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#667eea",
  },
  avatarDefault: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#667eea",
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  avatarMatricula: {
    fontSize: 14,
    color: "#666",
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
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#ffebee",
    borderColor: "#ef5350",
    borderWidth: 1,
  },
  cancelButtonText: {
    color: "#ef5350",
  },
});
