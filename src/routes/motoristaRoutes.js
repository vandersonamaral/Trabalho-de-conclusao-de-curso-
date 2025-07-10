import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { listarViagensMotorista, listarPassageirosViagem } from "../controllers/motoristaController.js";

export default async function motoristaRoutes(app) {
    app.get("/motorista/viagens", { preHandler: [authenticate, authorize(["MOTORISTA"])] }, listarViagensMotorista);
    app.get("/motorista/viagens/:id/passageiros", { preHandler: [authenticate, authorize(["MOTORISTA"])] }, listarPassageirosViagem);
} 