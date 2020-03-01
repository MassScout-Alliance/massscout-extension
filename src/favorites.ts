import { getOptionsItem, setOptionsItem } from "./local-storage";

const favoriteKey = 'favorites';

export async function addFavoriteTeam(team: number): Promise<void> {
    return await modifyFavorites(teams => {
        if (teams.indexOf(team) === -1) {
            teams.push(team);
        }
        return teams;
    });
}

export async function removeFavoriteTeam(team: number): Promise<void> {
    return await modifyFavorites(teams => {
        const index = teams.indexOf(team);
        if (index !== -1) {
            teams.splice(index, 1);
        }
        return teams;
    });
}

export async function getFavoriteTeams(): Promise<number[]> {
    try {
        return await getOptionsItem(favoriteKey) as number[];
    } catch {
        await setOptionsItem(favoriteKey, []);
        return [];
    }
}

export async function isFavoriteTeam(team: number): Promise<boolean> {
    return (await getFavoriteTeams()).indexOf(team) !== -1;
}

async function modifyFavorites(transform: (teams: number[]) => number[]|null) {
    let favorites: number[] = [];
    try {
        favorites = await getFavoriteTeams();
    } catch {
        // favorites doesn't exist
    }

    const newFavorites = transform(favorites);

    if (newFavorites !== null) {
        await setOptionsItem(favoriteKey, newFavorites);
    }
}