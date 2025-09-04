import { ZodError } from 'zod';
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { registerAlunoSchema } from '../schemas/authSchemas.js';
import { uploadComprovanteToSupabase } from '../services/supabaseService.js';

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
        let dadosParaValidar;
        let comprovanteMatriculaUrl = null;
        // Detecta se é multipart
        const isMultipart = request.headers['content-type'] && request.headers['content-type'].includes('multipart');
        if (isMultipart) {
            // Suporte a múltiplos campos/arquivos
            const parts = request.parts ? request.parts() : [];
            const fields = {};
            let comprovanteMatriculaField = null;
            for await (const part of parts) {
                if (part.type === 'file' && part.fieldname === 'comprovanteMatricula') {
                    comprovanteMatriculaField = part;
                } else if (part.type === 'field') {
                    fields[part.fieldname] = part.value;
                }
            }
            // LOG DETALHADO DOS CAMPOS RECEBIDOS (exceto em teste)
            if (process.env.NODE_ENV !== 'test') {
                console.log('CAMPOS RECEBIDOS:', Object.keys(fields));
                for (const key of Object.keys(fields)) {
                    console.log(`Campo '${key}':`, fields[key]);
                }
            }
            // Upload do comprovante para o Supabase, se enviado
            if (comprovanteMatriculaField) {
                const fileName = `${Date.now()}_${comprovanteMatriculaField.filename}`;
                const fileBuffer = await comprovanteMatriculaField.toBuffer();
                try {
                    comprovanteMatriculaUrl = await uploadComprovanteToSupabase(fileBuffer, fileName);
                } catch (uploadError) {
                    console.error('Erro ao fazer upload para Supabase:', uploadError);
                    throw uploadError;
                }
            }
            // diasSolicitados pode vir como string JSON ou array
            let diasSolicitados = fields['diasSolicitados'];
            if (typeof diasSolicitados === 'string') {
                try {
                    diasSolicitados = JSON.parse(diasSolicitados);
                } catch {
                    diasSolicitados = [];
                }
            }
            dadosParaValidar = {
                nome: fields['nome'],
                email: fields['email'],
                senha: fields['senha'],
                matricula: fields['matricula'],
                cpf: fields['cpf'],
                rg: fields['rg'],
                telefone: fields['telefone'],
                diasSolicitados,
                instituicao: fields['instituicao']
            };
        } else {
            // JSON puro
            const body = request.body;
            let diasSolicitados = body.diasSolicitados;
            if (typeof diasSolicitados === 'string') {
                try {
                    diasSolicitados = JSON.parse(diasSolicitados);
                } catch {
                    diasSolicitados = [];
                }
            }
            dadosParaValidar = {
                nome: body.nome,
                email: body.email,
                senha: body.senha,
                matricula: body.matricula,
                cpf: body.cpf,
                rg: body.rg,
                telefone: body.telefone,
                diasSolicitados,
                instituicao: body.instituicao
            };
        }
        registerAlunoSchema.parse(dadosParaValidar);
        const existingUser = await prisma.user.findUnique({ where: { email: dadosParaValidar.email } });
        if (existingUser) {
            return reply.status(400).send({ error: "Email já cadastrado." });
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
        // Loga apenas erro relevante
        console.error('Erro no cadastro de aluno:', error);
        if (error instanceof ZodError) {
            return reply.status(400).send({ error: "Erro de validação", detalhes: error.errors });
        }
        if (error.code === 'P2003') {
            return reply.status(400).send({ error: "Instituição não encontrada." });
        }
        if (error.message && error.message.includes('Bucket not found')) {
            return reply.status(500).send({
                error: "Erro no cadastro",
                detalhes: "Bucket do Supabase não encontrado. Verifique se o bucket 'comprovantes' existe no painel do Supabase e se o nome está correto no código."
            });
        }
        // Para qualquer outro erro, deixe o middleware global tratar:
        throw error;
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
        return reply.send(reservas);
    } catch (error) {
        console.error('Erro ao listar reservas do aluno:', error);
        return reply.status(500).send({ error: "Erro ao listar reservas", detalhes: error.message });
    }
}