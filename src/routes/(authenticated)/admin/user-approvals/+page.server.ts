import type { PageServerLoad } from "./$types";
import { db } from "$srv/db";

export const load: PageServerLoad = async () => {
    const [pendingUsers, rejectedUsers, roles] = await Promise.all([
        db.user.findMany({
            where: {
                approvalStatus: "pending",
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                createdAt: true,
                image: true,
                role: true,
                referralSource: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        }),
        db.user.findMany({
            where: {
                approvalStatus: "rejected",
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                createdAt: true,
                image: true,
                role: true,
                referralSource: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        db.role.findMany(),
    ]);

    return {
        pendingUsers,
        rejectedUsers,
        roles,
    };
};
