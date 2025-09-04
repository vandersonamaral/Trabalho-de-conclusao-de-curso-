import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [lembrarDeMim, setLembrarDeMim] = useState<boolean>(false);
  const [erro, setErro] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigation = useNavigation();
  const [showSenha, setShowSenha] = useState(false);

  useEffect(() => {
    console.log("[LoginScreen] Tela montada");
  }, []);

  const handleLogin = async () => {
    console.log("[LoginScreen] Tentando login com:", { email, senha });
    if (!email || !senha) {
      setErro("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setErro("");

    try {
      const response = await api.post("/login", { email, senha });
      console.log("[LoginScreen] Resposta do backend:", response.data);
      await AsyncStorage.setItem("token", response.data.token);
      if (lembrarDeMim) {
        await AsyncStorage.setItem("lembrarEmail", email);
      }
      navigation.reset({ index: 0, routes: [{ name: "AppTabs" }] });
    } catch (error) {
      let msg = "Erro ao fazer login";
      if (error.isAxiosError) {
        if (error.response) {
          // Erro de resposta do backend
          console.log(
            "[LoginScreen] Erro de resposta:",
            error.response.status,
            error.response.data
          );
          msg = error.response.data?.error || msg;
          setErro(msg);
          // Se for cadastro pendente, alerta e limpa senha
          if (msg === "Cadastro pendente de aprovação.") {
            Alert.alert(
              "Aguardando aprovação",
              "Seu cadastro está pendente de aprovação. Aguarde o supervisor liberar seu acesso."
            );
            setSenha("");
            return;
          }
        } else if (error.request) {
          console.log("[LoginScreen] Erro de requisição:", error.request);
          msg = "Não foi possível conectar ao servidor.";
          setErro(msg);
        } else {
          console.log("[LoginScreen] Erro desconhecido:", error.message);
          setErro(msg);
        }
      } else {
        console.log("[LoginScreen] Erro genérico:", error);
        setErro(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <View style={styles.content}>
        {/* Logo e Título */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="bus" size={50} color="#fff" />
          </View>
          <Text style={styles.titulo}>Transporte Universitário</Text>
          <Text style={styles.subtitulo}>Faça login para continuar</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="email"
              size={20}
              color="#667eea"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Seu email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock"
              size={20}
              color="#667eea"
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Sua senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!showSenha}
              style={styles.input}
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setShowSenha((v) => !v)}>
              <MaterialIcons
                name={showSenha ? "visibility" : "visibility-off"}
                size={22}
                color="#667eea"
              />
            </TouchableOpacity>
          </View>

          {/* Checkbox Lembrar de mim */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setLembrarDeMim(!lembrarDeMim)}
          >
            <View
              style={[styles.checkbox, lembrarDeMim && styles.checkboxChecked]}
            >
              {lembrarDeMim && (
                <MaterialIcons name="check" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxText}>Lembrar de mim</Text>
          </TouchableOpacity>

          {/* Botão de Login */}
          <TouchableOpacity
            style={[styles.btnLogin, loading && styles.btnLoginDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnLoginText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          {/* Links */}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate("RecuperarSenhaAluno" as never)}
          >
            <Text style={styles.linkText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.btnCadastro}
            onPress={() => navigation.navigate("Register" as never)}
          >
            <Text style={styles.btnCadastroText}>Criar nova conta</Text>
          </TouchableOpacity>

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  checkboxText: {
    color: "#fff",
    fontSize: 14,
  },
  btnLogin: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnLoginDisabled: {
    opacity: 0.7,
  },
  btnLoginText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  linkText: {
    color: "#fff",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "#fff",
    marginHorizontal: 16,
    fontSize: 14,
  },
  btnCadastro: {
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnCadastroText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  erro: {
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
});
