CREATE TABLE "CommentLikes" (
    "id" SERIAL NOT NULL,
    "commentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLikes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommentLikes_commentId_userId_key"
    ON "CommentLikes"("commentId", "userId");

CREATE INDEX "CommentLikes_userId_idx"
    ON "CommentLikes"("userId");

ALTER TABLE "CommentLikes"
    ADD CONSTRAINT "CommentLikes_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "Comments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommentLikes"
    ADD CONSTRAINT "CommentLikes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "Users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;