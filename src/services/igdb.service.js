const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_GAMES_URL = 'https://api.igdb.com/v4/games';
const TOKEN_REFRESH_MARGIN_MS = 60_000;

let cachedAccessToken;
let tokenExpiresAt = 0;

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

const searchGames = async (searchTerm) => {
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
    const clientId = process.env.TWITCH_CLIENT_ID;
    const accessToken = await getAccessToken();

    const response = await fetch(IGDB_GAMES_URL, {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
        },
        body: `where id = ${gameId}; fields id,name,cover.url,artworks.url,first_release_date,genres.name,platforms.name,summary,involved_companies.developer,involved_companies.publisher,involved_companies.company.name; limit 1;`,
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`IGDB game request falló con HTTP ${response.status}.`);
    }

    return response.json();
};

export default searchGames;
