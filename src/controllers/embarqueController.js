import prisma from "../config/prisma.js";
import { getFotoPerfilUrl } from "../services/supabaseService.js";

// Embarque usando QR Code da carteirinha (novo sistema)
export async function embarqueCarteirinha(request, reply) {
    try {
        const { qrCodeData } = request.body;
        
        // O QR Code da carteirinha contém apenas o ID do usuário
        const userId = qrCodeData;
        
        const hoje = new Date();
        const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
        const fimDia = new Date(hoje.setHours(23, 59, 59, 999));
        
        // Buscar o aluno
        const aluno = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                instituicao: {
                    select: { nome: true }
                }
            }
        });
        
        if (!aluno || aluno.role !== 'ALUNO') {
            return reply.status(404).send({ error: "Aluno não encontrado" });
        }
        
        if (aluno.statusCadastro !== 'APROVADO') {
            return reply.status(403).send({ error: "Aluno não está aprovado" });
        }
        
        // Verificar se o aluno tem horário recorrente para hoje
        const diasSemana = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
        const diaHoje = diasSemana[new Date().getDay()];
        
        const horarioHoje = await prisma.horarioRecorrente.findFirst({
            where: {
                userId,
                diaSemana: diaHoje,
                ativo: true,
                aprovado: true
            }
        });
        
        if (!horarioHoje) {
            return reply.status(403).send({ 
                error: `${aluno.nome} não possui autorização para usar o transporte hoje (${diaHoje})` 
            });
        }
        
        // Buscar ou criar reserva automática para hoje
        let reserva = await prisma.reserva.findFirst({
            where: {
                userId,
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                ativo: true
            }
        });
        
        // Se não existir reserva, criar automaticamente
        if (!reserva) {
            reserva = await prisma.reserva.create({
                data: {
                    userId,
                    data: new Date(),
                    vaiIda: horarioHoje.vaiIda,
                    vaiVolta: horarioHoje.vaiVolta,
                    status: 'APROVADA'
                }
            });
        }
        
        // Verificar status atual da reserva
        let novoStatus;
        let acao;
        
        if (reserva.status === 'APROVADA') {
            novoStatus = 'EMBARCADO';
            acao = 'embarque';
        } else if (reserva.status === 'EMBARCADO') {
            novoStatus = 'DESEMBARCADO';
            acao = 'desembarque';
        } else {
            return reply.status(400).send({ 
                error: `Não é possível fazer ${reserva.status === 'DESEMBARCADO' ? 'novo embarque' : 'embarque'} com reserva no status: ${reserva.status}` 
            });
        }
        
        // Atualizar status da reserva
        const reservaAtualizada = await prisma.reserva.update({
            where: { id: reserva.id },
            data: { status: novoStatus }
        });
        
        // Buscar dados completos do aluno com foto
        const alunoCompleto = {
            ...aluno,
            fotoPerfilUrl: aluno.fotoPerfilUrl ? await getFotoPerfilUrl(aluno.fotoPerfilUrl) : null
        };
        
        return reply.status(200).send({
            message: `${acao} realizado com sucesso`,
            acao,
            aluno: alunoCompleto,
            reserva: reservaAtualizada,
            horario: horarioHoje
        });
        
    } catch (error) {
        console.error("Erro no embarque por carteirinha:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Listar alunos embarcados hoje (para motorista)
export async function getAlunosEmbarcadosHoje(request, reply) {
    try {
        const hoje = new Date();
        const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
        const fimDia = new Date(hoje.setHours(23, 59, 59, 999));
        
        const reservas = await prisma.reserva.findMany({
            where: {
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                status: {
                    in: ['EMBARCADO', 'DESEMBARCADO']
                },
                ativo: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nome: true,
                        matricula: true,
                        fotoPerfilUrl: true,
                        instituicao: {
                            select: { nome: true }
                        }
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        
        // Adicionar URLs das fotos
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
        
        return reply.status(200).send(reservasComFotos);
        
    } catch (error) {
        console.error("Erro ao buscar alunos embarcados:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}
