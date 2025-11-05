import type { edition, edition_room, table, table_seat } from "@prisma/client";

export type TableWithSeats = table & { seats: table_seat[] };
export type RoomWithTables = edition_room & { tables: TableWithSeats[] };
export type EditionWithRooms = edition & { rooms: RoomWithTables[] };

/**
 * @description Holds the table plan management state
 */
class TablePlanState {
    /**
     * @description The current selected edition
     * @type {EditionWithRooms | null}
     * @default null
     */
    currentEdition: EditionWithRooms | null = $state(null);

    /**
     * @description The current selected room
     * @type {RoomWithTables | null}
     * @default null
     */
    currentRoom: RoomWithTables | null = $state(null);

    /**
     * @description The currently selected table ID
     * @type {string | null}
     * @default null
     */
    selectedTableId: string | null = $state(null);

    /**
     * @description Whether a table is currently being dragged
     * @type {boolean}
     * @default false
     */
    isDragging: boolean = $state(false);

    /**
     * @description Grid size in pixels per grid unit
     * @type {number}
     * @default 50
     */
    gridSize: number = $state(50);

    /**
     * Set the current edition and auto-select first room
     */
    setCurrentEdition(edition: EditionWithRooms | null) {
        this.currentEdition = edition;
        this.currentRoom = edition?.rooms?.[0] || null;
        this.selectedTableId = null;
    }

    /**
     * Update the current edition while preserving the current room selection
     */
    setCurrentEditionPreservingRoom(edition: EditionWithRooms | null) {
        this.currentEdition = edition;
        // If current room is still in the edition, update it with fresh data
        if (this.currentRoom && edition) {
            const updatedRoom = edition.rooms.find((r) => r.id === this.currentRoom!.id);
            if (updatedRoom) {
                this.currentRoom = updatedRoom;
            }
        }
    }

    /**
     * Set the current room
     */
    setCurrentRoom(room: RoomWithTables | null) {
        this.currentRoom = room;
        this.selectedTableId = null;
    }

    /**
     * Set the selected table ID
     */
    setSelectedTable(tableId: string | null) {
        this.selectedTableId = tableId;
    }

    /**
     * Set the dragging state
     */
    setDragging(isDragging: boolean) {
        this.isDragging = isDragging;
    }

    /**
     * Add a new table to the current room
     */
    addTableToCurrentRoom(newTable: TableWithSeats) {
        if (this.currentRoom) {
            this.currentRoom.tables = [...this.currentRoom.tables, newTable];
            // Also update in currentEdition.rooms
            if (this.currentEdition) {
                this.currentEdition.rooms = this.currentEdition.rooms.map((r) =>
                    r.id === this.currentRoom!.id ? this.currentRoom! : r,
                );
            }
        }
    }

    /**
     * Remove a table from the current room by ID
     */
    removeTableFromCurrentRoom(tableId: string) {
        if (this.currentRoom) {
            this.currentRoom.tables = this.currentRoom.tables.filter((t) => t.id !== tableId);
            // Also update in currentEdition.rooms
            if (this.currentEdition) {
                this.currentEdition.rooms = this.currentEdition.rooms.map((r) =>
                    r.id === this.currentRoom!.id ? this.currentRoom! : r,
                );
            }
        }
    }

    /**
     * Update a table in the current room
     */
    updateTableInCurrentRoom(updatedTable: TableWithSeats) {
        if (this.currentRoom) {
            this.currentRoom.tables = this.currentRoom.tables.map((t) => (t.id === updatedTable.id ? updatedTable : t));
            // Also update in currentEdition.rooms
            if (this.currentEdition) {
                this.currentEdition.rooms = this.currentEdition.rooms.map((r) =>
                    r.id === this.currentRoom!.id ? this.currentRoom! : r,
                );
            }
        }
    }
}

export const tablePlanState = new TablePlanState();
