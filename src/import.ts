import { parseEntry, storeMatches } from "./local-storage";
import { MatchEntry, AllianceColor, StoneType, ScoringResult, DisconnectStatus } from "./match";
import * as xlsx from 'xlsx';

interface ImportStrategy<T> {
    displayName: string;
    readFile: (file: File) => Promise<T>;
    readToMatchEntries(contents: T): MatchEntry[];
}

export function convertExcelFormat(excelPairings: object, team: number): MatchEntry {
    const deliveredStones: StoneType[] = [];
    // assuming all skystones first
    for (let i = 0; i < excelPairings['# of sky delivered']; i++) {
        deliveredStones.push(StoneType.SKYSTONE);
    }
    for (let i = 0; i < excelPairings['# of Stones deliver']; i++) {
        deliveredStones.push(StoneType.STONE);
    }
    function scoring(key: string): ScoringResult {
        const raw = excelPairings[key].toUpperCase();
        if (raw === 'Y') return ScoringResult.SCORED;
        if (raw === 'DNT') return ScoringResult.DID_NOT_TRY;
        return ScoringResult.FAILED;
    }

    const stonesPerLevel: number[] = new Array(10);
    for (let level = 1; level <= 10; level++) {
        stonesPerLevel[level - 1] = excelPairings[`L${level}`];
    }
    let maxLevel = 9;
    // negation means that 0, undefined, null, '' all go to true
    while (!stonesPerLevel[maxLevel] && maxLevel >= 0) {
        maxLevel--;
    }

    return new MatchEntry(
        `Q${excelPairings['Match #']}`,
        team,
        excelPairings['Alliance'] === 'Blue' ? AllianceColor.BLUE : AllianceColor.RED,
        {
            cyclesAttempted: excelPairings['# of cyc. attempt'],
            deliveredStones: deliveredStones,
            stonesOnFoundation: excelPairings['# placed found'],
            parked: scoring('Auto Park'),
            movedFoundation: scoring('Auto Found')
        },
        {
            allianceStonesDelivered: excelPairings['Ally Cyc.'],
            neutralStonesDelivered: excelPairings['Center Cyc.'],
            stonesPerLevel: stonesPerLevel.slice(0, maxLevel + 1)
        },
        {
            movedFoundation: scoring('End Found'),
            parked: scoring('End Park'),
            // lossy!
            capstoneLevel: excelPairings['Capped'].toUpperCase() === 'Y' ? maxLevel : undefined
        },
        DisconnectStatus.NO_DISCONNECT);
}

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
    },
    "excel": {
        displayName: "Excel",
        readFile: function readFileAsByteArray(file: File): Promise<Uint8Array> {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = event => {
                    if (event.target !== null) {
                        resolve(new Uint8Array(event.target.result as ArrayBuffer));
                    } else {
                        reject();
                    }
                }
            });
        },
        readToMatchEntries(contents) {
            const output: MatchEntry[] = [];

            const spreadsheet = xlsx.read(contents, {type: 'array'});
            for (let team of spreadsheet.SheetNames.filter(it => it !== 'Averages')) {
                const sheet: object[] = xlsx.utils.sheet_to_json(spreadsheet.Sheets[team]);
                const entries = extractMatchPairings(sheet)
                    .map(pairing => convertExcelFormat(pairing, parseInt(team)));
                
                console.info(`Processed ${entries.length} entries of team ${team}`);
                output.push(...entries);
            }

            return output;
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
