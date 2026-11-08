import { firebaseAuth } from '../services/firebaseAdmin.service.js';

import { HttpError } from '../utils/httperror.util.js';

const verifyFirebaseToken = async (req, res, next) => {

    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new HttpError(401, 'No autenticado');
    }

    const token = authorization.split(' ')[1];

    try {
        req.firebaseUser = await firebaseAuth.verifyIdToken(token);
        return next();
    } catch (error) {
        console.error('No se pudo verificar el token de Firebase:', error);
        throw new HttpError(401, 'Token inválido o expirado');
    }

}

export default verifyFirebaseToken;