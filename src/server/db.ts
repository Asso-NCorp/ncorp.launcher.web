import { PrismaClient } from "$src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, MYSQL_PORT } from "$env/static/private";

const createPrismaClient = () => {
    const adapter = new PrismaMariaDb({
        host: MYSQL_HOST,
        port: parseInt(MYSQL_PORT),
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
        connectionLimit: 10,
    });

    return new PrismaClient({
        adapter,
        log: import.meta.env.MODE === "development" ? ["error", "warn"] : ["error"],
        transactionOptions: {
            maxWait: import.meta.env.MODE === "development" ? 30_000 : 5000,
        },
    });
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (import.meta.env.MODE !== "production") globalForPrisma.prisma = db;
