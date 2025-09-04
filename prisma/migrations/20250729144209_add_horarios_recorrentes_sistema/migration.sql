-- CreateTable
CREATE TABLE `horarios_recorrentes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `diaSemana` ENUM('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO') NOT NULL,
    `vaiIda` BOOLEAN NOT NULL DEFAULT true,
    `vaiVolta` BOOLEAN NOT NULL DEFAULT true,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `aprovado` BOOLEAN NOT NULL DEFAULT false,
    `dataInicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataFim` DATETIME(3) NULL,
    `observacoes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `horarios_recorrentes_userId_diaSemana_key`(`userId`, `diaSemana`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitacoes_horario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `diaSemana` ENUM('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO') NOT NULL,
    `vaiIda` BOOLEAN NOT NULL DEFAULT true,
    `vaiVolta` BOOLEAN NOT NULL DEFAULT true,
    `motivo` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE',
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `horarios_recorrentes` ADD CONSTRAINT `horarios_recorrentes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacoes_horario` ADD CONSTRAINT `solicitacoes_horario_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
