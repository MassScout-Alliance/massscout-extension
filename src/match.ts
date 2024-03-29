import { param } from "jquery";
import { stats } from "./stats";

export enum AllianceColor {
  BLUE, RED
}

export enum ScoringResult {
  FAILED = -1, DID_NOT_TRY = 0, SCORED = 1
}

export enum ParkingResult {
  COMPLETELY_IN = 2, PARTIALLY_IN = 1, FAILED = -1, DID_NOT_TRY = 0
}

export enum DisconnectStatus {
  NO_DISCONNECT = 0, PARTIAL = -1, TOTAL = -2
}

export enum ParkArea {
  NOT_PARKED,
  ATTEMPTED_STORAGE_UNIT, PIN_STORAGE_UNIT, CIN_STORAGE_UNIT,
  ATTEMPTED_WAREHOUSE,    PIN_WAREHOUSE,    CIN_WAREHOUSE
}

export enum HubState {
  BALANCED = 0, TIPPED = 1, TIPPED_OPP = -1
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

    this.validateMetadata();
    this.validateAutonomous();
    this.validateTeleOp();
    this.validateEndgame();
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

  validateAutonomous() {
    MatchEntry.validateRange(this.auto.freightScoredInStorageUnit, 0, 40,
        'Invalid amount of freight in the Storage Unit during autonomous');
    MatchEntry.validateFreightLevels(this.auto.freightScoredPerLevel,
        'Invalid amount of freight on the Alliance Hub during autonomous');
  }

  validateTeleOp() {
    MatchEntry.validateRange(this.teleOp.freightScoredInStorageUnit, 0, 40,
        'Invalid amount of freight in the Storage Unit during TeleOp');
    MatchEntry.validateFreightLevels(this.teleOp.freightScoredPerLevel,
        'Invalid number of scored freight during teleop');
  }

  validateEndgame() {
    if (!this.endgame.duckDeliveryAttempted && this.endgame.ducksDelivered !== 0) {
      throw new Error('Cannot deliver ducks if not attempted');
    }
    MatchEntry.validateRange(this.endgame.ducksDelivered, 0, 10, 'Invalid number of ducks delivered');
  }

  static pointsPenalizedDuring(period: PeriodPerformance): number {
    return period.warningsPenalties[1] * 10 + period.warningsPenalties[2] * 20;
  }

  private static validateFreightLevels(levels: [number, number, number], msg: string) {
    for (const num of levels) {
      this.validateRange(num, 0, 40, 'Invalid amount of freight on the Alliance Hub');
    }
  }

  private static validateRange(num: number, min: number, max: number, msg: string) {
    if (num < min || num > max) {
      throw new RangeError(msg);
    }
  }

  // TODO test
  getTotalPenalty(): number {
    return stats.sum([this.auto, this.teleOp, this.endgame].map(MatchEntry.pointsPenalizedDuring));
  }

  getAutonomousScore(): number {
    let score = 0;
    //4.5.2
    if (this.auto.deliveredCarouselDuck === ScoringResult.SCORED) {
      score += 10;
    }
    if (this.auto.deliveredPreLoaded === ScoringResult.SCORED) {
      if (this.auto.usedTse === ScoringResult.SCORED) {
        score += 20;
      }
      else {
        score += 10;
      }
    }
    score += this.auto.freightScoredInStorageUnit * 2;
    score += stats.sum(this.auto.freightScoredPerLevel) * 6;

    if (this.auto.parked === ParkArea.PIN_STORAGE_UNIT) {
      score += 3;
    }
    else if (this.auto.parked === ParkArea.CIN_STORAGE_UNIT) {
      score += 6;
    }
    else if (this.auto.parked === ParkArea.PIN_WAREHOUSE) {
      score += 5;
    }
    else if (this.auto.parked === ParkArea.CIN_WAREHOUSE) {
      score += 10;
    }

    score -= MatchEntry.pointsPenalizedDuring(this.auto);

    return score;
  }

  getTeleOpScore(): number {
    let score = 0;

    score += this.getAshTotalScore();
    score += this.teleOp.freightScoredOnSharedHub * 4;
    score += this.teleOp.freightScoredInStorageUnit * 2;
    score -= MatchEntry.pointsPenalizedDuring(this.teleOp);

    return score;

  }

  // ASH: alliance-specific hub
  getAshTotalScore(): number {
    return (
      (this.auto.freightScoredPerLevel[0] + this.teleOp.freightScoredPerLevel[0]) * 2 +
      (this.auto.freightScoredPerLevel[1] + this.teleOp.freightScoredPerLevel[1]) * 4 +
      (this.auto.freightScoredPerLevel[2] + this.teleOp.freightScoredPerLevel[2]) * 6);
  }

  getEndgameScore(): number {
    let score = 0;

    score += this.endgame.ducksDelivered * 6;
    if (this.endgame.allianceHubTipped === HubState.BALANCED) score += 10;
    if (this.endgame.sharedHubTipped === HubState.TIPPED) score += 20;

    if (this.endgame.parked === ParkingResult.PARTIALLY_IN) {
      score += 3;
    } else if (this.endgame.parked === ParkingResult.COMPLETELY_IN) {
      score += 6;
    }

    if (this.endgame.tseScored === ScoringResult.SCORED) score += 15;
    score -= MatchEntry.pointsPenalizedDuring(this.endgame);
    return score;

  }

  getTotalScore(): number {
    return this.getAutonomousScore() + this.getTeleOpScore() + this.getEndgameScore();
  }
}

export interface PeriodPerformance {
  warningsPenalties: [number, number, number];
}

// penalties [warning, minor, major]
export interface AutonomousPerformance extends PeriodPerformance {
  usedTse: ScoringResult;
  deliveredPreLoaded: ScoringResult;
  deliveredCarouselDuck: ScoringResult;
  freightScoredPerLevel: [number, number, number];
  freightScoredInStorageUnit: number;
  parked: ParkArea;
}

export interface TeleOpPerformance extends PeriodPerformance {
  freightScoredOnSharedHub: number;
  freightScoredInStorageUnit: number;
  freightScoredPerLevel: [number, number, number];
}

export interface EndgamePerformance extends PeriodPerformance {
  duckDeliveryAttempted: boolean;
  ducksDelivered: number;
  allianceHubTipped: HubState;
  sharedHubTipped: HubState;
  parked: ParkingResult;
  tseScored: ScoringResult;
}

export type MatchEntrySet = MatchEntry[];

export function isValidMatchCode(matchCode: string): boolean {
  const matchResult = matchCode.match(/^([QF][1-9][0-9]*)|(SF[12]-[1-9][0-9]*)$/);
  return matchResult !== null && matchResult[0] === matchCode;
}
