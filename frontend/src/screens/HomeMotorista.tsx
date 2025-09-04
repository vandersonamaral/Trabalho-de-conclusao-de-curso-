import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserInfo {
  nome: string;
  email: string;
  cnh?: string;
  telefone?: string;
  fotoPerfilUrl?: string;
}

interface ViagemStats {
  total: number;
  iniciadas: number;
  finalizadas: number;
  pendentes: number;
}

export default function HomeMotorista({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [viagemStats, setViagemStats] = useState<ViagemStats>({
    total: 0,
    iniciadas: 0,
    finalizadas: 0,
    pendentes: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMotoristaData();
  }, []);

  const loadMotoristaData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Buscar dados do motorista
        const userResponse = await api.get("/motoristas/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(userResponse.data);

        // Buscar estatísticas de viagens
        const viagensResponse = await api.get("/motoristas/viagens", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const viagens = viagensResponse.data.viagens || [];
        const stats = {
          total: viagens.length,
          iniciadas: viagens.filter((v: any) => v.status === "INICIADA").length,
          finalizadas: viagens.filter((v: any) => v.status === "FINALIZADA").length,
          pendentes: viagens.filter((v: any) => v.status === "PENDENTE").length,
        };
        setViagemStats(stats);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do motorista:", error);
      // Se não conseguir carregar, pode ser que não tenha endpoint ainda
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMotoristaData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("token");
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          },
        },
      ]
    );
  };

  if (loading) {
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        </LinearGradient>
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
          {/* Header com informações do motorista */}
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
                  {userInfo?.nome || "Motorista"}
                </Text>
                <Text style={styles.userEmail}>
                  {userInfo?.email || "email@exemplo.com"}
                </Text>
                {userInfo?.cnh && (
                  <Text style={styles.userCnh}>CNH: {userInfo.cnh}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Cards de estatísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.primary }]}
                >
                  <MaterialIcons
                    name="directions-bus"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{viagemStats.total}</Text>
                <Text style={styles.statLabel}>Total de Viagens</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.success }]}
                >
                  <MaterialIcons
                    name="play-arrow"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{viagemStats.iniciadas}</Text>
                <Text style={styles.statLabel}>Em Andamento</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.info }]}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{viagemStats.finalizadas}</Text>
                <Text style={styles.statLabel}>Finalizadas</Text>
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
                <Text style={styles.statNumber}>{viagemStats.pendentes}</Text>
                <Text style={styles.statLabel}>Pendentes</Text>
              </View>
            </View>
          </View>

          {/* Menu de ações */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Ações Rápidas</Text>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("ListarViagensMotorista")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="list" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>Minhas Viagens</Text>
                <Text style={styles.menuItemSubtitle}>Ver todas as viagens</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("ScanQRCode")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.success }]}>
                <MaterialIcons name="qr-code-scanner" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>Scanner QR</Text>
                <Text style={styles.menuItemSubtitle}>Embarcar/Desembarcar alunos</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("PerfilMotorista")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.info }]}>
                <MaterialIcons name="person" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>Meu Perfil</Text>
                <Text style={styles.menuItemSubtitle}>Editar informações pessoais</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
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
    marginBottom: 4,
  },
  userCnh: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
