import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function registerHandler(request, reply) {
  try {
    const data = request.body;

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

    return reply.status(201).send({ 
      message: "Aluno registrado com sucesso. Aguardando aprovação." 
    });
  } catch (error) {
    console.error(error);
    return reply.status(400).send({ 
      error: "Erro no cadastro", 
      detalhes: error.message 
    });
  }
}