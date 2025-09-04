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

export async function uploadFotoPerfilToSupabase(fileBuffer, fileName) {
    const { data, error } = await supabase
        .storage
        .from('fotos-perfil')
        .upload(fileName, fileBuffer, { upsert: true });
    if (error) throw error;
    return data.path;
}

export async function removeFotoPerfilFromSupabase(filePath) {
    if (!filePath) {
        console.log('🗑️ [SUPABASE] Nenhum caminho de arquivo fornecido para remoção');
        return;
    }
    
    console.log('🗑️ [SUPABASE] Removendo arquivo:', filePath);
    const { error } = await supabase
        .storage
        .from('fotos-perfil')
        .remove([filePath]);
    
    if (error) {
        console.error(' [SUPABASE] Erro ao remover arquivo:', error);
        throw error;
    }
    
    console.log(' [SUPABASE] Arquivo removido com sucesso:', filePath);
}

export function getFotoPerfilUrl(fileName) {
    return supabase.storage.from('fotos-perfil').getPublicUrl(fileName).data.publicUrl;
}

// Função para listar todas as fotos no bucket
export async function listarFotosSupabase() {
    console.log(' [SUPABASE] Listando fotos no bucket...');
    const { data, error } = await supabase
        .storage
        .from('fotos-perfil')
        .list();
    
    if (error) {
        console.error('[SUPABASE] Erro ao listar fotos:', error);
        throw error;
    }
    
    console.log(`[SUPABASE] Encontradas ${data.length} fotos no bucket`);
    return data;
}


export async function limparFotosOrfas(prisma) {
    try {
        console.log(' [CLEANUP] Iniciando limpeza de fotos órfãs...');
        
        // Listar todas as fotos no Supabase
        const fotosSupabase = await listarFotosSupabase();
        
        // Buscar todas as URLs de foto dos usuários
        const usuariosComFoto = await prisma.user.findMany({
            where: {
                fotoPerfilUrl: {
                    not: null
                }
            },
            select: {
                fotoPerfilUrl: true
            }
        });
        
        const fotosEmUso = usuariosComFoto.map(u => u.fotoPerfilUrl).filter(Boolean);
        console.log(`🔍 [CLEANUP] ${fotosEmUso.length} fotos em uso pelos usuários`);
        
        // Identificar fotos órfãs
        const fotosOrfas = fotosSupabase.filter(foto => {
            const fotoPath = foto.name;
            return !fotosEmUso.includes(fotoPath);
        });
        
        console.log(` [CLEANUP] ${fotosOrfas.length} fotos órfãs encontradas`);
        
        if (fotosOrfas.length === 0) {
            console.log('[CLEANUP] Nenhuma foto órfã para remover');
            return { removidas: 0, erros: 0 };
        }
        
        // Remover fotos órfãs
        let removidas = 0;
        let erros = 0;
        
        for (const foto of fotosOrfas) {
            try {
                await removeFotoPerfilFromSupabase(foto.name);
                removidas++;
            } catch (error) {
                console.error(`[CLEANUP] Erro ao remover ${foto.name}:`, error.message);
                erros++;
            }
        }
        
        console.log(` [CLEANUP] Limpeza concluída: ${removidas} fotos removidas, ${erros} erros`);
        return { removidas, erros };
        
    } catch (error) {
        console.error(' [CLEANUP] Erro na limpeza de fotos órfãs:', error);
        throw error;
    }
} 