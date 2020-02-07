import * as $ from 'jquery';
import { MatchEntry, AllianceColor } from "./match";
import { entryKey, getAllMatches, removeMatch, clearAllMatches } from "./local-storage";

function getHtmlForEntry(entry: MatchEntry): string {
    const key = entryKey(entry);
    return `<div class="section row entry" match="${key}">
    <div class="col-sm-1">
        <h4>${entry.matchCode}</h4>
        <alliance ${entry.alliance === AllianceColor.RED ? 'red' : 'blue'}></alliance>
    </div>
    <div class="col-sm">
        <h1>${entry.teamNumber}</h1>
    </div>
    <div class="col-sm-1">
        <score auto>${entry.getAutonomousScore()}</score>
    </div>
    <div class="col-sm-1">
        <score teleop>${entry.getTeleOpScore()}</score>
    </div>
    <div class="col-sm-1">
        <score endgame>${entry.getEndgameScore()}</score>
    </div>
    <div class="col-sm-1">
        <score total>${entry.getTotalScore()}</score>
    </div>
    <div class="col-sm-1 actions">
        <!-- <span class="icon-edit"></span> -->
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
        clearAllMatches().then(() => $('.entry').remove())
            .catch(alert);
    });
});