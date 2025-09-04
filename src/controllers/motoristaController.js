import prisma from "../config/prisma.js";
import { getFotoPerfilUrl } from '../services/supabaseService.js';

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
                    include: { 
                        user: { 
                            select: { 
                                id: true, 
                                nome: true, 
                                matricula: true, 
                                fotoPerfilUrl: true 
                            } 
                        } 
                    }
                }
            }
        });
        if (!viagem) return reply.status(404).send({ error: "Viagem não encontrada." });
        const passageiros = viagem.reservas.map(r => ({
            id: r.user.id,
            nome: r.user.nome,
            matricula: r.user.matricula,
            status: r.status,
            fotoPerfilUrl: r.user.fotoPerfilUrl ? getFotoPerfilUrl(r.user.fotoPerfilUrl) : null
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

// ===== NOVAS FUNÇÕES PARA GESTÃO DE EMBARQUES =====

// Buscar reservas do dia atual para o motorista
export async function getReservasHoje(request, reply) {
    try {
        const motoristaId = request.user.id;
        
        // Data de hoje (início e fim do dia)
        const hoje = new Date();
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
        
        // Buscar reservas aprovadas para hoje
        const reservas = await prisma.reserva.findMany({
            where: {
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                status: {
                    in: ['APROVADA', 'EMBARCADO', 'DESEMBARCADO']
                },
                ativo: true
            },
            include: {
                user: {
                    select: {
                        nome: true,
                        matricula: true,
                        fotoPerfilUrl: true
                    }
                }
            },
            orderBy: {
                user: {
                    nome: 'asc'
                }
            }
        });

        // Processar fotos de perfil
        const reservasComFotos = await Promise.all(
            reservas.map(async (reserva) => ({
                ...reserva,
                user: {
                    ...reserva.user,
                    fotoPerfilUrl: reserva.user.fotoPerfilUrl 
                        ? await getFotoPerfilUrl(reserva.user.fotoPerfilUrl) 
                        : null
                }
            }))
        );

        return reply.status(200).send({ 
            reservas: reservasComFotos,
            total: reservasComFotos.length,
            embarcados: reservasComFotos.filter(r => r.status === 'EMBARCADO').length,
            desembarcados: reservasComFotos.filter(r => r.status === 'DESEMBARCADO').length
        });
        
    } catch (error) {
        console.error("Erro ao buscar reservas do dia:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Processar embarque/desembarque via QR Code ou manual
export async function processarEmbarque(request, reply) {
    try {
        const { reservaId, tipoViagem } = request.body;
        const motoristaId = request.user.id;

        if (!reservaId || !tipoViagem) {
            return reply.status(400).send({ 
                error: "ReservaId e tipoViagem são obrigatórios" 
            });
        }

        // Verificar se a reserva existe e está ativa
        const reserva = await prisma.reserva.findFirst({
            where: {
                id: parseInt(reservaId),
                ativo: true
            },
            include: {
                user: {
                    select: {
                        nome: true,
                        matricula: true
                    }
                }
            }
        });

        if (!reserva) {
            return reply.status(404).send({ error: "Reserva não encontrada" });
        }

        // Determinar o novo status baseado no tipo de viagem e status atual
        let novoStatus;
        
        if (tipoViagem === 'IDA') {
            if (reserva.status !== 'APROVADA') {
                return reply.status(400).send({ 
                    error: "Só é possível embarcar reservas aprovadas" 
                });
            }
            if (!reserva.vaiIda) {
                return reply.status(400).send({ 
                    error: "Esta reserva não inclui ida" 
                });
            }
            novoStatus = 'EMBARCADO';
        } else if (tipoViagem === 'VOLTA') {
            if (reserva.status !== 'EMBARCADO') {
                return reply.status(400).send({ 
                    error: "Só é possível desembarcar reservas que já embarcaram" 
                });
            }
            if (!reserva.vaiVolta) {
                return reply.status(400).send({ 
                    error: "Esta reserva não inclui volta" 
                });
            }
            novoStatus = 'DESEMBARCADO';
        } else {
            return reply.status(400).send({ error: "Tipo de viagem inválido" });
        }

        // Atualizar status da reserva
        const reservaAtualizada = await prisma.reserva.update({
            where: {
                id: parseInt(reservaId)
            },
            data: {
                status: novoStatus
            },
            include: {
                user: {
                    select: {
                        nome: true,
                        matricula: true
                    }
                }
            }
        });

        // Log da ação
        console.log(`✅ Motorista ${motoristaId} processou ${tipoViagem} para ${reservaAtualizada.user.nome}: ${novoStatus}`);

        return reply.status(200).send({ 
            message: `${reservaAtualizada.user.nome} marcado como ${novoStatus.toLowerCase()}`,
            reserva: reservaAtualizada
        });
        
    } catch (error) {
        console.error("Erro ao processar embarque:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Obter estatísticas do motorista
export async function getEstatisticasMotorista(request, reply) {
    try {
        const motoristaId = request.user.id;
        
        // Data de hoje
        const hoje = new Date();
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
        
        // Estatísticas do dia
        const estatisticasHoje = await prisma.reserva.aggregate({
            where: {
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                ativo: true
            },
            _count: {
                id: true
            }
        });

        const embarcadosHoje = await prisma.reserva.count({
            where: {
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                status: 'EMBARCADO',
                ativo: true
            }
        });

        const desembarcadosHoje = await prisma.reserva.count({
            where: {
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                status: 'DESEMBARCADO',
                ativo: true
            }
        });

        return reply.status(200).send({
            hoje: {
                total: estatisticasHoje._count.id,
                embarcados: embarcadosHoje,
                desembarcados: desembarcadosHoje,
                pendentes: estatisticasHoje._count.id - embarcadosHoje - desembarcadosHoje
            }
        });
        
    } catch (error) {
        console.error("Erro ao buscar estatísticas do motorista:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}