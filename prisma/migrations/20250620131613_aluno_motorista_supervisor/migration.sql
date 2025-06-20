-- AlterTable
ALTER TABLE `motoristas` ADD COLUMN `telefone` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `comprovanteMatriculaUrl` VARCHAR(191) NULL,
    ADD COLUMN `cpf` VARCHAR(191) NULL,
    ADD COLUMN `rg` VARCHAR(191) NULL,
    ADD COLUMN `telefone` VARCHAR(191) NULL;
