import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { listarDocumentosAlunos, aprovarCadastro, rejeitarCadastro, cadastrarInstituicao, cadastrarMotorista, listarAlunosPendentes } from "../controllers/supervisorController.js";

export default async function supervisorRoutes(app) {
    app.get("/supervisor/documentos", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, listarDocumentosAlunos);
    app.get("/supervisor/pendentes", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, listarAlunosPendentes);
    app.patch("/supervisor/aprovar/:id", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, aprovarCadastro);
    app.patch("/supervisor/rejeitar/:id", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, rejeitarCadastro);
    app.post("/supervisor/instituicoes", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, cadastrarInstituicao);
    app.post("/supervisor/motoristas", { preHandler: [authenticate, authorize(["SUPERVISOR"])] }, cadastrarMotorista);
} 