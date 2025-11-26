import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const createPrismaClient = () =>
    new PrismaClient({
        log: import.meta.env.MODE === "development" ? ["error", "warn"] : ["error"],
        transactionOptions: {
            maxWait: import.meta.env.MODE === "development" ? 30_000 : 5000,
        },
    });

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (import.meta.env.MODE !== "production") globalForPrisma.prisma = db;
