-- AlterTable
ALTER TABLE `users` DROP COLUMN `password`,
    ADD COLUMN `firebaseUID` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Users_firebaseUID_key` ON `Users`(`firebaseUID`);

