import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import CardMenu from "../components/CardMenu";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "HomeAluno">;
};

interface UserInfo {
  nome: string;
  email: string;
  statusCadastro: string;
  fotoPerfilUrl?: string;
}

interface ReservaStats {
  total: number;
  pendentes: number;
  aprovadas: number;
  embarcadas: number;
}

export default function HomeAluno({ navigation }: Props) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [reservaStats, setReservaStats] = useState<ReservaStats>({
    total: 0,
    pendentes: 0,
    aprovadas: 0,
    embarcadas: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Buscar dados reais do backend
        const res = await api.get("/alunos/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(res.data);
      }
    } catch (error) {
      setUserInfo(null);
    }
  };

  const loadReservaStats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get("/alunos/reservas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reservas = response.data;
      const stats = {
        total: reservas.length,
        pendentes: reservas.filter((r: any) => r.status === "PENDENTE").length,
        aprovadas: reservas.filter((r: any) => r.status === "APROVADA").length,
        embarcadas: reservas.filter((r: any) => r.status === "EMBARCADO")
          .length,
      };
      setReservaStats(stats);
    } catch (error) {
      setReservaStats({ total: 0, pendentes: 0, aprovadas: 0, embarcadas: 0 });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(), loadReservaStats()]);
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadUserData(), loadReservaStats()]);
      setLoading(false);
    })();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APROVADO":
        return colors.success;
      case "PENDENTE":
        return colors.warning;
      case "REJEITADO":
        return colors.error;
      default:
        return colors.info;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APROVADO":
        return "Aprovado";
      case "PENDENTE":
        return "Pendente";
      case "REJEITADO":
        return "Rejeitado";
      default:
        return "Desconhecido";
    }
  };

  if (loading) {
    return (
      <>
        <SafeAreaView
          edges={["top"]}
          style={{ backgroundColor: colors.gradient[0] }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.gradient[0] }}
      />
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header com informações do usuário */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                {userInfo?.fotoPerfilUrl ? (
                  <Image 
                    source={{ uri: userInfo.fotoPerfilUrl }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons name="person" size={32} color={colors.primary} />
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {userInfo?.nome || "Carregando..."}
                </Text>
                <Text style={styles.userEmail}>
                  {userInfo?.email || "carregando@email.com"}
                </Text>
                {userInfo?.statusCadastro && (
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusColor(
                            userInfo.statusCadastro
                          ),
                        },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {getStatusText(userInfo.statusCadastro)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Cards de estatísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.primary }]}
                >
                  <MaterialIcons
                    name="event-note"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{reservaStats.total}</Text>
                <Text style={styles.statLabel}>Total de Reservas</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.warning }]}
                >
                  <MaterialIcons
                    name="schedule"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{reservaStats.pendentes}</Text>
                <Text style={styles.statLabel}>Pendentes</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.success }]}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{reservaStats.aprovadas}</Text>
                <Text style={styles.statLabel}>Aprovadas</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.info }]}
                >
                  <FontAwesome5 name="bus" size={20} color={colors.secondary} />
                </View>
                <Text style={styles.statNumber}>{reservaStats.embarcadas}</Text>
                <Text style={styles.statLabel}>Em Viagem</Text>
              </View>
            </View>
          </View>

          {/* Menu de ações */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Ações Rápidas</Text>

            <CardMenu
              icon={
                <View
                  style={[styles.menuIcon, { backgroundColor: colors.primary }]}
                >
                  <MaterialIcons
                    name="event-note"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
              }
              text="Minhas Reservas"
              subtitle="Ver e gerenciar todas as suas viagens"
              onPress={() => navigation.navigate("MinhasReservas")}
            />

            <CardMenu
              icon={
                <View
                  style={[styles.menuIcon, { backgroundColor: colors.info }]}
                >
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
              }
              text="Meu Perfil"
              subtitle="Editar informações pessoais"
              onPress={() => navigation.navigate("PerfilAluno")}
            />
          </View>

          {/* Informações adicionais */}
          <View style={styles.infoContainer}>
            <View style={styles.infoCard}>
              <Ionicons
                name="information-circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.infoText}>
                Suas reservas são processadas automaticamente. Você receberá
                notificações sobre o status.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    marginLeft: 12,
    lineHeight: 20,
  },
});
