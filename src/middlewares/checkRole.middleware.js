

const checkRole = (permittedRoles) => {
    return (req, res, next) => {
        const { role } = req.user;
        if (permittedRoles.includes(role)) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden' });
        }
    }
}

export default checkRole;