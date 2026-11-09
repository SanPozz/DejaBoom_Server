const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_GAMES_URL = 'https://api.igdb.com/v4/games';
const IGDB_TIME_TO_BEAT_URL = 'https://api.igdb.com/v4/game_time_to_beats';
const TOKEN_REFRESH_MARGIN_MS = 60_000;

let cachedAccessToken;
let tokenExpiresAt = 0;

const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora en milisegundos

const igdbCached = new Map();

const getCachedIgdb = (key) => {
    const cached = igdbCached.get(key);

    if (cached === undefined) return undefined;

    if (Date.now() > cached.expiresAt) {
        igdbCached.delete(key);
        return undefined;
    }

    igdbCached.delete(key);
    igdbCached.set(key, cached);
    return cached.value;
};

const setCachedIgdb = (key, value) => {
    if (igdbCached.size >= MAX_CACHE_SIZE) {
        const oldestKey = igdbCached.keys().next().value;
        igdbCached.delete(oldestKey);
    }

    igdbCached.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

export class IgdbConfigurationError extends Error {}

const getAccessToken = async () => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new IgdbConfigurationError('TWITCH_CLIENT_ID y TWITCH_CLIENT_SECRET tienen que estar configurados.');
    }

    if (cachedAccessToken && Date.now() < tokenExpiresAt - TOKEN_REFRESH_MARGIN_MS) {
        return cachedAccessToken;
    }

    const response = await fetch(TWITCH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`Twitch OAuth request falló con HTTP ${response.status}.`);
    }

    const tokenResponse = await response.json();
    if (typeof tokenResponse.access_token !== 'string' || !Number.isFinite(tokenResponse.expires_in)) {
        throw new Error('Twitch OAuth devolvió una respuesta de token inválida.');
    }

    cachedAccessToken = tokenResponse.access_token;
    tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000;

    return cachedAccessToken;
};

export const searchGames = async (searchTerm) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const accessToken = await getAccessToken();
    const escapedSearchTerm = JSON.stringify(searchTerm.trim().replace(/[\r\n]/g, ' '));

    const response = await fetch(IGDB_GAMES_URL, {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
        },
        body: `search ${escapedSearchTerm}; fields id,name,cover.url,first_release_date,genres.name,platforms.name,summary; limit 10;`,
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`IGDB games request falló con HTTP ${response.status}.`);
    }

    return response.json();
};

export const listGames = async ({ afterId, limit }) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const accessToken = await getAccessToken();
    const cursorFilter = afterId === undefined ? '' : `where id > ${afterId}; `;

    const response = await fetch(IGDB_GAMES_URL, {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
        },
        body: `${cursorFilter}sort id asc; fields id,name,cover.url,first_release_date,genres.name,platforms.name,summary; limit ${limit + 1};`,
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`IGDB games request falló con HTTP ${response.status}.`);
    }

    return response.json();
};

export const getGameById = async (gameId) => {

    const cacheKey = `game:${gameId}`;

    const cached = getCachedIgdb(cacheKey);
    if (cached !== undefined) return [cached];

    const clientId = process.env.TWITCH_CLIENT_ID;
    const accessToken = await getAccessToken();

    const response = await fetch(IGDB_GAMES_URL, {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
        },
        body: `where id = ${gameId}; fields id,name,cover.url,artworks.url,first_release_date,genres.name,platforms.name,summary,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,similar_games.id,similar_games.name,similar_games.cover.url,similar_games.first_release_date,similar_games.genres.name,similar_games.platforms.name,similar_games.summary; limit 1;`,
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`IGDB game request falló con HTTP ${response.status}.`);
    }

    const result = await response.json();
    const game = result[0];
    if (game) {
        setCachedIgdb(cacheKey, game);
    }
    return result
};

// Los tiempos vienen en segundos. Devuelve null si IGDB no tiene datos del juego.
export const getTimeToBeat = async (gameId) => {

    const cacheKey = `timeToBeat:${gameId}`;
    const cached = getCachedIgdb(cacheKey);
    if (cached !== undefined) return cached;

    const clientId = process.env.TWITCH_CLIENT_ID;
    const accessToken = await getAccessToken();

    const response = await fetch(IGDB_TIME_TO_BEAT_URL, {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
        },
        body: `where game_id = ${gameId}; fields hastily,normally,completely,count; limit 1;`,
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`IGDB time to beat request falló con HTTP ${response.status}.`);
    }


    const [timeToBeat] = await response.json();

    if (timeToBeat === undefined) {
        setCachedIgdb(cacheKey, null);
        return null;
    }

    setCachedIgdb(cacheKey, timeToBeat);
    return timeToBeat;
};

export const getGamesByIds = async (gameIds) => {

    const GAME_CARD_FIELDS = 'id,name,cover.url,first_release_date,genres.name,platforms.name';

    const flagNotNumber = gameIds.some(id => !Number.isInteger(id) || id <= 0);

    if (flagNotNumber) {
        throw new Error('Todos los elementos de gameIds deben ser números enteros positivos.');
    }

    const uniqueIds = [...new Set(gameIds)];

    if (uniqueIds.length === 0) return [];

    const found = new Map();
    const missing = [];

    uniqueIds.forEach((id) => {
        const cached = getCachedIgdb(`card:${id}`);
        if (cached !== undefined) {
            found.set(id, cached);
        } else {
            missing.push(id);
        }
    });

    if (missing.length > 0) {
        const clientId = process.env.TWITCH_CLIENT_ID;
        const accessToken = await getAccessToken();

        const response = await fetch(IGDB_GAMES_URL, {
            method: 'POST',
            headers: {
                'Client-ID': clientId,
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'text/plain',
            },
            body: `where id = (${missing.join(',')}); fields ${GAME_CARD_FIELDS}; limit ${missing.length};`,
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            throw new Error(`IGDB games request falló con HTTP ${response.status}.`);
        }

        const results = await response.json();
        results.forEach((game) => {
            setCachedIgdb(`card:${game.id}`, game);
            found.set(game.id, game);
        });
    }

    return gameIds.map((id) => found.get(id) || null);
}

