import { HttpError } from '../utils/httperror.util.js';

const checkRole = (permittedRoles) => {
    return (req, res, next) => {
        const { role } = req.user;

        if (!permittedRoles.includes(role)) {
            throw new HttpError(403, 'Forbidden');
        }
        
        next();

        // if (permittedRoles.includes(role)) {
        //     next();
        // } else {
        //     throw new HttpError(403, 'Forbidden');
        // }
    }
}

export default checkRole;