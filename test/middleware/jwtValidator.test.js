import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { adminValidator, jwtValidator } from "../../middleware/jwtValidator";
import { generateToken } from "../../helpers/jwt";

let req, res, next;

beforeEach(() => {
  req = {
    header: jest.fn(),
  };
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  next = jest.fn();
});

describe("jwt middleware validator", () => {
  test("should call next if user is authenticated", async () => {
    const token = await generateToken(crypto.randomUUID(), "azulcolor", 3);
    req.header.mockReturnValue(token);

    jwtValidator(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("should return 401 if no token is provided", () => {
    req.header.mockReturnValue(null);
    jwtValidator(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "There's no token in the request",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if the token is invalid", () => {
    req.header.mockReturnValue(":)");
    jwtValidator(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Invalid Token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("Admin user validator", () => {
  test("should call next if user is admin", async () => {
    const token = await generateToken(crypto.randomUUID(), "azulcolor", 1);
    req.header.mockReturnValue(token);

    adminValidator(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("should return status 401 if there's no token in the request", () => {
    req.header.mockReturnValue(null);

    adminValidator(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "There's no token in the request",
    });
  });

  test("should return status 401 if user is not admin", async () => {
    const token = await generateToken(crypto.randomUUID(), "azulcolor", 2);
    req.header.mockReturnValue(token);

    adminValidator(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "You're not admin",
    });
  });

  test("should return status 401 if token is not valid", () => {
    req.header.mockReturnValue(':)');

    adminValidator(req, res, next);

    expect(next).not.toHaveBeenCalled;
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "Invalid token",
    });
  });
});
