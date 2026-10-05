import TokenService from "../services/token.service";

const authMiddleware = (req, res, next) => {

    const token = req.cookies?.access_token;

    if (!token) {
        return res.status(401).send('Acceso no autorizado');
    }

    try {
        const decoded = TokenService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).send('Sesión inválida o expirada');
    }

}