import prisma from "../config/prisma.js";
import { generateQRCode } from "../utils/qrcode.js";

// Criação de reserva por aluno
export async function createReserva(request, reply) {
    try {
        const { dia } = request.body;
        const userId = request.user.id;
        if (!dia) return reply.status(400).send({ error: "Dia é obrigatório." });
        const reserva = await prisma.reserva.create({
            data: {
                userId,
                data: new Date(dia),
                status: "PENDENTE"
            }
        });
        return reply.status(201).send({ message: "Reserva criada com sucesso.", reserva });
    } catch (err) {
        console.error('Erro ao criar reserva:', err);
        return reply.status(500).send({ error: "Erro ao criar reserva." });
    }
}

// Geração de QR Code da reserva
export async function getReservaQRCode(request, reply) {
    try {
        const { id } = request.params;
        const reserva = await prisma.reserva.findUnique({ where: { id: Number(id) }, include: { user: true } });
        if (!reserva) return reply.status(404).send({ error: "Reserva não encontrada." });
        if (reserva.userId !== request.user.id) return reply.status(403).send({ error: "Acesso negado." });
        // O QR Code pode conter o id da reserva e um hash simples
        const qrPayload = { reservaId: reserva.id, userId: reserva.userId };
        const qrCode = await generateQRCode(JSON.stringify(qrPayload));
        return reply.type("image/png").send(qrCode);
    } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
        return reply.status(500).send({ error: "Erro ao gerar QR Code." });
    }
}

// Embarque/desembarque via QR Code
export async function embarqueReserva(request, reply) {
    try {
        const { qrData } = request.body;
        if (!qrData) return reply.status(400).send({ error: "QR Code não enviado." });
        let payload;
        try {
            payload = JSON.parse(qrData);
        } catch {
            return reply.status(400).send({ error: "QR Code inválido." });
        }
        const reserva = await prisma.reserva.findUnique({ where: { id: Number(payload.reservaId) }, include: { user: true } });
        if (!reserva) return reply.status(404).send({ error: "Reserva não encontrada." });

        let novoStatus;
        if (reserva.status === "PENDENTE") {
            novoStatus = "EMBARCADO";
        } else if (reserva.status === "EMBARCADO") {
            novoStatus = "DESEMBARCADO";
        } else {
            return reply.status(400).send({ error: `Reserva já está no status: ${reserva.status}` });
        }
        await prisma.reserva.update({ where: { id: reserva.id }, data: { status: novoStatus } });
        return reply.send({ message: `Reserva ${novoStatus.toLowerCase()}.`, reservaId: reserva.id });
    } catch (err) {
        console.error('Erro ao processar embarque:', err);
        return reply.status(500).send({ error: "Erro ao processar embarque." });
    }
}

// Listar alunos embarcados em viagens do motorista
export async function listarEmbarcados(request, reply) {
    try {
        const motoristaId = request.user.id;
        const reservas = await prisma.reserva.findMany({
            where: {
                status: "EMBARCADO",
                viagem: {
                    motoristaId: motoristaId
                }
            },
            include: {
                user: true,
                viagem: true
            }
        });
        return reply.send({ message: "Lista de embarcados.", reservas });
    } catch (err) {
        console.error('Erro ao listar embarcados:', err);
        return reply.status(500).send({ error: "Erro ao listar embarcados." });
    }
}

// Listar status das reservas de uma viagem
export async function listarStatusReservasViagem(request, reply) {
    try {
        const motoristaId = request.user.id;
        // Busca a viagem ativa do motorista (ajuste conforme seu modelo)
        const viagem = await prisma.viagem.findFirst({
            where: {
                motoristaId,
                status: "INICIADA" // ou o status que representa a viagem em andamento
            },
            include: {
                reservas: {
                    include: { user: true }
                }
            }
        });
        if (!viagem) {
            return reply.status(404).send({ error: "Nenhuma viagem ativa encontrada para o motorista." });
        }

        // Separa reservas por status
        const embarcados = viagem.reservas.filter(r => r.status === "EMBARCADO");
        const finalizados = viagem.reservas.filter(r => r.status === "FINALIZADA");
        const pendentes = viagem.reservas.filter(r => r.status === "PENDENTE");

        return reply.send({
            message: "Status das reservas da viagem.",
            embarcados,
            finalizados,
            pendentes
        });
    } catch (err) {
        console.error('Erro ao listar status das reservas:', err);
        return reply.status(500).send({ error: "Erro ao listar status das reservas." });
    }
} 