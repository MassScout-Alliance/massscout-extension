import { parseEntry, storeMatches } from "./local-storage";
import { MatchEntry } from "./match";

interface ImportStrategy<T> {
    displayName: string;
    readFile: (file: File) => Promise<T>;
    readToMatchEntries(contents: T): MatchEntry[];
}

// No Excel importing for Freight Frenzy

export function extractMatchPairings(sheet: object[]): object[] {
    let matchCount = 0;
    while (sheet.length > matchCount && 'Match #' in sheet[matchCount]) {
        ++matchCount;
    }
    return sheet.slice(0, matchCount);
}

export const kImportStrategies: { [name: string]: ImportStrategy<any> } = {
    "original": {
        displayName: "Original",
        readFile: readFile,
        readToMatchEntries(contents) {
            return JSON.parse(contents).map(parseEntry);
        }
    }
};

function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = event => {
            if (event.target !== null) {
                resolve(event.target.result as string);
            } else {
                reject();
            }
        }
    });
}

export function importFile(file: File, strategyName: string): Promise<null> {
    return readFile(file)
        .then(contents => storeMatches(kImportStrategies[strategyName].readToMatchEntries(contents)));
}
