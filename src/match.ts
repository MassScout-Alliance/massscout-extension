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
    }

    public validateAutonomous() {
        if (this.auto.cyclesAttempted < this.auto.deliveredStones.length) {
            throw new RangeError(`${this.teamNumber} ${this.matchCode}: autonomous cyclesAttempted < num of deliveredStones`);
        }
        if (this.auto.stonesOnFoundation > this.auto.deliveredStones.length) {
            throw new RangeError(`${this.teamNumber} ${this.matchCode}: autonomous stonesOnFoundation > num of deliveredStones`);
        }
    }

    getAutonomousScore(): number {
        let score = 0;
        // 4.5.2.1
        if (this.auto.movedFoundation === ScoringResult.SCORED) {
            score += 10;
        }
        // 4.5.2.2
        for (let i = 0; i < this.auto.deliveredStones.length; i++) {
            const stone = this.auto.deliveredStones[i];
            if (stone === StoneType.SKYSTONE && i < 2) {
                score += 10;
            } else if (stone != undefined) {
                score += 2;
            }
        }
        // 4.5.2.3
        if (this.auto.parked === ScoringResult.SCORED) {
            score += 5;
        }
        // 4.5.2.4
        score += this.auto.stonesOnFoundation * 4;
        return score;
    }

    getTeleOpScore(): number {
        let score = 0;
        // 4.5.3.1
        score += this.teleOp.allianceStonesDelivered;
        // 4.5.3.2
        score += this.teleOp.stonesPerLevel.reduce((a, b) => a + b, 0);
        // 4.5.3.3
        score += this.teleOp.stonesPerLevel.length * 2;
        return score;
    }

    getEndgameScore(): number {
        let score = 0;
        // 4.5.4.1
        if (this.endgame.capstoneLevel !== undefined) {
            score += 5 + this.endgame.capstoneLevel;
        }
        // 4.5.4.2
        if (this.endgame.movedFoundation === ScoringResult.SCORED) {
            score += 15;
        }
        // 4.5.4.3
        if (this.endgame.parked === ScoringResult.SCORED) {
            score += 5;
        }
        return score;
    }

    getTotalScore(): number {
        return this.getAutonomousScore() + this.getTeleOpScore() + this.getEndgameScore();
    }
}

export interface AutonomousPerformance {
    deliveredStones: StoneType[];
    cyclesAttempted: number;
    stonesOnFoundation: number;
    parked: ScoringResult;
    movedFoundation: ScoringResult;
}

export interface TeleOpPerformance {
    allianceStonesDelivered: number;
    neutralStonesDelivered: number;
    stonesPerLevel: number[];
}

export interface EndgamePerformance {
    movedFoundation: ScoringResult;
    capstoneLevel?: number;
    parked: ScoringResult;
}

export type MatchEntrySet = MatchEntry[];

export function isValidMatchCode(matchCode: string): boolean {
    const matchResult = matchCode.match(/^([QF][1-9][0-9]*)|(SF[12]-[1-9][0-9]*)$/);
    return matchResult !== null && matchResult[0] === matchCode;
}
