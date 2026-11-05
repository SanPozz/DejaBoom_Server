-- DropForeignKey
ALTER TABLE "Reviews" DROP CONSTRAINT "Reviews_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameListItems" DROP CONSTRAINT "GameListItems_gameId_fkey";

-- DropTable
DROP TABLE "Games";
