import { BarTooltipRendererParams } from "ag-grid-community";
import { param } from "jquery";

export enum AllianceColor {
    BLUE, RED
}

export enum StoneType {
    SKYSTONE, STONE
}

export enum ScoringResult {
    SCORED, FAILED, DID_NOT_TRY
}

// OK FTC state-of-the-art mobile phone control system
export enum DisconnectStatus {
    NO_DISCONNECT, PARTIAL, TOTAL
}

export enum ParkArea {
    CIN_STATION, CIN_WAREHOUSE, PIN_STATION, PIN_WAREHOUSE, NOT_PARKED
}

export enum HubState {
    BALANCED, TIPPED, TIPPED_OPP
}

export class MatchEntry {
    matchCode: string;
    teamNumber: number;
    alliance: AllianceColor;
    auto: AutonomousPerformance;
    teleOp: TeleOpPerformance;
    endgame: EndgamePerformance;
    disconnect: DisconnectStatus;
    remarks?: string;

    constructor(matchCode: string, teamNumber: number, alliance: AllianceColor,
        auto: AutonomousPerformance, teleOp: TeleOpPerformance, endgame: EndgamePerformance,
        disconnect: DisconnectStatus, remarks?: string) {
        this.matchCode = matchCode;
        this.teamNumber = teamNumber;
        this.alliance = alliance;
        this.auto = auto;
        this.teleOp = teleOp;
        this.endgame = endgame;
        this.disconnect = disconnect;
        this.remarks = remarks;

        this.validateAutonomous();
        this.validateMetadata();
    }

    public validateMetadata() {
        if (!isValidMatchCode(this.matchCode)) {
            throw new Error(`Match code "${this.matchCode}" is invalid`);
        }
        if (isNaN(this.teamNumber)) {
            throw new Error(`Invalid team number`);
        }
        if (this.teamNumber < 1 || Math.floor(this.teamNumber) !== this.teamNumber) {
            throw new Error(`Team number ${this.teamNumber} is invalid`);
        }
        if (this.disconnect === DisconnectStatus.TOTAL && this.getTotalScore() > 0) {
            throw new Error('A totally disconnected team cannot score points');
        }
    }

    public validateAutonomous() {
        if (this.auto.cyclesAttempted < this.auto.freightScoredPerLevel.length) {
            throw new RangeError(`${this.teamNumber} ${this.matchCode}: autonomous cyclesAttempted < num of delivered freight`);
        }
    }

    getAutonomousScore(): number {
        let score = 0;
        //4.5.2
        if(this.auto.deliveredCarouselDuck === ScoringResult.SCORED) {
            score += 10;
        }
        if(this.auto.deliveredPreLoaded === ScoringResult.SCORED) {
            if(this.auto.hasCapstone === ScoringResult.SCORED) {
                score += 20;
            }
            else {
                score += 10;
            }
        }
        score += this.auto.freightScoredInStorageUnit * 2;
        score += totalOfArr(this.auto.freightScoredPerLevel) * 6;

        if(this.auto.parked === ParkArea.PIN_STATION) {
            score += 3;
        }
        else if(this.auto.parked === ParkArea.CIN_STATION) {
            score += 6;
        }
        else if(this.auto.parked === ParkArea.PIN_WAREHOUSE) {
            score += 5;
        }
        else if(this.auto.parked === ParkArea.CIN_WAREHOUSE) {
            score += 10;
        }

        score -= this.auto.warningsPenalties[1] * 10;
        score -= this.auto.warningsPenalties[2] * 20;

        return score;
    }

    getTeleOpScore(): number {
        let score = 0;

        score += this.teleOp.freightScoredPerLevel[0] * 2;
        score += this.teleOp.freightScoredPerLevel[1] * 4;
        score += this.teleOp.freightScoredPerLevel[2] * 6;

        score += this.teleOp.freightInStorageUnit * 2;

        score -= this.teleOp.warningsPenalties[1] * 10;
        score -= this.teleOp.warningsPenalties[2] * 20;

        return score;

    }

    getEndgameScore(): number {
        let score = 0;

        score += this.endgame.ducksDelivered * 6;
        if (this.endgame.allianceHubTipped === HubState.BALANCED) score += 10;
        if (this.endgame.sharedHubTipped === HubState.TIPPED) score += 20;

        if (this.endgame.parked === ParkArea.PIN_WAREHOUSE) {
            score += 3;
        } else if (this.endgame.parked === ParkArea.CIN_WAREHOUSE) {
            score += 6;
        }

        if (this.endgame.capstoneScored === ScoringResult.SCORED) score += 15;

        return score;

    }

    getTotalScore(): number {
        return this.getAutonomousScore() + this.getTeleOpScore() + this.getEndgameScore();
    }
}

// penalties [warning, minor, major]
export interface AutonomousPerformance {
    hasCapstone: ScoringResult;
    deliveredPreLoaded: ScoringResult;
    deliveredCarouselDuck: ScoringResult;
    cyclesAttempted: number;
    freightScoredPerLevel: number[];
    freightScoredInStorageUnit: number;
    parked: ParkArea;
    warningsPenalties: number[];
}

export interface TeleOpPerformance {
    freightScoredOnSharedHub: number;
    freightInStorageUnit: number;
    freightScoredPerLevel: number[];
    warningsPenalties: number[];
}

export interface EndgamePerformance {
    ducksDelivered: number;
    allianceHubTipped: HubState;
    sharedHubTipped: HubState;
    parked: ParkArea;
    capstoneScored: ScoringResult;
    warningsPenalties: number[];
}

export type MatchEntrySet = MatchEntry[];

export function isValidMatchCode(matchCode: string): boolean {
    const matchResult = matchCode.match(/^([QF][1-9][0-9]*)|(SF[12]-[1-9][0-9]*)$/);
    return matchResult !== null && matchResult[0] === matchCode;
}

export function totalOfArr(arr: number[]) {
    let ret = 0;
    for(let i = 0; i < arr.length; i++) {
        ret += arr[i];
    }
    return ret;
}
