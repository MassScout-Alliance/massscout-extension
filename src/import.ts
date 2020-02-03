import { injectFunctionsToMatchEntry, storeMatch, storeMatches } from "./local-storage";
import { MatchEntry } from "./match";
import * as $ from 'jquery';

interface ImportStrategy {
    displayName: string;
    readToMatchEntries(contents: string): MatchEntry[];
}

const kImportStrategies: {[name: string]: ImportStrategy} = {
    "original": {
        displayName: "Original",
        readToMatchEntries(contents) {
            return JSON.parse(contents).map(injectFunctionsToMatchEntry);
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

$(() => {
    $('#import-form').on('submit', event => {
        event.preventDefault();
        const filepicker = document.querySelector('#import-form input[type="file"]')!;
        const file = (filepicker as HTMLInputElement).files![0];        
        const strategyName = $('#import-form select').val() as string;
        
        if (file === undefined) {
            alert('Please select a file to import');
            return;
        }
        if (strategyName == undefined) {
            alert("Please select an import strategy (format)");
            return;
        }

        const strategy = kImportStrategies[strategyName];
        readFile(file).then(contents => storeMatches(strategy.readToMatchEntries(contents)))
            .then(_ => $('#import-form input[type="submit"]').attr("value", "Submitted")); // update UI as needed
    });
});