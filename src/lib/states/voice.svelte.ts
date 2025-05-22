import type { RoomUser } from "../voice/types"

class Voice {

    roomUsers = $state<RoomUser[]>([])
    audioEnabled = $state<boolean>(true)
    currentRoomId = $state<string | null>(null)
    constructor() {

    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled
    }
}

export const voice = new Voice()