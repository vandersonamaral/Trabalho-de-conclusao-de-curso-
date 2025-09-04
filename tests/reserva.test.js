import { describe, it, expect } from 'vitest';
import buildApp from '../src/config/app.js';

const app = buildApp();

// Testes de reservas

describe('Reserva', () => {
    // Testa criação de reserva sem autenticação
    it('deve retornar 401 ao tentar criar reserva sem autenticação', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/reservas',
            payload: { dia: '2024-07-10' },
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa embarque sem autenticação
    it('deve retornar 401 ao tentar embarcar sem autenticação', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/reservas/embarque',
            payload: { qrData: '{}' },
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });
}); 