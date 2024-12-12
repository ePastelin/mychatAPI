import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import { createUser, userLogin, updateUser, deleteUser, getUsers, createNumber, logged, desactivateUser } from "../../controller/auth";
import { pool } from "../../database/config";

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
const mockInsertUser =
{
    insertId: 1
};
const mockLoginUser = [
    {
        id: 1,
        username: "glover santos concha",
        password: "$2a$12$ktXmMYmS/XvRMfzgtDrynu4Au5IHG7YLnv2VXgZrR8mv2.ROLwaIC",
        role: "user",
    }
];

const mockValidPassword = {
    validPassword: true
};

const mockPhoneNumbers = [99898, 8056856];

const mockCurrentNumbers = {number_id: 2343452};


beforeEach(() => {
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    pool.query.mockReset();
});

describe("createUser", () => {
    beforeEach(() => {
        req = {
            body: {
                username: "gloversantos",
                password: "gloversantos1@@@@",
                role: 1,
                phone_numbers: [
                    99898, 8056856
                ]
            },
        };
        pool.query.mockReset();
    });
    test('should create a user correctly', async () => {
        pool.query.mockResolvedValueOnce([mockInsertUser]);
        await createUser(req, res);
        expect(res.json).toHaveBeenCalledWith(req.body);
    });
    test('should get the queries correctly', async () => {
        pool.query.mockResolvedValueOnce([mockInsertUser]);
        pool.query.mockResolvedValueOnce([mockPhoneNumbers]);
        await createUser(req, res);
        expect(pool.query).toHaveBeenNthCalledWith(1, "INSERT INTO users SET ?", [{
            username: "gloversantos",
            password: expect.any(String),
            role: 1
        }]);
        expect(pool.query).toHaveBeenCalledTimes(3, "INSERT INTO users_numbers (user_id, number_id) VALUES (?, ?)");
    });
    test('should get a error 400 because of password empty', async () => {
        req.body.password = null;
        await createUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "Missing required fields",
        })
    });
    test('Should get a error 500 for a unexpected error', async () => {
        req = null;
        await createUser(req, res);
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "Error creating user",
        })
    });
});

describe("userLogin", () => {
    beforeEach(() => {
        req = {
            body: {
                username: "glover santos concha",
                password: "gloversantos1@"
            }
        }
        pool.query.mockReset();
    });
    test("should let the user get in correctly", async () => {
        pool.query.mockResolvedValueOnce([mockLoginUser]);
        pool.query.mockResolvedValueOnce(mockValidPassword);
        await userLogin(req, res);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            uid: 1,
            username: "glover santos concha",
            role: "user",
            token: expect.any(String)
        });
    });
    test("should give 400 when the user doesnt exist", async () => {
        pool.query.mockResolvedValueOnce(mockLoginUser);
        await userLogin(req, res);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "Usuario o contraseña incorrectos"
        })
    });
    test("should give 400 when password is incorrect", async () => {
        req.body.password = "gloversantos1";
        pool.query.mockResolvedValueOnce([mockLoginUser]);
        pool.query.mockResolvedValueOnce(mockValidPassword);
        await userLogin(req, res);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "User or password incorrect"
        });
    });
    test("should give 500 becuase of a unexpected error", async () => {
        await userLogin(req, res);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "Error logging in"
        })
    });
    test("should check that the query work properly", async () => {
        pool.query.mockResolvedValueOnce([mockLoginUser]);
        pool.query.mockResolvedValueOnce(mockValidPassword);
        await userLogin(req, res);
        expect(pool.query).toHaveBeenNthCalledWith(1, "SELECT * FROM users WHERE username = ?", ["glover santos concha"]);
    });
});
/*
describe("updateUser", () => {
    beforeEach(() => {
        req = {
            params: {
                id: 1
            },
            body: {
                phone_numbers: ["123213213213213"],
                role: 1,
                username: "glover santos concha",
                password: "gloversantos1@"
            }
        }
    });
    test("should update and return user", async () => {
        pool.query.mockResolvedValueOnce(mockCurrentNumbers);
        console.log(mockCurrentNumbers);
        await updateUser(req,res);
        expect(res.json).toHaveBeenCalledWith(201);
    });
});
*/
describe("desactivateUser", ()=>{
    beforeEach(()=>{
        req = {
            params:{
                id:1
            }
        }
    });
    test("should desactivate the user", async () =>{
        await desactivateUser(req,res);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            message: "User desactivated",
        });
    });
});

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
        expect(pool.query).toHaveBeenNthCalledWith(1, "SELECT u.*, COALESCE(GROUP_CONCAT(n.number_id), '') AS phone_numbers FROM users u LEFT JOIN users_numbers n ON u.id = n.user_id WHERE u.isActive = 1 GROUP BY u.id ORDER BY u.role ASC;");
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
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "Error getting users"
        });
    });
});

describe("createNumber", () => {
    beforeEach(() => {
        req = {
            body: {
                idNumber: 123,
                number: 1234567
            }
        };
    });
    test("should create the number correctly", async () => {
        await createNumber(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            message: "Number created"
        });
    })
    test("sould give 400 because of missing parameter", async () => {
        req.body.number = null;
        await createNumber(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("should give 500 because of a error with number", async () => {
        req.body = null;
        await createNumber(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "Error creating number"
        });
    });
    test("the query should be correctly done", async () => {
        await createNumber(req, res);
        expect(pool.query).toHaveBeenNthCalledWith(1, 'INSERT INTO number (idnumber, number) VALUES (?, ?)', [
            123,
            1234567
        ])
    });
});

describe("logged", () => {
    beforeEach(() => {

    });
    test("should loget the user", async () => {
        await logged(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            message: "User logged"
        });
    });
});