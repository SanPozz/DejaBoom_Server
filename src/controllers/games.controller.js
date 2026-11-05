import searchGames, { getGameById, IgdbConfigurationError, listGames } from '../services/igdb.service.js';
import { DeepLConfigurationError, translateTextsToSpanish } from '../services/deepl.service.js';

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
        try {
            const games = await getGameById(gameId);
            game = games[0];
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
            const genres = Array.isArray(game.genres) ? game.genres : [];
            const textsToTranslate = [];
            const summaryIndex = typeof game.summary === 'string' && game.summary.length > 0
                ? textsToTranslate.push(game.summary) - 1
                : -1;
            const genreIndexes = genres.map(genre => {
                if (typeof genre.name !== 'string' || !genre.name) {
                    return -1;
                }

                return textsToTranslate.push(genre.name) - 1;
            });
            const translatedTexts = await translateTextsToSpanish(textsToTranslate);
            const translatedGenres = genres.map((genre, index) => ({
                ...genre,
                nameEs: genreIndexes[index] === -1 ? null : translatedTexts[genreIndexes[index]],
            }));

            return res.json({
                ...game,
                summaryEs: summaryIndex === -1 ? null : translatedTexts[summaryIndex],
                genres: translatedGenres,
            });
        } catch (error) {
            console.error('Game description or genre translation failed:', error.message);

            if (error instanceof DeepLConfigurationError) {
                return res.status(500).json({ error: 'La clave de API de DeepL no está configurada en el servidor.' });
            }

            return res.status(502).json({ error: 'No se pudo traducir la descripción del juego o los géneros.' });
        }
    }

}

export default GamesController;
