import { getLocalApi, getServerApi } from "../utils";
import type { sidelink } from "@prisma/client";
import type { User } from "../auth/client";


export type GameDisplayMode = "grid" | "list";

/**
 * @description Holds the global state of the application
 */
class GlobalState {


    private serverApi = getServerApi();
    private localApi = getLocalApi();

    /**
     * @description The current collapsed state of the sidebar
     * @type {boolean}
     * @default false
     * @memberof GlobalState
     */
    sidebarCollapsed: boolean = $state<boolean>(false);

    /**
     * @description The current display mode of the games
     * @type {GameDisplayMode}
     * @default "grid"
     * @memberof GlobalState
     */
    gamesDisplayMode: GameDisplayMode = $state<GameDisplayMode>("grid");

    /**
     * @description The current search query for the games
     * @type {string}
     * @default ""
     * @memberof GlobalState
     */
    gamesSearchQuery: string = $state<string>("");

    /**
     * @description The current sort order of the games (title)
     * @type {string}
     * @default "asc"
     * @memberof GlobalState
     */
    gamesSortOrder: string = $state<string>("asc");

    /**
     * @description The current background image of the application
     * @type {string}
     * @default ""
     * @memberof GlobalState
     * @example "https://example.com/image.jpg"
     */
    mainBackgroundImage: string | undefined = $state<string | undefined>();

    /**
     * @description The current path of the application
     * @type {string}
     * @default ""
     * @memberof GlobalState
     */
    currentPath: string = $state<string>("");

    trpcClient = $state();

    /**
     * @description The current user ID
     * @type {string}
     * @default ""
     * @memberof GlobalState
     */
    currentUser: User | undefined = $state<User | undefined>();

    /**
     * @description The current side links
     * @type {any[]}
     * @default []
     * @memberof GlobalState
     */
    sideLinks: sidelink[] = $state<sidelink[]>([]);

    refreshSideLinks = async () => {
        try {
            const response = await fetch("/api/sidelinks");
            if (!response.ok) {
                console.warn(`Error fetching sidelinks: ${response.statusText}`);
                return false;
            }
            const data = await response.json();

            // Check if the response is an array
            if (Array.isArray(data)) {
                this.sideLinks = data;
                return true;
            } else {
                console.warn('Unexpected response format from sidelinks API:', data);
                return false;
            }
        } catch (err) {
            console.error("Failed to fetch sidelinks:", err);
            return false;
        }
    }

    localGamesFolder: string | undefined = $state<string | undefined>();
}

export const global = new GlobalState();