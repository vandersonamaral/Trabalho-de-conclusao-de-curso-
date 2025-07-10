import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, registerAlunoSchema, registerSupervisorSchema } from "../schemas/authSchemas.js";

export async function login(request, reply) {
    try {
        const { email, senha } = loginSchema.parse(request.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return reply.status(401).send({ error: "Credenciais inválidas." });
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return reply.status(401).send({ error: "Credenciais inválidas." });
        if (user.statusCadastro !== "APROVADO") return reply.status(403).send({ error: "Cadastro pendente de aprovação." });
        if (!process.env.JWT_SECRET) return reply.status(500).send({ error: "Configuração do servidor ausente (JWT_SECRET)." });
        const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return reply.send({ token });
    } catch (error) {
        return reply.status(400).send({ error: "Erro no login", detalhes: error.message });
    }
}

export async function registerAluno(request, reply) {
    try {
        const data = request.body;
        const dados = registerAlunoSchema.parse(data);
        const existingUser = await prisma.user.findUnique({ where: { email: dados.email } });
        if (existingUser) return reply.status(400).send({ error: "Email já cadastrado." });
        const senhaHash = await bcrypt.hash(dados.senha, 10);
        const user = await prisma.user.create({
            data: {
                nome: dados.nome,
                email: dados.email,
                senha: senhaHash,
                role: "ALUNO",
                statusCadastro: "PENDENTE",
                matricula: dados.matricula,
                cpf: dados.cpf,
                rg: dados.rg,
                telefone: dados.telefone,
                instituicao: { connect: { id: Number(dados.instituicao) } },
                diasSolicitados: {
                    create: dados.diasSolicitados.map(dia => ({ dia }))
                }
            },
        });
        return reply.status(201).send({ message: "Aluno registrado com sucesso. Aguardando aprovação.", userId: user.id });
    } catch (error) {
        return reply.status(400).send({ error: "Erro no cadastro", detalhes: error.message });
    }
}

export async function registerSupervisor(request, reply) {
    try {
        const data = request.body;
        const dados = registerSupervisorSchema.parse(data);
        const count = await prisma.user.count({ where: { role: "SUPERVISOR" } });
        if (count === 0) {
            if (!dados.nome || !dados.email || !dados.senha) {
                return reply.status(400).send({ error: "Nome, email e senha são obrigatórios." });
            }
        } else {
            if (!request.user || request.user.role !== "SUPERVISOR") {
                return reply.status(403).send({ error: "Apenas supervisores podem cadastrar novos supervisores." });
            }
            if (!dados.nome || !dados.email || !dados.senha || !dados.departamento) {
                return reply.status(400).send({ error: "Todos os campos são obrigatórios." });
            }
        }
        const existingUser = await prisma.user.findUnique({ where: { email: dados.email } });
        if (existingUser) return reply.status(400).send({ error: "Email já cadastrado." });
        const senhaHash = await bcrypt.hash(dados.senha, 10);
        const user = await prisma.user.create({
            data: {
                nome: dados.nome,
                email: dados.email,
                senha: senhaHash,
                role: "SUPERVISOR",
                statusCadastro: "APROVADO"
            }
        });
        if (count > 0) {
            await prisma.supervisor.create({
                data: {
                    userId: user.id,
                    departamento: dados.departamento
                }
            });
        }
        return reply.status(201).send({ message: "Supervisor cadastrado com sucesso.", userId: user.id });
    } catch (error) {
        return reply.status(400).send({ error: "Erro no cadastro", detalhes: error.message });
    }
} 