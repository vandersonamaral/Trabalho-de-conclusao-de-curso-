import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import jwt from "jsonwebtoken";


const prisma = new PrismaClient();

const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
  matricula: z.string().min(3),
  cpf: z.string().min(11).max(14), // pode validar melhor depois
  rg: z.string().min(5),
  telefone: z.string().min(8),
  comprovanteMatriculaUrl: z.string().optional(), // aqui sera usadp upload
});


const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

async function authController(app) {
  app.post("/register", async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);

      const senhaHash = await bcrypt.hash(data.senha, 10);

      await prisma.user.create({
        data: {
          nome: data.nome,
          email: data.email,
          senha: senhaHash,
          role: "ALUNO",
          statusCadastro: "PENDENTE",
          matricula: data.matricula,
          cpf: data.cpf,
          rg: data.rg,
          telefone: data.telefone,
          comprovanteMatriculaUrl: data.comprovanteMatriculaUrl || "",
        },
      });

      return reply.status(201).send({ message: "Aluno registrado com sucesso. Aguardando aprovação." });
    } catch (error) {
      console.error(error);
      return reply.status(400).send({ error: "Erro no cadastro", detalhes: error });
    }
  });


  app.post("/login", async (request, reply) => {
    try {
      const { email, senha } = loginSchema.parse(request.body);
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Verifica se o usuário existe
      if (!user) {
        return reply.status(401).send({ error: "Usuário não encontrado" });
      }

      // Verifica se a senha está correta
      const senhaValida = await bcrypt.compare(senha, user.senha);
      if (!senhaValida) {
        return reply.status(401).send({ error: "Senha inválida" });
      }

      // Verifica se o cadastro foi aprovado
      if (user.statusCadastro !== "APROVADO") {
        return reply.status(403).send({ error: "Cadastro pendente de aprovação." });
      }
      const token = jwt.sign(
        {sub: user.id, role: user.role},
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return reply.send({
        message: "Login realizado com sucesso",
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      return reply.status(400).send({ error: "Erro no login", detalhes: error });
    }
  });
}

export default authController;
