import { MatchEntry } from "./match";

export function formatEntryKey(matchCode: string, teamNumber: number) {
    return `${matchCode}:${teamNumber}`;
}

export function entryKey(entry: MatchEntry): string {
    return formatEntryKey(entry.matchCode, entry.teamNumber);
}

export function storeMatch(entry: MatchEntry): Promise<null> {
    return new Promise((resolve, _) => {
        let object = {};
        object[entryKey(entry)] = entry;
        chrome.storage.local.set(object, resolve);
    });
}

export function getMatch(code: string, teamNumber: number): Promise<MatchEntry> {
    return new Promise((resolve, reject) => {
        const key = formatEntryKey(code, teamNumber);
        chrome.storage.local.get([key], items => {
            if (key in items) {
                resolve(injectFunctionsToMatchEntry(items[key]));
            } else {
                reject('no such match');
            }
        });
    });
}

export function getAllMatches(): Promise<MatchEntry[]> {
    return new Promise((resolve, _) => {
        chrome.storage.local.get(null, (items: object) => {
            resolve(Object.keys(items).map(key => injectFunctionsToMatchEntry(items[key])));
        });
    });
}

export function removeMatch(key: string): Promise<null> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, () => {
            if (chrome.runtime.lastError !== undefined) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(null);
            }
        })
    })
}

function injectFunctionsToMatchEntry(data: object): MatchEntry {
    let entry = Object.create(MatchEntry.prototype);
    Object.assign(entry, data);
    return entry;
}