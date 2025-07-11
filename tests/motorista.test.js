import { describe, it, expect } from 'vitest';
import buildApp from '../src/config/app.js';

const app = buildApp();

// Testes de motorista

describe('Motorista', () => {
  // Testa listagem de viagens sem autenticação
  it('deve retornar 401 ao tentar listar viagens sem autenticação', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/motorista/viagens',
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });

  // Testa atualização de dados do motorista sem autenticação
  it('deve retornar 401 ao tentar atualizar dados sem autenticação', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/motorista/update',
      payload: { nome: 'Novo Nome' },
      headers: { 'content-type': 'application/json' }
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toHaveProperty('error');
  });
}); 