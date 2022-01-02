import * as $ from 'jquery';
import { StoneType, MatchEntry, AllianceColor, AutonomousPerformance, ScoringResult, TeleOpPerformance, DisconnectStatus } from './match';
import { storeMatch, getMatch, getMatchByKey } from './local-storage';
import { stats } from './stats';
import { searchParams } from './utils';
import { AgAbstractField } from 'ag-grid-community';

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

