import prisma from "../config/prisma.js";
import { getFotoPerfilUrl } from "../services/supabaseService.js";

// Listar horários recorrentes do aluno
export async function getHorariosRecorrentes(request, reply) {
    try {
        const { userId } = request.user;
        
        const horarios = await prisma.horarioRecorrente.findMany({
            where: { 
                userId,
                ativo: true 
            },
            orderBy: {
                diaSemana: 'asc'
            }
        });

        return reply.status(200).send(horarios);
    } catch (error) {
        console.error("Erro ao buscar horários recorrentes:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Solicitar novo horário (aluno)
export async function solicitarNovoHorario(request, reply) {
    try {
        const { userId } = request.user;
        const { diaSemana, vaiIda, vaiVolta, motivo, dataInicio, dataFim } = request.body;

        // Verificar se já existe horário para esse dia
        const horarioExistente = await prisma.horarioRecorrente.findUnique({
            where: {
                userId_diaSemana: {
                    userId,
                    diaSemana
                }
            }
        });

        if (horarioExistente) {
            return reply.status(400).send({ 
                error: "Você já possui horário cadastrado para este dia da semana" 
            });
        }

        // Verificar se já existe solicitação pendente
        const solicitacaoPendente = await prisma.solicitacaoHorario.findFirst({
            where: {
                userId,
                diaSemana,
                status: 'PENDENTE'
            }
        });

        if (solicitacaoPendente) {
            return reply.status(400).send({ 
                error: "Você já possui uma solicitação pendente para este dia" 
            });
        }

        const solicitacao = await prisma.solicitacaoHorario.create({
            data: {
                userId,
                diaSemana,
                vaiIda: vaiIda ?? true,
                vaiVolta: vaiVolta ?? true,
                motivo,
                dataInicio: new Date(dataInicio),
                dataFim: dataFim ? new Date(dataFim) : null
            }
        });

        return reply.status(201).send({
            message: "Solicitação enviada com sucesso. Aguardando aprovação.",
            solicitacao
        });
    } catch (error) {
        console.error("Erro ao criar solicitação:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Listar solicitações pendentes (supervisor)
export async function getSolicitacoesPendentes(request, reply) {
    try {
        const solicitacoes = await prisma.solicitacaoHorario.findMany({
            where: { status: 'PENDENTE' },
            include: {
                user: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        matricula: true,
                        fotoPerfilUrl: true,
                        instituicao: {
                            select: {
                                nome: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Adicionar URLs das fotos
        const solicitacoesComFotos = await Promise.all(
            solicitacoes.map(async (solicitacao) => ({
                ...solicitacao,
                user: {
                    ...solicitacao.user,
                    fotoPerfilUrl: solicitacao.user.fotoPerfilUrl 
                        ? await getFotoPerfilUrl(solicitacao.user.fotoPerfilUrl)
                        : null
                }
            }))
        );

        return reply.status(200).send(solicitacoesComFotos);
    } catch (error) {
        console.error("Erro ao buscar solicitações:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Aprovar/rejeitar solicitação (supervisor)
export async function processarSolicitacao(request, reply) {
    try {
        const { id } = request.params;
        const { acao, observacoes } = request.body; // acao: 'APROVAR' ou 'REJEITAR'

        const solicitacao = await prisma.solicitacaoHorario.findUnique({
            where: { id: parseInt(id) }
        });

        if (!solicitacao) {
            return reply.status(404).send({ error: "Solicitação não encontrada" });
        }

        if (solicitacao.status !== 'PENDENTE') {
            return reply.status(400).send({ error: "Solicitação já foi processada" });
        }

        if (acao === 'APROVAR') {
            // Criar horário recorrente
            await prisma.horarioRecorrente.create({
                data: {
                    userId: solicitacao.userId,
                    diaSemana: solicitacao.diaSemana,
                    vaiIda: solicitacao.vaiIda,
                    vaiVolta: solicitacao.vaiVolta,
                    ativo: true,
                    aprovado: true,
                    dataInicio: solicitacao.dataInicio,
                    dataFim: solicitacao.dataFim,
                    observacoes
                }
            });

            // Atualizar status da solicitação
            await prisma.solicitacaoHorario.update({
                where: { id: parseInt(id) },
                data: { status: 'APROVADO' }
            });

            return reply.status(200).send({ 
                message: "Solicitação aprovada e horário criado com sucesso" 
            });
        } else if (acao === 'REJEITAR') {
            await prisma.solicitacaoHorario.update({
                where: { id: parseInt(id) },
                data: { status: 'REJEITADO' }
            });

            return reply.status(200).send({ 
                message: "Solicitação rejeitada" 
            });
        } else {
            return reply.status(400).send({ 
                error: "Ação inválida. Use 'APROVAR' ou 'REJEITAR'" 
            });
        }
    } catch (error) {
        console.error("Erro ao processar solicitação:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Remover horário recorrente (aluno)
export async function removerHorarioRecorrente(request, reply) {
    try {
        const { userId } = request.user;
        const { id } = request.params;

        const horario = await prisma.horarioRecorrente.findFirst({
            where: {
                id: parseInt(id),
                userId
            }
        });

        if (!horario) {
            return reply.status(404).send({ error: "Horário não encontrado" });
        }

        await prisma.horarioRecorrente.update({
            where: { id: parseInt(id) },
            data: { ativo: false }
        });

        return reply.status(200).send({ 
            message: "Horário removido com sucesso" 
        });
    } catch (error) {
        console.error("Erro ao remover horário:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Função para criar reservas automáticas baseadas nos horários recorrentes
export async function criarReservasAutomaticas() {
    try {
        const hoje = new Date();
        const proximaSegunda = new Date(hoje);
        proximaSegunda.setDate(hoje.getDate() + (1 + 7 - hoje.getDay()) % 7);
        
        const fimSemana = new Date(proximaSegunda);
        fimSemana.setDate(proximaSegunda.getDate() + 6);

        // Buscar horários recorrentes aprovados e ativos
        const horariosRecorrentes = await prisma.horarioRecorrente.findMany({
            where: {
                ativo: true,
                aprovado: true,
                user: {
                    statusCadastro: 'APROVADO'
                }
            },
            include: {
                user: true
            }
        });

        const diasSemana = {
            'SEGUNDA': 1,
            'TERCA': 2, 
            'QUARTA': 3,
            'QUINTA': 4,
            'SEXTA': 5,
            'SABADO': 6,
            'DOMINGO': 0
        };

        for (const horario of horariosRecorrentes) {
            const diaNumero = diasSemana[horario.diaSemana];
            const dataReserva = new Date(proximaSegunda);
            dataReserva.setDate(proximaSegunda.getDate() + (diaNumero === 0 ? 6 : diaNumero - 1));

            // Verificar se já existe reserva para este dia
            const reservaExistente = await prisma.reserva.findFirst({
                where: {
                    userId: horario.userId,
                    data: {
                        gte: new Date(dataReserva.setHours(0, 0, 0, 0)),
                        lt: new Date(dataReserva.setHours(23, 59, 59, 999))
                    },
                    ativo: true
                }
            });

            if (!reservaExistente) {
                await prisma.reserva.create({
                    data: {
                        userId: horario.userId,
                        data: dataReserva,
                        vaiIda: horario.vaiIda,
                        vaiVolta: horario.vaiVolta,
                        status: 'APROVADA' // Automaticamente aprovada por ser recorrente
                    }
                });
            }
        }

        console.log("Reservas automáticas criadas com sucesso");
    } catch (error) {
        console.error("Erro ao criar reservas automáticas:", error);
    }
}
