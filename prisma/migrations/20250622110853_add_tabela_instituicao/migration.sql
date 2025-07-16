/*
  Warnings:

  - The primary key for the `motoristas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `supervisores` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `dias_solicitados` DROP FOREIGN KEY `dias_solicitados_userId_fkey`;

-- DropForeignKey
ALTER TABLE `motoristas` DROP FOREIGN KEY `motoristas_userId_fkey`;

-- DropForeignKey
ALTER TABLE `reservas` DROP FOREIGN KEY `reservas_userId_fkey`;

-- DropForeignKey
ALTER TABLE `supervisores` DROP FOREIGN KEY `supervisores_userId_fkey`;

-- DropForeignKey
ALTER TABLE `veiculos` DROP FOREIGN KEY `veiculos_motoristaId_fkey`;

-- DropForeignKey
ALTER TABLE `viagens` DROP FOREIGN KEY `viagens_motoristaId_fkey`;

-- DropIndex
DROP INDEX `dias_solicitados_userId_fkey` ON `dias_solicitados`;

-- DropIndex
DROP INDEX `reservas_userId_fkey` ON `reservas`;

-- DropIndex
DROP INDEX `veiculos_motoristaId_fkey` ON `veiculos`;

-- DropIndex
DROP INDEX `viagens_motoristaId_fkey` ON `viagens`;

-- AlterTable
ALTER TABLE `dias_solicitados` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `motoristas` DROP PRIMARY KEY,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`userId`);

-- AlterTable
ALTER TABLE `reservas` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `supervisores` DROP PRIMARY KEY,
    MODIFY `userId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`userId`);

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    ADD COLUMN `instituicaoId` INTEGER NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `veiculos` MODIFY `motoristaId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `viagens` MODIFY `motoristaId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `instituicoes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `cidade` VARCHAR(191) NULL,

    UNIQUE INDEX `instituicoes_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_instituicaoId_fkey` FOREIGN KEY (`instituicaoId`) REFERENCES `instituicoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `motoristas` ADD CONSTRAINT `motoristas_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supervisores` ADD CONSTRAINT `supervisores_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `veiculos` ADD CONSTRAINT `veiculos_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dias_solicitados` ADD CONSTRAINT `dias_solicitados_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viagens` ADD CONSTRAINT `viagens_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
