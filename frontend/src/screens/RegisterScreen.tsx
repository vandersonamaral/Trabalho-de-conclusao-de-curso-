import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import api from "../services/api";
import { SafeAreaView as SafeAreaViewContext } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get("window");

const DIAS_SEMANA = [
  { key: "SEGUNDA", label: "Segunda" },
  { key: "TERCA", label: "Terça" },
  { key: "QUARTA", label: "Quarta" },
  { key: "QUINTA", label: "Quinta" },
  { key: "SEXTA", label: "Sexta" },
  { key: "SABADO", label: "Sábado" },
  { key: "DOMINGO", label: "Domingo" },
];

export default function RegisterScreen() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [matricula, setMatricula] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [comprovante, setComprovante] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [aguardando, setAguardando] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [instituicoes, setInstituicoes] = useState<
    { id: number; nome: string }[]
  >([]);
  const [loadingInstituicoes, setLoadingInstituicoes] = useState(true);

  useEffect(() => {
    console.log("[RegisterScreen] Tela montada");
  }, []);

  useEffect(() => {
      const fetchInstituicoes = async () => {
        try {
          setLoadingInstituicoes(true);
          const res = await api.get("/instituicoes");
          // Garante que a resposta é um array
          if (Array.isArray(res.data)) {
            setInstituicoes(res.data);
          } else if (res.data && Array.isArray(res.data.instituicoes)) {
            setInstituicoes(res.data.instituicoes);
          } else {
            setInstituicoes([]);
          }
        } catch (e) {
          setInstituicoes([]);
        } finally {
          setLoadingInstituicoes(false);
        }
      };
      fetchInstituicoes();
  }, []);

  const toggleDia = (dia: string) => {
    setDiasSelecionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const handlePickComprovante = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
  const maxSize = 5242880; // 5MB
        if (file.size && file.size > maxSize) {
          Alert.alert("Arquivo muito grande", "Selecione uma imagem ou PDF com até 1MB.");
          return;
        }
        setComprovante(file);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível selecionar o arquivo");
    }
  };

  const handleRegister = async () => {
    setErro("");
    // Log detalhado do comprovante
    console.log("[RegisterScreen] comprovante selecionado:", comprovante);
    const payload = {
      nome,
      email,
      senha,
      matricula,
      cpf,
      rg,
      telefone,
      instituicao,
      diasSolicitados: diasSelecionados,
      comprovanteMatricula: comprovante
        ? {
            uri: comprovante.uri,
            name: comprovante.name || "comprovante.jpg",
            type: comprovante.mimeType || (comprovante.name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          }
        : null,
    };
    console.log("[RegisterScreen] Tentando cadastro com:", payload);
    setLoading(true);

    // Validações

    if (
      !nome ||
      !email ||
      !senha ||
      !matricula ||
      !cpf ||
      !rg ||
      !telefone ||
      !instituicao
    ) {
      setErro("Preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    if (telefone.replace(/\D/g, '').length < 8) {
      setErro("O telefone deve conter pelo menos 8 dígitos (incluindo DDD).");
      setLoading(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    if (diasSelecionados.length === 0) {
      setErro("Selecione pelo menos um dia.");
      setLoading(false);
      return;
    }

    if (!comprovante) {
      setErro("Selecione o comprovante de matrícula.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("senha", senha);
      formData.append("matricula", matricula);
      formData.append("cpf", cpf);
      formData.append("rg", rg);
      formData.append("telefone", telefone);
      formData.append("instituicao", String(Number(instituicao)));
      formData.append("diasSolicitados", JSON.stringify(diasSelecionados));
      if (comprovante) {
        formData.append("comprovanteMatricula", {
          uri: comprovante.uri,
          name: comprovante.name || "comprovante.jpg",
          type: comprovante.mimeType || (comprovante.name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        });
      }
      // Log do formData para debug
      for (let pair of (formData as any)._parts || []) {
        console.log('[RegisterScreen] formData:', pair[0], pair[1]);
      }

      // Envio usando fetch puro para multipart (NÃO definir Content-Type)
      const url = api.defaults.baseURL?.replace(/\/$/, "") + "/alunos/register";
      console.log("[RegisterScreen] Enviando cadastro para:", url);
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      let data = null;
      let text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      if (!response.ok) {
        let backendError = "Erro ao cadastrar.";
        if (data && typeof data === 'object') {
          if (data.error) {
            backendError = data.error;
            if (data.detalhes) {
              if (Array.isArray(data.detalhes) && data.detalhes.length > 0 && data.detalhes[0].message) {
                backendError += `: ${data.detalhes[0].message}`;
              } else if (typeof data.detalhes === 'string') {
                backendError += `: ${data.detalhes}`;
              } else {
                backendError += `: ${JSON.stringify(data.detalhes)}`;
              }
            }
          } else {
            backendError = JSON.stringify(data);
          }
        } else if (typeof data === 'string') {
          backendError = data;
        }
        setErro(backendError);
        Alert.alert("Erro ao cadastrar", backendError);
        console.log("[RegisterScreen] Erro ao cadastrar:", backendError, data, response);
        setLoading(false);
        return;
      }
      Alert.alert("Cadastro realizado com sucesso!", JSON.stringify(data, null, 2));
      console.log("[RegisterScreen] Resposta do backend:", data);
      setAguardando(true);
    } catch (err: any) {
      let backendError = "Erro ao cadastrar";
      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          backendError = err.response.data;
        } else if (err.response.data.error) {
          backendError = err.response.data.error;
          if (err.response.data.detalhes) {
            backendError += ": " + JSON.stringify(err.response.data.detalhes);
          }
        } else {
          backendError = JSON.stringify(err.response.data);
        }
      }
      setErro(backendError);
      Alert.alert("Erro ao cadastrar", backendError);
      console.log("[RegisterScreen] Erro ao cadastrar:", err, backendError);
    } finally {
      setLoading(false);
    }
  };

  if (aguardando) {
    return (
      <>
        <SafeAreaViewContext
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
            <Text style={styles.successTitle}>Cadastro Realizado!</Text>
            <Text style={styles.successMessage}>
              Seu cadastro foi enviado com sucesso e está aguardando aprovação
              do supervisor.
            </Text>
            <TouchableOpacity
              style={styles.btnVoltar}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnVoltarText}>Voltar ao Login</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <SafeAreaViewContext
        edges={["top"]}
        style={{ backgroundColor: "#667eea" }}
      />
      <LinearGradient
        colors={["#667eea", "#764ba2"] as [string, string]}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.titulo}>Criar Conta</Text>
              <Text style={styles.subtitulo}>
                Preencha seus dados para se cadastrar
              </Text>
            </View>

            {/* Formulário */}
            <View style={styles.form}>
              {/* Informações Pessoais */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações Pessoais</Text>

                {/* Nome */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="person"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Nome completo"
                    value={nome}
                    onChangeText={setNome}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Email */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Senha */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Senha"
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

                {/* Confirmar Senha */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Confirmar senha"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry={!showConfirmarSenha}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmarSenha((v) => !v)}
                  >
                    <MaterialIcons
                      name={
                        showConfirmarSenha ? "visibility" : "visibility-off"
                      }
                      size={22}
                      color="#667eea"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Informações Acadêmicas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informações Acadêmicas</Text>

                {/* Matrícula */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="school"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Matrícula"
                    value={matricula}
                    onChangeText={setMatricula}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Instituição */}
                <View
                  style={[
                    styles.inputContainer,
                    { marginBottom: 16, paddingLeft: 0, paddingRight: 0 },
                  ]}
                >
                  <MaterialIcons
                    name="business"
                    size={20}
                    color="#667eea"
                    style={[styles.inputIcon, { marginLeft: 16 }]}
                  />
                  <View style={{ flex: 1 }}>
                    {loadingInstituicoes ? (
                      <Text style={{ color: "#999", marginLeft: 8 }}>
                        Carregando instituições...
                      </Text>
                    ) : (
                      <Picker
                        selectedValue={instituicao}
                        onValueChange={(itemValue) =>
                          setInstituicao(String(itemValue))
                        }
                        style={{
                          color: instituicao ? "#333" : "#999",
                          backgroundColor: "transparent",
                        }}
                        dropdownIconColor="#667eea"
                      >
                        <Picker.Item
                          label="Selecione a instituição"
                          value=""
                          color="#999"
                        />
                        {instituicoes.map((inst) => (
                          <Picker.Item
                            key={inst.id}
                            label={inst.nome}
                            value={inst.id}
                          />
                        ))}
                      </Picker>
                    )}
                  </View>
                </View>
              </View>

              {/* Documentos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Documentos</Text>

                {/* CPF */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="badge"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="CPF"
                    value={cpf}
                    onChangeText={setCpf}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* RG */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="card-membership"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="RG"
                    value={rg}
                    onChangeText={setRg}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Telefone */}
                <View style={[styles.inputContainer, { marginBottom: 16 }]}>
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color="#667eea"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Telefone"
                    value={telefone}
                    onChangeText={setTelefone}
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Dias da Semana */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dias de Transporte</Text>
                <Text style={styles.sectionSubtitle}>
                  Selecione os dias que você precisa do transporte
                </Text>

                <View style={styles.diasContainer}>
                  {DIAS_SEMANA.map((dia) => (
                    <TouchableOpacity
                      key={dia.key}
                      style={[
                        styles.diaButton,
                        diasSelecionados.includes(dia.key) &&
                          styles.diaButtonSelected,
                      ]}
                      onPress={() => toggleDia(dia.key)}
                    >
                      <Text
                        style={[
                          styles.diaButtonText,
                          diasSelecionados.includes(dia.key) &&
                            styles.diaButtonTextSelected,
                        ]}
                      >
                        {dia.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comprovante */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Comprovante de Matrícula
                </Text>

                <TouchableOpacity
                  style={[
                    styles.comprovanteButton,
                    comprovante && styles.comprovanteButtonSelected,
                  ]}
                  onPress={handlePickComprovante}
                >
                  <MaterialIcons
                    name={comprovante ? "check-circle" : "upload-file"}
                    size={24}
                    color={comprovante ? "#28a745" : "#667eea"}
                  />
                  <Text
                    style={[
                      styles.comprovanteButtonText,
                      comprovante && styles.comprovanteButtonTextSelected,
                    ]}
                  >
                    {comprovante
                      ? "Comprovante selecionado"
                      : "Selecionar comprovante"}
                  </Text>
                </TouchableOpacity>

                {comprovante && (
                  <Text style={styles.comprovanteName}>{comprovante.name}</Text>
                )}
              </View>

              {/* Botão de Cadastro */}
              <TouchableOpacity
                style={[
                  styles.btnCadastro,
                  loading && styles.btnCadastroDisabled,
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.btnCadastroText}>
                  {loading ? "Cadastrando..." : "Criar Conta"}
                </Text>
              </TouchableOpacity>

              {erro ? <Text style={styles.erro}>{erro}</Text> : null}
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
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 1,
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  diasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  diaButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    minWidth: (width - 80) / 3 - 8,
    alignItems: "center",
  },
  diaButtonSelected: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  diaButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  diaButtonTextSelected: {
    color: "#fff",
  },
  comprovanteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    justifyContent: "center",
  },
  comprovanteButtonSelected: {
    borderColor: "#28a745",
    backgroundColor: "#f8fff9",
  },
  comprovanteButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  comprovanteButtonTextSelected: {
    color: "#28a745",
  },
  comprovanteName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  btnCadastro: {
    backgroundColor: "#667eea",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnCadastroDisabled: {
    opacity: 0.7,
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
  btnVoltar: {
    backgroundColor: "#fff",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  btnVoltarText: {
    color: "#667eea",
    fontSize: 16,
    fontWeight: "bold",
  },
});
