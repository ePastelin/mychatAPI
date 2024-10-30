import jwt from "jsonwebtoken";
import "dotenv/config";

export const generateToken = (id, username, role) => {
  if(!id || !username || !role) {
    throw Error("Incomplete parameters")
  }

  const seed = process.env.SECRET_JWT_SEED;

  return new Promise((resolve, reject) => {
    const payload = {
      id,
      username,
      role,
    };
    jwt.sign(
      payload,
      seed,
      {
        expiresIn: "28d",
      },
      (err, token) => {
        if (err) {
          reject(err);
        }
        resolve(token);
      }
    );
  });
};
