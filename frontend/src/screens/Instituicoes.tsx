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

export default function Instituicoes({ navigation }: any) {
  // Mock de instituições
  const instituicoes = [
    { id: 1, nome: "Universidade A", cidade: "Cidade X" },
    { id: 2, nome: "Universidade B", cidade: "Cidade Y" },
  ];

  return (
    <LinearGradient
      colors={colors.gradient as [string, string]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Instituições</Text>
        {instituicoes.map((inst) => (
          <View key={inst.id} style={styles.card}>
            <MaterialIcons name="business" size={28} color={colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{inst.nome}</Text>
              <Text style={styles.cardSubtitle}>Cidade: {inst.cidade}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={() => {}}>
          <MaterialIcons name="add" size={22} color={colors.primary} />
          <Text style={styles.addBtnText}>Adicionar Nova Instituição</Text>
        </TouchableOpacity>
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    alignSelf: "center",
  },
  addBtnText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
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
