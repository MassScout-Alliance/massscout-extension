import { MatchEntry, AllianceColor, StoneType, ScoringResult, AutonomousPerformance, TeleOpPerformance, EndgamePerformance } from "../match";

const kEmptyAuto: AutonomousPerformance = {
    deliveredStones: [],
    cyclesAttempted: 0,
    stonesOnFoundation: 0,
    parked: ScoringResult.FAILED,
    movedFoundation: ScoringResult.FAILED 
};

const kEmptyTeleOp: TeleOpPerformance = {
    stonesDelivered: 0,
    stonesPerLevel: []
};

const kEmptyEndgame: EndgamePerformance = {
    movedFoundation: ScoringResult.FAILED,
    parked: ScoringResult.FAILED
};

test('MatchEntry constructor', () => {
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE, StoneType.STONE],
        cyclesAttempted: 3,
        stonesOnFoundation: 1,
        parked: ScoringResult.SCORED,
        movedFoundation: ScoringResult.DID_NOT_TRY
    };
    const teleop: TeleOpPerformance = {
        stonesDelivered: 2,
        stonesPerLevel: [2, 2, 1, 1]
    };
    const endgame: EndgamePerformance = {
        movedFoundation: ScoringResult.SCORED,
        parked: ScoringResult.FAILED,
    }
    const entry = new MatchEntry('Q3', 5273, AllianceColor.RED,
        auto, teleop, endgame);

    expect(entry.matchCode).toBe('Q3');
    expect(entry.teamNumber).toBe(5273);
    expect(entry.alliance).toBe(AllianceColor.RED);
    expect(entry.auto).toBe(auto);
    expect(entry.teleOp).toBe(teleop);
    expect(entry.endgame).toBe(endgame);
});

test('MatchEntry scoring 4.5.2.2a 1 skystone', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE],
        cyclesAttempted: 1,
        stonesOnFoundation: 0,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(10);
});

test('MatchEntry scoring 4.5.2.2a 2 skystones', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE, StoneType.SKYSTONE],
        cyclesAttempted: 3,
        stonesOnFoundation: 0,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(20);
});

test('MatchEntry scoring 4.5.2.2a 1 skystone 1 stone', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE, StoneType.STONE],
        cyclesAttempted: 2,
        stonesOnFoundation: 0,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(12);
});

test('MatchEntry scoring 4.5.2.2a 2 stones', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.STONE, StoneType.STONE],
        cyclesAttempted: 2,
        stonesOnFoundation: 0,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(4);
});

test('MatchEntry scoring 4.5.2.2b Sky-Stone-Sky', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE, StoneType.STONE, StoneType.SKYSTONE],
        cyclesAttempted: 4,
        stonesOnFoundation: 0,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(10 + 2 + 2);
});

test('MatchEntry scoring 4.5.2.2b Sky-Stone-Stone-Sky', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE, StoneType.STONE, StoneType.STONE, StoneType.SKYSTONE],
        cyclesAttempted: 4,
        stonesOnFoundation: 0,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(10 + 2 + 2 + 2);
});