import { forgotPassword, resetPassword, changePassword } from "../controllers/auth/passwordController.js";
import { authenticate } from "../middlewares/authenticate.js";

export default async function authRoutes(app) {
    app.post("/auth/forgot-password", forgotPassword);
    app.post("/auth/reset-password", resetPassword);
    app.post("/auth/change-password", { preHandler: [authenticate] }, changePassword);
} 