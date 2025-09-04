import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

export default function PendentesAprovacao({ navigation }: any) {
  // Mock de usuários pendentes
  const pendentes = [
    {
      id: 1,
      nome: "João Silva",
      email: "joao@email.com",
      matricula: "2023001",
    },
    {
      id: 2,
      nome: "Maria Souza",
      email: "maria@email.com",
      matricula: "2023002",
    },
  ];

  return (
    <LinearGradient
      colors={colors.gradient as [string, string]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pendentes de Aprovação</Text>
        {pendentes.map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{u.nome}</Text>
              <Text style={styles.cardSubtitle}>{u.email}</Text>
              <Text style={styles.cardSubtitle}>Matrícula: {u.matricula}</Text>
            </View>
            <TouchableOpacity style={styles.aprovarBtn} onPress={() => {}}>
              <MaterialIcons name="check" size={22} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejeitarBtn} onPress={() => {}}>
              <MaterialIcons name="close" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 12,
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
  cardTitle: { fontSize: 15, fontWeight: "bold", color: colors.primary },
  cardSubtitle: { fontSize: 13, color: colors.textPrimary },
  aprovarBtn: { marginLeft: 8 },
  rejeitarBtn: { marginLeft: 8 },
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
