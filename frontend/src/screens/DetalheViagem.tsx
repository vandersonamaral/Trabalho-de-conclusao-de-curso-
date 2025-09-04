import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import api from "../services/api";

export default function DetalheViagem({ route, navigation }: any) {
  const { viagemId } = route.params || {};
  const [passageiros, setPassageiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (viagemId) {
      loadPassageiros();
    }
  }, [viagemId]);

  const loadPassageiros = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/motoristas/viagens/${viagemId}/passageiros`);
      setPassageiros(response.data.passageiros || []);
    } catch (error) {
      console.error('Erro ao carregar passageiros:', error);
      Alert.alert('Erro', 'Não foi possível carregar os passageiros da viagem');
      setPassageiros([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'embarcado': colors.success,
      'aprovada': colors.warning,
      'desembarcado': colors.info,
      'pendente': colors.warning,
      'cancelada': colors.error,
    };
    return statusColors[status?.toLowerCase()] || colors.info;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Carregando passageiros...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={colors.gradient as [string, string]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Viagem #{viagemId}</Text>
        <Text style={styles.subtitle}>Passageiros</Text>
        {passageiros.length === 0 ? (
          <View style={styles.card}>
            <MaterialIcons name="info" size={28} color={colors.info} />
            <Text style={[styles.cardTitle, { marginLeft: 12 }]}>
              Nenhum passageiro encontrado
            </Text>
          </View>
        ) : (
          passageiros.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.avatarContainer}>
                {p.fotoPerfilUrl ? (
                  <Image 
                    source={{ uri: p.fotoPerfilUrl }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarDefault}>
                    <MaterialIcons name="person" size={20} color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.cardTitle}>{p.nome}</Text>
                <Text style={styles.cardSubtitle}>Matrícula: {p.matricula}</Text>
              </View>
              <Text
                style={[
                  styles.status,
                  {
                    color: getStatusColor(p.status),
                  },
                ]}
              >
                {p.status}
              </Text>
            </View>
          ))
        )}
        <TouchableOpacity
          style={styles.voltarBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          <Text style={styles.voltarBtnText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarDefault: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardTitle: { fontSize: 15, fontWeight: "bold", color: colors.primary },
  cardSubtitle: { fontSize: 13, color: colors.textPrimary },
  status: { fontWeight: "bold", fontSize: 13 },
  voltarBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 32,
    alignSelf: "center",
  },
  voltarBtnText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
});
