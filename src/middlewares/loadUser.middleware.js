import UsersRepository from '../repositories/users.repository.js';

// Debe ir después de verifyFirebaseToken: carga el usuario de la BD en req.user
const loadUser = async (req, res, next) => {
    try {
        const user = await new UsersRepository().findByFirebaseUID(req.firebaseUser.uid);

        if (!user) {
            return res.status(403).send('Usuario no registrado');
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error('Error al cargar el usuario:', error);
        return res.status(500).send('Error al autenticar el usuario');
    }
};

export default loadUser;
