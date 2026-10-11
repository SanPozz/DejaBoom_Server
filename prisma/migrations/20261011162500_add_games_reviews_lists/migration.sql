-- AlterTable
ALTER TABLE "Users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Games" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "gameId" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameLists" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameLists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameListItems" (
    "gameListId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameListItems_pkey" PRIMARY KEY ("gameListId","gameId")
);

-- CreateIndex
CREATE INDEX "Reviews_userId_idx" ON "Reviews"("userId");

-- CreateIndex
CREATE INDEX "Reviews_gameId_idx" ON "Reviews"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Reviews_gameId_userId_key" ON "Reviews"("gameId", "userId");

-- CreateIndex
CREATE INDEX "GameLists_userId_idx" ON "GameLists"("userId");

-- CreateIndex
CREATE INDEX "GameListItems_gameId_idx" ON "GameListItems"("gameId");

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameLists" ADD CONSTRAINT "GameLists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameListItems" ADD CONSTRAINT "GameListItems_gameListId_fkey" FOREIGN KEY ("gameListId") REFERENCES "GameLists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameListItems" ADD CONSTRAINT "GameListItems_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Games"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Rating entre 0.5 y 5, en pasos de 0.5
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_rating_range"
  CHECK ("rating" >= 0.5 AND "rating" <= 5 AND ("rating" * 2) = FLOOR("rating" * 2));