import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const generateToken = (id, fullname, role) => {

    const seed = process.env.SECRET_JWT_SEED;

    return new Promise((resolve, reject) => {
        const payload = {
            id,
           fullname,
           role,  
        };
        jwt.sign(payload, seed, {
            expiresIn: '28d'
        }, (err, token) => {
            if (err) {
                reject(err);
            }
            resolve(token);
        });
    })
}