import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USER } from "$env/static/private";

const adapter = new PrismaMariaDb({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT) || 3306,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
});

const createPrismaClient = () =>
    new PrismaClient({
        log: import.meta.env.MODE === "development" ? ["error", "warn"] : ["error"],
        transactionOptions: {
            maxWait: import.meta.env.MODE === "development" ? 30_000 : 5000,
        },
        adapter,
    });

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (import.meta.env.MODE !== "production") globalForPrisma.prisma = db;
