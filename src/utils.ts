import { MatchEntry } from "./match";

export function searchParams(): URLSearchParams {
    const url = new URL(window.location.href);
    return url.searchParams;
}

export function collateMatchesByTeam(entries: MatchEntry[]): {[team: number]: MatchEntry[]} {
    const output = {};
    for (let entry of entries) {
        if (entry.teamNumber in output) {
            output[entry.teamNumber].push(entry);
        } else {
            output[entry.teamNumber] = [entry];
        }
    }
    return output;
}