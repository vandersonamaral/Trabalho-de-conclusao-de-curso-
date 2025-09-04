import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { emitAuthEvent } from "../contexts/authEvents";

const api = axios.create({
  baseURL: "https://l0cdstpd-3000.brs.devtunnels.ms/",
  timeout: 30000, // 30 segundos
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  async (config) => {
    console.log(`Fazendo requisição para: ${config.baseURL}${config.url}`);
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Erro no interceptor de request:", error);
    return Promise.reject(error);
  }
);

// Interceptor para capturar erros de resposta
api.interceptors.response.use(
  (response) => {
    console.log(
      `Resposta recebida de ${response.config.url}:`,
      response.status
    );
    return response;
  },
  async (error) => {
    console.error("Erro no interceptor de response:", error.message);

    // Tratamento específico para erro 401 (não autorizado)
    if (error.response?.status === 401) {
      // NÃO remover token se for erro de login (credenciais incorretas)
      const isLoginError = error.config?.url?.includes("/login");

      if (!isLoginError) {
        console.log("Token expirado ou inválido, removendo do storage...");
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("userInfo");
        emitAuthEvent();
        console.log(
          "Dados de autenticação removidos. Usuário precisa fazer login novamente."
        );
      } else {
        console.log("Erro 401 na tela de login - credenciais incorretas");
      }
    }

    if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
      console.error("Problema de conectividade detectado. Verifique:");
      console.error("1. Se o servidor está rodando");
      console.error("2. Se a URL do tunnel está correta");
      console.error("3. Se há conexão com a internet");
    }

    return Promise.reject(error);
  }
);

export async function uploadFotoPerfil(foto: any) {
  try {
    console.log("Preparando FormData...");
    const formData = new FormData();

    const fotoData = {
      uri: foto.uri,
      name: foto.fileName || "foto-perfil.jpg",
      type: foto.mimeType || foto.type || "image/jpeg",
    };

    console.log("Dados da foto:", fotoData);
    formData.append("foto", fotoData as any);

    console.log("Enviando requisição para /alunos/foto-perfil...");
    const response = await api.patch("/alunos/foto-perfil", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 segundos de timeout
    });

    console.log("Resposta recebida:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Erro no uploadFotoPerfil:", error);
    console.error("Detalhes do erro:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
    });
    throw error;
  }
}

export async function deletarFotoPerfil() {
  const response = await api.delete("/alunos/foto-perfil");
  return response.data;
}

export default api;
