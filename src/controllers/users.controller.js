import { HttpError } from "../utils/httperror.util.js";

import { REVIEW_ORDER } from "../repositories/reviews.repository.js";

import ReviewsRepository from "../repositories/reviews.repository.js";
import UsersRepository from "../repositories/users.repository.js";
import { getGamesByIds } from "../services/igdb.service.js";

const PAGE_SIZE = 8;

const toPublicUser = (user) => ({
    id: user.id,
    nickname: user.nickname,
    profilePicture: user.profilePicture,
    profileBanner: user.profileBanner,
    bio: user.bio,
    createdAt: user.createdAt
});

const normalizeText = (text) => {
    if (text === null) return null;
    if (typeof text !== "string") return undefined;
    const trimmedText = text.trim();
    return trimmedText === "" ? null : trimmedText;
}

const withGames = async (reviews) => {
    const games = await getGamesByIds(reviews.map(review => review.gameId));
    return reviews.map((review, index) => ({
        ...review,
        rating: Number(review.rating),
        game: games[index]
    }));
}

const usersRepository = new UsersRepository();

const reviewsRepository = new ReviewsRepository();

class UsersController {

    static async getProfile(req, res) {

        const { nickname } = req.params;

        const user = await usersRepository.findByUsername(nickname);

        if (!user) {
            throw new HttpError(404, "Usuario no encontrado");
        }

        const [stats, reviews] = await Promise.all([
            reviewsRepository.getUserStats(user.id),
            reviewsRepository.getRecentByUserId(user.id)
        ]);

        const recentReviews = await withGames(reviews);


        res.status(200).json({
            user: toPublicUser(user),
            stats,
            recentReviews
        });
    }

    static async getReviews(req, res) {

        const { nickname } = req.params;
        const { page = '1', sort='recent' } = req.query;

        if (!Object.keys(REVIEW_ORDER).includes(sort)) {
            throw new HttpError(400, "Orden de reseñas no válido");
        }

        const pageNumber = Number(page);

        if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
            throw new HttpError(400, "Página no válida");
        }

        const user = await usersRepository.findByUsername(nickname);

        if (!user) {
            throw new HttpError(404, "Usuario no encontrado");
        }

        const [reviews, stats ] = await Promise.all([
            reviewsRepository.getByUserId(user.id, { skip: (pageNumber - 1) * PAGE_SIZE, sort, limit: PAGE_SIZE }),
            reviewsRepository.getUserStats(user.id)
        ]);

        const totalPages = Math.ceil(stats.reviewsCount / PAGE_SIZE);

        res.status(200).json({
            reviews: await withGames(reviews),
            page: pageNumber,
            totalPages,
            total: stats.reviewsCount
        })

        

    }

    static async updateMe(req, res) {
        const { bio, profilePicture, profileBanner } = req.body ?? {};

        const data = {};

        if (bio !== undefined) {
            const value = normalizeText(bio);
            if (value === undefined) {
                throw new HttpError(400, "La biografía no es válida");
            }
            if (value !== null && value.length > 240) {
                throw new HttpError(400, "La biografía no puede tener más de 240 caracteres");
            }
            data.bio = value;
        }

        if (Object.keys(data).length === 0) {
            throw new HttpError(400, "No se proporcionaron datos para actualizar");
        }

        const updatedUser = await usersRepository.updateById(req.user.id, data);

        res.status(200).json({
            user: toPublicUser(updatedUser)
        });
    }
}

export default UsersController;