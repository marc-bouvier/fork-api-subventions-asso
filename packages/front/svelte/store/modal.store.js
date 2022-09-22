import { writable } from "svelte/store";

export const modal = writable(false);
export const data = writable({});
export const action = writable(() => null);