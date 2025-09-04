import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  StatusBar,
  Image,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../types/navigation";
import api from "../services/api";
import { colors } from "../theme/colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView as SafeAreaViewRN } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { uploadFotoPerfil, deletarFotoPerfil } from "../services/api";

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "PerfilAluno">;
};

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  cpf: string;
  rg: string;
  telefone: string;
  statusCadastro: string;
  instituicao?: {
    nome: string;
  };
  diasSolicitados?: Array<{ dia: string }>;
  fotoPerfilUrl?: string;
}

export default function PerfilAluno({ navigation }: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feriasModal, setFeriasModal] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [enviandoFerias, setEnviandoFerias] = useState(false);
  const [showInicio, setShowInicio] = useState(false);
  const [showFim, setShowFim] = useState(false);
  const [senhaModal, setSenhaModal] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      console.log("URL da foto de perfil:", userProfile.fotoPerfilUrl);
    }
  }, [userProfile]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/alunos/me");
      setUserProfile(response.data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // Token inválido/expirado: redireciona para login
        await AsyncStorage.removeItem("token");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] }); // ajuste o nome se necessário
        return;
      }
      console.error("Erro ao carregar perfil:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("lembrarEmail");
            // Garante logout no web apenas se window existir e for ambiente browser
            if (
              typeof window !== "undefined" &&
              typeof window.document !== "undefined"
            ) {
              if (window.localStorage) {
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("lembrarEmail");
              }
              if (window.sessionStorage) {
                window.sessionStorage.removeItem("token");
                window.sessionStorage.removeItem("lembrarEmail");
              }
              if (window.indexedDB) {
                try {
                  window.indexedDB.deleteDatabase("AsyncStorage");
                } catch {}
              }
              window.location.href = "/";
            } else {
              // No React Native, apenas reseta a navegação
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
            }
          } catch (error) {
            console.error("Erro ao fazer logout:", error);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APROVADO":
        return colors.success;
      case "PENDENTE":
        return colors.warning;
      case "REJEITADO":
        return colors.status.rejeitado;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APROVADO":
        return "Aprovado";
      case "PENDENTE":
        return "Pendente";
      case "REJEITADO":
        return "Rejeitado";
      default:
        return "Desconhecido";
    }
  };

  // Função para marcar férias
  const marcarFerias = async () => {
    if (!dataInicio || !dataFim) {
      Alert.alert("Erro", "Selecione as duas datas!");
      return;
    }
    setEnviandoFerias(true);
    try {
      await api.post("/alunos/ferias", {
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      });
      Alert.alert(
        "Sucesso",
        "Férias marcadas e reservas canceladas no período!"
      );
      setFeriasModal(false);
      setDataInicio(null);
      setDataFim(null);
      await loadUserProfile();
    } catch (err: any) {
      Alert.alert("Erro", err.response?.data?.error || "Erro ao marcar férias");
    } finally {
      setEnviandoFerias(false);
    }
  };

  const trocarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert("Erro", "A confirmação não confere com a nova senha.");
      return;
    }
    setTrocandoSenha(true);
    try {
      await api.post("/auth/change-password", {
        senhaAtual,
        novaSenha,
      });
      Alert.alert("Sucesso", "Senha alterada com sucesso!");
      setSenhaModal(false);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err: any) {
      Alert.alert("Erro", err.response?.data?.error || "Erro ao alterar senha");
    } finally {
      setTrocandoSenha(false);
    }
  };

  // Função para selecionar e enviar foto de perfil
  const handlePickFotoPerfil = async () => {
    try {
      console.log("Solicitando permissão para acessar a galeria...");
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "É necessário permitir acesso à galeria para escolher uma foto."
        );
        return;
      }
      console.log("Permissão concedida. Abrindo ImagePicker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "Images" as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      console.log("Resultado do picker:", result);

      if (result.canceled) {
        console.log("Seleção de imagem cancelada pelo usuário");
        return;
      }
      if (!result.assets || result.assets.length === 0) {
        console.log("Nenhuma imagem selecionada");
        return;
      }

      setUploadingFoto(true);
      const foto = result.assets[0];
      console.log("Foto selecionada:", foto);

      try {
        console.log("Iniciando upload da foto...");
        const data = await uploadFotoPerfil(foto);
        console.log("Resposta do upload:", data);

        console.log("Recarregando perfil...");
        await loadUserProfile(); // Garante que o perfil é recarregado com a nova foto

        Alert.alert("Sucesso", "Foto de perfil atualizada!");
      } catch (uploadError) {
        console.error("Erro específico no upload:", uploadError);
        throw uploadError; // Re-throw para ser capturado pelo catch externo
      }
    } catch (err: any) {
      console.log("Erro ao atualizar foto de perfil:", err, err?.response);
      Alert.alert(
        "Erro",
        err?.response?.data?.error ||
          err?.message ||
          "Erro ao atualizar foto de perfil"
      );
    } finally {
      setUploadingFoto(false);
    }
  };

  // Função para deletar foto de perfil
  const handleDeleteFotoPerfil = async () => {
    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover sua foto de perfil?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              setUploadingFoto(true);
              await deletarFotoPerfil();
              await loadUserProfile(); // Recarrega o perfil
              Alert.alert("Sucesso", "Foto de perfil removida!");
            } catch (err: any) {
              console.log(
                "Erro ao remover foto de perfil:",
                err,
                err?.response
              );
              Alert.alert(
                "Erro",
                err?.response?.data?.error ||
                  err?.message ||
                  "Erro ao remover foto de perfil"
              );
            } finally {
              setUploadingFoto(false);
            }
          },
        },
      ]
    );
  };

  // Função para mostrar opções de foto
  const handleFotoOptions = () => {
    const options: any[] = [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Escolher Nova Foto",
        onPress: handlePickFotoPerfil,
      },
    ];

    // Se já tem foto, adiciona opção de remover
    if (userProfile?.fotoPerfilUrl) {
      options.push({
        text: "Remover Foto Atual",
        style: "destructive",
        onPress: handleDeleteFotoPerfil,
      });
    }

    Alert.alert("Foto de Perfil", "O que você deseja fazer?", options);
  };

  if (loading) {
    return (
      <>
        <SafeAreaViewRN
          edges={["top"]}
          style={{ backgroundColor: colors.primary }}
        />
        <LinearGradient colors={colors.gradient} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Carregando perfil...</Text>
          </View>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <SafeAreaViewRN
        edges={["top"]}
        style={{ backgroundColor: colors.primary }}
      />
      <LinearGradient colors={colors.gradient} style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meu Perfil</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Avatar e Informações Básicas */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {userProfile?.fotoPerfilUrl ? (
                  <Image
                    source={{ uri: userProfile.fotoPerfilUrl }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons
                    name="person"
                    size={60}
                    color={colors.secondary}
                  />
                )}
                {/* Botão de editar foto */}
                <TouchableOpacity
                  style={styles.editFotoButton}
                  onPress={handleFotoOptions}
                  disabled={uploadingFoto}
                >
                  {uploadingFoto ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <MaterialIcons
                      name="photo-camera"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.avatarInfo}>
                <Text style={styles.userName}>{userProfile?.nome}</Text>
                <Text style={styles.userEmail}>{userProfile?.email}</Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: getStatusColor(
                          userProfile?.statusCadastro || ""
                        ),
                      },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {getStatusText(userProfile?.statusCadastro || "")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Informações Detalhadas */}
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Pessoais</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="person"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>Nome:</Text>
                  <Text style={styles.infoValue}>{userProfile?.nome}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{userProfile?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="phone"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>Telefone:</Text>
                  <Text style={styles.infoValue}>{userProfile?.telefone}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações Acadêmicas</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="school"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>Matrícula:</Text>
                  <Text style={styles.infoValue}>{userProfile?.matricula}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="business"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>Instituição:</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.instituicao?.nome}
                  </Text>
                </View>
              </View>
            </View>

            {/* Dias autorizados */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Dias autorizados para uso do transporte
              </Text>
              <View style={styles.diasChips}>
                {userProfile?.diasSolicitados &&
                userProfile.diasSolicitados.length > 0 ? (
                  userProfile.diasSolicitados.map((ds: any) => (
                    <View key={ds.dia} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {ds.dia.charAt(0) + ds.dia.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.textLight }}>
                    Nenhum dia autorizado.
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documentos</Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="id-card"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>CPF:</Text>
                  <Text style={styles.infoValue}>{userProfile?.cpf}</Text>
                </View>

                <View style={styles.infoRow}>
                  <FontAwesome5
                    name="address-card"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.infoLabel}>RG:</Text>
                  <Text style={styles.infoValue}>{userProfile?.rg}</Text>
                </View>
              </View>
            </View>

            {/* Botão Marcar Férias */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setFeriasModal(true)}
              >
                <MaterialIcons
                  name="beach-access"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.actionButtonText}>
                  Marcar Férias/Ausência
                </Text>
              </TouchableOpacity>
            </View>
            {/* Modal de Férias */}
            {feriasModal && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: colors.overlayDark,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.secondary,
                    padding: 24,
                    borderRadius: 16,
                    width: 320,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 18,
                      marginBottom: 16,
                    }}
                  >
                    Marcar Férias/Ausência
                  </Text>
                  <Text>Data de Início:</Text>
                  <TouchableOpacity
                    onPress={() => setShowInicio(true)}
                    style={{
                      padding: 10,
                      backgroundColor: colors.button.primary + "22",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text>
                      {dataInicio
                        ? dataInicio.toLocaleDateString("pt-BR")
                        : "Selecionar data"}
                    </Text>
                  </TouchableOpacity>
                  {showInicio && (
                    <DateTimePicker
                      value={dataInicio || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowInicio(false);
                        if (event.type === "set" && date) setDataInicio(date);
                      }}
                    />
                  )}
                  <Text style={{ marginTop: 12 }}>Data de Fim:</Text>
                  <TouchableOpacity
                    onPress={() => setShowFim(true)}
                    style={{
                      padding: 10,
                      backgroundColor: colors.button.primary + "22",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text>
                      {dataFim
                        ? dataFim.toLocaleDateString("pt-BR")
                        : "Selecionar data"}
                    </Text>
                  </TouchableOpacity>
                  {showFim && (
                    <DateTimePicker
                      value={dataFim || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) => {
                        setShowFim(false);
                        if (event.type === "set" && date) setDataFim(date);
                      }}
                    />
                  )}
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 20,
                    }}
                    onPress={marcarFerias}
                    disabled={enviandoFerias}
                  >
                    <Text
                      style={{
                        color: colors.secondary,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      {enviandoFerias ? "Enviando..." : "Confirmar Férias"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.borderLight,
                      padding: 12,
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                    onPress={() => setFeriasModal(false)}
                    disabled={enviandoFerias}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Modal de Troca de Senha */}

            <Modal visible={senhaModal} transparent animationType="fade">
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    padding: 32,
                    borderRadius: 20,
                    width: 340,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 22,
                      marginBottom: 24,
                      color: colors.primary,
                      textAlign: "center",
                    }}
                  >
                    Alterar Senha
                  </Text>
                  {/* Campo Senha Atual */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      Senha atual
                    </Text>
                    <View style={{ position: "relative" }}>
                      <TextInput
                        placeholder="Digite sua senha atual"
                        value={senhaAtual}
                        onChangeText={setSenhaAtual}
                        secureTextEntry={!showSenhaAtual}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          padding: 12,
                          paddingRight: 40,
                          fontSize: 16,
                          backgroundColor: "#f7f7f7",
                        }}
                      />
                      <TouchableOpacity
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: [{ translateY: -13 }],
                        }}
                        onPress={() => setShowSenhaAtual((v) => !v)}
                      >
                        <MaterialIcons
                          name={
                            showSenhaAtual ? "visibility" : "visibility-off"
                          }
                          size={24}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Campo Nova Senha */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      Nova senha
                    </Text>
                    <View style={{ position: "relative" }}>
                      <TextInput
                        placeholder="Digite a nova senha"
                        value={novaSenha}
                        onChangeText={setNovaSenha}
                        secureTextEntry={!showNovaSenha}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          padding: 12,
                          paddingRight: 40,
                          fontSize: 16,
                          backgroundColor: "#f7f7f7",
                        }}
                      />
                      <TouchableOpacity
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: [{ translateY: -13 }],
                        }}
                        onPress={() => setShowNovaSenha((v) => !v)}
                      >
                        <MaterialIcons
                          name={showNovaSenha ? "visibility" : "visibility-off"}
                          size={24}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Campo Confirmar Nova Senha */}
                  <View style={{ marginBottom: 28 }}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginBottom: 4,
                        fontSize: 14,
                      }}
                    >
                      Confirmar nova senha
                    </Text>
                    <View style={{ position: "relative" }}>
                      <TextInput
                        placeholder="Confirme a nova senha"
                        value={confirmarSenha}
                        onChangeText={setConfirmarSenha}
                        secureTextEntry={!showConfirmarSenha}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          padding: 12,
                          paddingRight: 40,
                          fontSize: 16,
                          backgroundColor: "#f7f7f7",
                        }}
                      />
                      <TouchableOpacity
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: [{ translateY: -13 }],
                        }}
                        onPress={() => setShowConfirmarSenha((v) => !v)}
                      >
                        <MaterialIcons
                          name={
                            showConfirmarSenha ? "visibility" : "visibility-off"
                          }
                          size={24}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 14,
                      borderRadius: 8,
                      marginBottom: 12,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                    onPress={trocarSenha}
                    disabled={trocandoSenha}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        textAlign: "center",
                        fontSize: 16,
                        letterSpacing: 0.5,
                      }}
                    >
                      {trocandoSenha ? "Salvando..." : "Salvar Senha"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#f2f2f2",
                      paddingVertical: 14,
                      borderRadius: 8,
                    }}
                    onPress={() => setSenhaModal(false)}
                    disabled={trocandoSenha}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontWeight: "bold",
                        textAlign: "center",
                        fontSize: 16,
                      }}
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Ações */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("EditarPerfilAluno")}
              >
                <MaterialIcons name="edit" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Editar Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setSenhaModal(true)}
              >
                <MaterialIcons name="lock" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Alterar Senha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("MinhasReservas")}
              >
                <MaterialIcons
                  name="history"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.actionButtonText}>
                  Histórico de Reservas
                </Text>
              </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.secondary,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.secondary,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.overlay,
    borderRadius: 20,
    padding: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  avatarInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  actionsSection: {
    marginTop: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  diasChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: colors.button.primary + "22",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "capitalize",
  },
  editFotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    zIndex: 2,
  },
});
