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
import { createApp, onMounted, Ref, ref } from 'vue';
import { storeMatch, getMatch, getMatchByKey } from './local-storage';
import { stats } from './stats';
import { searchParams } from './utils';
import { AgAbstractField } from 'ag-grid-community';


// valid condition: cyclesAttempted >= deliveredStones.length >= stonesOnFoundation

function setIdEnabled(id: string, enabled: boolean) {
    const elem = $(`#${id}`);
    if (enabled)
        elem.removeAttr('disabled');
    else
        elem.attr('disabled', 'true');
}

const app = createApp({
    setup() {
        const auto: AutonomousPerformance = {
            usedTse: ScoringResult.DID_NOT_TRY,
            deliveredPreLoaded: ScoringResult.DID_NOT_TRY,
            deliveredCarouselDuck: ScoringResult.DID_NOT_TRY,
            cyclesAttempted: 0,
            freightScoredPerLevel: [0, 0, 0] as [number, number, number],
            freightScoredInStorageUnit: 0,
            parked: ParkArea.NOT_PARKED,
            warningsPenalties: [0, 0, 0] as [number, number, number]
        };
        const teleOp: TeleOpPerformance = {
            freightScoredOnSharedHub: 0,
            freightInStorageUnit: 0,
            freightScoredPerLevel: [0, 0, 0] as [number, number, number],
            warningsPenalties: [0, 0, 0] as [number, number, number]
        };
        const endgame: EndgamePerformance = {
            ducksDelivered: 0,
            duckDeliveryAttempted: false,
            allianceHubTipped: HubState.BALANCED,
            sharedHubTipped: HubState.BALANCED,
            parked: ParkingResult.FAILED,
            tseScored: ScoringResult.DID_NOT_TRY,
            warningsPenalties: [0, 0, 0] as [number, number, number]
        };

        const entry = ref(new MatchEntry('Q42', 11115, AllianceColor.BLUE,
            auto, teleOp, endgame, DisconnectStatus.NO_DISCONNECT));

        onMounted(() => {
            const form = document.getElementById('performance-form');
            if (form != null) {
                form.style.display = 'unset';
            }
        });
        return {
            AllianceColor: ref(AllianceColor),
            DisconnectStatus: ref(DisconnectStatus),
            ScoringResult: ref(ScoringResult),
            ParkingResult: ref(ParkingResult),
            HubState: ref(HubState),
            ParkArea: ref(ParkArea),
            MatchEntry: ref(MatchEntry),
            entry, auto: ref(auto), teleOp: ref(teleOp),
            endgame: ref(endgame),
            message: ref('')
        };
    },
    components: {
        penalties: {
            emits: ['update:modelValue'],
            props: { modelValue: Array, period: String, periodname: String },
            template: '#penalties-template'
        },
        allianceshippinghub: {
            emits: ['update:modelValue'],
            props: { modelValue: Array, period: String },
            template: '#ash-template'
        }
    }
}).mount('#performance-form');
