import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

export default function PerfilSupervisor({ navigation }: any) {
  // Mock de dados do supervisor
  const supervisor = {
    nome: "Ana Supervisor",
    email: "ana@transporte.com",
    departamento: "Administração",
  };

  return (
    <LinearGradient
      colors={colors.gradient as [string, string]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="person" size={60} color={colors.primary} />
        </View>
        <Text style={styles.nome}>{supervisor.nome}</Text>
        <Text style={styles.info}>Email: {supervisor.email}</Text>
        <Text style={styles.info}>Departamento: {supervisor.departamento}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => {}}>
          <MaterialIcons name="edit" size={20} color={colors.primary} />
          <Text style={styles.editBtnText}>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.voltarBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          <Text style={styles.voltarBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  nome: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  info: { fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  editBtnText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  voltarBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  voltarBtnText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
});
