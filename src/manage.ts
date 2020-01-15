import * as $ from 'jquery';
import { MatchEntry, AllianceColor } from "./match";
import { entryKey, getAllMatches, removeMatch } from "./local-storage";

function getHtmlForEntry(entry: MatchEntry): string {
    const key = entryKey(entry);
    return `<div class="section row entry" match="${key}">
    <div class="col-sm-3">
        <h4>${entry.matchCode}</h4>
        <alliance ${entry.alliance === AllianceColor.RED ? 'red' : 'blue'}></alliance>
    </div>
    <div class="col-sm-4">
        <h2>${entry.teamNumber}</h2>
    </div>
    <div class="col-sm-3">
        <score>${entry.getTotalScore()}</score>
    </div>
    <div class="col-sm-2 actions">
        <span class="icon-edit"></span>
        <span class="icon-delete" match="${key}"></span>
    </div>
</div>`;
}

const kEntryContainer = $('#entries');

function repopulate() {
    getAllMatches().then(entries => {
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

$(repopulate);