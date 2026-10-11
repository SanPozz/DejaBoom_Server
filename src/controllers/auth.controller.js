import { regexEmail } from '../utils/regexEmail.util.js';

import TokenService from '../services/token.service.js';

import UsersRepository from '../repositories/users.repository.js';

class AuthController {

    static async register(req, res) {
        const username = req.body.username;
        const { uid: firebaseUID, email } = req.firebaseUser;

        if (!username) {
            return res.status(400).send('El nombre de usuario es requerido');
        }

        if (!email || !regexEmail(email)) {
            return res.status(400).send('El correo electrónico no es válido');
        }

        try {

            const userRepository = new UsersRepository();

            const newUser = await userRepository.save({
                nickname: username,
                firebaseUID,
                email,
            });

            return res.status(200).json(newUser);
            
        } catch (error) {
            console.error('Error al registrar el usuario:', error);

            if (error.code === 'P2002') {
                return res.status(409).send('Ya existe un usuario con ese correo, UID o nombre de usuario');
            }

            return res.status(500).send('Error al registrar el usuario');
        }
        
    }

    static async getCurrentUser(req, res) {
        const firebaseUser = req.firebaseUser;

        try {
            const userRepository = new UsersRepository();
            const user = await userRepository.findByFirebaseUID(firebaseUser.uid);

            if (!user) {
                return res.status(404).send('Usuario no encontrado');
            }

            return res.status(200).json({
                id: user.id,
                nickname: user.nickname,
                email: user.email,
                authenticated: true
            });
        } catch (error) {
            return res.status(401).send('Sesión inválida o expirada');
        }
    }

}

export default AuthController;