import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { listarDocumentosAlunos, aprovarCadastro, rejeitarCadastro, cadastrarInstituicao, cadastrarMotorista, listarAlunosPendentes, deletarAluno, deletarMotorista, atualizarSupervisor, listarReservasPendentes, aprovarReserva, rejeitarReserva } from "../controllers/supervisorController.js";

export default async function supervisorRoutes(app) {
    app.get("/supervisor/documentos", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, listarDocumentosAlunos);
    app.get("/supervisor/pendentes", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, listarAlunosPendentes);
    app.patch("/supervisor/aprovar/:id", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, aprovarCadastro);
    app.patch("/supervisor/rejeitar/:id", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, rejeitarCadastro);
    app.post("/supervisor/instituicoes", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, cadastrarInstituicao);
    app.post("/supervisor/motoristas", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, cadastrarMotorista);
    app.delete("/supervisor/aluno/:id", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, deletarAluno);
    app.delete("/supervisor/motorista/:id", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, deletarMotorista);
    app.patch("/supervisor/update", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, atualizarSupervisor);
    app.get("/supervisor/reservas-pendentes", { preHandler: [authenticate, authorize(["SUPERVISOR", "MOTORISTA"])] }, listarReservasPendentes);
    app.patch("/supervisor/reservas/:id/aprovar", { preHandler: [authenticate, authorize(["SUPERVISOR", "MOTORISTA"])] }, aprovarReserva);
    app.patch("/supervisor/reservas/:id/rejeitar", { preHandler: [authenticate, authorize(["SUPERVISOR", "MOTORISTA"])] }, rejeitarReserva);
} 