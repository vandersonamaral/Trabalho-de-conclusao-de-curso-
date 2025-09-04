import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import api from "../services/api";
import { SafeAreaView as SafeAreaViewRN } from "react-native-safe-area-context";

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "RecuperarSenhaAluno">;
};

export default function RecuperarSenhaAluno({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (!email) {
      Alert.alert("Erro", "Preencha o e-mail!");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Erro", "Digite um e-mail válido!");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setEnviado(true);
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de recuperação:", error);
      // Não mostrar erro específico por segurança
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <>
        <SafeAreaViewRN
          edges={["top"]}
          style={{ backgroundColor: "#667eea" }}
        />
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.container}
        >
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check-circle" size={80} color="#fff" />
            </View>
            <Text style={styles.successTitle}>E-mail Enviado!</Text>
            <Text style={styles.successMessage}>
              Se o e-mail existir em nossa base de dados, você receberá
              instruções para redefinir sua senha.
            </Text>
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => navigation.navigate("Login")}
              >
                <MaterialIcons name="login" size={20} color="#667eea" />
                <Text style={styles.successButtonText}>Voltar ao Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.successButton, styles.secondaryButton]}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={20} color="#fff" />
                <Text style={[styles.successButtonText, { color: "#fff" }]}>
                  Voltar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <SafeAreaViewRN edges={["top"]} style={{ backgroundColor: "#667eea" }} />
      <LinearGradient
        colors={["#667eea", "#764ba2"] as [string, string]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recuperar Senha</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <View style={styles.formCard}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock-reset" size={60} color="#667eea" />
            </View>

            <Text style={styles.formTitle}>Esqueceu sua senha?</Text>
            <Text style={styles.formSubtitle}>
              Digite seu e-mail e enviaremos instruções para redefinir sua
              senha.
            </Text>

            <View style={styles.inputContainer}>
              <MaterialIcons
                name="email"
                size={20}
                color="#667eea"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Digite seu e-mail"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.infoCard}>
              <MaterialIcons name="info" size={20} color="#667eea" />
              <Text style={styles.infoText}>
                Você receberá um link de redefinição de senha no e-mail
                cadastrado.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={enviar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={20} color="#fff" />
              )}
              <Text style={styles.submitButtonText}>
                {loading ? "Enviando..." : "Enviar Instruções"}
              </Text>
            </TouchableOpacity>
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
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
    width: "100%",
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
    width: "100%",
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
    marginBottom: 32,
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
});
