import { MatchEntry, DisconnectStatus } from "./match";
import clone from 'just-clone';

export function formatEntryKey(matchCode: string, teamNumber: number) {
    return `${matchCode}:${teamNumber}`;
}

export function entryKey(entry: MatchEntry): string {
    return formatEntryKey(entry.matchCode, entry.teamNumber);
}

export function storeMatch(entry: MatchEntry): Promise<null> {
    return storeMatches([entry]);
}

export function storeMatches(entries: MatchEntry[]): Promise<null> {
    return new Promise((resolve, _) => {
        const object = {};
        for (const entry of entries) {
            object[entryKey(entry)] = entry;
        }
        chrome.storage.local.set(object, () => resolve(null));
    });
}

export function getMatch(code: string, teamNumber: number): Promise<MatchEntry> {
    return getMatchByKey(formatEntryKey(code, teamNumber));
}

export function getMatchByKey(key: string): Promise<MatchEntry> {
    return new Promise((resolve, reject) => {
        if (nonMatchKeys.indexOf(key) !== -1) {
            reject(`'${key}' is not a match key`);
        }
        chrome.storage.local.get([key], items => {
            if (key in items) {
                resolve(parseEntry(items[key]));
            } else {
                reject('no such match');
            }
        });
    });
}

const nonMatchKeys = [
    'options'
];

export function getAllMatches(): Promise<MatchEntry[]> {
    return new Promise((resolve, _) => {
        chrome.storage.local.get(null, (items: object) => {
            resolve(Object.keys(items)
                .filter(key => nonMatchKeys.indexOf(key) === -1)
                .map(key => parseEntry(items[key])));
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

export function clearAllMatches(): Promise<null> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError !== undefined) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(null);
            }
        });
    });
}

function injectFunctionsToMatchEntry(data: object): MatchEntry {
    let entry = Object.create(MatchEntry.prototype);
    Object.assign(entry, data);
    return entry;
}

const kFieldDefaults = {
    disconnect: DisconnectStatus.NO_DISCONNECT
};

export function populateDefaults(data: object): object {
    for (let key in kFieldDefaults) {
        if (!(key in data)) {
            data[key] = kFieldDefaults[key];
        }
    }
    return data;
}

export function parseEntry(entry: object): MatchEntry {
    return injectFunctionsToMatchEntry(populateDefaults(entry));
}

export function getOptionsItem(key: string): Promise<object> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('options', result => {
            const rejectFn = () => reject(`missing options item '${key}'`);

            if (!('options' in result)) {
                chrome.storage.local.set({'options': {}}, rejectFn);
            } else if (key in result.options) {
                resolve(result.options[key]);
            } else {
                rejectFn();
            }
        });
    });
}

export function setOptionsItem(key: string, value: object): Promise<null> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('options', result => {
            const existingOptions = 'options' in result ? result.options : {};
            existingOptions[key] = value;
            chrome.storage.local.set({'options': existingOptions}, () => resolve(null));
        });
    });
}