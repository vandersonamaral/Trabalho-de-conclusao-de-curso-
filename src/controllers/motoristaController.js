import prisma from "../config/prisma.js";

// Listar viagens do motorista
export async function listarViagensMotorista(request, reply) {
    try {
        const motoristaId = request.user.id;
        const viagens = await prisma.viagem.findMany({
            where: { motoristaId },
            orderBy: { data: "desc" },
            include: { reservas: true }
        });
        return reply.send({ message: "Lista de viagens do motorista.", viagens });
    } catch (err) {
        console.error('Erro ao buscar viagens:', err);
        return reply.status(500).send({ error: "Erro ao buscar viagens." });
    }
}

// Listar passageiros de uma viagem
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
        return reply.send({ message: "Lista de passageiros da viagem.", passageiros });
    } catch (err) {
        console.error('Erro ao buscar passageiros:', err);
        return reply.status(500).send({ error: "Erro ao buscar passageiros." });
    }
}

// Atualizar dados do motorista
export async function atualizarMotorista(request, reply) {
    try {
        const userId = request.user.id;
        const { nome, email, cnh, telefone } = request.body;
        const data = {};
        if (nome) data.nome = nome;
        if (email) data.email = email;
        await prisma.user.update({ where: { id: userId }, data });
        if (cnh || telefone) {
            const motoristaData = {};
            if (cnh) motoristaData.cnh = cnh;
            if (telefone) motoristaData.telefone = telefone;
            await prisma.motorista.update({ where: { userId }, data: motoristaData });
        }
        return reply.send({ message: "Dados atualizados com sucesso." });
    } catch (err) {
        console.error('Erro ao atualizar dados do motorista:', err);
        return reply.status(500).send({ error: "Erro ao atualizar dados do motorista." });
    }
} 