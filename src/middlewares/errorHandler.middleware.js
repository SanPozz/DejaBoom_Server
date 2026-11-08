import { HttpError } from '../utils/httperror.util.js'

const errorHandler = (error, req, res, next) => {
    if (error instanceof HttpError) {
        return res.status(error.status).send({error: error.message });
    }

    if (error.code === 'P2002') {
        return res.status(400).json({error: 'Ya existe un registro con esos datos'});
    }

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({error: 'JSON en body inválido'});
    }

    console.error(error);
    return res.status(500).json({error: 'Internal Server Error'});
};

export default errorHandler;