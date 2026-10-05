import { comparePasswordRegister } from '../utils/comparePasswordRegister.util.js';
import { regexEmail } from '../utils/regexEmail.util.js';
import { regexPassword } from '../utils/regexPassword.util.js';

import TokenService from '../services/token.service.js';

import PasswordHashService from '../services/passwordHash.service.js';

import UsersRepository from '../repositories/users.repository.js';

class AuthController {
    
    static async login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Todos los campos son requeridos');
        }

        const userRepository = new UsersRepository();
        const user = await userRepository.findByEmail(email);

        if (!user) {
            return res.status(404).send('No esxiste ninguna cuenta registrada con ese correo electrónico');
        }

        const isPasswordValid = await PasswordHashService.comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).send('Credenciales inválidas');
        }

        const token = TokenService.generateAccessToken(user.id);

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
        });

        return res.status(200).json({
            user: {
                id: user.id,
                nickname: user.nickname,
                email: user.email
            },
            access_token: token
        });

    }

    static async register(req, res) {
        const { username, password, email, confirmPassword} = req.body;

        if (!username || !password || !email || !confirmPassword) {
            return res.status(400).send('Todos los campos son requeridos');
        }

        if (!comparePasswordRegister(password, confirmPassword)) {
            return res.status(400).send('Las contraseñas no coinciden');
        }

        if (!regexEmail(email)) {
            return res.status(400).send('El correo electrónico no es válido');
        }

        if (!regexPassword(password)) {
            return res.status(400).send('La contraseña no cumple con los requisitos');
        }

        try {

            const userRepository = new UsersRepository();

            const hashedPassword = await PasswordHashService.hashPassword(password);

            const newUser = await userRepository.save({
                nickname: username,
                password: hashedPassword,
                email,
            });

            return res.status(201).json(newUser);
            
        } catch (error) {
            return res.status(500).send('Error al registrar el usuario');
        }
        
    }

    static async getCurrentUser(req, res) {
        const token = req.cookies.access_token;

        if (!token) {
            return res.status(401).send('No autenticado');
        }

        try {
            const decoded = TokenService.verifyToken(token);
            const userRepository = new UsersRepository();
            const user = await userRepository.findById(decoded.id);

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