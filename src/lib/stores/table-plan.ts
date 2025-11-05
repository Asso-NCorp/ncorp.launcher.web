import { writable } from "svelte/store";
import type { edition, edition_room, table, table_seat } from "@prisma/client";

export type TableWithSeats = table & { seats: table_seat[] };
export type RoomWithTables = edition_room & { tables: TableWithSeats[] };
export type EditionWithRooms = edition & { rooms: RoomWithTables[] };

export type TablePlanState = {
    currentEdition: EditionWithRooms | null;
    currentRoom: RoomWithTables | null;
    selectedTableId: string | null;
    isDragging: boolean;
    gridSize: number; // pixels per grid unit
};

export const tablePlanState = writable<TablePlanState>({
    currentEdition: null,
    currentRoom: null,
    selectedTableId: null,
    isDragging: false,
    gridSize: 50,
});

// UI state for dialogs/modals
export type UIState = {
    showEditEditionDialog: boolean;
    showAddRoomDialog: boolean;
    showDeleteConfirm: boolean;
    deleteConfirmTarget: "table" | "room" | "edition" | null;
};

export const uiState = writable<UIState>({
    showEditEditionDialog: false,
    showAddRoomDialog: false,
    showDeleteConfirm: false,
    deleteConfirmTarget: null,
});

// Helper functions
export function setCurrentEdition(edition: EditionWithRooms | null) {
    tablePlanState.update((state) => ({
        ...state,
        currentEdition: edition,
        currentRoom: edition?.rooms?.[0] || null,
    }));
}

export function setCurrentRoom(room: RoomWithTables | null) {
    tablePlanState.update((state) => ({
        ...state,
        currentRoom: room,
        selectedTableId: null,
    }));
}

export function setSelectedTable(tableId: string | null) {
    tablePlanState.update((state) => ({
        ...state,
        selectedTableId: tableId,
    }));
}

export function setDragging(isDragging: boolean) {
    tablePlanState.update((state) => ({
        ...state,
        isDragging,
    }));
}

export function addTableToCurrentRoom(newTable: TableWithSeats) {
    tablePlanState.update((state) => {
        if (!state.currentRoom) return state;

        return {
            ...state,
            currentRoom: {
                ...state.currentRoom,
                tables: [...state.currentRoom.tables, newTable],
            },
        };
    });
}
