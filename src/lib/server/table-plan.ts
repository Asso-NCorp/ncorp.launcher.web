import { db } from "$srv/db";
import type { edition, edition_room, table, table_seat } from "@prisma/client";

const GRID_SIZE = 50; // pixels per grid unit

export type TableWithSeats = table & { seats: table_seat[] };
export type RoomWithTables = edition_room & { tables: TableWithSeats[] };
export type EditionWithRooms = edition & { rooms: RoomWithTables[] };

// ====== EDITION OPERATIONS ======

export async function getEditions() {
    return db.edition.findMany({
        include: {
            rooms: {
                include: {
                    tables: {
                        include: { seats: true },
                    },
                },
            },
        },
        orderBy: { startDate: "desc" },
    });
}

export async function getEdition(id: string): Promise<EditionWithRooms | null> {
    return db.edition.findUnique({
        where: { id },
        include: {
            rooms: {
                include: {
                    tables: {
                        include: { seats: true },
                    },
                },
            },
        },
    });
}

export async function createEdition(data: Omit<edition, "id" | "createdAt" | "updatedAt">): Promise<edition> {
    return db.edition.create({
        data,
    });
}

export async function updateEdition(
    id: string,
    data: Partial<Omit<edition, "id" | "createdAt" | "updatedAt" | "createdBy">>,
): Promise<edition> {
    // Filter out undefined values to avoid Prisma validation errors
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined));

    return db.edition.update({
        where: { id },
        data: cleanData,
    });
}

export async function deleteEdition(id: string): Promise<edition> {
    return db.edition.delete({
        where: { id },
    });
}

// ====== ROOM OPERATIONS ======

export async function getRoom(id: string): Promise<RoomWithTables | null> {
    return db.edition_room.findUnique({
        where: { id },
        include: {
            tables: {
                include: { seats: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });
}

export async function createRoom(editionId: string, name: string): Promise<edition_room> {
    return db.edition_room.create({
        data: {
            editionId,
            name,
        },
    });
}

export async function updateRoom(id: string, name: string): Promise<edition_room> {
    return db.edition_room.update({
        where: { id },
        data: { name },
    });
}

export async function deleteRoom(id: string): Promise<edition_room> {
    return db.edition_room.delete({
        where: { id },
    });
}

// ====== TABLE OPERATIONS ======

export async function getTable(id: string): Promise<TableWithSeats | null> {
    return db.table.findUnique({
        where: { id },
        include: {
            seats: {
                orderBy: { seatIndex: "asc" },
            },
        },
    });
}

function checkCollision(
    positionX: number,
    positionY: number,
    width: number,
    height: number,
    existingTables: TableWithSeats[],
): boolean {
    for (const table of existingTables) {
        const aLeft = positionX;
        const aRight = positionX + width;
        const aTop = positionY;
        const aBottom = positionY + height;

        const bLeft = table.positionX;
        const bRight = table.positionX + table.width;
        const bTop = table.positionY;
        const bBottom = table.positionY + table.height;

        // If boxes intersect, return true (collision detected)
        if (aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop) {
            return true;
        }
    }
    return false;
}

function findAvailablePosition(
    existingTables: TableWithSeats[],
    width: number,
    height: number,
    maxAttempts: number = 100,
): { x: number; y: number } {
    let attempts = 0;
    const maxCoord = 30; // Search up to 30x30 grid

    // Try sequential positions first
    for (let y = 0; y < maxCoord && attempts < maxAttempts; y++) {
        for (let x = 0; x < maxCoord && attempts < maxAttempts; x++) {
            if (!checkCollision(x, y, width, height, existingTables)) {
                return { x, y };
            }
            attempts++;
        }
    }

    // Fallback: return a position far to the right
    return { x: maxCoord, y: 0 };
}

export async function createTable(
    roomId: string,
    name: string,
    positionX?: number,
    positionY?: number,
    width: number = 2,
    height: number = 1,
    capacity: number = 8,
): Promise<TableWithSeats> {
    // If position not provided or collision would occur, find available position
    let finalX = positionX ?? 0;
    let finalY = positionY ?? 0;

    if (positionX === undefined || positionY === undefined) {
        // Fetch existing tables in the room
        const existingTables = await db.table.findMany({
            where: { roomId },
            include: { seats: true },
        });

        const availablePos = findAvailablePosition(existingTables, width, height);
        finalX = availablePos.x;
        finalY = availablePos.y;
    }

    return db.table.create({
        data: {
            roomId,
            name,
            positionX: finalX,
            positionY: finalY,
            width,
            height,
            capacity,
            seats: {
                create: Array.from({ length: capacity }, (_, i) => ({
                    seatIndex: i,
                })),
            },
        },
        include: {
            seats: true,
        },
    });
}

export async function updateTable(
    id: string,
    data: {
        name?: string;
        positionX?: number;
        positionY?: number;
        width?: number;
        height?: number;
        capacity?: number;
    },
): Promise<TableWithSeats> {
    return db.table.update({
        where: { id },
        data,
        include: {
            seats: true,
        },
    });
}

export async function deleteTable(id: string): Promise<table> {
    return db.table.delete({
        where: { id },
    });
}

// ====== TABLE POSITION OPERATIONS ======

export async function updateTablePosition(id: string, positionX: number, positionY: number): Promise<TableWithSeats> {
    return updateTable(id, { positionX, positionY });
}

// ====== SEAT OPERATIONS ======

export async function assignSeat(seatId: string, userId: string | null): Promise<table_seat> {
    return db.table_seat.update({
        where: { id: seatId },
        data: { userId },
    });
}

export async function getTableSeats(tableId: string) {
    return db.table_seat.findMany({
        where: { tableId },
        orderBy: { seatIndex: "asc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    displayUsername: true,
                    image: true,
                },
            },
        },
    });
}

// ====== BULK OPERATIONS ======

export async function updateTablesPositionBulk(updates: Array<{ id: string; positionX: number; positionY: number }>) {
    return Promise.all(updates.map(({ id, positionX, positionY }) => updateTablePosition(id, positionX, positionY)));
}
