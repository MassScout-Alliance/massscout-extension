import * as $ from 'jquery';
import { MatchEntry, AllianceColor } from "./match";
import { entryKey, getAllMatches, removeMatch, clearAllMatches, storeMatches } from "./local-storage";
import { kImportStrategies } from './import';

function getHtmlForEntry(entry: MatchEntry): string {
    const key = entryKey(entry);
    return `<div class="section row entry" match="${key}">
    <div class="col-sm-3 col-md-1">
        <h4>${entry.matchCode}</h4>
        <alliance ${entry.alliance === AllianceColor.RED ? 'red' : 'blue'}></alliance>
    </div>
    <div class="col-sm-9 col-md">
        <h1>${entry.teamNumber}</h1>
    </div>
    <div class="col-sm col-md-0"></div>
    <div class="col-sm-2 col-md-1">
        <score auto>${entry.getAutonomousScore()}</score>
    </div>
    <div class="col-sm-2 col-md-1">
        <score teleop>${entry.getTeleOpScore()}</score>
    </div>
    <div class="col-sm-2 col-md-1">
        <score endgame>${entry.getEndgameScore()}</score>
    </div>
    <div class="col-sm-3 col-md-1">
        <score total>${entry.getTotalScore()}</score>
    </div>
    <div class="col-sm col-md-1 actions">
        <span class="icon-info" match="${key}"></span>
        <span class="icon-delete" match="${key}"></span>
    </div>
</div>`;
}

const kEntryContainer = $('#entries');
type EntryCompareFn = (a: MatchEntry, b: MatchEntry) => number;

function repopulate(sortFn: EntryCompareFn | null) {
    getAllMatches().then(entries => {
        if (sortFn != null) {
            entries = entries.sort(sortFn);
        }
        kEntryContainer.html(entries.map(getHtmlForEntry).join('\n'));       
    }).catch(alert).then(() => $(attachClickHandlers));
}

function attachClickHandlers() {
    $('.icon-delete').on('click', function() {
        const key = this.getAttribute('match')!;
        removeMatch(key);
        $(`.entry[match="${key}"]`).remove();
    });
    $('.icon-info').on('click', function() {
        chrome.windows.create({
            type: 'popup',
            url: `performance.html?match=${this.getAttribute('match')!}`,
            focused: true
        });
    });
}

function applySelectedSortMethod() {
    const kSortMethods: {[key: string]: EntryCompareFn | null} = {
        'natural': null,
        'score': (a, b) => {
            return b.getTotalScore() - a.getTotalScore();
        },
        'team': (a, b) => {
            return a.teamNumber - b.teamNumber;
        }
    };
    const sorter = kSortMethods[(document.getElementById('sort') as HTMLSelectElement).value];
    repopulate(sorter);
}

$(() => {
    $('#sort').on('change', applySelectedSortMethod);
    repopulate(null);
    $('#remove-all').on('click', () => {
        clearAllMatches().then(() => {
            $('.entry').remove();
            $('#modal-control').click();
        }).catch(alert);
    });

    for (let strategy in kImportStrategies) {
        $('#import-strategies').append(`<option value="${strategy}">${kImportStrategies[strategy].displayName}</option>`);
    }

    $('#import-file').on('change', function() {
        const filepicker = this;
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
        strategy.readFile(file).then(contents => storeMatches(strategy.readToMatchEntries(contents)))
            .then(_ => {
                applySelectedSortMethod();
                $('#import-display').text(`Successfully imported from ${file.name} using ${strategy.displayName}`);
            })
            .catch(reason => alert(`Failed: ${reason}`));
    });
});