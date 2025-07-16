import fastify from "fastify";
import authController from "../controllers/auth/authController.js";
import fastifyMultipart from "@fastify/multipart";
import {
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";
import supervisorRoutes from "../routes/supervisorRoutes.js";
import reservaRoutes from "../routes/reservaRoutes.js";
import alunoRoutes from "../routes/alunoRoutes.js";
import motoristaRoutes from "../routes/motoristaRoutes.js";
import authRoutes from "../routes/authRoutes.js";

const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyMultipart);

app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
        reply.status(400).send({
            statusCode: 400,
            error: "Bad Request",
            issues: error.issues,
        });
        return;
    }
    reply.send(error);
});

app.register(authController);
app.register(supervisorRoutes);
app.register(reservaRoutes);
app.register(alunoRoutes);
app.register(motoristaRoutes);
app.register(authRoutes);

export default app;
