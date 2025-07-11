import { describe, it, expect } from 'vitest';
import buildApp from '../src/config/app.js';

const app = buildApp();

// Testes de supervisor

describe('Supervisor', () => {
    // Testa listagem de pendentes sem autenticação
    it('deve retornar 401 ao tentar listar pendentes sem autenticação', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/supervisor/pendentes',
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa aprovação sem autenticação
    it('deve retornar 401 ao tentar aprovar cadastro sem autenticação', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/supervisor/aprovar/1',
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa rejeição sem autenticação
    it('deve retornar 401 ao tentar rejeitar cadastro sem autenticação', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/supervisor/rejeitar/1',
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa cadastro de instituição sem autenticação
    it('deve retornar 401 ao tentar cadastrar instituição sem autenticação', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/supervisor/instituicoes',
            payload: { nome: 'Nova Instituição', cidade: 'Cidade' },
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });
}); 