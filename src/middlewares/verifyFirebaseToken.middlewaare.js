import { firebaseAuth } from '../services/firebaseAdmin.service.js';

const verifyFirebaseToken = async (req, res, next) => {

    const authorization = req.headers.authorization;

    console.log(authorization)

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).send('No autenticado');
    }

    const token = authorization.split(' ')[1];

    console.log({token})


    try {
        req.firebaseUser = await firebaseAuth.verifyIdToken(token);
        return next();
    } catch (error) {
        console.error('No se pudo verificar el token de Firebase:', error);
        return res.status(401).send('Token inválido o expirado');
    }

}

export default verifyFirebaseToken;