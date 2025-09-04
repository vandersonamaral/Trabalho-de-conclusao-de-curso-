import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { 
    cadastroAluno, 
    listarReservasAluno, 
    atualizarAluno, 
    perfilAluno, 
    marcarFerias, 
    atualizarFotoPerfil, 
    deletarFotoPerfil, 
    limparFotosOrfas_Controller,
    solicitarReservaAvulsa,
    listarSolicitacoesAvulsas,
    cancelarSolicitacaoAvulsa
} from "../controllers/alunoController.js";
import prisma from "../prismaClient.js";

export default async function alunoRoutes(app) {
    app.post("/alunos/register", cadastroAluno);
    app.get("/alunos/reservas", { preHandler: [authenticate, authorize(["ALUNO"])] }, listarReservasAluno);
    
    // Endpoint público para listar instituições
    app.get("/instituicoes", async (request, reply) => {
        const instituicoes = await prisma.instituicao.findMany({ select: { id: true, nome: true } });
        return reply.send(instituicoes);
    });
    
    app.patch("/alunos/update", { preHandler: [authenticate, authorize(["ALUNO"])] }, atualizarAluno);
    app.get("/alunos/me", { preHandler: [authenticate, authorize(["ALUNO"])] }, perfilAluno);
    app.post("/alunos/ferias", { preHandler: [authenticate, authorize(["ALUNO"])] }, marcarFerias);
    app.patch("/alunos/foto-perfil", { preHandler: [authenticate, authorize(["ALUNO"])] }, atualizarFotoPerfil);
    app.delete("/alunos/foto-perfil", { preHandler: [authenticate, authorize(["ALUNO"])] }, deletarFotoPerfil);
    
    // ===== SOLICITAÇÕES AVULSAS =====
    app.post("/alunos/solicitar-reserva-avulsa", { 
        preHandler: [authenticate, authorize(["ALUNO"])] 
    }, solicitarReservaAvulsa);
    
    app.get("/alunos/solicitacoes-avulsas", { 
        preHandler: [authenticate, authorize(["ALUNO"])] 
    }, listarSolicitacoesAvulsas);
    
    app.delete("/alunos/solicitacoes-avulsas/:solicitacaoId", { 
        preHandler: [authenticate, authorize(["ALUNO"])] 
    }, cancelarSolicitacaoAvulsa);
    
    // Endpoint admin para limpeza de fotos órfãs
    app.post("/admin/limpar-fotos-orfas", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, limparFotosOrfas_Controller);
} 