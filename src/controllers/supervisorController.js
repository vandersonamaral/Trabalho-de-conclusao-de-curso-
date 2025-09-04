import prisma from "../config/prisma.js";
import { getSignedUrlFromSupabase } from "../services/supabaseService.js";
import bcrypt from "bcryptjs";

// Listar alunos pendentes de aprovação
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
                    // Loga apenas erro relevante
                    console.error(`Comprovante não encontrado no Supabase para o aluno ${aluno.id}:`, e.message);
                    comprovanteUrl = null;
                }
            }
            return {
                ...aluno,
                comprovanteUrl
            };
        }));
        return reply.send({ message: "Lista de alunos pendentes.", alunos: alunosComUrl });
    } catch (err) {
        console.error('Erro ao buscar alunos pendentes:', err);
        return reply.status(500).send({ error: "Erro ao buscar alunos pendentes." });
    }
}

// Listar documentos dos alunos
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
        return reply.send({ message: "Lista de documentos dos alunos.", alunos: alunosComUrl });
    } catch (err) {
        console.error('Erro ao buscar documentos:', err);
        return reply.status(500).send({ error: "Erro ao buscar documentos." });
    }
}

// Aprovar cadastro de usuário
export async function aprovarCadastro(request, reply) {
    try {
        const id = request.params.id;
        // Aprova o usuário
        const user = await prisma.user.update({ where: { id }, data: { statusCadastro: "APROVADO" } });
        // Busca os dias solicitados pelo aluno
        const aluno = await prisma.user.findUnique({ where: { id }, include: { diasSolicitados: true } });
        if (aluno && aluno.diasSolicitados && aluno.diasSolicitados.length > 0) {
            // Cria reservas automáticas para cada dia solicitado até o fim do semestre
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const fimSemestre = new Date(ano, 11, 31); // 31/12 do ano corrente
            const diasSemanaMap = {
                "DOMINGO": 0,
                "SEGUNDA": 1,
                "TERCA": 2,
                "QUARTA": 3,
                "QUINTA": 4,
                "SEXTA": 5,
                "SABADO": 6
            };
            let data = new Date(hoje);
            data.setHours(0, 0, 0, 0);
            while (data <= fimSemestre) {
                const diaSemana = data.getDay();
                const diaSolicitado = aluno.diasSolicitados.find(ds => diasSemanaMap[ds.dia] === diaSemana);
                if (diaSolicitado) {
                    // Verifica se já existe reserva para esse dia
                    const existe = await prisma.reserva.findFirst({ where: { userId: id, data: data } });
                    if (!existe) {
                        await prisma.reserva.create({
                            data: {
                                userId: id,
                                data: new Date(data),
                                status: "APROVADA"
                            }
                        });
                    }
                }
                data.setDate(data.getDate() + 1);
            }
        }
        return reply.send({ message: "Usuário aprovado com sucesso e reservas criadas automaticamente." });
    } catch (err) {
        console.error('Erro ao aprovar cadastro:', err);
        return reply.status(500).send({ error: "Erro ao aprovar cadastro." });
    }
}

// Rejeitar cadastro de usuário
export async function rejeitarCadastro(request, reply) {
    try {
        const id = request.params.id;
        await prisma.user.update({ where: { id }, data: { statusCadastro: "REJEITADO" } });
        return reply.send({ message: "Usuário rejeitado com sucesso." });
    } catch (err) {
        console.error('Erro ao rejeitar cadastro:', err);
        return reply.status(500).send({ error: "Erro ao rejeitar cadastro." });
    }
}

// Cadastrar nova instituição
export async function cadastrarInstituicao(request, reply) {
    try {
        const { nome, cidade } = request.body;
        if (!nome) return reply.status(400).send({ error: "Nome da instituição é obrigatório." });
        const jaExiste = await prisma.instituicao.findUnique({ where: { nome } });
        if (jaExiste) return reply.status(400).send({ error: "Instituição já cadastrada." });
        const nova = await prisma.instituicao.create({ data: { nome, cidade } });
        return reply.status(201).send({ message: "Instituição criada", instituicao: nova });
    } catch (err) {
        console.error('Erro ao cadastrar instituição:', err);
        return reply.status(500).send({ error: "Erro ao cadastrar instituição." });
    }
}

// Cadastrar motorista
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
        console.error('Erro ao cadastrar motorista:', err);
        return reply.status(500).send({ error: "Erro ao cadastrar motorista." });
    }
}

// Deletar aluno
export async function deletarAluno(request, reply) {
    try {
        const id = request.params.id;
        await prisma.user.delete({ where: { id, role: "ALUNO" } });
        return reply.send({ message: "Aluno deletado com sucesso." });
    } catch (err) {
        console.error('Erro ao deletar aluno:', err);
        return reply.status(500).send({ error: "Erro ao deletar aluno." });
    }
}

// Deletar motorista
export async function deletarMotorista(request, reply) {
    try {
        const id = request.params.id;
        await prisma.user.delete({ where: { id, role: "MOTORISTA" } });
        return reply.send({ message: "Motorista deletado com sucesso." });
    } catch (err) {
        console.error('Erro ao deletar motorista:', err);
        return reply.status(500).send({ error: "Erro ao deletar motorista." });
    }
}

// Atualizar dados do supervisor
export async function atualizarSupervisor(request, reply) {
    try {
        const userId = request.user.id;
        const { nome, email, departamento } = request.body;
        const data = {};
        if (nome) data.nome = nome;
        if (email) data.email = email;
        await prisma.user.update({ where: { id: userId }, data });
        if (departamento) {
            await prisma.supervisor.update({ where: { userId }, data: { departamento } });
        }
        return reply.send({ message: "Dados atualizados com sucesso." });
    } catch (err) {
        console.error('Erro ao atualizar dados do supervisor:', err);
        return reply.status(500).send({ error: "Erro ao atualizar dados do supervisor." });
    }
}

// Listar reservas pendentes para aprovação
export async function listarReservasPendentes(request, reply) {
    try {
        const reservas = await prisma.reserva.findMany({
            where: { status: "PENDENTE" },
            include: {
                user: { select: { id: true, nome: true, email: true, matricula: true } }
            },
            orderBy: { data: 'asc' }
        });
        return reply.send({ reservas });
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao buscar reservas pendentes." });
    }
}
// Aprovar reserva pendente
export async function aprovarReserva(request, reply) {
    try {
        const { id } = request.params;
        const reserva = await prisma.reserva.findUnique({ where: { id: Number(id) } });
        if (!reserva || reserva.status !== "PENDENTE") {
            return reply.status(404).send({ error: "Reserva pendente não encontrada." });
        }
        await prisma.reserva.update({ where: { id: Number(id) }, data: { status: "APROVADA" } });
        return reply.send({ message: "Reserva aprovada com sucesso." });
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao aprovar reserva." });
    }
}
// Rejeitar reserva pendente
export async function rejeitarReserva(request, reply) {
    try {
        const { id } = request.params;
        const reserva = await prisma.reserva.findUnique({ where: { id: Number(id) } });
        if (!reserva || reserva.status !== "PENDENTE") {
            return reply.status(404).send({ error: "Reserva pendente não encontrada." });
        }
        await prisma.reserva.update({ where: { id: Number(id) }, data: { status: "REJEITADA" } });
        return reply.send({ message: "Reserva rejeitada com sucesso." });
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao rejeitar reserva." });
    }
} 