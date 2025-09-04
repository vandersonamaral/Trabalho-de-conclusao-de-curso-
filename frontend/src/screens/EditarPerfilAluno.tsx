import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import api from "../services/api";

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "EditarPerfilAluno">;
};

interface UserData {
  nome: string;
  email: string;
  telefone: string;
  matricula: string;
}

export default function EditarPerfilAluno({ navigation }: Props) {
  const [userData, setUserData] = useState<UserData>({
    nome: "",
    email: "",
    telefone: "",
    matricula: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Buscar dados reais do backend
      const response = await api.get("/alunos/me");
      setUserData({
        nome: response.data.nome || "",
        email: response.data.email || "",
        telefone: response.data.telefone || "",
        matricula: response.data.matricula || "",
      });
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do usuário");
    } finally {
      setLoading(false);
    }
  };

  const salvar = async () => {
    if (!userData.nome.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }

    if (!userData.email.trim()) {
      Alert.alert("Erro", "O e-mail é obrigatório");
      return;
    }

    if (!userData.email.includes("@")) {
      Alert.alert("Erro", "Digite um e-mail válido");
      return;
    }

    setSaving(true);
    try {
      await api.patch("/alunos/update", {
        nome: userData.nome,
        email: userData.email,
        telefone: userData.telefone,
      });

      Alert.alert("Sucesso", "Dados atualizados com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Erro ao atualizar dados:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.error || "Erro ao atualizar dados"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="edit" size={60} color="#667eea" />
            </View>

            <Text style={styles.formTitle}>Editar Informações</Text>
            <Text style={styles.formSubtitle}>
              Atualize suas informações pessoais
            </Text>

            {/* Nome */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color="#667eea"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Digite seu nome completo"
                  value={userData.nome}
                  onChangeText={(text) =>
                    setUserData({ ...userData, nome: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="email"
                  size={20}
                  color="#667eea"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Digite seu e-mail"
                  value={userData.email}
                  onChangeText={(text) =>
                    setUserData({ ...userData, email: text })
                  }
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Telefone */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="phone"
                  size={20}
                  color="#667eea"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Digite seu telefone"
                  value={userData.telefone}
                  onChangeText={(text) =>
                    setUserData({ ...userData, telefone: text })
                  }
                  style={styles.input}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Matrícula (somente leitura) */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Matrícula</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <MaterialIcons
                  name="school"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  value={userData.matricula}
                  style={[styles.input, styles.disabledInputText]}
                  editable={false}
                  placeholderTextColor="#999"
                />
              </View>
              <Text style={styles.helperText}>
                A matrícula não pode ser alterada
              </Text>
            </View>

            {/* Informações */}
            <View style={styles.infoCard}>
              <MaterialIcons name="info" size={20} color="#667eea" />
              <Text style={styles.infoText}>
                As alterações serão salvas automaticamente. Alguns campos podem
                não ser editáveis por questões de segurança.
              </Text>
            </View>

            {/* Botões */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={salvar}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="save" size={20} color="#fff" />
                )}
                <Text style={styles.saveButtonText}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="close" size={20} color="#667eea" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    alignSelf: "center",
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
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  disabledInput: {
    backgroundColor: "#f1f3f4",
    borderColor: "#e0e0e0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  disabledInputText: {
    color: "#999",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  saveButton: {
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#667eea",
  },
  cancelButtonText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
