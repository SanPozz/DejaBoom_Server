import jwt from 'jsonwebtoken';

const getSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET no está configurado');
    }

    return process.env.JWT_SECRET;
};

class TokenService {
    static generateAccessToken(userID) {
        return jwt.sign(
            {},
            getSecret(),
            {
                subject: String(userID),
                expiresIn: '1h',
                issuer: 'DejaBoom-api',
                audience: 'DejaBoom-web'
            }
        );
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, getSecret(), {
                issuer: 'DejaBoom-api',
                audience: 'DejaBoom-web'
            });
        } catch (error) {
            return null;
        }
    }
}

export default TokenService;