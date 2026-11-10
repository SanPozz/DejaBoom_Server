import {searchGames, getGameById, getGamesByIds, getTimeToBeat, IgdbConfigurationError, listGames } from '../services/igdb.service.js';
import translateToSpanishWithCache, { DeepLConfigurationError } from '../services/deepl.service.js';
import ReviewsRepository from '../repositories/reviews.repository.js';

const reviewsRepository = new ReviewsRepository();

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

class GamesController {
    static async list(req, res) {
        const { limit: requestedLimit, after: requestedAfter } = req.query;
        const limit = requestedLimit === undefined ? DEFAULT_PAGE_SIZE : Number(requestedLimit);
        const afterId = requestedAfter === undefined ? undefined : Number(requestedAfter);

        if (
            (requestedLimit !== undefined &&
                (typeof requestedLimit !== 'string' || !/^\d+$/.test(requestedLimit))) ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > MAX_PAGE_SIZE
        ) {
            return res.status(400).json({ error: `limit tiene que ser un entero entre 1 y ${MAX_PAGE_SIZE}.` });
        }

        if (
            (requestedAfter !== undefined &&
                (typeof requestedAfter !== 'string' || !/^\d+$/.test(requestedAfter))) ||
            (afterId !== undefined && (!Number.isSafeInteger(afterId) || afterId < 1))
        ) {
            return res.status(400).json({ error: 'after tiene que ser un ID de juego entero positivo.' });
        }

        try {
            const games = await listGames({ afterId, limit });
            const hasMore = games.length > limit;
            const data = hasMore ? games.slice(0, limit) : games;
            const nextCursor = hasMore ? String(data[data.length - 1].id) : null;

            return res.json({ data, nextCursor, hasMore });
        } catch (error) {
            console.error('IGDB game listing failed:', error.message);

            if (error instanceof IgdbConfigurationError) {
                return res.status(500).json({ error: 'Las credenciales de IGDB no están configuradas en el servidor.' });
            }

            return res.status(502).json({ error: 'No se pudieron obtener los juegos de IGDB.' });
        }
    }

    static async search(req, res) {
        const searchTerm = req.query.q;

        if (typeof searchTerm !== 'string' || !searchTerm.trim()) {
            return res.status(400).json({ error: 'Se requiere un parámetro de consulta q no sea vacío.' });
        }

        if (searchTerm.trim().length > 100) {
            return res.status(400).json({ error: 'El parámetro de consulta q debe tener 100 caracteres o menos.' });
        }

        try {
            const games = await searchGames(searchTerm);
            return res.json(games);
        } catch (error) {
            console.error('IGDB game search failed:', error.message);

            if (error instanceof IgdbConfigurationError) {
                return res.status(500).json({ error: 'Las credenciales de IGDB no están configuradas en el servidor.' });
            }

            return res.status(502).json({ error: 'No se pudieron obtener los juegos de IGDB.' });
        }
    }

    static async getById(req, res) {
        const gameId = Number(req.params.id);

        if (!Number.isSafeInteger(gameId) || gameId < 1) {
            return res.status(400).json({ error: 'El ID del juego tiene que ser un entero positivo.' });
        }

        let game;
        let timeToBeat;
        try {
            const [games, timeToBeatData] = await Promise.all([
                getGameById(gameId),
                // Si falla el time to beat, el detalle del juego se devuelve igual
                getTimeToBeat(gameId).catch((error) => {
                    console.error('IGDB time to beat retrieval failed:', error.message);
                    return null;
                }),
            ]);
            game = games[0];
            timeToBeat = timeToBeatData;
        } catch (error) {
            console.error('IGDB game retrieval failed:', error.message);

            if (error instanceof IgdbConfigurationError) {
                return res.status(500).json({ error: 'Las credenciales de IGDB no están configuradas en el servidor.' });
            }

            return res.status(502).json({ error: 'No se pudo obtener el juego de IGDB.' });
        }

        if (!game) {
            return res.status(404).json({ error: 'Juego no encontrado.' });
        }

        try {
            const summaryEs = typeof game.summary === 'string' && game.summary.length > 0
                ? await translateToSpanishWithCache(game.summary)
                : null;

            return res.json({
                ...game,
                summaryEs,
                timeToBeat,
            });
        } catch (error) {
            console.error('Game description translation failed:', error.message);

            if (error instanceof DeepLConfigurationError) {
                return res.status(500).json({ error: 'La clave de API de DeepL no está configurada en el servidor.' });
            }

            return res.status(502).json({ error: 'No se pudo traducir la descripción del juego.' });
        }
    }

    static async getCommunity(req, res) {

        const gameId = Number(req.params.id);

        if (!Number.isSafeInteger(gameId) || gameId < 1) {
            return res.status(400).json({ error: 'El ID del juego tiene que ser un entero positivo.' });
        }

        try {
            const stats = await reviewsRepository.getCommunityStatsByGameId(gameId);
            return res.json(stats);
        } catch (error) {
            console.error('Game community stats retrieval failed:', error.message);
            return res.status(500).json({ error: 'No se pudieron obtener los datos de la comunidad del juego.' });
        }
    }

    static async getPopular(req, res) {
        try {

            const popularGameIds = await reviewsRepository.getPopularGameIds();
            const games = await getGamesByIds(popularGameIds);
            return res.json(games.filter(Boolean));
        } catch (error) {
            console.error('Popular games retrieval failed:', error.message);
            if (error instanceof IgdbConfigurationError) {
                return res.status(500).json({ error: 'Las credenciales de IGDB no están configuradas en el servidor.' });
            }
            return res.status(500).json({ error: 'No se pudieron obtener los juegos populares.' });
            
        }
    }

    static async getGameOfTheWeek(req, res) {
        try {

            const [popularGameId] = await reviewsRepository.getPopularGameIds({ days: 7, limit: 1 });

            if (!popularGameId) {
                return res.status(404).json({ error: 'No se encontró el juego de la semana.' });
            }

            const [[game], stats] = await Promise.all([
                getGameById(popularGameId),
                reviewsRepository.getCommunityStatsByGameId(popularGameId)
            ])

            if (!game) {
                return res.status(404).json({ error: 'No se encontró el juego de la semana.' });
            }

            const summaryEs = game.summary 
                ? await translateToSpanishWithCache(game.summary, 'ES').catch((error) => {
                    console.error('Game summary translation failed:', error.message);
                    return null
                })
                : null;

            return res.json({ ...game, summaryEs, stats });

        } catch (error) {
            
            console.error('Game of the week retrieval failed:', error.message);

            if (error instanceof IgdbConfigurationError) {
                return res.status(500).json({ error: 'Las credenciales de IGDB no están configuradas en el servidor.' });
            }

            return res.status(500).json({ error: 'No se pudo obtener el juego de la semana.' });

        }
    }

}

export default GamesController;
