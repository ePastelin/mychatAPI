import jwt from 'jsonwebtoken';

export const jwtValidator = (req, res, next) => {

    const token = req.header('x-token');
    if (!token) {
        return res.status(401).json({
            ok: false,
            message: "There's no token in the request" 
        });
    }

    try {
        const { id, username, role } = jwt.verify(token, process.env.SECRET_JWT_SEED);

        req.id = id;
        req.username = username;
        req.role = role;
    } catch {
        return res.status(401).json({
            ok: false,
            message: "Invalid Token"
        });
    }

    next();
}

export const adminValidator = (req, res, next) =>{
    const token = req.header('x-token');

    if(!token) {
        return res.status(401).json({
            ok: false,
            message: "There's no token in the request"
        })
    }
    
    try {
        const {role} = jwt.verify(token, process.env.SECRET_JWT_SEED)
        if (role !== 1) return res.status(401).json({
            ok: false,
            message: "You're not admin"
        })

    } catch {
        return res.status(401).json({
            ok: false,
            message: "Invalid token"
        });
    } 

    next();
}