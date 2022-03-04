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
import { createApp, onMounted, reactive, Ref, ref } from 'vue';
import clone from 'just-clone';
import { storeMatch, getMatch, getMatchByKey, entryKey } from './local-storage';
import { stats } from './stats';
import { searchParams } from './utils';


// valid condition: cyclesAttempted >= deliveredStones.length >= stonesOnFoundation

function setIdEnabled(id: string, enabled: boolean) {
    const elem = $(`#${id}`);
    if (enabled)
        elem.removeAttr('disabled');
    else
        elem.attr('disabled', 'true');
}

function getEmptyMatchEntry(): MatchEntry {
    const auto: AutonomousPerformance = {
        usedTse: ScoringResult.DID_NOT_TRY,
        deliveredPreLoaded: ScoringResult.DID_NOT_TRY,
        deliveredCarouselDuck: ScoringResult.DID_NOT_TRY,
        freightScoredPerLevel: [0, 0, 0] as [number, number, number],
        freightScoredInStorageUnit: 0,
        parked: ParkArea.NOT_PARKED,
        warningsPenalties: [0, 0, 0] as [number, number, number]
    };
    const teleOp: TeleOpPerformance = {
        freightScoredOnSharedHub: 0,
        freightScoredInStorageUnit: 0,
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

    const entry = new MatchEntry('Q42', 11115, AllianceColor.BLUE,
        auto, teleOp, endgame, DisconnectStatus.NO_DISCONNECT);
    entry.matchCode = '';
    entry.teamNumber = 0;
    return entry;
}

const app = createApp({
    setup() {
        const entry = ref(getEmptyMatchEntry());
        const submitted = ref(false);
        const canInteract = ref(true);
        const message: Ref<['success'|'error'|null, string]> = ref([null, ''] as ['success'|'error'|null, string]);
        
        const matchCode = searchParams().get('match');
        if (matchCode != null) {
            getMatchByKey(matchCode)
                .then(match => {
                    entry.value = match;
                    submitted.value = true;
                    canInteract.value = false;
                }).catch(() => alert(`Failed to read match with code ${matchCode}`));
        }

        onMounted(() => {
            const form = document.getElementById('performance-form');
            if (form != null) {
                form.style.display = 'unset';
            }
        });

        function clearEntry(clearTeam = false) {
            const clean = getEmptyMatchEntry();
            if (clearTeam) {
                entry.value = clean;
            } else {
                entry.value.auto = clean.auto;
                entry.value.teleOp = clean.teleOp;
                entry.value.endgame = clean.endgame;
            }
        }

        function startNewEntry() {
            clearEntry(true);
            submitted.value = false;
        }

        function validate(): string|undefined {
            try {
                entry.value.validateAutonomous();
                entry.value.validateMetadata();
            } catch (e: any) {
                return (e instanceof Error) ? e.message : e.toString();
            }
        }

        async function trySubmit() {
            if (submitted.value) return;
            console.debug('1', {submitted});
            const error = validate();
            console.debug('2', {error});
            if (error !== undefined) {
                message.value = ['error', error];
                return;
            }
            try {
                console.debug('3', {error});
                await storeMatch(clone(entry.value));
                console.debug('4', {entry});
                message.value = ['success', 'Successfully stored match ' + entryKey(entry.value)];
                submitted.value = true;
                console.debug('5', [message.value, submitted.value]);
            } catch (e: any) {
                message.value = ['error', (e instanceof Error) ? e.message : e.toString()];
            }
        }

        return {
            AllianceColor: ref(AllianceColor),
            DisconnectStatus: ref(DisconnectStatus),
            ScoringResult: ref(ScoringResult),
            ParkingResult: ref(ParkingResult),
            HubState: ref(HubState),
            ParkArea: ref(ParkArea),
            MatchEntry: ref(MatchEntry),
            entry, trySubmit, submitted, validate,
            message, canInteract,
            clearEntry, startNewEntry
        };
    },
    components: {
        penalties: {
            emits: ['update:modelValue'],
            props: { modelValue: Array, period: String, periodname: String, disabled: Boolean },
            template: '#penalties-template'
        },
        allianceshippinghub: {
            emits: ['update:modelValue'],
            props: { modelValue: Array, period: String, disabled: Boolean },
            template: '#ash-template'
        }
    }
}).mount('#performance-form');
