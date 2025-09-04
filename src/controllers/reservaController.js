import prisma from "../config/prisma.js";
import { generateQRCode } from "../utils/qrcode.js";
import { getHorarioLimiteCancelamento } from "../models/config.js";
import { getFotoPerfilUrl } from '../services/supabaseService.js';


// Função para obter o dia da semana de uma data
function getDiaSemana(data) {
    const dias = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
    return dias[data.getDay()];
}

// Criação de reserva por aluno com aprovação automática
export async function createReserva(request, reply) {
    try {
        const { dia, vaiIda = true, vaiVolta = true } = request.body;
        const userId = request.user.id;

        if (!dia) {
            return reply.status(400).send({ error: "Dia é obrigatório." });
        }

        // Verificar se o usuário está aprovado
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { diasSolicitados: true }
        });

        if (!user) {
            return reply.status(404).send({ error: "Usuário não encontrado." });
        }

        if (user.statusCadastro !== "APROVADO") {
            return reply.status(403).send({
                error: "Cadastro não aprovado. Aguarde a aprovação do administrador."
            });
        }

        // Verificar se já existe uma reserva ativa para esta data
        const dataReserva = new Date(dia);
        const reservaExistente = await prisma.reserva.findFirst({
            where: {
                userId,
                data: {
                    gte: new Date(dataReserva.getFullYear(), dataReserva.getMonth(), dataReserva.getDate()),
                    lt: new Date(dataReserva.getFullYear(), dataReserva.getMonth(), dataReserva.getDate() + 1)
                },
                status: { in: ["APROVADA", "PENDENTE"] }
            }
        });

        if (reservaExistente) {
            return reply.status(400).send({
                error: "Já existe uma reserva ativa para esta data."
            });
        }

        // Verificar se o dia da semana está nos dias solicitados pelo aluno
        const diasSemana = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
        const diaSemana = diasSemana[dataReserva.getDay()];
        const diaPermitido = user.diasSolicitados.some(ds => ds.dia === diaSemana);
        // Se o dia está nos dias permitidos, aprova automaticamente, senão deixa pendente
        const statusInicial = diaPermitido ? "APROVADA" : "PENDENTE";

        const reserva = await prisma.reserva.create({
            data: {
                userId,
                data: dataReserva,
                status: statusInicial,
                vaiIda,
                vaiVolta
            },
            include: {
                user: {
                    select: {
                        nome: true,
                        email: true,
                        matricula: true
                    }
                }
            }
        });

        return reply.status(201).send({
            message: `Reserva criada e ${statusInicial === 'APROVADA' ? 'aprovada automaticamente' : 'enviada para análise'} para ${diaSemana.toLowerCase()}.`,
            reserva,
            status: statusInicial,
            diaSemana: diaSemana
        });
    } catch (err) {
        console.error('Erro ao criar reserva:', err);
        return reply.status(500).send({ error: "Erro ao criar reserva." });
    }
}

// Geração de QR Code da reserva
// Buscar informações de uma reserva específica
export async function getReservaById(request, reply) {
    try {
        const { id } = request.params;
        const reserva = await prisma.reserva.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: {
                        nome: true,
                        matricula: true,
                        email: true,
                        fotoPerfilUrl: true
                    }
                }
            }
        });

        if (!reserva) {
            return reply.status(404).send({ error: "Reserva não encontrada." });
        }

        if (reserva.userId !== request.user.id) {
            return reply.status(403).send({ error: "Acesso negado." });
        }

        // Converte fotoPerfilUrl para URL pública se existir
        const reservaComFoto = {
            ...reserva,
            user: {
                ...reserva.user,
                fotoPerfilUrl: reserva.user.fotoPerfilUrl ? getFotoPerfilUrl(reserva.user.fotoPerfilUrl) : null
            }
        };

        return reply.send(reservaComFoto);
    } catch (err) {
        console.error('Erro ao buscar reserva:', err);
        return reply.status(500).send({ error: "Erro ao buscar reserva." });
    }
}

export async function getReservaQRCode(request, reply) {
    try {
        const { id } = request.params;
        const reserva = await prisma.reserva.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: {
                        nome: true,
                        matricula: true,
                        email: true
                    }
                }
            }
        });

        if (!reserva) {
            return reply.status(404).send({ error: "Reserva não encontrada." });
        }

        if (reserva.userId !== request.user.id) {
            return reply.status(403).send({ error: "Acesso negado." });
        }

        if (reserva.status !== "APROVADA" && reserva.status !== "EMBARCADO") {
            return reply.status(400).send({
                error: "QR Code só pode ser gerado para reservas aprovadas ou embarcadas."
            });
        }

        // Criar payload mais completo para o QR Code
        const qrPayload = {
            reservaId: reserva.id,
            userId: reserva.userId,
            userNome: reserva.user.nome,
            userMatricula: reserva.user.matricula,
            data: reserva.data.toISOString(),
            status: reserva.status,
            vaiIda: reserva.vaiIda,
            vaiVolta: reserva.vaiVolta,
            timestamp: Date.now(),
            tipo: "reserva_transporte"
        };

        const qrCode = await generateQRCode(JSON.stringify(qrPayload));

        // Definir headers para imagem PNG
        reply.header('Content-Type', 'image/png');
        reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        reply.header('Pragma', 'no-cache');
        reply.header('Expires', '0');

        return reply.send(qrCode);
    } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
        return reply.status(500).send({ error: "Erro ao gerar QR Code." });
    }
}

// Embarque/desembarque via QR Code
export async function embarqueReserva(request, reply) {
    try {
        const { qrData, tipo } = request.body; // tipo: 'ida' ou 'volta'
        if (!qrData) {
            return reply.status(400).send({ error: "QR Code não enviado." });
        }
        let payload;
        try {
            payload = JSON.parse(qrData);
        } catch {
            return reply.status(400).send({ error: "QR Code inválido." });
        }
        if (payload.tipo !== "aluno_carteirinha") {
            return reply.status(400).send({ error: "QR Code não é de uma carteirinha de aluno." });
        }
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        const reserva = await prisma.reserva.findFirst({
            where: {
                userId: payload.userId,
                data: {
                    gte: hoje,
                    lt: amanha
                },
                status: { in: ["APROVADA", "EMBARCADO"] }
            },
            include: {
                user: { select: { nome: true, matricula: true, email: true } }
            }
        });
        if (!reserva) {
            return reply.status(404).send({ error: "Nenhuma reserva ativa encontrada para este aluno hoje." });
        }
        // Determinar se é ida ou volta
        let tipoViagem = tipo;
        if (!tipoViagem) {
            // Heurística: antes das 12h é ida, depois é volta
            const agora = new Date();
            tipoViagem = agora.getHours() < 12 ? "ida" : "volta";
        }
        if (tipoViagem === "ida" && !reserva.vaiIda) {
            return reply.status(400).send({ error: "Aluno cancelou a ida neste dia." });
        }
        if (tipoViagem === "volta" && !reserva.vaiVolta) {
            return reply.status(400).send({ error: "Aluno cancelou a volta neste dia." });
        }
        let novoStatus;
        let mensagem;
        if (reserva.status === "APROVADA") {
            novoStatus = "EMBARCADO";
            mensagem = "Passageiro embarcado com sucesso.";
        } else if (reserva.status === "EMBARCADO") {
            novoStatus = "DESEMBARCADO";
            mensagem = "Passageiro desembarcado com sucesso.";
        } else {
            return reply.status(400).send({ error: `Reserva já está no status: ${reserva.status}` });
        }
        await prisma.reserva.update({
            where: { id: reserva.id },
            data: { status: novoStatus }
        });
        return reply.send({
            message: mensagem,
            reservaId: reserva.id,
            status: novoStatus,
            passageiro: {
                nome: reserva.user.nome,
                matricula: reserva.user.matricula,
                email: reserva.user.email
            },
            data: reserva.data,
            timestamp: new Date().toISOString()
        });
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
        const finalizados = viagem.reservas.filter(r => r.status === "DESEMBARCADO");
        const aprovadas = viagem.reservas.filter(r => r.status === "APROVADA");

        return reply.send({
            message: "Status das reservas da viagem.",
            embarcados,
            finalizados,
            aprovadas
        });
    } catch (err) {
        console.error('Erro ao listar status das reservas:', err);
        return reply.status(500).send({ error: "Erro ao listar status das reservas." });
    }
}

// PATCH /reservas/:id/cancelar - soft delete
export async function cancelarReserva(request, reply) {
    try {
        const { id } = request.params;
        const userId = request.user.id;
        const tipo = request.body?.tipo || request.query?.tipo || "ambos";
        const reserva = await prisma.reserva.findUnique({
            where: { id: Number(id) },
            include: { user: true }
        });
        if (!reserva) {
            return reply.status(404).send({ error: "Reserva não encontrada." });
        }
        if (reserva.userId !== userId) {
            return reply.status(403).send({ error: "Acesso negado." });
        }
        if (reserva.status === "CANCELADA" || reserva.ativo === false) {
            return reply.status(400).send({ error: "Reserva já foi cancelada." });
        }
        let updateData = {};
        if (tipo === "ida") {
            if (!reserva.vaiIda) {
                return reply.status(400).send({ error: "A ida já foi cancelada." });
            }
            updateData.vaiIda = false;
        } else if (tipo === "volta") {
            if (!reserva.vaiVolta) {
                return reply.status(400).send({ error: "A volta já foi cancelada." });
            }
            updateData.vaiVolta = false;
        } else {
            updateData.status = "CANCELADA";
            updateData.vaiIda = false;
            updateData.vaiVolta = false;
            updateData.ativo = false;
        }
        // Se ambos vão ficar false, cancela a reserva inteira
        if ((tipo === "ida" && reserva.vaiVolta === false) || (tipo === "volta" && reserva.vaiIda === false)) {
            updateData.status = "CANCELADA";
            updateData.ativo = false;
        }
        const updated = await prisma.reserva.update({
            where: { id: Number(id) },
            data: updateData
        });
        return reply.send({
            message: tipo === "ida" ? "Ida cancelada (soft delete)." : tipo === "volta" ? "Volta cancelada (soft delete)." : "Reserva cancelada (soft delete).",
            reservaId: reserva.id,
            status: updated.status,
            vaiIda: updated.vaiIda,
            vaiVolta: updated.vaiVolta,
            ativo: updated.ativo
        });
    } catch (err) {
        console.error('Erro ao cancelar reserva:', err);
        return reply.status(500).send({ error: "Erro ao cancelar reserva." });
    }
}
// PATCH /reservas/:id - reativar reserva (ativo: true)
export async function reativarReserva(request, reply) {
    try {
        const { id } = request.params;
        const userId = request.user.id;
        const { vaiIda, vaiVolta } = request.body;
        const reserva = await prisma.reserva.findUnique({ where: { id: Number(id) } });
        if (!reserva) return reply.status(404).send({ error: "Reserva não encontrada." });
        if (reserva.userId !== userId) return reply.status(403).send({ error: "Acesso negado." });
        const updated = await prisma.reserva.update({
            where: { id: Number(id) },
            data: {
                vaiIda: typeof vaiIda === "boolean" ? vaiIda : reserva.vaiIda,
                vaiVolta: typeof vaiVolta === "boolean" ? vaiVolta : reserva.vaiVolta,
                ativo: true,
                status: "APROVADA"
            }
        });
        return reply.send({ message: "Reserva reativada com sucesso.", reserva: updated });
    } catch (err) {
        console.error('Erro ao reativar reserva:', err);
        return reply.status(500).send({ error: "Erro ao reativar reserva." });
    }
}

// Buscar reservas automáticas do usuário logado
export async function getMinhasReservasAutomaticas(request, reply) {
    try {
        const userId = request.user.id;
        
        // Buscar todas as reservas do usuário (incluindo automáticas)
        const reservas = await prisma.reserva.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                data: 'desc'
            }
        });
        
        // Buscar dados do usuário com foto
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                nome: true,
                fotoPerfilUrl: true
            }
        });
        
        // Formatar reservas com foto do usuário
        const reservasFormatadas = await Promise.all(
            reservas.map(async (reserva) => ({
                ...reserva,
                user: {
                    ...user,
                    fotoPerfilUrl: user.fotoPerfilUrl ? await getFotoPerfilUrl(user.fotoPerfilUrl) : null
                }
            }))
        );
        
        return reply.status(200).send({ reservas: reservasFormatadas });
        
    } catch (error) {
        console.error("Erro ao buscar reservas automáticas:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Criar reserva avulsa (fora dos dias programados)
export async function criarReservaAvulsa(request, reply) {
    try {
        const { data, vaiIda = true, vaiVolta = true } = request.body;
        const userId = request.user.id;

        if (!data) {
            return reply.status(400).send({ error: "Data é obrigatória." });
        }

        // Verificar se o usuário está aprovado
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return reply.status(404).send({ error: "Usuário não encontrado." });
        }

        if (user.statusCadastro !== "APROVADO") {
            return reply.status(403).send({
                error: "Cadastro não aprovado. Aguarde a aprovação do administrador."
            });
        }

        // Verificar se já existe uma reserva ativa para esta data
        const dataReserva = new Date(data);
        const inicioDia = new Date(dataReserva.getFullYear(), dataReserva.getMonth(), dataReserva.getDate());
        const fimDia = new Date(dataReserva.getFullYear(), dataReserva.getMonth(), dataReserva.getDate() + 1);
        
        const reservaExistente = await prisma.reserva.findFirst({
            where: {
                userId,
                data: {
                    gte: inicioDia,
                    lt: fimDia
                },
                ativo: true
            }
        });

        if (reservaExistente) {
            return reply.status(400).send({
                error: "Já existe uma reserva ativa para esta data."
            });
        }

        // Criar a reserva avulsa
        const novaReserva = await prisma.reserva.create({
            data: {
                userId,
                data: dataReserva,
                vaiIda,
                vaiVolta,
                status: "APROVADA", // Aprovação automática
                ativo: true
            }
        });

        return reply.status(201).send({
            message: "Reserva avulsa criada com sucesso.",
            reserva: novaReserva
        });

    } catch (error) {
        console.error("Erro ao criar reserva avulsa:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Editar reserva (alterar ida/volta)
export async function editarReserva(request, reply) {
    try {
        const { id } = request.params;
        const { vaiIda, vaiVolta } = request.body;
        const userId = request.user.id;

        // Buscar a reserva
        const reserva = await prisma.reserva.findUnique({
            where: { id: parseInt(id) }
        });

        if (!reserva) {
            return reply.status(404).send({ error: "Reserva não encontrada." });
        }

        if (reserva.userId !== userId) {
            return reply.status(403).send({ error: "Acesso negado." });
        }

        if (reserva.status === 'CANCELADA') {
            return reply.status(400).send({ error: "Não é possível editar uma reserva cancelada." });
        }

        // Atualizar a reserva
        const reservaAtualizada = await prisma.reserva.update({
            where: { id: parseInt(id) },
            data: {
                vaiIda: typeof vaiIda === "boolean" ? vaiIda : reserva.vaiIda,
                vaiVolta: typeof vaiVolta === "boolean" ? vaiVolta : reserva.vaiVolta
            }
        });

        return reply.status(200).send({
            message: "Reserva atualizada com sucesso.",
            reserva: reservaAtualizada
        });

    } catch (error) {
        console.error("Erro ao editar reserva:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Listar minhas reservas (aluno) - versão completa com paginação
export async function getMinhasReservas(request, reply) {
    try {
        const { userId } = request.user;
        const { page = 1, limit = 10, status, periodo } = request.query;
        
        const skip = (page - 1) * limit;
        
        let whereClause = {
            userId,
            ativo: true
        };

        // Filtrar por status se especificado
        if (status) {
            whereClause.status = status;
        }

        // Filtrar por período
        if (periodo) {
            const hoje = new Date();
            if (periodo === 'semana') {
                const inicioSemana = new Date(hoje);
                inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                inicioSemana.setHours(0, 0, 0, 0);
                
                const fimSemana = new Date(inicioSemana);
                fimSemana.setDate(inicioSemana.getDate() + 6);
                fimSemana.setHours(23, 59, 59, 999);
                
                whereClause.data = {
                    gte: inicioSemana,
                    lte: fimSemana
                };
            } else if (periodo === 'mes') {
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
                
                whereClause.data = {
                    gte: inicioMes,
                    lte: fimMes
                };
            }
        }

        const [reservas, total] = await Promise.all([
            prisma.reserva.findMany({
                where: whereClause,
                include: {
                    user: {
                        select: {
                            nome: true,
                            fotoPerfilUrl: true
                        }
                    }
                },
                orderBy: {
                    data: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.reserva.count({ where: whereClause })
        ]);

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

        return reply.status(200).send({
            reservas: reservasComFotos,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Erro ao buscar reservas:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Cancelar reserva específica
export async function cancelarReservaEspecifica(request, reply) {
    try {
        const { id } = request.params;
        const { tipo = "ambos" } = request.body;
        const userId = request.user.id;

        const reserva = await prisma.reserva.findUnique({
            where: { id: parseInt(id) }
        });

        if (!reserva) {
            return reply.status(404).send({ error: "Reserva não encontrada." });
        }

        if (reserva.userId !== userId) {
            return reply.status(403).send({ error: "Acesso negado." });
        }

        if (reserva.status === 'CANCELADA') {
            return reply.status(400).send({ error: "Reserva já está cancelada." });
        }

        let updateData = {};
        
        if (tipo === "ida") {
            updateData.vaiIda = false;
            if (!reserva.vaiVolta) {
                updateData.status = "CANCELADA";
                updateData.ativo = false;
            }
        } else if (tipo === "volta") {
            updateData.vaiVolta = false;
            if (!reserva.vaiIda) {
                updateData.status = "CANCELADA";
                updateData.ativo = false;
            }
        } else {
            updateData.status = "CANCELADA";
            updateData.ativo = false;
        }

        const reservaAtualizada = await prisma.reserva.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return reply.status(200).send({
            message: "Reserva cancelada com sucesso.",
            reserva: reservaAtualizada
        });

    } catch (error) {
        console.error("Erro ao cancelar reserva:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Reativar reserva específica
export async function reativarReservaEspecifica(request, reply) {
    try {
        const { id } = request.params;
        const { vaiIda = true, vaiVolta = true } = request.body;
        const userId = request.user.id;

        const reserva = await prisma.reserva.findUnique({
            where: { id: parseInt(id) }
        });

        if (!reserva) {
            return reply.status(404).send({ error: "Reserva não encontrada." });
        }

        if (reserva.userId !== userId) {
            return reply.status(403).send({ error: "Acesso negado." });
        }

        const reservaAtualizada = await prisma.reserva.update({
            where: { id: parseInt(id) },
            data: {
                vaiIda,
                vaiVolta,
                status: "APROVADA",
                ativo: true
            }
        });

        return reply.status(200).send({
            message: "Reserva reativada com sucesso.",
            reserva: reservaAtualizada
        });

    } catch (error) {
        console.error("Erro ao reativar reserva:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Listar reservas de hoje (motorista)
export async function getReservasHoje(request, reply) {
    try {
        const hoje = new Date();
        const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
        const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

        const reservas = await prisma.reserva.findMany({
            where: {
                data: {
                    gte: inicioDia,
                    lte: fimDia
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
                data: 'asc'
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
        console.error("Erro ao buscar reservas de hoje:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Executar criação manual de reservas (supervisor)
export async function executarCriacaoReservas(request, reply) {
    try {
        const resultado = await executarCriacaoManual();
        return reply.status(200).send({
            message: "Criação de reservas executada com sucesso.",
            resultado
        });
    } catch (error) {
        console.error("Erro ao executar criação de reservas:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}

// Obter estatísticas de reservas (supervisor)
export async function getEstatisticasReservas(request, reply) {
    try {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

        const [
            totalReservas,
            reservasAprovadas,
            reservasPendentes,
            reservasCanceladas,
            reservasHoje,
            reservasMes
        ] = await Promise.all([
            prisma.reserva.count(),
            prisma.reserva.count({ where: { status: 'APROVADA' } }),
            prisma.reserva.count({ where: { status: 'PENDENTE' } }),
            prisma.reserva.count({ where: { status: 'CANCELADA' } }),
            prisma.reserva.count({
                where: {
                    data: {
                        gte: new Date(hoje.setHours(0, 0, 0, 0)),
                        lte: new Date(hoje.setHours(23, 59, 59, 999))
                    }
                }
            }),
            prisma.reserva.count({
                where: {
                    data: {
                        gte: inicioMes,
                        lte: fimMes
                    }
                }
            })
        ]);

        return reply.status(200).send({
            total: totalReservas,
            aprovadas: reservasAprovadas,
            pendentes: reservasPendentes,
            canceladas: reservasCanceladas,
            hoje: reservasHoje,
            mes: reservasMes
        });

    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return reply.status(500).send({ error: "Erro interno do servidor" });
    }
}