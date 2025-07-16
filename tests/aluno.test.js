import { describe, it, expect } from 'vitest';
import buildApp from '../src/config/app.js';

const app = buildApp();

// Testes de cadastro e atualização de aluno

describe('Aluno', () => {
    // Testa erro ao faltar campos obrigatórios no cadastro
    it('deve retornar erro se faltar campos obrigatórios no cadastro', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/alunos/register',
            payload: {},
            headers: { 'content-type': 'application/json' }
        });
        expect([400, 406]).toContain(response.statusCode);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa atualização de dados do aluno sem autenticação
    it('deve retornar 401 ao tentar atualizar dados sem autenticação', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: '/alunos/update',
            payload: { nome: 'Novo Nome' },
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa listagem de reservas sem autenticação
    it('deve retornar 401 ao tentar listar reservas sem autenticação', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/alunos/reservas',
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });
}); 