import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import api from "../services/api";

export default function CarteirinhaAluno() {
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    const fetchAluno = async () => {
      try {
        setLoading(true);
        const response = await api.get("/alunos/me");
        setAluno(response.data);
      } catch (e) {
        Alert.alert("Erro", "Não foi possível carregar os dados do aluno.");
      } finally {
        setLoading(false);
      }
    };
    fetchAluno();
  }, []);

  const handleSalvarImagem = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão negada", "Não foi possível salvar a imagem.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Sucesso", "Carteirinha salva na galeria!");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a carteirinha.");
    }
  };

  if (loading || !aluno) {
    return (
      <LinearGradient
        colors={["#667eea", "#764ba2"] as [string, string]}
        style={styles.container}
      >
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </LinearGradient>
    );
  }

  const qrPayload = {
    userId: aluno.id || "",
    nome: aluno.nome || "",
    matricula: aluno.matricula || "",
    tipo: "aluno_carteirinha",
    timestamp: Date.now(),
  };

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"] as [string, string]}
      style={styles.container}
    >
      <View style={styles.content}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1 }}
          style={styles.cardShot}
        >
          <View style={styles.card}>
            {/* Avatar centralizado */}
            <View style={styles.avatarContainer}>
              {aluno.fotoPerfilUrl ? (
                <Image
                  source={{ uri: aluno.fotoPerfilUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarDefault}>
                  <MaterialIcons name="person" size={60} color="#fff" />
                </View>
              )}
            </View>

            {/* Nome do aluno */}
            <Text style={styles.nome}>
              {aluno.nome || "Nome não disponível"}
            </Text>

            {/* CPF do aluno */}
            {aluno.cpf && (
              <View style={styles.cpfContainer}>
                <MaterialIcons
                  name="badge"
                  size={18}
                  color="#667eea"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.cpfLabel}>CPF:</Text>
                <Text style={styles.cpfValue}>
                  {aluno.cpf.replace(
                    /(\d{3})(\d{3})(\d{3})(\d{2})/,
                    "$1.$2.$3-$4"
                  )}
                </Text>
              </View>
            )}

            {/* Informações básicas */}
            <View style={styles.infoContainer}>
              <Text style={styles.matriculaLabel}>
                Matrícula: {aluno.matricula || "Não informada"}
              </Text>
              {aluno.instituicao?.nome && (
                <Text style={styles.instituicaoLabel}>
                  {aluno.instituicao.nome}
                </Text>
              )}
            </View>

            {/* QR Code único */}
            <View style={styles.qrContainer}>
              <QRCode
                value={JSON.stringify(qrPayload)}
                size={140}
                backgroundColor="#fff"
                color="#333"
              />
            </View>
            <Text style={styles.qrLabel}>
              Apresente este QR Code para embarque/desembarque
            </Text>
          </View>
        </ViewShot>
        <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvarImagem}>
          <MaterialIcons name="download" size={22} color="#fff" />
          <Text style={styles.btnSalvarText}>Baixar Carteirinha</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cardShot: { borderRadius: 24, overflow: "hidden" },
  card: {
    backgroundColor: "#f9f9ff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: 350,
    borderWidth: 2,
    borderColor: "#667eea",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  cpfContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef1fa",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
    marginTop: -6,
    alignSelf: "center",
  },
  cpfLabel: {
    fontSize: 15,
    color: "#667eea",
    fontWeight: "bold",
    marginRight: 4,
  },
  cpfValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  avatarContainer: { marginBottom: 16 },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#667eea",
  },
  avatarDefault: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
  },
  nome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  matriculaLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 4,
  },
  instituicaoLabel: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  qrContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  qrLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  btnSalvar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5b7fff",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 32,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  btnSalvarText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    marginRight: 4,
    minWidth: 40,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  matriculaValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 8,
  },
});
