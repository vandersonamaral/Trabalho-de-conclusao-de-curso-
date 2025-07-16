import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { cadastroAluno, listarReservasAluno, atualizarAluno } from "../controllers/alunoController.js";

export default async function alunoRoutes(app) {
    app.post("/alunos/register", cadastroAluno);
    app.get("/alunos/reservas", { preHandler: [authenticate, authorize(["ALUNO"])] }, listarReservasAluno);
    app.patch("/alunos/update", { preHandler: [authenticate, authorize(["ALUNO"])] }, atualizarAluno);
} 