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

describe("Create a statement", () => {
    beforeAll(async () => {
        connection = await createConnection();
        await connection.runMigrations();

        await request(app).post("/api/v1/users").send(user);
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
    });
    
    it("should create a statement", async () => {
        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        const balance = await request(app).post("/api/v1/statements/deposit").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(201);
        expect(balance.body).toHaveProperty("id");
        expect(balance.body).toHaveProperty("created_at");
        expect(balance.body).toHaveProperty("updated_at");
    });
	
	it("should create a withdraw statement", async () => {
        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        await request(app).post("/api/v1/statements/deposit").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        const balance = await request(app).post("/api/v1/statements/withdraw").send({
            amount: 12,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(201);
        expect(balance.body).toHaveProperty("id");
        expect(balance.body).toHaveProperty("created_at");
        expect(balance.body).toHaveProperty("updated_at");
    });

    it("should not able to create a statement with insufficient funds", async () => {
        const tokenUser = await request(app).post("/api/v1/sessions").send({
            email: user.email,
            password: user.password,
        }).set({
            Accept: "application/json",
            ContentType: "application/json",
        });

        const balance = await request(app).post("/api/v1/statements/withdraw").send({
            amount: 1000,
            description: "Test"
        }).set({
            Authorization: `Bearer ${tokenUser.body.token}`
        });

        expect(balance.status).toBe(400);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("Insufficient funds");
    });

    it("should not able to create a statement with a invalid user", async () => {
        const balance = await request(app).post("/api/v1/statements/withdraw").send({
            amount: 1000,
            description: "Test"
        }).set({
            Authorization: "Bearer 123"
        });

        expect(balance.status).toBe(401);
        expect(balance.body).toHaveProperty("message");
        expect(balance.body.message).toEqual("JWT invalid token!");
    });
})
