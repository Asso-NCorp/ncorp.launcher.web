import type { PageServerLoad } from "./$types";
import { db } from "$srv/db";

export const load: PageServerLoad = async () => {
    const [pendingUsers, rejectedUsers, roles, allUsers] = await Promise.all([
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
                rejectedBy: true,
                rejectedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        db.role.findMany(),
        db.user.findMany({
            select: {
                id: true,
                name: true,
                username: true,
            },
        }),
    ]);

    // Create a map for quick lookup of user names by ID
    const userNameMap = new Map(allUsers.map((u) => [u.id, u.name || u.username || "Unknown"]));

    // Enrich rejected users with rejector name
    const rejectedUsersWithNames = rejectedUsers.map((user) => ({
        ...user,
        rejectedByName: user.rejectedBy ? userNameMap.get(user.rejectedBy) : undefined,
    }));

    return {
        pendingUsers,
        rejectedUsers: rejectedUsersWithNames,
        roles,
    };
};
