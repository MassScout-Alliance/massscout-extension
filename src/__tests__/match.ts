import {
    MatchEntry,
    AllianceColor,
    ScoringResult,
    ParkArea,
    AutonomousPerformance,
    TeleOpPerformance,
    EndgamePerformance,
    isValidMatchCode,
    DisconnectStatus
} from "../match";

export const kEmptyAuto: AutonomousPerformance = {
    hasCapstone: false,
    deliveredPreLoaded: false,
    ranCarousel: false,
    cyclesAttempted: 5,
    freightDelivered: 1,
    parked: ParkArea.WAREHOUSE
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
        hasCapstone: true,
        deliveredPreLoaded: true,
        ranCarousel: true,
        cyclesAttempted: 3,
        freightDelivered: 2,
        parked: ParkArea.STATION
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
        auto, teleop, endgame, DisconnectStatus.NO_DISCONNECT, "some remarks");

    expect(entry.matchCode).toBe('Q3');
    expect(entry.teamNumber).toBe(5273);
    expect(entry.alliance).toBe(AllianceColor.RED);
    expect(entry.auto).toBe(auto);
    expect(entry.teleOp).toBe(teleop);
    expect(entry.endgame).toBe(endgame);
    expect(entry.disconnect).toBe(DisconnectStatus.NO_DISCONNECT);
    expect(entry.remarks).toBe("some remarks");
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
    expect(() => new MatchEntry('bad', 4410, AllianceColor.BLUE, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame, DisconnectStatus.NO_DISCONNECT))
        .toThrowError('Match code "bad" is invalid');
});

test('MatchEntry metadata validation team number', () => {
    expect(() => new MatchEntry('Q13', 0, AllianceColor.RED, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame, DisconnectStatus.NO_DISCONNECT))
        .toThrowError('Team number 0 is invalid');
    expect(() => new MatchEntry('Q13', NaN, AllianceColor.RED, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame, DisconnectStatus.NO_DISCONNECT))
        .toThrowError('Invalid team number');
    expect(() => new MatchEntry('Q13', 1.5, AllianceColor.RED, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame, DisconnectStatus.NO_DISCONNECT))
        .toThrowError('Team number 1.5 is invalid');
});

test('MatchEntry points scored when fully disconnected', () => {
    expect(() => new MatchEntry('Q14', 10331, AllianceColor.BLUE, kEmptyAuto, {
        allianceStonesDelivered: 2,
        neutralStonesDelivered: 0,
        stonesPerLevel: []
    }, kEmptyEndgame, DisconnectStatus.TOTAL))
        .toThrowError('A totally disconnected team cannot score points');
})