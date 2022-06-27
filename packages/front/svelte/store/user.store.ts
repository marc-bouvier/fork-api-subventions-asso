import { writable } from 'svelte/store';

export interface UserDto {
    token: string,
    roles: string[],
}

export const user = writable({
    token: "",
    roles: []
} as UserDto);