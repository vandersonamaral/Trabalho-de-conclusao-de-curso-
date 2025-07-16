import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadDocumentoAluno(fileBuffer, fileName) {
    const { data, error } = await supabase.storage.from('documentos').upload(fileName, fileBuffer, { upsert: true });
    if (error) throw error;
    return data.path;
}

export function getDocumentoUrl(fileName) {
    return supabase.storage.from('documentos').getPublicUrl(fileName).data.publicUrl;
}

export async function uploadComprovanteToSupabase(fileStream, fileName) {
    const { data, error } = await supabase
        .storage
        .from('comprovantes')
        .upload(fileName, fileStream, {
            cacheControl: '3600',
            upsert: false
        });
    if (error) throw error;
    return data.path;
}

export async function getSignedUrlFromSupabase(path) {
    const { data, error } = await supabase
        .storage
        .from('comprovantes')
        .createSignedUrl(path, 60 * 60); // 1 hora de validade
    if (error) throw error;
    return data.signedUrl;
} 