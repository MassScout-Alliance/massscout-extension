import { getAllMatches } from "./local-storage"
import { MatchEntry } from "./match"
import * as $ from 'jquery';

interface ExportStrategy {
    displayName: string,
    contentType: string,
    fileName: string,
    exportToString(entries: MatchEntry[]): string
};

const kExportStrategies: {[id: string]: ExportStrategy} = {
    'original': {
        displayName: 'Original',
        contentType: 'application/json',
        fileName: 'export.json',
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

function download(contents: string, filename: string, contentType: string) {
    const blob = new Blob([contents], {type: contentType});
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('link') as HTMLLinkElement;

    link.href = url;
    link['download'] = filename;
    link.click();
}

$(() => {
    const strategy = getSelectedStrategy();
    if (strategy !== undefined) {
        getAllMatches().then(matches => {
            const output = strategy.exportToString(matches);
            download(output, strategy.fileName, strategy.contentType);
            $('h1').text(`Exported as ${strategy.fileName}`);
        });
    } else {
        console.warn('no strategy selected');
    }
});