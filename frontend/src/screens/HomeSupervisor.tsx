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
  telefone?: string;
  fotoPerfilUrl?: string;
}

interface AdminStats {
  alunosPendentes: number;
  alunosAprovados: number;
  totalReservas: number;
  reservasPendentes: number;
}

export default function HomeSupervisor({ navigation }: any) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    alunosPendentes: 0,
    alunosAprovados: 0,
    totalReservas: 0,
    reservasPendentes: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupervisorData();
  }, []);

  const loadSupervisorData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Buscar dados do supervisor
        const userResponse = await api.get("/supervisores/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(userResponse.data);

        // Buscar estatísticas administrativas
        const statsResponse = await api.get("/supervisores/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setAdminStats(statsResponse.data || {
          alunosPendentes: 0,
          alunosAprovados: 0,
          totalReservas: 0,
          reservasPendentes: 0,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do supervisor:", error);
      // Se não conseguir carregar, mantém valores padrão
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSupervisorData();
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
            <Text style={styles.loadingText}>Carregando painel...</Text>
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
          {/* Header com informações do supervisor */}
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
                  <MaterialIcons name="supervisor-account" size={32} color={colors.primary} />
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {userInfo?.nome || "Supervisor"}
                </Text>
                <Text style={styles.userEmail}>
                  {userInfo?.email || "supervisor@exemplo.com"}
                </Text>
                <Text style={styles.userRole}>Painel Administrativo</Text>
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
                  style={[styles.statIcon, { backgroundColor: colors.warning }]}
                >
                  <MaterialIcons
                    name="person-add"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{adminStats.alunosPendentes}</Text>
                <Text style={styles.statLabel}>Alunos Pendentes</Text>
              </View>

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
                <Text style={styles.statNumber}>{adminStats.alunosAprovados}</Text>
                <Text style={styles.statLabel}>Alunos Aprovados</Text>
              </View>
            </View>

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
                <Text style={styles.statNumber}>{adminStats.totalReservas}</Text>
                <Text style={styles.statLabel}>Total Reservas</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: colors.info }]}
                >
                  <MaterialIcons
                    name="schedule"
                    size={24}
                    color={colors.secondary}
                  />
                </View>
                <Text style={styles.statNumber}>{adminStats.reservasPendentes}</Text>
                <Text style={styles.statLabel}>Reservas Pendentes</Text>
              </View>
            </View>
          </View>

          {/* Menu de ações administrativas */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Gestão do Sistema</Text>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("PendentesAprovacao")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.warning }]}>
                <MaterialIcons name="pending-actions" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>Aprovações Pendentes</Text>
                <Text style={styles.menuItemSubtitle}>
                  {adminStats.alunosPendentes} alunos aguardando aprovação
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Instituicoes")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="business" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>Instituições</Text>
                <Text style={styles.menuItemSubtitle}>Gerenciar escolas e faculdades</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("GerenciarUsuarios")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.success }]}>
                <MaterialIcons name="people" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>Gerenciar Usuários</Text>
                <Text style={styles.menuItemSubtitle}>Alunos, motoristas e supervisores</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("RelatoriosAdmin")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.info }]}>
                <MaterialIcons name="assessment" size={24} color={colors.secondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuItemTitle}>Relatórios</Text>
                <Text style={styles.menuItemSubtitle}>Análises e estatísticas do sistema</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("PerfilSupervisor")}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
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
  userRole: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
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
