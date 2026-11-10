import prisma from '../database/db.js';

class UsersRepository {
    
    save(user) {

        return prisma.users.create({
            data: user,
        });

    }

    findById(id) {

        return prisma.users.findUnique({
            where: { id },
        });

    }

    findByEmail(email) {

        return prisma.users.findUnique({
            where: { email },
        });

    }

    findByUsername(username) {

        return prisma.users.findUnique({
            where: { nickname: username },
        });

    }

    findByFirebaseUID(firebaseUID) {

        return prisma.users.findUnique({
            where: { firebaseUID },
        });

    }

    findAll() {

        return prisma.users.findMany();

    }

    deleteById(id) {

        return prisma.users.delete({
            where: { id },
        });

    }

    updateById(id, user) {

        return prisma.users.update({
            where: { id },
            data: user,
        });

    }

    async getFavoriteGameIds(userId) {

        const favorites = await prisma.favoriteGames.findMany({
            where: { userId },
            orderBy: { position: 'asc' },
            select: { gameId: true }
        });

        return favorites.map(f => f.gameId);

    }

    replaceFavoriteGames(userId, gameIds) {

        return prisma.$transaction([
            prisma.favoriteGames.deleteMany({
                where: { userId }
            }),
            prisma.favoriteGames.createMany({
                data: gameIds.map((gameId, position) => ({
                    userId,
                    gameId,
                    position
                }))
            })
        ])

    }

}

export default UsersRepository;