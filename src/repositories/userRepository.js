import prisma from '../config/prisma.js';

export const findUserByEmail = (email) =>
    prisma.user.findUnique({ where: { email } });

export const createUser = (data) =>
    prisma.user.create({ data });

export const updateUser = (id, data) =>
    prisma.user.update({ where: { id }, data }); 