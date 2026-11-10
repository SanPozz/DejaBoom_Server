import { HttpError } from "../utils/httperror.util.js";

import ListsRepository from "../repositories/lists.repository.js";
import UsersRepository from "../repositories/users.repository.js";

import { getGamesByIds } from "../services/igdb.service.js"

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 300;
const GAMES_LIMIT = 100;

const listsRepository = new ListsRepository();
const usersRepository = new UsersRepository();

const toListSummaries = async (lists) => {

    const gameIds = lists.flatMap(list => list.items.map(item => item.gameId));

    const games = await getGamesByIds(gameIds).catch(err => {
        console.error("Error buscando juegos para las portadas de la lista:", err.message);
        return gameIds.map(() => null);
    });

    const gamesById =  new Map(games.filter(Boolean).map(game => [game.id, game]));

    return lists.map(({name, items, _count, ...list}) => ({
        ...list,
        title: name,
        gamesCount: _count.items,
        savedCount: _count.savedBy,
        covers: items.map(item => gamesById.get(item.gameId)).filter(Boolean)
    }));

}

const parseListId = (id) => {
    const listId = Number(id);
    if (!Number.isSafeInteger(listId) || listId <= 0) {
        throw new HttpError(400, "ID de lista inválido");
    }
    return listId;
}

const parseListBody = (body) => {
    const {title, description, isPublic, gameIds} = body ?? {};

    if (typeof title !== "string" || !title.trim()) {
        throw new HttpError(400, "El título es obligatorio");
    }

    if (title.trim().length > TITLE_MAX_LENGTH) {
        throw new HttpError(400, `El título no puede tener más de ${TITLE_MAX_LENGTH} caracteres`);
    }

    if (description !== undefined && description !== null && typeof description !== "string") {
        throw new HttpError(400, "La descripción no es válida");
    }

    if (description?.trim().length > DESCRIPTION_MAX_LENGTH) {
        throw new HttpError(400, `La descripción no puede tener más de ${DESCRIPTION_MAX_LENGTH} caracteres`);
    }

    if (typeof isPublic !== "boolean") {
        throw new HttpError(400, "isPublic tiene que ser true o false");
    }

    if (!Array.isArray(gameIds)) {
        throw new HttpError(400, "gameIds tiene que ser un array");
    }

    if (gameIds.length > GAMES_LIMIT) {
        throw new HttpError(400, `Una lista no puede tener más de ${GAMES_LIMIT} juegos`);
    }

    if (gameIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
        throw new HttpError(400, "Los IDs de los juegos no son válidos");
    }

    if (new Set(gameIds).size !== gameIds.length) {
        throw new HttpError(400, "No se puede repetir un juego en la lista");
    }

    return {
        name: title.trim(),
        description: description?.trim() || null,
        isPublic,
        gameIds,
    }
}


class ListController {
    
    static async getByUser(req, res) {
        const { nickname } = req.params;

        const user = await usersRepository.findByUsername(nickname);

        if (!user) {
            throw new HttpError(404, "Usuario no encontrado");
        }

        const isOwner = user.id === req.user.id;
        const lists = await listsRepository.findByUserId(user.id, { includePrivate: isOwner});

        res.status(200).json(await toListSummaries(lists));
    }

    static async getById(req, res) {
        const listId = parseListId(req.params.id);
        const list = await listsRepository.findById(listId);

        if (!list || (!list.isPublic && list.userId !== req.user.id)) {
            throw new HttpError(404, "Lista no encontrada");
        }

        const [games, savedByMe] = await Promise.all([
            getGamesByIds(list.items.map(item => item.gameId)).catch(err => {
                console.error("Error buscando juegos para la lista:", err.message);
                return list.items.map(() => null);
            }),
            listsRepository.isSavedByUser(listId, req.user.id),
        ]);

        const { name, items, userId, _count, ...data } = list;

        res.status(200).json({
            ...data,
            title: name,
            isOwner: userId === req.user.id,
            savedCount: _count.savedBy,
            savedByMe,
            games: games.filter(Boolean),
        });
    }

    static async create(req, res) {
        const data = parseListBody(req.body);

        const list = await listsRepository.create({
            ...data,
            userId: req.user.id,
        });

        res.status(201).json({
            id: list.id,
        });
    }

    static async update(req, res) {
        const listId = parseListId(req.params.id);
        const data = parseListBody(req.body);

        const list = await listsRepository.findById(listId);

        if (!list || list.userId !== req.user.id) {
            throw new HttpError(404, "Lista no encontrada");
        }

        await listsRepository.update(listId, data);

        res.status(200).json({
            id: listId,
        });
    }

    static async remove(req, res) {

        const listId = parseListId(req.params.id);

        const list = await listsRepository.findById(listId);

        if (!list || list.userId !== req.user.id) {
            throw new HttpError(404, "Lista no encontrada");
        }

        await listsRepository.deleteById(listId);

        res.status(200).json({
            id: listId,
        });
    }

    static async save(req, res) {
        const listId = parseListId(req.params.id);
        const list = await listsRepository.findById(listId);

        if (!list || !list.isPublic){
            throw new HttpError(404, "Lista no encontrada");
        }

        if (list.userId === req.user.id) {
            throw new HttpError(400, "No puedes guardar tu propia lista");
        }

        await listsRepository.save(listId, req.user.id);

        res.status(200).json({
            id: listId,
            savedByMe: true
        });
    }

    static async unsave(req, res) {
        const listId = parseListId(req.params.id);
        const list = await listsRepository.findById(listId);

        if (!list || !list.isPublic){
            throw new HttpError(404, "Lista no encontrada");
        }

        await listsRepository.unsave(listId, req.user.id);

        res.status(200).json({
            id: listId,
            savedByMe: false
        });
    }

    static async getSaved(req, res) {
        const lists = await listsRepository.findSavedByUser(req.user.id);

        res.status(200).json(await toListSummaries(lists));
    }

    static async getPopular(req, res) {
        const lists = await listsRepository.findPopular();

        res.status(200).json(await toListSummaries(lists));
    }
}

export default ListController;