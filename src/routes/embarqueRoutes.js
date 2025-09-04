import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { embarqueCarteirinha, getAlunosEmbarcadosHoje } from "../controllers/embarqueController.js";

export default async function embarqueRoutes(app) {
    // Motorista faz embarque/desembarque usando QR Code da carteirinha
    app.post("/embarque/carteirinha", { 
        preHandler: [authenticate, authorize(["MOTORISTA"])] 
    }, embarqueCarteirinha);

    // Motorista lista alunos embarcados hoje
    app.get("/embarque/hoje", { 
        preHandler: [authenticate, authorize(["MOTORISTA"])] 
    }, getAlunosEmbarcadosHoje);
}
