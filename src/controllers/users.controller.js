import { HttpError } from "../utils/httperror.util.js";

import ReviewsRepository from "../repositories/reviews.repository.js";
import UsersRepository from "../repositories/users.repository.js";
import { getGamesByIds } from "../services/igdb.service.js";

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

        const games = await getGamesByIds(reviews.map(review => review.gameId));

        const recentReviews = reviews.map( (review, index) => ({
            ...review,
            rating: Number(review.rating),
            game: games[index]
        }));


        res.status(200).json({
            user:{
                id: user.id,
                nickname: user.nickname,
                profilePicture: user.profilePicture,
                profileBanner: user.profileBanner,
                bio: user.bio,
                createdAt: user.createdAt
            },
            stats,
            recentReviews
        });

    }
}

export default UsersController;