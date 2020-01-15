import * as $ from 'jquery';
import { StoneType, MatchEntry, AllianceColor, AutonomousPerformance, ScoringResult, TeleOpPerformance } from './match';
import { storeMatch, getMatch } from './local-storage';

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
});

// valid condition: cyclesAttempted >= deliveredStones.length >= stonesOnFoundation

function setIdEnabled(id: string, enabled: boolean) {
    const elem = $(`#${id}`);
    if (enabled)
        elem.removeAttr('disabled');
    else
        elem.attr('disabled', 'true');
}

function updateAutoButtonEnabled() {    
    setIdEnabled('auto-button-attempt', true);
    const canDeliverMoreStones = currentAutoPerformance.deliveredStones.length < currentAutoPerformance.cyclesAttempted;
    setIdEnabled('auto-button-deliver-skystone', canDeliverMoreStones);
    setIdEnabled('auto-button-deliver-stone', canDeliverMoreStones);
    const canStackMoreStones = currentAutoPerformance.stonesOnFoundation < currentAutoPerformance.deliveredStones.length;
    setIdEnabled('auto-button-placed', canStackMoreStones);
    
    if (!canDeliverMoreStones && !canStackMoreStones) {
        $('#auto-button-attempt').addClass('primary');
    } else {
        $('#auto-button-attempt').removeClass('primary');
    }
}

function updateAutoDisplays() {
    function imageForStone(type: StoneType): JQuery<HTMLElement> {
        const url = type === StoneType.SKYSTONE ? 'assets/brick_outline_target_new.png' : 'assets/brick_normal_small.png';
        return $(`<div class="row"><img src="${url}"></div>`);
    }

    $('#auto-display-attempt').text(currentAutoPerformance.cyclesAttempted);

    const stonesParent = $('#auto-display-delivered');
    stonesParent.html('');
    for (let stone of currentAutoPerformance.deliveredStones) {
        imageForStone(stone).appendTo(stonesParent);
    }

    $('#auto-display-placed').text(currentAutoPerformance.stonesOnFoundation);
}

function updateTeleOpDisplays() {
    $('#teleop-display-alliance-deliver').text(currentTeleOpPerformance.allianceStonesDelivered);
    $('#teleop-display-neutral-deliver').text(currentTeleOpPerformance.neutralStonesDelivered);
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

function wireScoringResult(name: string, writeResult: (result: ScoringResult) => void) {
    const element = $(`*[name="${name}"]`);
    const resultValues = {
        'Yes': ScoringResult.SCORED,
        'Failed': ScoringResult.FAILED,
        'DNT': ScoringResult.DID_NOT_TRY
    };

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

function updateMetadata() {
    currentMatchEntry.matchCode = $('#match').val() as string;
    currentMatchEntry.teamNumber = parseInt($('#team').val() as string);
    currentMatchEntry.alliance = $('*[name="alliance"]:checked').val() === 'blue' ? AllianceColor.BLUE : AllianceColor.RED;
}

$(() => {
    
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

    $('#auto-pane button').on('click', () => {
        updateAutoButtonEnabled();
        updateAutoDisplays();
    });

    $('#end-capped').on('change', function() {
        const checked = (this as HTMLInputElement).checked;
        setIdEnabled('end-capped-level', checked);

        if (!checked) {
            $('#end-capped-level').val(1);
        }
        currentMatchEntry.endgame.capstoneLevel = checked ? parseInt($('#end-capped-level').val() as string) : undefined;
    });

    $('#end-capped-level').on('change', function() {
        currentMatchEntry.endgame.capstoneLevel = parseInt((this as HTMLInputElement).value as string);
    });

    $('#metadata input').on('change', updateMetadata);

    wireScoringResult('auto-moved', result => currentAutoPerformance.movedFoundation = result);
    wireScoringResult('auto-parked', result => currentAutoPerformance.parked = result);
    wireScoringResult('end-found-moved', result => currentMatchEntry.endgame.movedFoundation = result);
    wireScoringResult('end-parked', result => currentMatchEntry.endgame.parked = result);
    
    $('#teleop-pane button').on('click', updateTeleOpDisplays);
    $('.teleop-level').on('click change', updateStackedStones);
    
    $('input').on('input', updateScoring);
    $('button').on('click', updateScoring);

    $('#submit').on('click', function() {
        try {
            currentMatchEntry.validateMetadata();
            currentMatchEntry.validateAutonomous();

            // $('#output').text(JSON.stringify(currentMatchEntry));
            storeMatch(currentMatchEntry).then(() => {
                this.setAttribute('disabled', 'yes');
                this.innerText = 'Stored';
            });
        } catch (e) {
            alert(e);
        }
    });

    // constructor checks, we can update afterwards
    updateMetadata();
    updateAutoButtonEnabled();
});