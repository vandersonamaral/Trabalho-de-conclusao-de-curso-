import { ZodError } from 'zod';
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { registerAlunoSchema } from '../schemas/authSchemas.js';
import { uploadComprovanteToSupabase } from '../services/supabaseService.js';



const getValue = (field) => field?.value ?? field;
const getField = (fields, key) => {
    if (fields[key]) return fields[key];
    if (fields[key.trim()]) return fields[key.trim()];
    const foundKey = Object.keys(fields).find(k => k.trim() === key);
    return foundKey ? fields[foundKey] : undefined;
};

export async function cadastroAluno(request, reply) {
    try {
        const data = await request.file();
        const fields = data.fields;
        let comprovanteMatriculaUrl = null;

        console.log('--- INÍCIO CADASTRO ALUNO ---');
        console.log('FIELDS RECEBIDOS:', fields);

        // Upload real do comprovante para o Supabase
        const comprovanteField = getField(fields, 'comprovanteMatricula');
        if (comprovanteField && comprovanteField.file) {
            const fileName = `${Date.now()}_${comprovanteField.filename}`;
            console.log('Arquivo de comprovante encontrado:', fileName);
            const fileBuffer = await comprovanteField.toBuffer();
            try {
                comprovanteMatriculaUrl = await uploadComprovanteToSupabase(fileBuffer, fileName);
                console.log('Upload para Supabase realizado com sucesso:', comprovanteMatriculaUrl);
            } catch (uploadError) {
                console.error('Erro ao fazer upload para Supabase:', uploadError);
                throw uploadError;
            }
        } else {
            console.log('Nenhum arquivo de comprovante enviado.');
        }

        const dadosParaValidar = {
            nome: getValue(getField(fields, 'nome')),
            email: getValue(getField(fields, 'email')),
            senha: getValue(getField(fields, 'senha')),
            matricula: getValue(getField(fields, 'matricula')),
            cpf: getValue(getField(fields, 'cpf')),
            rg: getValue(getField(fields, 'rg')),
            telefone: getValue(getField(fields, 'telefone')),
            diasSolicitados: JSON.parse(getValue(getField(fields, 'diasSolicitados'))),
            instituicao: getValue(getField(fields, 'instituicao'))
        };

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
                    create: dadosParaValidar.diasSolicitados.map(dia => ({ dia }))
                }
            },
        });

        return reply.status(201).send({ message: "Aluno registrado com sucesso. Aguardando aprovação.", userId: user.id });
    } catch (error) {
        // Log detalhado no terminal
        console.error('Erro detalhado no cadastro de aluno:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
            supabase: error?.error,
            full: error
        });

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
        return reply.status(500).send({ error: "Erro no cadastro", detalhes: error.message });
    }
}

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
        return reply.status(500).send({ error: "Erro ao listar reservas", detalhes: error.message });
    }
}