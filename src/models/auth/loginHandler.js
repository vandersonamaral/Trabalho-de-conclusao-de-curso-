import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function loginHandler(request, reply) {
  try {
    const { email, senha } = request.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(401).send({ error: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return reply.status(401).send({ error: "Senha inválida" });
    }

    if (user.statusCadastro !== "APROVADO") {
      return reply.status(403).send({ 
        error: "Cadastro pendente de aprovação." 
      });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return reply.send({ token });
  } catch (error) {
    console.error(error);
    return reply.status(400).send({ 
      error: "Erro no login", 
      detalhes: error.message 
    });
  }
}