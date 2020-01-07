export enum AllianceColor {
    BLUE, RED
}

export enum StoneType {
    SKYSTONE, STONE
}

export enum ScoringResult {
    SCORED, FAILED, DID_NOT_TRY
}

export class MatchEntry {
    matchCode: string;
    teamNumber: number;
    alliance: AllianceColor;
    auto: AutonomousPerformance;
    teleOp: TeleOpPerformance;
    endgame: EndgamePerformance;

    constructor(matchCode: string, teamNumber: number, alliance: AllianceColor,
        auto: AutonomousPerformance, teleOp: TeleOpPerformance, endgame: EndgamePerformance) {
        this.matchCode = matchCode;
        this.teamNumber = teamNumber;
        this.alliance = alliance;
        this.auto = auto;
        this.teleOp = teleOp;
        this.endgame = endgame;
    }

    getAutonomousScore(): number {
        let score = 0;
        for (let i = 0; i < this.auto.deliveredStones.length; i++) {
            const stone = this.auto.deliveredStones[i];
            if (stone == StoneType.SKYSTONE && i < 2) {
                score += 10;
            } else if (stone != undefined) {
                score += 2;
            }
        }
        return score;
    }
    getTeleOpScore(): number { return 0; }
    getEndgameScore(): number { return 0; }

    getTotalScore(): number { return 0; }
}

export interface AutonomousPerformance {
    deliveredStones: StoneType[];
    cyclesAttempted: number;
    stonesOnFoundation: number;
    parked: ScoringResult;
    movedFoundation: ScoringResult;
}

export interface TeleOpPerformance {
    stonesDelivered: number;
    stonesPerLevel: number[];
}

export interface EndgamePerformance {
    movedFoundation: ScoringResult;
    capstoneLevel?: number;
    parked: ScoringResult;
}