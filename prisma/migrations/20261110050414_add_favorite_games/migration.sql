-- CreateTable
CREATE TABLE "FavoriteGames" (
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteGames_pkey" PRIMARY KEY ("userId","gameId")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteGames_userId_position_key" ON "FavoriteGames"("userId", "position");

-- AddForeignKey
ALTER TABLE "FavoriteGames" ADD CONSTRAINT "FavoriteGames_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
