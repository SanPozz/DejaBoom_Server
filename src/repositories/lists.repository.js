import prisma from "../database/db.js";

const listSummarySelect = {
    id: true,
    name: true,
    description: true,
    isPublic: true,
    updatedAt: true,
    createdAt: true,
    user: { select: { nickname: true, profilePicture: true }},
    _count: { select: { items: true, savedBy: true } },
    items: {
        orderBy: { position: 'asc' },
        take: 4,
        select: { gameId: true }
    },
};

const toItems = (gameIds) => gameIds.map((gameId, position) => ({
    gameId,
    position
}));

class ListsRepository {

    findByUserId(userId, { includePrivate = false } = {}) {

        return prisma.gameLists.findMany({
            where: {userId, ...(includePrivate ? {} : {isPublic: true})},
            orderBy: [{ updatedAt: 'desc' }, {id: 'desc'}],
            select: listSummarySelect
        })
    }

    countByUserId(userId, { includePrivate = false } = {}) {

        return prisma.gameLists.count({
            where: {userId, ...(includePrivate ? {} : {isPublic: true})}
        });
    }

    findById(id) {

        return prisma.gameLists.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                name: true,
                description: true,
                isPublic: true,
                _count: { select: { savedBy: true } },
                updatedAt: true,
                createdAt: true,
                user: {
                    select: {
                        nickname: true,
                        profilePicture: true
                    }
                },
                items: {
                    orderBy: { position: 'asc' },
                    select: { gameId: true },
                },
            },
        });
    }

    create({ userId, name, description, isPublic, gameIds = [] }) {

        return prisma.gameLists.create({
            data: {
                userId,
                name,
                description,
                isPublic,
                items: { create: toItems(gameIds) }
            }
        });
    }

    deleteById(id) {

        return prisma.gameLists.delete({
            where: { id }
        });
    }

    update(id, { name, description, isPublic, gameIds = [] }) {
        return prisma.$transaction([
            prisma.gameListItems.deleteMany({ where: { gameListId: id } }),
            prisma.gameLists.update({
                where: { id },
                data: {
                    name,
                    description,
                    isPublic,
                    items: { create: toItems(gameIds) }
                }
            })
        ])
    }

    async isSavedByUser(listId, userId) {
        return prisma.savedLists.findUnique({
            where: { userId_gameListId: { userId, gameListId: listId } }
        }).then(saved => saved !== null)
    }

    save(listId, userId) {
        return prisma.savedLists.createMany({
            data: {userId, gameListId: listId},
            skipDuplicates: true,
        });
    }

    unsave(listId, userId) {
        return prisma.savedLists.deleteMany({
            where: { userId, gameListId: listId },
        });
    }

    findSavedByUser(userId) {
        return prisma.gameLists.findMany({
            where: { isPublic: true, savedBy: { some: { userId } } },
            orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
            select: listSummarySelect,
        });
    }

    findPopular({ limit = 3 } = {}) {
        return prisma.gameLists.findMany({
            where: { isPublic: true, items: { some: {} } },
            orderBy: [{ savedBy: { _count: 'desc' } }, { updatedAt: 'desc' }, { id: 'desc' }],
            take: limit,
            select: listSummarySelect,
        })
    }

}

export default ListsRepository;