import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { createUser, userLogin, updateUser, deleteUser, getUsers, createNumber, logged } from "../../controller/auth";
import api from "../../helpers/axios";
import { pool } from "../../database/config";
import bcrypt from 'bcryptjs' 
import { expectedError } from "@babel/core/lib/errors/rewrite-stack-trace";
import { json, query } from "express";

jest.mock("../../database/config", () => ({
    __esModule: true,
    getConnection: jest.fn(),
    pool: {
        query: jest.fn(),
    },
}));

let req, res;

const mockUsers = [
    {
        id: 34,
        username: "pastelin",
        password: "$2a$10$oCWnDWjfAbGBziJ0PmSMqeHubX3WDj2igiRq57bhKFviTv81Z0g9W",
        role: 1,
        phone_numbers: "331209570084524"
    },
    {
        id: 39,
        username: "Rasta",
        password: "$2a$10$bZ2AyFOc/ZMsoYSmbPyKO.ioKS4pO5OzCB5FJIlEdNItzGafREZXO",
        role: null,
        phone_numbers: ""
    },
];
const mockNumbers = [
    {
        idnumber: "255264754344614",
        number: "15550350257"
    },
    {
        idnumber: "331209570084524",
        number: "5219983487842"
    }
];

beforeEach(() => {
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
});
/*
describe("createUser", () => {
    req = {
        body:{
            username: "gloversantos",
            password: null,
            role: 1,
            phone_numbers:[
                99898,8056856
            ]
        },
    };
    beforeEach(() => {
        pool.query.mockClear();
    });
    test('should get a 400', async () => {
        req.body.password = null;
        await createUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("should create a new user", async () => {
        req.body.password = "gloversntos";
        await createUser(req, res);
        expect(pool.query).toHaveBeenNthCalledWith(1,"INSERT INTO users SET ?", [{
            username: "gloversantos",
            role: 1,
            password: expect.any(String)
        }]);
        expect(pool.query).toHaveBeenNthCalledWith(2,"INSERT INTO users_numbers (user_id, number_id) VALUES (?, ?)",[[

        ]]);
    });
});
*/
describe("getUsers", () => {
    beforeEach(() => {
        req = {};
    });

    test('should get users and phone numbers', async () => {
        pool.query
            .mockResolvedValueOnce([mockUsers])
            .mockResolvedValueOnce([mockNumbers]);
        const transformedUsers = mockUsers.map((user) => ({
            ...user,
            phone_numbers: user.phone_numbers ? user.phone_numbers.split(',') : [],
        }));
        await getUsers(req, res);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            users: transformedUsers,
            numbers: mockNumbers
        });
    });

    test('should get the query', async () => {
        pool.query
            .mockResolvedValueOnce([mockUsers])
            .mockResolvedValueOnce([mockNumbers]);
        await getUsers(req, res);
        expect(pool.query).toHaveBeenNthCalledWith(1, "SELECT u.*, COALESCE(GROUP_CONCAT(n.number_id), '') AS phone_numbers FROM users u LEFT JOIN users_numbers n ON u.id = n.user_id GROUP BY u.id;");
        expect(pool.query).toHaveBeenNthCalledWith(2, "SELECT * FROM number");
    });

    test('should get a 200 in the status', async () => {
        pool.query
            .mockResolvedValueOnce([mockUsers])
            .mockResolvedValueOnce([mockNumbers]);
        await getUsers(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should get a 500 in the response of get user', async () => {
        await getUsers(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
