import { describe, it, expect } from 'vitest';
import buildApp from '../src/config/app.js';

const app = buildApp();

// Testes de autenticação

describe('Autenticação', () => {
    // Testa login inválido
    it('deve retornar 400 para login inválido', async () => {
        // Envia body inválido
        const response = await app.inject({
            method: 'POST',
            url: '/login',
            payload: { email: '', senha: '' },
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa recuperação de senha para email não cadastrado
    it('deve retornar mensagem genérica para email não cadastrado na recuperação de senha', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/auth/forgot-password',
            payload: { email: 'naoexiste@email.com' },
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toHaveProperty('message');
    });

    // Testa cadastro de supervisor sem campos obrigatórios
    it('deve retornar erro ao tentar registrar supervisor sem campos obrigatórios', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/register-supervisor',
            payload: {},
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toHaveProperty('error');
    });
});