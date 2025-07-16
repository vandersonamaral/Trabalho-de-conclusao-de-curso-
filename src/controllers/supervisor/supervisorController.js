import prisma from "../../config/prisma.js";

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
    const id = request.params.id;

    await prisma.user.update({
      where: { id },
      data: { statusCadastro: "APROVADO" },
    });

    return reply.send({ message: "Usuário aprovado com sucesso." });
  });

  // Rejeitar um cadastro
  app.patch("/supervisor/rejeitar/:id", async (request, reply) => {
    const id = request.params.id;

    await prisma.user.update({
      where: { id },
      data: { statusCadastro: "REJEITADO" },
    });

    return reply.send({ message: "Usuário rejeitado com sucesso." });
  });

  // Criar nova instituição
  app.post("/supervisor/instituicoes", async (request, reply) => {
    const { nome, cidade } = request.body;

    // Verifica se já existe
    const jaExiste = await prisma.instituicao.findUnique({ where: { nome } });
    if (jaExiste) {
      return reply.status(400).send({ error: "Instituição já cadastrada." });
    }

    const novaInstituicao = await prisma.instituicao.create({
      data: { nome, cidade },
    });

    return reply.status(201).send({ message: "Instituição criada", instituicao: novaInstituicao });
  });

}
export default supervisorController;
