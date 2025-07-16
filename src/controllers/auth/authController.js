import { login, registerAluno, registerSupervisor } from "../../services/authService.js";
import { loginSchema, registerAlunoSchema, registerSupervisorSchema } from "../../schemas/authSchemas.js";

export default async function authController(app) {
  app.post("/login", { schema: { body: loginSchema }, config: { public: true } }, login);
  app.post("/register", { schema: { body: registerAlunoSchema }, config: { public: true } }, registerAluno);
  app.post("/register-supervisor", { schema: { body: registerSupervisorSchema }, config: { public: true } }, registerSupervisor);
}