import {describe, test, expect} from '@jest/globals'
import { generateToken } from "../../helpers/jwt";
import jwt from 'jsonwebtoken'

const seed = process.env.SECRET_JWT_SEED
let id = crypto.randomUUID()
let username = 'azulcolor'
let role = 1

describe("Generating jwt", () => {
    test("should generate right the token", async () => {
        const token = await generateToken(id, username, role)
        const decoded = jwt.verify(token, seed)

        expect(token).not.toBeNull
        expect(decoded).not.toBeNull()
        expect(decoded).toHaveProperty('id', id)
        expect(decoded).toHaveProperty('username', username)
        expect(decoded).toHaveProperty('role', role)
    })
    test("should not accept wrong parameters", async () => {
        expect(() => generateToken(id, null, null)).toThrowError("Incomplete parameters")
        expect(() => generateToken(null, username, null)).toThrowError("Incomplete parameters")
        expect(() => generateToken(null, null, role)).toThrowError("Incomplete parameters")
        expect(() => generateToken()).toThrowError("Incomplete parameters")
    })
}) 
    
