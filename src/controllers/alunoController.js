import { ZodError } from 'zod';
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { registerAlunoSchema } from '../schemas/authSchemas.js';
import { uploadComprovanteToSupabase, uploadFotoPerfilToSupabase, removeFotoPerfilFromSupabase, getFotoPerfilUrl, limparFotosOrfas } from '../services/supabaseService.js';

// Funções utilitárias para extrair campos do multipart
const getValue = (field) => field?.value ?? field;
const getField = (fields, key) => {
    if (fields[key]) return fields[key];
    if (fields[key.trim()]) return fields[key.trim()];
    const foundKey = Object.keys(fields).find(k => k.trim() === key);
    return foundKey ? fields[foundKey] : undefined;
};

// Cadastro de aluno com upload de comprovante e validação
export async function cadastroAluno(request, reply) {
    try {
        const inicioTotal = Date.now();
        let dadosParaValidar;
        let comprovanteMatriculaUrl = null;
        const isMultipart = request.headers['content-type']?.includes('multipart');

        if (isMultipart) {
            const parts = request.parts ? request.parts() : [];
            const fields = {};
            let comprovanteMatriculaField = null;
            let countFields = 0;
            let countFiles = 0;

            for await (const part of parts) {
                if (part.type === 'file' && part.fieldname === 'comprovanteMatricula') {
                    comprovanteMatriculaField = part;
                    countFiles++;
                } else if (part.type === 'field') {
                    fields[part.fieldname] = part.value;
                    countFields++;
                }
            }

            console.log('CAMPOS RECEBIDOS (MOBILE):', fields);
            console.log('Total de campos:', countFields, '| Total de arquivos:', countFiles);

            if (comprovanteMatriculaField) {
                const fileName = `${Date.now()}_${comprovanteMatriculaField.filename}`;
                const fileBuffer = await comprovanteMatriculaField.toBuffer();
                const inicioUpload = Date.now();
                try {
                    comprovanteMatriculaUrl = await uploadComprovanteToSupabase(fileBuffer, fileName);
                    console.log('Tempo para upload Supabase:', Date.now() - inicioUpload, 'ms');
                } catch (uploadError) {
                    console.error('Erro ao fazer upload para Supabase:', uploadError);
                    throw uploadError;
                }
            } else {
                console.warn('Nenhum arquivo comprovanteMatricula recebido!');
            }

            let diasSolicitados = fields['diasSolicitados'];
            if (typeof diasSolicitados === 'string') {
                try {
                    diasSolicitados = JSON.parse(diasSolicitados);
                    if (!Array.isArray(diasSolicitados)) diasSolicitados = [];
                } catch {
                    diasSolicitados = [];
                }
            }

            const cpfLimpo = (fields['cpf'] || '').replace(/\D/g, '').slice(0, 11);

            dadosParaValidar = {
                nome: fields['nome'],
                email: fields['email'],
                senha: fields['senha'],
                matricula: fields['matricula'],
                cpf: cpfLimpo,
                rg: fields['rg'],
                telefone: fields['telefone'],
                diasSolicitados,
                instituicao: fields['instituicao']
            };
        } else {
            const body = request.body;
            let diasSolicitados = body.diasSolicitados;

            if (typeof diasSolicitados === 'string') {
                try {
                    diasSolicitados = JSON.parse(diasSolicitados);
                    if (!Array.isArray(diasSolicitados)) diasSolicitados = [];
                } catch {
                    diasSolicitados = [];
                }
            }

            const cpfLimpo = (body.cpf || '').replace(/\D/g, '').slice(0, 11);

            dadosParaValidar = {
                nome: body.nome,
                email: body.email,
                senha: body.senha,
                matricula: body.matricula,
                cpf: cpfLimpo,
                rg: body.rg,
                telefone: body.telefone,
                diasSolicitados,
                instituicao: body.instituicao
            };
        }
        console.log('DADOS PARA VALIDAR:', dadosParaValidar);
        console.log('Tempo total do cadastroAluno:', Date.now() - inicioTotal, 'ms');

        registerAlunoSchema.parse(dadosParaValidar);

        const existingUser = await prisma.user.findUnique({ where: { email: dadosParaValidar.email } });
        if (existingUser) {
            return reply.status(400).send({ error: "Email já cadastrado." });
        }

        const instituicaoExiste = await prisma.instituicao.findUnique({ where: { id: Number(dadosParaValidar.instituicao) } });
        if (!instituicaoExiste) {
            return reply.status(400).send({ error: "Instituição não encontrada." });
        }

        const senhaHash = await bcrypt.hash(dadosParaValidar.senha, 10);

        const user = await prisma.user.create({
            data: {
                nome: dadosParaValidar.nome,
                email: dadosParaValidar.email,
                senha: senhaHash,
                role: "ALUNO",
                statusCadastro: "PENDENTE",
                matricula: dadosParaValidar.matricula,
                cpf: dadosParaValidar.cpf,
                rg: dadosParaValidar.rg,
                telefone: dadosParaValidar.telefone,
                comprovanteMatriculaUrl,
                instituicao: { connect: { id: Number(dadosParaValidar.instituicao) } },
                diasSolicitados: {
                    create: (dadosParaValidar.diasSolicitados || []).map(dia => ({ dia }))
                }
            },
        });

        return reply.status(201).send({ message: "Aluno registrado com sucesso. Aguardando aprovação.", userId: user.id });

    } catch (error) {
        console.error('ERRO DETALHADO NO CADASTRO:', error);
        console.log('STACK TRACE:', error?.stack);

        if (error instanceof ZodError) {
            return reply.status(400).send({ error: "Erro de validação", detalhes: error.errors });
        }

        if (error.code === 'P2003') {
            return reply.status(400).send({ error: "Instituição não encontrada.", detalhes: error.message });
        }

        if (error.message?.includes('Bucket not found')) {
            return reply.status(500).send({
                error: "Erro no cadastro",
                detalhes: "Bucket do Supabase não encontrado. Verifique se o bucket 'comprovantes' existe no painel do Supabase."
            });
        }

        return reply.status(500).send({
            error: "Erro ao cadastrar",
            detalhes: error.message || String(error)
        });
    }
}


// Atualização de dados do aluno
export async function atualizarAluno(request, reply) {
    try {
        const userId = request.user.id;
        const { nome, email, matricula, cpf, rg, telefone } = request.body;
        const data = {};
        if (nome) data.nome = nome;
        if (email) data.email = email;
        if (matricula) data.matricula = matricula;
        if (cpf) data.cpf = cpf;
        if (rg) data.rg = rg;
        if (telefone) data.telefone = telefone;
        await prisma.user.update({ where: { id: userId }, data });
        return reply.send({ message: "Dados atualizados com sucesso." });
    } catch (err) {
        console.error('Erro ao atualizar dados do aluno:', err);
        return reply.status(500).send({ error: "Erro ao atualizar dados do aluno." });
    }
}

// Upload/atualização da foto de perfil do aluno
export async function atualizarFotoPerfil(request, reply) {
    console.log('📸 [FOTO] Recebido request para atualizar foto de perfil');
    console.log('📸 [FOTO] Headers:', request.headers);
    console.log('📸 [FOTO] Content-Type:', request.headers['content-type']);
    
    try {
        const userId = request.user.id;
        console.log('📸 [FOTO] User ID:', userId);
        
        // Verifica se o usuário existe
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.log('❌ [FOTO] Usuário não encontrado');
            return reply.status(404).send({ error: 'Usuário não encontrado.' });
        }

        // Verifica se é multipart
        const isMultipart = request.headers['content-type']?.includes('multipart');
        console.log('📸 [FOTO] isMultipart:', isMultipart);
        if (!isMultipart) {
            console.log('❌ [FOTO] Request não é multipart');
            return reply.status(400).send({ error: 'Envie a foto como multipart/form-data.' });
        }

        // Processa as partes do multipart
        console.log('📸 [FOTO] Processando partes do multipart...');
        const parts = request.parts ? request.parts() : [];
        let fotoField = null;
        let partCount = 0;
        
        for await (const part of parts) {
            partCount++;
            console.log(`📸 [FOTO] Part ${partCount}:`, {
                fieldname: part.fieldname,
                type: part.type,
                filename: part.filename,
                mimetype: part.mimetype
            });
            
            if (part.type === 'file' && (part.fieldname === 'foto' || part.fieldname === 'fotoPerfil')) {
                fotoField = part;
                console.log('✅ [FOTO] Arquivo de foto encontrado!');
                break;
            }
        }

        if (!fotoField) {
            console.log(`❌ [FOTO] Arquivo de foto não encontrado. Total de partes: ${partCount}`);
            return reply.status(400).send({ error: 'Arquivo de foto não enviado.' });
        }

        // Validações do arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        console.log('📸 [FOTO] Validando tipo de arquivo:', fotoField.mimetype);
        if (!allowedTypes.includes(fotoField.mimetype)) {
            console.log('❌ [FOTO] Tipo de arquivo não permitido:', fotoField.mimetype);
            return reply.status(400).send({ 
                error: 'Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.' 
            });
        }

        console.log('📸 [FOTO] Convertendo para buffer...');
        const fileBuffer = await fotoField.toBuffer();
        console.log('📸 [FOTO] Tamanho do arquivo:', fileBuffer.length, 'bytes');
        
        if (fileBuffer.length > maxSize) {
            console.log('❌ [FOTO] Arquivo muito grande:', fileBuffer.length, '>', maxSize);
            return reply.status(400).send({ 
                error: 'Arquivo muito grande. Tamanho máximo: 5MB.' 
            });
        }

        // Gera nome único para o arquivo
        const fileExtension = fotoField.filename?.split('.').pop() || 'jpg';
        const fileName = `${userId}_${Date.now()}.${fileExtension}`;
        console.log('📸 [FOTO] Nome do arquivo gerado:', fileName);

        // Remove foto antiga AUTOMATICAMENTE se existir
        if (user.fotoPerfilUrl && typeof user.fotoPerfilUrl === 'string' && user.fotoPerfilUrl.trim() !== '') {
            console.log('🗑️ [AUTO-CLEANUP] Foto antiga detectada:', user.fotoPerfilUrl);
            console.log('🗑️ [AUTO-CLEANUP] Removendo automaticamente antes do novo upload...');
            
            try {
                await removeFotoPerfilFromSupabase(user.fotoPerfilUrl);
                console.log('✅ [AUTO-CLEANUP] Foto antiga removida automaticamente!');
            } catch (removeError) {
                console.warn('⚠️ [AUTO-CLEANUP] Falha na remoção automática:', removeError.message);
                console.warn('⚠️ [AUTO-CLEANUP] Continuando com upload (nova foto sobrescreverá)...');
                // Não falha o processo - continua com o upload
            }
        } else {
            console.log('ℹ️ [AUTO-CLEANUP] Primeiro upload de foto do usuário - nada para remover');
        }

        // Faz upload da nova foto
        console.log('☁️ [FOTO] Iniciando upload para Supabase...');
        const fotoPath = await uploadFotoPerfilToSupabase(fileBuffer, fileName);
        console.log('✅ [FOTO] Upload realizado com sucesso:', fotoPath);
        // Atualiza usuário no banco
        console.log('💾 [FOTO] Atualizando banco de dados...');
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { fotoPerfilUrl: fotoPath } 
        });
        
        // Gera URL pública
        const publicUrl = getFotoPerfilUrl(fotoPath);
        console.log('🌐 [FOTO] URL pública gerada:', publicUrl);
        console.log('✅ [FOTO] Processo concluído com sucesso!');
        
        return reply.send({ 
            message: 'Foto de perfil atualizada com sucesso.',
            fotoPerfilUrl: publicUrl 
        });
        
    } catch (error) {
        console.error('❌ [FOTO] Erro ao atualizar foto de perfil:', error);
        console.error('❌ [FOTO] Stack trace:', error.stack);
        
        if (error.message?.includes('Bucket not found')) {
            return reply.status(500).send({ 
                error: 'Erro de configuração do servidor. Bucket de fotos não encontrado.' 
            });
        }
        
        if (error.message?.includes('File size')) {
            return reply.status(400).send({ 
                error: 'Arquivo muito grande ou corrompido.' 
            });
        }
        
        return reply.status(500).send({ 
            error: error.message || 'Erro interno ao atualizar foto de perfil.' 
        });
    }
}

// Listagem de reservas do aluno
export async function listarReservasAluno(request, reply) {
    try {
        const user = request.user;
        if (!user || user.role !== "ALUNO") {
            return reply.status(403).send({ error: "Acesso não autorizado." });
        }
        const reservas = await prisma.reserva.findMany({
            where: { userId: user.id },
            include: {
                viagem: true
            },
            orderBy: { data: 'desc' }
        });
        // Garante que vaiIda e vaiVolta sempre aparecem no JSON
        const reservasComIdaVolta = reservas.map(r => ({
            ...r,
            vaiIda: r.vaiIda,
            vaiVolta: r.vaiVolta
        }));
        return reply.send(reservasComIdaVolta);
    } catch (error) {
        console.error('Erro ao listar reservas do aluno:', error);
        return reply.status(500).send({ error: "Erro ao listar reservas", detalhes: error.message });
    }
}

// Retorna os dados do aluno autenticado
export async function perfilAluno(request, reply) {
    try {
        const userId = request.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nome: true,
                email: true,
                statusCadastro: true,
                matricula: true,
                cpf: true,
                rg: true,
                telefone: true,
                instituicao: { select: { nome: true } },
                diasSolicitados: true,
                fotoPerfilUrl: true
            }
        });
        if (!user) return reply.status(404).send({ error: "Usuário não encontrado." });

        // Se houver fotoPerfilUrl, converte para URL pública
        let fotoPerfilUrl = null;
        if (user.fotoPerfilUrl) {
            fotoPerfilUrl = getFotoPerfilUrl(user.fotoPerfilUrl);
        }

        return reply.send({
            ...user,
            fotoPerfilUrl
        });
    } catch (err) {
        console.error('Erro ao buscar perfil do aluno:', err);
        return reply.status(500).send({ error: "Erro ao buscar perfil do aluno." });
    }
}

// Endpoint para marcar férias/ausência
export async function marcarFerias(request, reply) {
    try {
        const userId = request.user.id;
        const { dataInicio, dataFim } = request.body;
        if (!dataInicio || !dataFim) {
            return reply.status(400).send({ error: "Informe dataInicio e dataFim." });
        }
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        if (fim < inicio) {
            return reply.status(400).send({ error: "Data final não pode ser antes da inicial." });
        }
        // Cancela todas as reservas do aluno nesse período que ainda não passaram
        const hoje = new Date();
        await prisma.reserva.updateMany({
            where: {
                userId,
                data: {
                    gte: inicio,
                    lte: fim,
                    gt: hoje // só cancela reservas futuras
                },
                status: { in: ["APROVADA", "PENDENTE"] }
            },
            data: { status: "CANCELADA" }
        });
        return reply.send({ message: "Reservas canceladas para o período informado." });
    } catch (err) {
        console.error('Erro ao marcar férias:', err);
        return reply.status(500).send({ error: "Erro ao marcar férias." });
    }
}

// Deletar foto de perfil do aluno
export async function deletarFotoPerfil(request, reply) {
    try {
        const userId = request.user.id;
        console.log('🗑️ [DELETE] Solicitação para deletar foto de perfil do usuário:', userId);
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.log('❌ [DELETE] Usuário não encontrado');
            return reply.status(404).send({ error: 'Usuário não encontrado.' });
        }

        // Se não há foto, não há nada para deletar
        if (!user.fotoPerfilUrl || user.fotoPerfilUrl.trim() === '') {
            console.log('ℹ️ [DELETE] Usuário não possui foto de perfil para deletar');
            return reply.status(400).send({ error: 'Usuário não possui foto de perfil.' });
        }

        console.log('🗑️ [DELETE] Removendo foto do Supabase:', user.fotoPerfilUrl);
        
        // Remove foto do Supabase
        try {
            await removeFotoPerfilFromSupabase(user.fotoPerfilUrl);
            console.log('✅ [DELETE] Foto removida do Supabase com sucesso');
        } catch (removeError) {
            console.warn('⚠️ [DELETE] Erro ao remover foto do Supabase:', removeError.message);
            // Continua para limpar o campo no banco mesmo se falhar no Supabase
        }

        // Remove referência do banco
        console.log('💾 [DELETE] Limpando referência no banco de dados...');
        await prisma.user.update({ 
            where: { id: userId }, 
            data: { fotoPerfilUrl: null } 
        });

        console.log('✅ [DELETE] Foto de perfil deletada com sucesso!');
        return reply.send({ message: 'Foto de perfil removida com sucesso.' });
        
    } catch (error) {
        console.error('❌ [DELETE] Erro ao deletar foto de perfil:', error);
        return reply.status(500).send({ 
            error: 'Erro interno ao deletar foto de perfil.' 
        });
    }
}

// Endpoint para limpar fotos órfãs (apenas para supervisores)
export async function limparFotosOrfas_Controller(request, reply) {
    try {
        console.log('🧹 [CLEANUP] Iniciando limpeza manual de fotos órfãs...');
        
        const resultado = await limparFotosOrfas(prisma);
        
        return reply.send({ 
            message: 'Limpeza de fotos órfãs concluída.',
            fotosRemovidas: resultado.removidas,
            erros: resultado.erros
        });
        
    } catch (error) {
        console.error('❌ [CLEANUP] Erro ao limpar fotos órfãs:', error);
        return reply.status(500).send({ 
            error: 'Erro interno ao limpar fotos órfãs.' 
        });
    }
}

// ===== SOLICITAÇÕES AVULSAS =====

// Solicitar reserva avulsa (fora dos horários recorrentes)
export async function solicitarReservaAvulsa(request, reply) {
    try {
        const { data, vaiIda = true, vaiVolta = true, motivo } = request.body;
        const userId = request.user.id;

        if (!data || !motivo?.trim()) {
            return reply.status(400).send({ 
                error: "Data e motivo são obrigatórios" 
            });
        }

        // Verificar se o usuário está aprovado
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.statusCadastro !== "APROVADO") {
            return reply.status(403).send({
                error: "Cadastro não aprovado. Aguarde a aprovação do administrador."
            });
        }

        // Verificar se já existe uma solicitação para esta data
        const dataReserva = new Date(data);
        const inicioDia = new Date(dataReserva.getFullYear(), dataReserva.getMonth(), dataReserva.getDate());
        const fimDia = new Date(dataReserva.getFullYear(), dataReserva.getMonth(), dataReserva.getDate() + 1);
        
        const solicitacaoExistente = await prisma.solicitacaoReservaAvulsa.findFirst({
            where: {
                userId,
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                status: { in: ['PENDENTE', 'APROVADA'] }
            }
        });

        if (solicitacaoExistente) {
            return reply.status(400).send({
                error: "Já existe uma solicitação para esta data"
            });
        }

        // Criar solicitação
        const solicitacao = await prisma.solicitacaoReservaAvulsa.create({
            data: {
                userId,
                data: dataReserva,
                vaiIda,
                vaiVolta,
                motivo: motivo.trim(),
                status: 'PENDENTE'
            }
        });

        console.log(`📋 Nova solicitação avulsa criada: ${user.nome} para ${dataReserva.toDateString()}`);

        return reply.status(201).send({ 
            message: "Solicitação enviada com sucesso. Aguarde a aprovação do supervisor.",
            solicitacao
        });
        
    } catch (error) {
        console.error("Erro ao criar solicitação avulsa:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Listar solicitações avulsas do aluno
export async function listarSolicitacoesAvulsas(request, reply) {
    try {
        const userId = request.user.id;
        
        const solicitacoes = await prisma.solicitacaoReservaAvulsa.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return reply.status(200).send({ solicitacoes });
        
    } catch (error) {
        console.error("Erro ao listar solicitações avulsas:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Cancelar solicitação avulsa (apenas se estiver pendente)
export async function cancelarSolicitacaoAvulsa(request, reply) {
    try {
        const { solicitacaoId } = request.params;
        const userId = request.user.id;

        const solicitacao = await prisma.solicitacaoReservaAvulsa.findFirst({
            where: {
                id: parseInt(solicitacaoId),
                userId,
                status: 'PENDENTE'
            }
        });

        if (!solicitacao) {
            return reply.status(404).send({ 
                error: "Solicitação não encontrada ou não pode ser cancelada" 
            });
        }

        await prisma.solicitacaoReservaAvulsa.update({
            where: { id: parseInt(solicitacaoId) },
            data: { status: 'CANCELADA' }
        });

        return reply.status(200).send({ 
            message: "Solicitação cancelada com sucesso" 
        });
        
    } catch (error) {
        console.error("Erro ao cancelar solicitação avulsa:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}