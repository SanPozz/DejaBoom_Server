/*
  Warnings:

  - A unique constraint covering the columns `[gameListId,position]` on the table `GameListItems` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `position` to the `GameListItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameListItems" ADD COLUMN     "position" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "GameLists" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "GameListItems_gameListId_position_key" ON "GameListItems"("gameListId", "position");

-- CreateIndex
CREATE INDEX "GameLists_isPublic_updatedAt_idx" ON "GameLists"("isPublic", "updatedAt");
