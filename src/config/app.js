import fastify from "fastify";
import authController from "../controllers/auth/authController.js";
import fastifyMultipart from "@fastify/multipart";
import supervisorRoutes from "../routes/supervisorRoutes.js";
import reservaRoutes from "../routes/reservaRoutes.js";
import alunoRoutes from "../routes/alunoRoutes.js";
import motoristaRoutes from "../routes/motoristaRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import errorHandler from "../middlewares/errorHandler.js";
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyCors from '@fastify/cors';

export default function buildApp() {
    const app = fastify({ logger: false, bodyLimit: 20971520 }); // 20MB

    // Middleware de log detalhado
    app.addHook("onRequest", async (request, reply) => {
        request.logStart = Date.now();
        console.log(`[REQ] ${request.method} ${request.url} - headers:`, request.headers);
    });

    app.addHook("onResponse", async (request, reply) => {
        const ms = Date.now() - (request.logStart || Date.now());
        console.log(`[RES] ${request.method} ${request.url} -> ${reply.statusCode} (${ms}ms)`);
    });

    app.addHook("onError", async (request, reply, error) => {
        console.error("[GLOBAL ERROR]", error);
    });

    // Habilita CORS para permitir requisições do frontend
    app.register(fastifyCors, {
        origin: true
    });

    // Swagger/OpenAPI
    app.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Transporte Escolar/Universitário API',
                description: 'API para gestão de transporte escolar/universitário (cadastro, reservas, autenticação, etc).',
                version: '1.0.0',
            },
        },
    });
    app.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        },
    });

    // Removido: app.setValidatorCompiler(validatorCompiler);
    // Removido: app.setSerializerCompiler(serializerCompiler);

    app.register(fastifyMultipart);

    app.setErrorHandler(errorHandler);

    // Endpoint de debug para inspecionar o body recebido
    app.post('/debug-body', async (request, reply) => {
        console.log('DEBUG BODY:', request.body);
        return reply.send({ body: request.body });
    });


    app.register(authController);
    app.register(supervisorRoutes);
    app.register(reservaRoutes);
    app.register(alunoRoutes);
    app.register(motoristaRoutes);
    app.register(authRoutes);

    return app;
}
