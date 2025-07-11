import { ZodError } from "zod";

// Middleware global de tratamento de erros
export default function errorHandler(error, request, reply) {
    // Só loga detalhes se não estiver em ambiente de teste
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.error('--- ERRO GLOBAL CAPTURADO ---');
        console.error('Erro:', error);
        console.error('Rota:', request?.url);
        console.error('Método:', request?.method);
        console.error('Headers:', request?.headers);
        console.error('Body recebido:', request?.body);
        console.error('-----------------------------');
    }
    // Erro de validação Zod (mesmo de instâncias diferentes)
    if (error instanceof ZodError || error?.name === 'ZodError') {
        return reply.status(400).send({
            error: "Erro de validação",
            detalhes: error.errors || error.issues || error.message || error
        });
    }
    // Erro de execução por body undefined/malformado (TypeError do Zod/Fastify)
    if (error instanceof TypeError && error.message && error.message.includes("Cannot read properties of undefined")) {
        return reply.status(400).send({
            error: "Body da requisição ausente ou malformado",
            detalhes: error.message
        });
    }
    // Erro de validação do Fastify (body inválido, schema, etc.)
    if (error.code === 'FST_ERR_VALIDATION' || error.validation) {
        return reply.status(400).send({
            error: "Erro de validação",
            detalhes: error.message || error.validation || error
        });
    }
    // Erro de multipart esperado mas não enviado
    if (error.code === 'FST_INVALID_MULTIPART_CONTENT_TYPE') {
        return reply.status(400).send({
            error: "Conteúdo do request deve ser multipart/form-data para este endpoint."
        });
    }
    // Outros erros
    reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error',
        details: error.details || undefined
    });
} 