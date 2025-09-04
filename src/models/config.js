import prisma from "../config/prisma.js";

export async function getHorarioLimiteCancelamento() {
    // Busca configuração global (pode evoluir para por motorista depois)
    const config = await prisma.configuracao.findFirst({ where: { chave: "horario_limite_cancelamento" } });
    return config ? config.valor : "08:00"; // valor padrão
}

export async function setHorarioLimiteCancelamento(valor) {
    await prisma.configuracao.upsert({
        where: { chave: "horario_limite_cancelamento" },
        update: { valor },
        create: { chave: "horario_limite_cancelamento", valor },
    });
} 