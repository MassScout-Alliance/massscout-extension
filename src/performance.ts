import $ from 'jquery';
import 'spectre.css';
import {
    MatchEntry,
    AllianceColor,
    AutonomousPerformance,
    ScoringResult,
    TeleOpPerformance,
    DisconnectStatus, ParkArea, EndgamePerformance, HubState, ParkingResult
} from './match';
import { createApp } from 'vue';
import { storeMatch, getMatch, getMatchByKey } from './local-storage';
import { stats } from './stats';
import { searchParams } from './utils';
import { AgAbstractField } from 'ag-grid-community';


let currentAutoPerformance: AutonomousPerformance = {
    usedTse: ScoringResult.DID_NOT_TRY,
    deliveredPreLoaded: ScoringResult.DID_NOT_TRY,
    deliveredCarouselDuck: ScoringResult.DID_NOT_TRY,
    cyclesAttempted: 0,
    freightScoredPerLevel: [0, 0, 0],
    freightScoredInStorageUnit: 0,
    parked: ParkArea.NOT_PARKED,
    warningsPenalties: [0, 0, 0]
};
let currentTeleOpPerformance: TeleOpPerformance = {
    freightScoredOnSharedHub: 0,
    freightInStorageUnit: 0,
    freightScoredPerLevel: [0, 0, 0],
    warningsPenalties: [0, 0, 0]
};
let currentEndgamePerformance: EndgamePerformance = {
    ducksDelivered: 0,
    allianceHubTipped: HubState.BALANCED,
    sharedHubTipped: HubState.BALANCED,
    parked: ParkingResult.DID_NOT_TRY,
    tseScored: ScoringResult.DID_NOT_TRY,
    warningsPenalties: [0, 0, 0]
}

let currentMatchEntry = new MatchEntry('Q1', 1, AllianceColor.BLUE,
    currentAutoPerformance,
    currentTeleOpPerformance,
    currentEndgamePerformance,
    DisconnectStatus.NO_DISCONNECT);

// valid condition: cyclesAttempted >= deliveredStones.length >= stonesOnFoundation

function setIdEnabled(id: string, enabled: boolean) {
    const elem = $(`#${id}`);
    if (enabled)
        elem.removeAttr('disabled');
    else
        elem.attr('disabled', 'true');
}

const app = createApp({
    components: {
        penalties: {
            props: {period: String},
            template: '#penalties-template'
        },
        allianceshippinghub: {
            props: {period: String},
            template: '#ash-template'
        }
    }
}).mount('#performance-form');
