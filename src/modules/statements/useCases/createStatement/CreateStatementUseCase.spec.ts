import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let authenticateUserUseCase: AuthenticateUserUseCase;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
}

describe("Create a statement", () => {
    beforeAll(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        inMemoryStatementsRepository = new InMemoryStatementsRepository();

        authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
        createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
    });

    it("should create a statement", async () => {
        const user = {
            name: "test",
            email: "test@example.com",
            password: "admin",
        };

        await createUserUseCase.execute(user);

        const login = await authenticateUserUseCase.execute({
            email: user.email,
            password: user.password
        });

        const statement = await createStatementUseCase.execute({
            user_id: login.user.id as string,
            type: OperationType.DEPOSIT,
            amount: 10,
            description: "Description Test"
        });

        expect(statement).toHaveProperty("id");
    });

    it("should not able to create a statement with insufficient funds", async () => {
        expect(async () => {
            const user = {
                name: "test",
                email: "test@example.com",
                password: "admin",
            };
    
            await createUserUseCase.execute(user);
    
            const login = await authenticateUserUseCase.execute({
                email: user.email,
                password: user.password
            });
    
            await createStatementUseCase.execute({
                user_id: login.user.id as string,
                type: OperationType.WITHDRAW,
                amount: 10,
                description: "Description Test"
            });
        }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
    });

    it("should not able to create a statement with a invalid user", async () => {
        expect(async () => {
            const user = {
                name: "test",
                email: "test@example.com",
                password: "admin",
            };
    
            await createUserUseCase.execute(user);
    
            const login = await authenticateUserUseCase.execute({
                email: user.email,
                password: user.password
            });
    
            await createStatementUseCase.execute({
                user_id: "123",
                type: OperationType.WITHDRAW,
                amount: 10,
                description: "Description Test"
            });
        }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
    });
})