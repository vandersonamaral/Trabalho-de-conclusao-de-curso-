import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { createReserva, getReservaQRCode, embarqueReserva } from "../controllers/reservaController.js";

export default async function reservaRoutes(app) {
    // Aluno cria reserva
    app.post("/reservas", { preHandler: [authenticate, authorize(["ALUNO"])] }, createReserva);

    // Aluno obtém QR Code da reserva
    app.get("/reservas/:id/qrcode", { preHandler: [authenticate, authorize(["ALUNO"])] }, getReservaQRCode);

    // Motorista faz leitura do QR Code para embarque/desembarque
    app.post("/reservas/embarque", { preHandler: [authenticate, authorize(["MOTORISTA"])] }, embarqueReserva);
} 