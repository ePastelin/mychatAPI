import jwt from 'jsonwebtoken';

export const jwtValidator = (req, res, next) => {

    const token = req.header('x-token');
    console.log(token)
    if (!token) {
        return res.status(401).json({
            ok: false,
            message: "There's no token in the request" 
        });
    }

    try {
        const { id, fullname, role_id } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        req.id = id;
        req.fullname = fullname;
        req.role_id = role_id;
    } catch {
        return res.status(401).json({
            ok: false,
            message: "Invalid token"
        });
    }

    next();
}