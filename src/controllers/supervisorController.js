import prisma from "../config/prisma.js";
import { getSignedUrlFromSupabase } from "../services/supabaseService.js";
import bcrypt from "bcryptjs";

export async function listarAlunosPendentes(request, reply) {
    try {
        const alunosPendentes = await prisma.user.findMany({
            where: { role: "ALUNO", statusCadastro: "PENDENTE" },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                cpf: true,
                rg: true,
                telefone: true,
                comprovanteMatriculaUrl: true,
                instituicaoId: true
            },
        });
        // Gera URL assinada para cada comprovante, tratando erro de arquivo não encontrado
        const alunosComUrl = await Promise.all(alunosPendentes.map(async aluno => {
            let comprovanteUrl = null;
            if (aluno.comprovanteMatriculaUrl) {
                try {
                    comprovanteUrl = await getSignedUrlFromSupabase(aluno.comprovanteMatriculaUrl);
                } catch (e) {
                    console.warn(`Comprovante não encontrado no Supabase para o aluno ${aluno.id}:`, e.message);
                    comprovanteUrl = null;
                }
            }
            return {
                ...aluno,
                comprovanteUrl
            };
        }));
        return reply.send(alunosComUrl);
    } catch (err) {
        console.error('Erro detalhado ao buscar alunos pendentes:', err);
        return reply.status(500).send({ error: "Erro ao buscar alunos pendentes." });
    }
}

export async function listarDocumentosAlunos(request, reply) {
    try {
        const alunos = await prisma.user.findMany({
            where: { role: "ALUNO" },
            select: {
                id: true,
                nome: true,
                email: true,
                comprovanteMatriculaUrl: true,
            },
        });
        const alunosComUrl = alunos.map(aluno => ({
            ...aluno,
            comprovanteUrl: aluno.comprovanteMatriculaUrl ? getDocumentoUrl(aluno.comprovanteMatriculaUrl) : null
        }));
        return reply.send(alunosComUrl);
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao buscar documentos." });
    }
}

export async function aprovarCadastro(request, reply) {
    try {
        const id = request.params.id;
        await prisma.user.update({ where: { id }, data: { statusCadastro: "APROVADO" } });
        return reply.send({ message: "Usuário aprovado com sucesso." });
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao aprovar cadastro." });
    }
}

export async function rejeitarCadastro(request, reply) {
    try {
        const id = request.params.id;
        await prisma.user.update({ where: { id }, data: { statusCadastro: "REJEITADO" } });
        return reply.send({ message: "Usuário rejeitado com sucesso." });
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao rejeitar cadastro." });
    }
}

export async function cadastrarInstituicao(request, reply) {
    try {
        const { nome, cidade } = request.body;
        if (!nome) return reply.status(400).send({ error: "Nome da instituição é obrigatório." });
        const jaExiste = await prisma.instituicao.findUnique({ where: { nome } });
        if (jaExiste) return reply.status(400).send({ error: "Instituição já cadastrada." });
        const nova = await prisma.instituicao.create({ data: { nome, cidade } });
        return reply.status(201).send({ message: "Instituição criada", instituicao: nova });
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao cadastrar instituição." });
    }
}

export async function cadastrarMotorista(request, reply) {
    try {
        const { nome, email, senha, cnh, telefone, placa, modelo } = request.body;
        if (!nome || !email || !senha || !cnh || !placa || !modelo) return reply.status(400).send({ error: "Dados obrigatórios faltando." });
        const senhaHash = await bcrypt.hash(senha, 10);
        // Cria usuário motorista
        const user = await prisma.user.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                role: "MOTORISTA",
                statusCadastro: "APROVADO",
                motorista: {
                    create: {
                        cnh,
                        telefone,
                        veiculos: {
                            create: {
                                placa,
                                modelo,
                            },
                        },
                    },
                },
            },
            include: { motorista: true },
        });
        // Monta resposta apenas com campos relevantes
        return reply.status(201).send({
            message: "Motorista cadastrado",
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                statusCadastro: user.statusCadastro,
                motorista: {
                    cnh: user.motorista.cnh,
                    telefone: user.motorista.telefone
                }
            }
        });
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao cadastrar motorista." });
    }
} 