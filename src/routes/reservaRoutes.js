import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { createReserva, getReservaQRCode, embarqueReserva, cancelarReserva, reativarReserva } from "../controllers/reservaController.js";

export default async function reservaRoutes(app) {
    // Aluno cria reserva
    app.post("/reservas", { preHandler: [authenticate, authorize(["ALUNO"])] }, createReserva);

    // Aluno obtém QR Code da reserva
    app.get("/reservas/:id/qrcode", { preHandler: [authenticate, authorize(["ALUNO"])] }, getReservaQRCode);

    // Aluno cancela reserva (soft delete)
    app.patch("/reservas/:id/cancelar", { preHandler: [authenticate, authorize(["ALUNO"])] }, cancelarReserva);

    // Aluno reativa/edita reserva
    app.patch("/reservas/:id", { preHandler: [authenticate, authorize(["ALUNO"])] }, reativarReserva);

    // Motorista faz leitura do QR Code para embarque/desembarque
    app.post("/reservas/embarque", { preHandler: [authenticate, authorize(["MOTORISTA"])] }, embarqueReserva);
} 