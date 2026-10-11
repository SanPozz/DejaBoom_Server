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

}

export default UsersRepository;