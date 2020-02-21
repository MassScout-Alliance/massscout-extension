import * as $ from 'jquery';
import { StoneType, MatchEntry, AllianceColor, AutonomousPerformance, ScoringResult, TeleOpPerformance, DisconnectStatus } from './match';
import { storeMatch, getMatch, getMatchByKey } from './local-storage';
import { stats } from './stats';
import { searchParams } from './utils';

let currentAutoPerformance: AutonomousPerformance = {
    deliveredStones: [],
    cyclesAttempted: 0,
    stonesOnFoundation: 0,
    parked: ScoringResult.DID_NOT_TRY,
    movedFoundation: ScoringResult.DID_NOT_TRY
};
let currentTeleOpPerformance: TeleOpPerformance = {
    allianceStonesDelivered: 0,
    neutralStonesDelivered: 0,
    stonesPerLevel: []
};
let currentMatchEntry = new MatchEntry('Q1', 1, AllianceColor.BLUE, currentAutoPerformance, currentTeleOpPerformance, {
    movedFoundation: ScoringResult.DID_NOT_TRY,
    parked: ScoringResult.DID_NOT_TRY
}, DisconnectStatus.NO_DISCONNECT);

// valid condition: cyclesAttempted >= deliveredStones.length >= stonesOnFoundation

function setIdEnabled(id: string, enabled: boolean) {
    const elem = $(`#${id}`);
    if (enabled)
        elem.removeAttr('disabled');
    else
        elem.attr('disabled', 'true');
}

function updateAutoButtonEnabled() {    
    setIdEnabled('auto-button-attempt', currentAutoPerformance.cyclesAttempted < 6);
    const canDeliverMoreStones = currentAutoPerformance.deliveredStones.length < currentAutoPerformance.cyclesAttempted;
    const canDeliverMoreSkystones = canDeliverMoreStones && stats.count(currentAutoPerformance.deliveredStones, StoneType.SKYSTONE) < 2;
    setIdEnabled('auto-button-deliver-skystone', canDeliverMoreSkystones);
    setIdEnabled('auto-button-deliver-stone', canDeliverMoreStones);
    const canStackMoreStones = currentAutoPerformance.stonesOnFoundation < currentAutoPerformance.deliveredStones.length;
    setIdEnabled('auto-button-placed', canStackMoreStones);
    
    if (!canDeliverMoreStones && !canStackMoreStones && currentAutoPerformance.cyclesAttempted < 6) {
        $('#auto-button-attempt').addClass('primary');
    } else {
        $('#auto-button-attempt').removeClass('primary');
    }
}

function updateAutoDisplays() {
    function imageForStone(type: StoneType): JQuery<HTMLElement> {
        const url = type === StoneType.SKYSTONE ? 'assets/brick_outline_target_new.png' : 'assets/brick_normal_small.png';
        return $(`<div class="row"><img src="${url}"><span class="icon-delete auto-stone-return input"></span></div>`);
    }

    $('#auto-display-attempt').text(currentAutoPerformance.cyclesAttempted);

    const stonesParent = $('#auto-display-delivered');
    stonesParent.html('');
    for (let stone of currentAutoPerformance.deliveredStones) {
        imageForStone(stone).appendTo(stonesParent);
    }

    $('#auto-display-placed').text(currentAutoPerformance.stonesOnFoundation);
    $('.auto-stone-return').on('click', function() {
        if (this.getAttribute('disabled') !== null) return;
        
        // determine row
        const row = this.parentElement!;
        const collection = row.parentElement!;
        const n = Array.from(collection.children).indexOf(row);

        currentAutoPerformance.deliveredStones.splice(n, 1);
        currentAutoPerformance.stonesOnFoundation = Math.min(currentAutoPerformance.deliveredStones.length,
            currentAutoPerformance.stonesOnFoundation);
        updateAutoButtonEnabled();
        updateAutoDisplays();
        updateScoring();
    });
}

function updateTeleOpDisplays() {
    $('#teleop-display-alliance-deliver').text(currentTeleOpPerformance.allianceStonesDelivered);
    $('#teleop-display-neutral-deliver').text(currentTeleOpPerformance.neutralStonesDelivered);

    setIdEnabled('teleop-alliance-return', currentTeleOpPerformance.allianceStonesDelivered > 0);
    setIdEnabled('teleop-neutral-return', currentTeleOpPerformance.neutralStonesDelivered > 0);
}

function updateScoring() {
    setTimeout(() => {
        $('#auto-score').text(currentMatchEntry.getAutonomousScore());
        $('#teleop-score').text(currentMatchEntry.getTeleOpScore());
        $('#endgame-score').text(currentMatchEntry.getEndgameScore());
        $('#total-score').text(currentMatchEntry.getTotalScore());
        // console.log(currentMatchEntry.endgame);
    }, 200);
}

const resultValues = {
    'Yes': ScoringResult.SCORED,
    'Failed': ScoringResult.FAILED,
    'DNT': ScoringResult.DID_NOT_TRY
};

function wireScoringResult(name: string, writeResult: (result: ScoringResult) => void) {
    const element = $(`*[name="${name}"]`);    

    element.on('click change', function() {
        writeResult(resultValues[(this as HTMLInputElement).value]);
    });
}

function updateStackedStones() {
    let stones = new Array(12);
    $('.teleop-level').each(function() {
        const index = parseInt(this.getAttribute('level')!) - 1;
        stones[index] = parseInt((this as HTMLInputElement).value);
    });

    let actualLength = 0;
    for (let i = stones.length - 1; i >= 0; --i) {
        if (stones[i] > 0) {
            actualLength = i + 1;
            break;
        }
    }

    currentMatchEntry.teleOp.stonesPerLevel = stones.slice(0, actualLength);
}

const disconnectValues = {
    'none': DisconnectStatus.NO_DISCONNECT,
    'partial': DisconnectStatus.PARTIAL,
    'total': DisconnectStatus.TOTAL
};

function updateMetadata() {
    currentMatchEntry.matchCode = $('#match').val() as string;
    currentMatchEntry.teamNumber = parseInt($('#team').val() as string);
    currentMatchEntry.alliance = $('*[name="alliance"]:checked').val() === 'blue' ? AllianceColor.BLUE : AllianceColor.RED;
    
    currentMatchEntry.disconnect = disconnectValues[$('*[name="disconnect"]:checked').val() as string];
    currentMatchEntry.remarks = $('#remarks').val() as string|undefined;
}

function updateInputsForReadOnly() {
    function showScoringResult(result: ScoringResult, name: string) {
        for (let value in resultValues) {
            if (resultValues[value] === result) {
                $(`input[name="${name}"][value="${value}"]`).attr('checked', 'yes');
            }
        }
    }

    // Metadata
    $('#match').val(currentMatchEntry.matchCode);
    $('#team').val(currentMatchEntry.teamNumber);
    const allianceId = currentMatchEntry.alliance === AllianceColor.RED ? "alliance-red" : "alliance-blue";
    $(`#${allianceId}`).attr('checked', 'true');
    for (let value in disconnectValues) {
        if (disconnectValues[value] === currentMatchEntry.disconnect) {
            $(`input[name="disconnect"][value="${value}"]`).attr('checked', 'yes');
        }
    }
    $('#remarks').text(currentMatchEntry.remarks || '');

    // Autonomous
    showScoringResult(currentMatchEntry.auto.movedFoundation, 'auto-moved');
    showScoringResult(currentMatchEntry.auto.parked, 'auto-parked');

    // TeleOp
    for (let level = 0; level < currentMatchEntry.teleOp.stonesPerLevel.length; level++) {
        $(`.teleop-level[level="${level + 1}"]`).val(currentMatchEntry.teleOp.stonesPerLevel[level]);
    }

    // Endgame
    showScoringResult(currentMatchEntry.endgame.movedFoundation, 'end-found-moved');
    if (currentMatchEntry.endgame.capstoneLevel != undefined) {
        $('#end-capped').attr('checked', 'true');
        $('#end-capped-level').val(currentMatchEntry.endgame.capstoneLevel!);
    }
    showScoringResult(currentMatchEntry.endgame.parked, 'end-parked');
}

$(() => {
    const matchCode = searchParams().get('match');
    if (matchCode !== null) {
        getMatchByKey(matchCode).then(it => {
            currentMatchEntry = it;
            currentAutoPerformance = it.auto;
            currentTeleOpPerformance = it.teleOp;
            updateAutoDisplays();
            updateTeleOpDisplays();
            updateInputsForReadOnly();
            updateScoring();
            $('input, button, .input').attr('disabled', 'true');
        }).catch(() => alert(`No such match: ${matchCode}`));
        return;
    }
    
    $('#auto-button-attempt').on('click', () => {
        currentAutoPerformance.cyclesAttempted++;
    });

    $('#auto-button-deliver-skystone').on('click', () => {
        currentAutoPerformance.deliveredStones.push(StoneType.SKYSTONE);
    });

    $('#auto-button-deliver-stone').on('click', () => {
        currentAutoPerformance.deliveredStones.push(StoneType.STONE);
    });

    $('#auto-button-placed').on('click', () => {
        currentAutoPerformance.stonesOnFoundation++;
    });

    $('#teleop-alliance-deliver').on('click', () => {
        currentTeleOpPerformance.allianceStonesDelivered++;
    });

    $('#teleop-neutral-deliver').on('click', () => {
        currentTeleOpPerformance.neutralStonesDelivered++;
    });

    $('#teleop-alliance-return').on('click', () => {
        currentTeleOpPerformance.allianceStonesDelivered--;
    });

    $('#teleop-neutral-return').on('click', () => {
        currentTeleOpPerformance.neutralStonesDelivered--;
    });

    $('#auto-pane button').on('click', () => {
        updateAutoButtonEnabled();
        updateAutoDisplays();
    });

    $('#end-capped').on('change', function() {
        const checked = (this as HTMLInputElement).checked;
        setIdEnabled('end-capped-level', checked);

        if (!checked) {
            $('#end-capped-level').val(0);
        }
        currentMatchEntry.endgame.capstoneLevel = checked ? parseInt($('#end-capped-level').val() as string) : undefined;
    });

    $('#end-capped-level').on('change', function() {
        currentMatchEntry.endgame.capstoneLevel = parseInt((this as HTMLInputElement).value as string);
    });

    $('#metadata input, #metadata .input').on('change', updateMetadata);

    wireScoringResult('auto-moved', result => currentAutoPerformance.movedFoundation = result);
    wireScoringResult('auto-parked', result => currentAutoPerformance.parked = result);
    wireScoringResult('end-found-moved', result => currentMatchEntry.endgame.movedFoundation = result);
    wireScoringResult('end-parked', result => currentMatchEntry.endgame.parked = result);
    
    $('#teleop-pane button').on('click', updateTeleOpDisplays);
    $('.teleop-level').on('click change', updateStackedStones);
    
    $('input').on('input', updateScoring);
    $('button').on('click', updateScoring);

    $('#submit').on('click', function() {
        updateMetadata();
        try {
            currentMatchEntry.validateMetadata();
            currentMatchEntry.validateAutonomous();

            $('#output').text(JSON.stringify(currentMatchEntry));
            storeMatch(currentMatchEntry).then(() => {
                this.setAttribute('disabled', 'yes');
                this.innerText = 'Stored';
                $('#message').html('<b>Refresh (Ctrl-R or Cmd-R) to scout another match</b>');
            });
        } catch (e) {
            alert(e);
        }
    });

    // constructor checks, we can update afterwards
    updateMetadata();
    updateAutoButtonEnabled();
});