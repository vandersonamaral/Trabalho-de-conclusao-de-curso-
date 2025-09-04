import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { 
    listarViagensMotorista, 
    listarPassageirosViagem, 
    atualizarMotorista,
    getReservasHoje,
    processarEmbarque,
    getEstatisticasMotorista
} from "../controllers/motoristaController.js";

export default async function motoristaRoutes(app) {
    // Rotas antigas
    app.get("/motorista/viagens", { preHandler: [authenticate, authorize(["MOTORISTA"])] }, listarViagensMotorista);
    app.get("/motorista/viagens/:id/passageiros", { preHandler: [authenticate, authorize(["MOTORISTA"])] }, listarPassageirosViagem);
    app.patch("/motorista/update", { preHandler: [authenticate, authorize(["MOTORISTA"])] }, atualizarMotorista);
    
    // ===== NOVAS ROTAS PARA GESTÃO DE EMBARQUES =====
    
    // Lista de passageiros do dia atual
    app.get("/motoristas/reservas-hoje", { 
        preHandler: [authenticate, authorize(["MOTORISTA"])] 
    }, getReservasHoje);
    
    // Processar embarque/desembarque (via QR Code ou manual)
    app.post("/motoristas/processar-embarque", { 
        preHandler: [authenticate, authorize(["MOTORISTA"])] 
    }, processarEmbarque);
    
    // Estatísticas do motorista
    app.get("/motoristas/estatisticas", { 
        preHandler: [authenticate, authorize(["MOTORISTA"])] 
    }, getEstatisticasMotorista);
} 