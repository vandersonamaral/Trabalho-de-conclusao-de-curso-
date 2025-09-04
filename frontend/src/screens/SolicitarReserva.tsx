import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
  StatusBar,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import api from "../services/api";
import { colors } from "../theme/colors";
import Button from "../components/Button";
import { globalStyles } from "../theme/styles";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView as SafeAreaViewRN } from "react-native-safe-area-context";

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "SolicitarReserva">;
};

export default function SolicitarReserva({ navigation }: Props) {
  const [data, setData] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [reservaInfo, setReservaInfo] = useState<any>(null);
  const [vaiIda, setVaiIda] = useState(true);
  const [vaiVolta, setVaiVolta] = useState(true);
  const [reservas, setReservas] = useState<any[]>([]);
  const [diasAutorizados, setDiasAutorizados] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      // Carregar reservas do aluno
      api
        .get("/alunos/reservas")
        .then((res) => setReservas(res.data))
        .catch(() => {});
      // Carregar dias autorizados do perfil
      api
        .get("/alunos/me")
        .then((res) => {
          setDiasAutorizados(
            (res.data.diasSolicitados || []).map((d: any) => d.dia)
          );
        })
        .catch(() => {});
    }, [])
  );

  const solicitar = async () => {
    if (data < new Date()) {
      Alert.alert("Data Inválida", "Selecione uma data futura para a reserva.");
      return;
    }
    if (!vaiIda && !vaiVolta) {
      Alert.alert("Selecione pelo menos ida ou volta.");
      return;
    }
    // Bloquear se já existe reserva para o dia
    const dataStr = data.toISOString().slice(0, 10);
    const jaTemReserva = reservas.some(
      (r) =>
        r.data.slice(0, 10) === dataStr &&
        (r.status === "APROVADA" || r.status === "PENDENTE")
    );
    if (jaTemReserva) {
      Alert.alert("Já existe uma reserva para este dia.");
      return;
    }
    // Permitir reserva para dia não autorizado, mas avisar que ficará pendente
    const diasSemana = [
      "DOMINGO",
      "SEGUNDA",
      "TERCA",
      "QUARTA",
      "QUINTA",
      "SEXTA",
      "SABADO",
    ];
    const diaSemana = diasSemana[data.getDay()];
    const diaAutorizado = diasAutorizados.includes(diaSemana);
    if (!diaAutorizado) {
      Alert.alert(
        "Reserva pendente",
        "Você não está autorizado a reservar para este dia da semana. Sua solicitação será enviada para análise e ficará pendente até aprovação do motorista/supervisor."
      );
    }
    setLoading(true);
    try {
      const response = await api.post("/reservas", {
        dia: data.toISOString(),
        vaiIda,
        vaiVolta,
      });
      setReservaInfo(response.data);
      setSucesso(true);
    } catch (error: any) {
      console.error("Erro ao solicitar reserva:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.error || "Erro ao solicitar reserva"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (sucesso) {
    return (
      <>
        <SafeAreaViewRN
          edges={["top"]}
          style={{ backgroundColor: colors.gradient[0] }}
        />
        <LinearGradient
          colors={colors.gradient as [string, string]}
          style={globalStyles.container}
        >
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <FontAwesome5 name="check-circle" size={80} color="#fff" />
            </View>
            <Text style={styles.successTitle}>
              {reservaInfo?.status === "PENDENTE"
                ? "Solicitação enviada para análise!"
                : "Reserva Aprovada!"}
            </Text>
            <Text style={styles.successMessage}>
              {reservaInfo?.status === "PENDENTE"
                ? "Sua solicitação foi enviada para análise. Você receberá uma notificação assim que for aprovada ou rejeitada."
                : `Sua reserva foi criada e aprovada automaticamente para ${reservaInfo?.diaSemana?.toLowerCase()}.`}
            </Text>

            {reservaInfo?.reserva && (
              <View style={styles.reservaInfo}>
                <Text style={styles.reservaInfoTitle}>
                  Detalhes da Reserva:
                </Text>
                <Text style={styles.reservaInfoText}>
                  • Data: {formatDate(new Date(reservaInfo.reserva.data))}
                </Text>
                <Text style={styles.reservaInfoText}>
                  • Status: {reservaInfo.status}
                </Text>
                <Text style={styles.reservaInfoText}>
                  • ID: #{reservaInfo.reserva.id}
                </Text>
              </View>
            )}

            <View style={styles.successActions}>
              <Button
                title={loading ? "Solicitando..." : "Solicitar Reserva"}
                onPress={solicitar}
                loading={loading}
                style={{ marginTop: 24 }}
              />
              <Button
                title="Ver QR Code"
                onPress={() =>
                  navigation.navigate("QRCodeReserva", {
                    reservaId: reservaInfo?.reserva?.id,
                  })
                }
                variant="secondary"
                style={{ marginBottom: 8 }}
              />
              <Button
                title="Ver Minhas Reservas"
                onPress={() =>
                  navigation.navigate("AppTabs", {
                    screen: "MinhasReservas",
                  } as never)
                }
                variant="secondary"
                style={{ marginBottom: 8 }}
              />
              <Button
                title="Voltar para Home"
                onPress={() =>
                  navigation.navigate("AppTabs", {
                    screen: "HomeAluno",
                  } as never)
                }
                variant="primary"
              />
            </View>
          </View>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <SafeAreaViewRN
        edges={["top"]}
        style={{ backgroundColor: colors.gradient[0] }}
      />
      <LinearGradient
        colors={colors.gradient as [string, string]}
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
          <Text style={styles.headerTitle}>Nova Reserva</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Selecione a Data</Text>
            <Text style={styles.formSubtitle}>
              Escolha a data em que você precisa do transporte
            </Text>

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowPicker(true)}
            >
              <View style={styles.dateIcon}>
                <FontAwesome5 name="calendar-alt" size={24} color="#667eea" />
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Data Selecionada</Text>
                <Text style={styles.dateValue}>{formatDate(data)}</Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={24}
                color="#667eea"
              />
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={data}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setData(selectedDate);
                }}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.idaVoltaContainer}>
              <View style={styles.idaVoltaOption}>
                <Text style={styles.idaVoltaLabel}>Ida</Text>
                <Switch
                  value={vaiIda}
                  onValueChange={setVaiIda}
                  thumbColor={vaiIda ? "#1976d2" : "#ccc"}
                  trackColor={{ true: "#90caf9", false: "#eee" }}
                />
              </View>
              <View style={styles.idaVoltaOption}>
                <Text style={styles.idaVoltaLabel}>Volta</Text>
                <Switch
                  value={vaiVolta}
                  onValueChange={setVaiVolta}
                  thumbColor={vaiVolta ? "#1976d2" : "#ccc"}
                  trackColor={{ true: "#90caf9", false: "#eee" }}
                />
              </View>
            </View>

            <View style={styles.infoCard}>
              <MaterialIcons name="info" size={20} color="#667eea" />
              <Text style={styles.infoText}>
                Sua reserva será aprovada automaticamente se o dia escolhido
                estiver entre os dias que você informou durante o cadastro.
              </Text>
            </View>

            <View style={styles.infoCard}>
              <MaterialIcons name="check-circle" size={20} color="#28a745" />
              <Text style={styles.infoText}>
                Aprovação automática: O sistema verifica se você pode usar o
                transporte no dia selecionado baseado nos seus dias cadastrados.
              </Text>
            </View>

            <Button
              title={loading ? "Solicitando..." : "Solicitar Reserva"}
              onPress={solicitar}
              loading={loading}
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
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
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  dateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#667eea",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
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
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  reservaInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
  },
  reservaInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  reservaInfoText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  successActions: {
    width: "100%",
  },
  successButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  successButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#667eea",
  },
  idaVoltaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  idaVoltaOption: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
  },
  idaVoltaLabel: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
    fontWeight: "bold",
  },
});
