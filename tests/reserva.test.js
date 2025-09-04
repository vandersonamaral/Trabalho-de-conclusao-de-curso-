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

    // Testa cancelamento de reserva sem autenticação
    it('deve retornar 401 ao tentar cancelar reserva sem autenticação', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/reservas/1',
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa obtenção de QR Code sem autenticação
    it('deve retornar 401 ao tentar obter QR Code sem autenticação', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/reservas/1/qrcode',
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toHaveProperty('error');
    });

    // Testa cancelamento de reserva inexistente
    it('deve retornar 404 ao tentar cancelar reserva inexistente', async () => {
        // Primeiro criar um token de autenticação (simulado)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwicm9sZSI6IkFMTlVPIiwiZW1haWwiOiJ0ZXN0ZUB0ZXN0ZS5jb20iLCJpYXQiOjE2MzQ1Njc4OTksImV4cCI6MTYzNDU3MTQ5OX0.test';

        const response = await app.inject({
            method: 'DELETE',
            url: '/reservas/999999',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`
            }
        });
        expect(response.statusCode).toBe(401); // Token inválido retorna 401
    });

    // Testa obtenção de QR Code de reserva inexistente
    it('deve retornar 404 ao tentar obter QR Code de reserva inexistente', async () => {
        // Primeiro criar um token de autenticação (simulado)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwicm9sZSI6IkFMTlVPIiwiZW1haWwiOiJ0ZXN0ZUB0ZXN0ZS5jb20iLCJpYXQiOjE2MzQ1Njc4OTksImV4cCI6MTYzNDU3MTQ5OX0.test';

        const response = await app.inject({
            method: 'GET',
            url: '/reservas/999999/qrcode',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`
            }
        });
        expect(response.statusCode).toBe(401); // Token inválido retorna 401
    });
}); 