import $ from 'jquery';
import { MatchEntry, AllianceColor } from "./match";
import { entryKey, getAllMatches, removeMatch, clearAllMatches, storeMatches } from "./local-storage";
import { kImportStrategies } from './import';
import { stats } from './stats';

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
    <div class="col-sm-2 col-md-1">
        <score penalty>${entry.getTotalPenalty()}</score>
    </div>
    <div class="col-sm col-md-1 actions">
        <span class="icon-info" match="${key}"></span>
        <span class="icon-delete" match="${key}"></span>
    </div>
</div>`;
}

function getHtmlForSection(team: number, contents: MatchEntry[]): string {
    return `<input type="checkbox" id="collapse-${team}" aria-hidden="true">
    <label for="collapse-${team}" aria-hidden="true">${team} (<span id="${team}-counter">${contents.length}</span> entries)</label>
    <div id="section-${team}" class="team-section">
    ${contents.map(getHtmlForEntry).join('\n')}
    </div>`;
}

const kEntryContainer = $('#entries');
type EntryCompareFn = (a: MatchEntry, b: MatchEntry) => number;
type TeamCompareFn = (a: [number, MatchEntry[]], b: [number, MatchEntry[]]) => number;

function repopulate(sortFn: TeamCompareFn | null) {
    getAllMatches().then(entries => {
        const sections: {[team: number]: MatchEntry[]} = {};
        
        for (let entry of entries) {
            if (!(entry.teamNumber in sections)) sections[entry.teamNumber] = [];
            sections[entry.teamNumber].push(entry);
        }

        const sortedSections = Object.keys(sections);
        if (sortFn !== null)
            sortedSections.sort((t1, t2) =>
                sortFn([parseInt(t1), sections[t1]], [parseInt(t2), sections[t2]]));

        kEntryContainer.html(sortedSections
            .map(team => getHtmlForSection(parseInt(team), sections[team])).join('\n'));

    }).catch(e => {
        console.error(e);
        throw e;
    }).then(() => $(attachClickHandlers));
}

function attachClickHandlers() {
    $('.icon-delete').on('click', function() {
        const key = this.getAttribute('match')!;
        removeMatch(key);
        $(`.entry[match="${key}"]`).remove();
        // jank
        const team = key.split(':')[1];
        if ($('#section-' + team).children().length === 0) {
            // remove the section
            $('#section-' + team).remove();
            $('label[for="collapse-' + team + '"]').remove();
        }
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
    const kSortMethods: {[key: string]: TeamCompareFn | null} = {
        'natural': null,
        'score': ([_, e1], [__, e2]) => {
            return stats.average(e2.map(entry => entry.getTotalScore())) -
                stats.average(e1.map(entry => entry.getTotalScore()));
        },
        'team': ([t1, _], [t2, __]) => {
            return t1 - t2;
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
            $('#entries').html('');
            $('#modal-control').trigger('click');
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