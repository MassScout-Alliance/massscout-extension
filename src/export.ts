import { getAllMatches } from "./local-storage"
import { MatchEntry } from "./match"
import * as $ from 'jquery';

interface ExportStrategy {
    displayName: string,
    contentType: string,
    extension: string,
    exportToString(entries: MatchEntry[]): string
};

const kExportStrategies: {[id: string]: ExportStrategy} = {
    'original': {
        displayName: 'Original',
        contentType: 'application/json',
        extension: 'json',
        exportToString: function(entries) {
            return JSON.stringify(entries);
        }
    }
};

function getSelectedStrategy(): ExportStrategy|undefined {
    const url = new URL(window.location.href);
    const parameter = url.searchParams.get('type');

    if (parameter == null) return undefined;

    return kExportStrategies[parameter];
}

function getFileNameInput(): string|undefined {
    const url = new URL(window.location.href);
    const parameter = url.searchParams.get('filename');

    if (parameter == null) return undefined;

    return parameter.toString();
}

function download(contents: string, filename: string, contentType: string) {
    const blob = new Blob([contents], {type: contentType});
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('link') as HTMLLinkElement;

    link.href = url;
    link['download'] = filename;
    link.click();
}

function sanitize(fileNameInput: string, strategy: ExportStrategy): string {
    const extension = `.${strategy.extension}`;
    while (fileNameInput.toLowerCase().endsWith(extension)) {
        fileNameInput = fileNameInput.slice(0, fileNameInput.length - extension.length);
    }
    return fileNameInput;
}


$(() => {
    const strategy = getSelectedStrategy();
    if (strategy !== undefined) {
        getAllMatches().then(matches => {
            const output = strategy.exportToString(matches);
            const fileNameInput = getFileNameInput();
            if (fileNameInput === undefined || fileNameInput.trim() == '') {
                $('h1').text('Filename missing');
                alert('Please provide a filename');
                return;
            }

            const fileName = `${sanitize(fileNameInput.toString(), strategy)}.${strategy.extension}`;
            download(output, fileName, strategy.contentType);
            $('h1').text(`Exported as ${fileName}`);
        });
    } else {
        console.warn('no strategy selected');
    }
});