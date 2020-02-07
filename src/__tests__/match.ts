import { MatchEntry, AllianceColor, StoneType, ScoringResult, AutonomousPerformance, TeleOpPerformance, EndgamePerformance, isValidMatchCode } from "../match";

export const kEmptyAuto: AutonomousPerformance = {
    deliveredStones: [],
    cyclesAttempted: 0,
    stonesOnFoundation: 0,
    parked: ScoringResult.FAILED,
    movedFoundation: ScoringResult.FAILED 
};

export const kEmptyTeleOp: TeleOpPerformance = {
    allianceStonesDelivered: 0,
    neutralStonesDelivered: 0,
    stonesPerLevel: []
};

export const kEmptyEndgame: EndgamePerformance = {
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
        allianceStonesDelivered: 2,
        neutralStonesDelivered: 1,
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

test('MatchEntry scoring 4.5.2.1 foundation', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [],
        cyclesAttempted: 1,
        stonesOnFoundation: 0,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.SCORED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(10);
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

test('MatchEntry scoring 4.5.2.3 parking', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [],
        cyclesAttempted: 1,
        stonesOnFoundation: 0,
        parked: ScoringResult.SCORED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(5);
});

test('MatchEntry scoring 4.5.2.4 placement', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE, StoneType.STONE],
        cyclesAttempted: 3,
        stonesOnFoundation: 2,
        parked: ScoringResult.FAILED,
        movedFoundation: ScoringResult.FAILED 
    };
    
    const entry = new MatchEntry('Q4', 4410, AllianceColor.RED,
        auto, kEmptyTeleOp, kEmptyEndgame);

    expect(entry.getAutonomousScore()).toBe(10 + 2 + 2*4);
});

test('MatchEntry scoring 4.5.3.1 delivery', () => {    
    const teleop: TeleOpPerformance = {
        allianceStonesDelivered: 2,
        neutralStonesDelivered: 3,
        stonesPerLevel: []
    };
    
    const entry = new MatchEntry('SF2-2', 10331, AllianceColor.RED,
        kEmptyAuto, teleop, kEmptyEndgame);

    expect(entry.getTeleOpScore()).toBe(2);
});

test('MatchEntry scoring 4.5.3.2 placing', () => {    
    const teleop: TeleOpPerformance = {
        allianceStonesDelivered: 0,
        neutralStonesDelivered: 0,
        stonesPerLevel: [2]
    };
    
    const entry = new MatchEntry('SF2-2', 10331, AllianceColor.RED,
        kEmptyAuto, teleop, kEmptyEndgame);

    expect(entry.getTeleOpScore()).toBe(2 + 2*1);
});

test('MatchEntry scoring 4.5.3.3 skyscraper bonus', () => {    
    const teleop: TeleOpPerformance = {
        allianceStonesDelivered: 0,
        neutralStonesDelivered: 2,
        stonesPerLevel: [1, 1, 1, 1]
    };
    
    const entry = new MatchEntry('F1', 5273, AllianceColor.BLUE,
        kEmptyAuto, teleop, kEmptyEndgame);

    expect(entry.getTeleOpScore()).toBe(4 + 4*2);
});

test('MatchEntry scoring 4.5.4.1 capstone', () => {    
    const endgame: EndgamePerformance = {
        movedFoundation: ScoringResult.DID_NOT_TRY,
        capstoneLevel: 3,
        parked: ScoringResult.FAILED
    };
    
    const entry = new MatchEntry('F2', 5273, AllianceColor.BLUE,
        kEmptyAuto, kEmptyTeleOp, endgame);

    expect(entry.getEndgameScore()).toBe(5 + 3);
});

test('MatchEntry scoring 4.5.4.2 foundation', () => {    
    const endgame: EndgamePerformance = {
        movedFoundation: ScoringResult.SCORED,
        capstoneLevel: undefined,
        parked: ScoringResult.FAILED
    };
    
    const entry = new MatchEntry('SF2-2', 4410, AllianceColor.BLUE,
        kEmptyAuto, kEmptyTeleOp, endgame);

    expect(entry.getEndgameScore()).toBe(15);
});

test('MatchEntry scoring 4.5.4.3 parking', () => {    
    const endgame: EndgamePerformance = {
        movedFoundation: ScoringResult.DID_NOT_TRY,
        capstoneLevel: undefined,
        parked: ScoringResult.SCORED
    };
    
    const entry = new MatchEntry('F1', 5273, AllianceColor.BLUE,
        kEmptyAuto, kEmptyTeleOp, endgame);

    expect(entry.getEndgameScore()).toBe(5);
});

test('MatchEntry scoring cumulative Lex7.1 F2', () => {    
    const auto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE, StoneType.SKYSTONE],
        cyclesAttempted: 2,
        stonesOnFoundation: 2,
        parked: ScoringResult.SCORED,
        movedFoundation: ScoringResult.SCORED
    };
    const teleop: TeleOpPerformance = {
        allianceStonesDelivered: 6,
        neutralStonesDelivered: 1,
        stonesPerLevel: [3, 1, 1, 1, 1, 1, 1, 1]
    };
    const endgame: EndgamePerformance = {
        movedFoundation: ScoringResult.SCORED,
        capstoneLevel: undefined,
        parked: ScoringResult.SCORED
    };

    const entry = new MatchEntry('F2', 8644, AllianceColor.RED,
        auto, teleop, endgame);

    // official final score 100, minus second parking robot in endgame
    expect(entry.getTotalScore()).toBe(100 - 5);
});

test('MatchEntry validation auto cyclesAttempted < delivered', () => {
    const badAuto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE],
        cyclesAttempted: 0,
        stonesOnFoundation: 1,
        parked: ScoringResult.SCORED,
        movedFoundation: ScoringResult.FAILED
    };

    expect(() => new MatchEntry('F2', 12897, AllianceColor.BLUE,
        badAuto, kEmptyTeleOp, kEmptyEndgame)).toThrow(
            new RangeError('12897 F2: autonomous cyclesAttempted < num of deliveredStones'));
});

test('MatchEntry validation auto stonesOnFoundation > delivered', () => {
    const badAuto: AutonomousPerformance = {
        deliveredStones: [StoneType.SKYSTONE],
        cyclesAttempted: 1,
        stonesOnFoundation: 2,
        parked: ScoringResult.SCORED,
        movedFoundation: ScoringResult.FAILED
    };

    expect(() => new MatchEntry('F2', 4410, AllianceColor.BLUE,
        badAuto, kEmptyTeleOp, kEmptyEndgame)).toThrow(
            new RangeError('4410 F2: autonomous stonesOnFoundation > num of deliveredStones'));
});

test('Qualifiers are valid match codes', () => {
    expectCodesValid(true, 'Q2', 'Q3', 'Q10', 'Q41', 'Q100');
});

test('Semifinals are valid match codes', () => {
    expectCodesValid(true, 'SF1-1', 'SF2-3', 'SF2-1', 'SF1-2');
});

test('Finals are valid match codes', () => {
    expectCodesValid(true, 'F1', 'F2', 'F3', 'F4', 'F5');
});

test('Nonpositive numbers are invalid', () => {
    expectCodesValid(false, 'Q0', 'SF0-2', 'F0', 'Q-13');
});

test('Match codes are all uppercase', () => {
    expectCodesValid(false, 'q3', 'sf1-2', 'f4');
});

test('Only semifinals 1 and 2 are valid', () => {
    expectCodesValid(false, 'SF3-1', 'SF4-2');
});

test('Dirty match codes are invalid', () => {
    expectCodesValid(false, ' Q14\t', 'Q14 yoov');
});

function expectCodesValid(expected: boolean, ...codes: string[]) {
    for (let code of codes) {
        expect(isValidMatchCode(code)).toBe(expected);
    }
}

test('MatchEntry metadata validation match code', () => {
    expect(() => new MatchEntry('bad', 4410, AllianceColor.BLUE, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame))
        .toThrowError('Match code "bad" is invalid');
});

test('MatchEntry metadata validation team number', () => {
    expect(() => new MatchEntry('Q13', 0, AllianceColor.RED, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame))
        .toThrowError('Team number 0 is invalid');
    expect(() => new MatchEntry('Q13', NaN, AllianceColor.RED, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame))
        .toThrowError('Invalid team number');
    expect(() => new MatchEntry('Q13', 1.5, AllianceColor.RED, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame))
        .toThrowError('Team number 1.5 is invalid');
});