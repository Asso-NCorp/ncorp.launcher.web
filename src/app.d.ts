// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from "better-auth";
import type { User } from "./lib/auth/client";
import type { LiveUser } from "./lib/shared-models";
import type { event, global_settings, role } from "@prisma/client";
import type { InstallableGameExtended } from "./lib/types";

// for information about these interfaces
declare global {
    namespace App {
        interface Locals {
            session: Session | undefined;
            user: User | undefined;
            liveUsers: LiveUser[];
            localGamesDir: string | undefined;
            events: event[];
            roles: role[];
            availableGames: InstallableGameExtended[];
            globalSettings: global_settings[];
            winnersGifsFiles: string[];
            token: string | undefined;
        }
    }
}

export {};
