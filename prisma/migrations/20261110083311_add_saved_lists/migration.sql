-- CreateTable
CREATE TABLE "SavedLists" (
    "userId" INTEGER NOT NULL,
    "gameListId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedLists_pkey" PRIMARY KEY ("userId","gameListId")
);

-- CreateIndex
CREATE INDEX "SavedLists_gameListId_idx" ON "SavedLists"("gameListId");

-- AddForeignKey
ALTER TABLE "SavedLists" ADD CONSTRAINT "SavedLists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedLists" ADD CONSTRAINT "SavedLists_gameListId_fkey" FOREIGN KEY ("gameListId") REFERENCES "GameLists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
