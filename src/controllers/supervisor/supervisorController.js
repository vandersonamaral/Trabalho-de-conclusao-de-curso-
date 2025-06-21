import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function supervisorController(app) {
  // Middleware para garantir que só o SUPERVISOR acesse essas rotas
  app.addHook("onRequest", async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "SUPERVISOR") {
      return reply.status(403).send({ error: "Acesso não autorizado." });
    }
  });

  // Listar cadastros pendentes
  // Listar cadastros pendentes (com documentos)
app.get("/supervisor/pendentes", async (request, reply) => {
  const pendentes = await prisma.user.findMany({
    where: { statusCadastro: "PENDENTE" },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      matricula: true,
      cpf: true,
      rg: true,
      comprovanteMatriculaUrl: true,
    },
  });

  return reply.send(pendentes);
});

  // Aprovar um cadastro
  app.patch("/supervisor/aprovar/:id", async (request, reply) => {
    const id = parseInt(request.params.id);

    await prisma.user.update({
      where: { id },
      data: { statusCadastro: "APROVADO" },
    });

    return reply.send({ message: "Usuário aprovado com sucesso." });
  });

  // Rejeitar um cadastro
  app.patch("/supervisor/rejeitar/:id", async (request, reply) => {
    const id = parseInt(request.params.id);

    await prisma.user.update({
      where: { id },
      data: { statusCadastro: "REJEITADO" },
    });

    return reply.send({ message: "Usuário rejeitado com sucesso." });
  });
}
export default supervisorController;
