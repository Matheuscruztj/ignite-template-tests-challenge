import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "@modules/users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "@modules/users/useCases/createUser/CreateUserUseCase";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createUserUseCase: CreateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw',
}

describe("Get a statement", () => {
    beforeAll(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository();
        inMemoryStatementsRepository = new InMemoryStatementsRepository();

        authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
        createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
        getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
    });

    it("should be able to get a statement", async () => {
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

        const getStatement = await getStatementOperationUseCase.execute({
            user_id: login.user.id as string,
            statement_id: statement.id as string
        });

        expect(getStatement).toHaveProperty("id");
    });

    it("should not be able to get a statement with an invalid user", async () => {
        expect(async () => {
            const statement = await createStatementUseCase.execute({
                user_id: "123",
                type: OperationType.DEPOSIT,
                amount: 10,
                description: "Description Test"
            });
        }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
    });

    it("should not be able to get a statement with an invalid statement", async () => {
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
    
            const getStatement = await getStatementOperationUseCase.execute({
                user_id: login.user.id as string,
                statement_id: "123"
            });
        }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
    });
})