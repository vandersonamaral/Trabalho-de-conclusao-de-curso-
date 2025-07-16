import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import buildApp from '../src/config/app.js';
import prisma from '../src/prismaClient.js';
import bcrypt from 'bcryptjs';
import { FormData } from 'formdata-node';

let app;
let supervisorToken;
let instituicaoId;
let alunoToken;
let reservaId;

async function resetDatabase() {
    await prisma.diasSolicitados.deleteMany();
    await prisma.reserva.deleteMany();
    await prisma.viagem.deleteMany();
    await prisma.veiculo.deleteMany();
    await prisma.motorista.deleteMany();
    await prisma.supervisor.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.instituicao.deleteMany();
}

describe('Fluxo de sucesso (happy path)', () => {
    beforeAll(async () => {
        app = buildApp();
        await app.ready(); // ESSENCIAL para Fastify async plugins/controllers!
        await resetDatabase();

        // 1. Cadastra supervisor direto no banco (status APROVADO)
        const supervisor = await prisma.user.create({
            data: {
                nome: 'Supervisor Teste',
                email: 'supervisor@teste.com',
                senha: await bcrypt.hash('123456', 10),
                role: 'SUPERVISOR',
                statusCadastro: 'APROVADO'
            }
        });

        // 2. Faz login como supervisor
        const loginResponse = await app.inject({
            method: 'POST',
            url: '/login', // Corrigido de '/auth/login' para '/login'
            payload: {
                email: 'supervisor@teste.com',
                senha: '123456'
            },
            headers: { 'content-type': 'application/json' }
        });
        expect(loginResponse.statusCode).toBe(200);
        supervisorToken = loginResponse.json().token;

        // 3. Cria instituição autenticado como supervisor
        const instituicaoResponse = await app.inject({
            method: 'POST',
            url: '/supervisor/instituicoes',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${supervisorToken}`
            },
            payload: {
                nome: 'Instituto Teste',
                cidade: 'Cidade Teste'
            }
        });
        expect(instituicaoResponse.statusCode).toBe(201);
        instituicaoId = instituicaoResponse.json().instituicao.id;
        expect(instituicaoId).toBeTruthy();
    });

    afterAll(async () => {
        await app.close();
        await prisma.$disconnect();
    });

    it('deve cadastrar um aluno (multipart) com sucesso', async () => {
        const formData = new FormData();
        formData.set('nome', 'Aluno Teste');
        formData.set('email', 'aluno@teste.com');
        formData.set('senha', '123456');
        formData.set('matricula', '20231234');
        formData.set('cpf', '12345678901');
        formData.set('rg', '1234567');
        formData.set('telefone', '11999999999');
        formData.set('diasSolicitados', JSON.stringify(['SEGUNDA', 'TERCA']));
        formData.set('instituicao', String(instituicaoId));
        // formData.set('comprovanteMatricula', await fileFromPath('./tests/comprovante-exemplo.pdf'));

        const response = await app.inject({
            method: 'POST',
            url: '/alunos/register',
            payload: formData,
            headers: formData.headers
        });
        expect(response.statusCode).toBe(201);
        expect(response.json()).toHaveProperty('userId');
    });

    it('deve aprovar o cadastro do aluno (simulação)', async () => {
        // Busca o aluno cadastrado
        const aluno = await prisma.user.findFirst({ where: { email: 'aluno@teste.com' } });
        expect(aluno).toBeTruthy();
        // Aprova o aluno diretamente no banco (simulação de ação do supervisor)
        await prisma.user.update({ where: { id: aluno.id }, data: { statusCadastro: 'APROVADO' } });
    });

    it('deve fazer login do aluno e receber um token', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/login',
            payload: {
                email: 'aluno@teste.com',
                senha: '123456'
            },
            headers: { 'content-type': 'application/json' }
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toHaveProperty('token');
        alunoToken = response.json().token;
    });

    it('deve criar uma reserva autenticada', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/reservas',
            payload: { dia: new Date().toISOString() },
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${alunoToken}`
            }
        });
        expect(response.statusCode).toBe(201);
        expect(response.json()).toHaveProperty('reserva');
        reservaId = response.json().reserva.id;
    });

    it('deve listar reservas do aluno autenticado', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/alunos/reservas',
            headers: { authorization: `Bearer ${alunoToken}` }
        });
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.json())).toBe(true);
    });
});