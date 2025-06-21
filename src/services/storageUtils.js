import { supabase } from "../utils/supabaseClient.js";

export async function getSignedUrl(filePath) {
  const expiresInSeconds = 60 * 60; // 1 hora

  const { data, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    console.error("Erro ao gerar URL assinada:", error);
    return null;
  }

  return data.signedUrl;
}
