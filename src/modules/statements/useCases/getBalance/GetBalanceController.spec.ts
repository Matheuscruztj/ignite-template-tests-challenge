import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuid } from "uuid";
import { app } from "../../../../app";

import createConnection from "../../../../database";

let connection: Connection;

const user = {
    name: "test",
    email: "test@example.com",
    password: "admin",
};

describe("Get User Balance Controller", () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();

        await request(app).post("/api/v1/users").send(user);
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });

    it("should be able to get user balance", async () => {
        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        const balance = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(200);
        expect(balance.body).toHaveProperty("statement");
        expect(balance.body).toHaveProperty("balance");
    });

    it("should not to be able to get user balance", async () => {
        const balance = await request(app).get("/api/v1/statements/balance").set({
            Authorization: "Bearer 1"
        });

        expect(balance.status).toBe(401);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("JWT invalid token!");
    });
});