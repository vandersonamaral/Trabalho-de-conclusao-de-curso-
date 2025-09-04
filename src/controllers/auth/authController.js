import { login, registerAluno, registerSupervisor } from "../../services/authService.js";
import { loginSchema, registerAlunoSchema, registerSupervisorSchema } from "../../schemas/authSchemas.js";

export default async function authController(app) {
  app.post("/login", async (request, reply) => {
    try {
      loginSchema.parse(request.body);
      await login(request, reply);
    } catch (error) {
      throw error;
    }
  });

  app.post("/register", async (request, reply) => {
    try {
      registerAlunoSchema.parse(request.body);
      await registerAluno(request, reply);
    } catch (error) {
      throw error;
    }
  });

  app.post("/register-supervisor", async (request, reply) => {
    try {
      registerSupervisorSchema.parse(request.body);
      await registerSupervisor(request, reply);
    } catch (error) {
      throw error;
    }
  });
}