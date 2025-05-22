import { writable } from "svelte/store";

// Un store pour stocker les mots associés à chaque ID unique
export const gameStatuses = writable<{ [id: string]: string }>({});
