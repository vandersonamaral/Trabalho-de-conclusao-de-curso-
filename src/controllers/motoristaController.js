import prisma from "../config/prisma.js";

export async function listarViagensMotorista(request, reply) {
    try {
        const motoristaId = request.user.id;
        const viagens = await prisma.viagem.findMany({
            where: { motoristaId },
            orderBy: { data: "desc" },
            include: { reservas: true }
        });
        return reply.send(viagens);
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao buscar viagens." });
    }
}

export async function listarPassageirosViagem(request, reply) {
    try {
        const viagemId = Number(request.params.id);
        const viagem = await prisma.viagem.findUnique({
            where: { id: viagemId },
            include: {
                reservas: {
                    include: { user: { select: { id: true, nome: true, matricula: true } } }
                }
            }
        });
        if (!viagem) return reply.status(404).send({ error: "Viagem não encontrada." });
        const passageiros = viagem.reservas.map(r => ({
            id: r.user.id,
            nome: r.user.nome,
            matricula: r.user.matricula,
            status: r.status
        }));
        return reply.send(passageiros);
    } catch (err) {
        return reply.status(500).send({ error: "Erro ao buscar passageiros." });
    }
} 