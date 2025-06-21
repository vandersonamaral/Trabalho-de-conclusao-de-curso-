import fastify from "fastify";
import authController  from "../controllers/auth/authController.js";
import fastifyMultipart from "@fastify/multipart";
import {
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";
import { ZodError } from "zod"; 
import supervisorController from "../controllers/supervisor/supervisorController.js";

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
app.register(supervisorController);

export default app;
