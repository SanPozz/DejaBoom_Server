import UsersRepository from '../repositories/users.repository.js';

const currentUser = async (req, res, next) => {
  try {
    const user = await new UsersRepository().findByFirebaseUID(
      req.firebaseUser.uid,
    );

    if (!user) {
      return res.status(404).send('Usuario no registrado en DejaBoom');
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    console.error('Error al obtener el usuario actual:', error);
    return res.status(500).send('Error al obtener el usuario');
  }
};

export default currentUser;
