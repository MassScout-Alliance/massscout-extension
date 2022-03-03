import {
    MatchEntry,
    AllianceColor,
    ScoringResult,
    ParkArea,
    AutonomousPerformance,
    TeleOpPerformance,
    EndgamePerformance,
    isValidMatchCode,
    DisconnectStatus,
    HubState,
    ParkingResult
} from "../match";

export const kEmptyAuto: AutonomousPerformance = {
    usedTse: ScoringResult.DID_NOT_TRY,
    deliveredPreLoaded: ScoringResult.DID_NOT_TRY,
    deliveredCarouselDuck: ScoringResult.DID_NOT_TRY,
    cyclesAttempted: 0,
    freightScoredPerLevel: [0, 0, 0],
    freightScoredInStorageUnit: 0,
    parked: ParkArea.NOT_PARKED,
    warningsPenalties: [0, 0, 0]
};

export const kEmptyTeleOp: TeleOpPerformance = {
    freightScoredOnSharedHub: 0,
    freightInStorageUnit: 0,
    freightScoredPerLevel: [0, 0, 0],
    warningsPenalties: [0, 0, 0]
};

export const kEmptyEndgame: EndgamePerformance = {
    duckDeliveryAttempted: false,
    ducksDelivered: 0,
    allianceHubTipped: HubState.BALANCED,
    sharedHubTipped: HubState.BALANCED,
    parked: ParkingResult.DID_NOT_TRY,
    tseScored: ScoringResult.DID_NOT_TRY,
    warningsPenalties: [0, 0, 0]
};

test('MatchEntry constructor', () => {
    const auto: AutonomousPerformance = {
        usedTse: ScoringResult.DID_NOT_TRY,
        deliveredPreLoaded: ScoringResult.SCORED,
        deliveredCarouselDuck: ScoringResult.SCORED,
        cyclesAttempted: 4,
        freightScoredPerLevel: [0, 0, 4],
        freightScoredInStorageUnit: 2,
        parked: ParkArea.PIN_WAREHOUSE,
        warningsPenalties: [2, 1, 1]
    };
    const teleop: TeleOpPerformance = {
        freightScoredOnSharedHub: 9,
        freightInStorageUnit: 1,
        freightScoredPerLevel: [0, 3, 14], //TODO: add the auto scored freight to this
        warningsPenalties: [1, 0, 0]
    };
    const endgame: EndgamePerformance = {
        duckDeliveryAttempted: true,
        ducksDelivered: 9,
        allianceHubTipped: HubState.TIPPED,
        sharedHubTipped: HubState.TIPPED_OPP,
        parked: ParkingResult.DID_NOT_TRY,
        tseScored: ScoringResult.DID_NOT_TRY,
        warningsPenalties: [0, 0, 0]
    }
    const entry = new MatchEntry('Q3', 5273, AllianceColor.RED,
        auto, teleop, endgame, DisconnectStatus.NO_DISCONNECT, "a remark that this team is the 6th best in the team, very sus if I do say so myself");

    expect(entry.matchCode).toBe('Q3');
    expect(entry.teamNumber).toBe(5273);
    expect(entry.alliance).toBe(AllianceColor.RED);
    expect(entry.auto).toBe(auto);
    expect(entry.teleOp).toBe(teleop);
    expect(entry.endgame).toBe(endgame);
    expect(entry.disconnect).toBe(DisconnectStatus.NO_DISCONNECT);
    expect(entry.remarks).toBe("a remark that this team is the 6th best in the team, very sus if I do say so myself");
});


test('MatchEntry 8644 Robostorm F1', () => {
    const auto: AutonomousPerformance = {
        usedTse: ScoringResult.SCORED,
        deliveredPreLoaded: ScoringResult.SCORED,
        deliveredCarouselDuck: ScoringResult.DID_NOT_TRY,
        cyclesAttempted: 7,
        freightScoredPerLevel: [0, 2, 4],
        freightScoredInStorageUnit: 0,
        parked: ParkArea.CIN_WAREHOUSE,
        warningsPenalties: [0, 3, 0]
    };
    const teleop: TeleOpPerformance = {
        freightScoredOnSharedHub: 11,
        freightInStorageUnit: 0,
        freightScoredPerLevel: [0, 0, 1], //TODO: add the auto scored freight to this
        warningsPenalties: [0, 0, 0]
    };
    const endgame: EndgamePerformance = {
        duckDeliveryAttempted: false,
        ducksDelivered: 0,
        allianceHubTipped: HubState.TIPPED,
        sharedHubTipped: HubState.TIPPED,
        parked: ParkingResult.COMPLETELY_IN,
        tseScored: ScoringResult.SCORED,
        warningsPenalties: [0, 0, 0]
    }
    const entry = new MatchEntry('F1', 8644, AllianceColor.RED,
        auto, teleop, endgame, DisconnectStatus.NO_DISCONNECT, "feat. vismay mc and crj");

    expect(entry.matchCode).toBe('F1');
    expect(entry.teamNumber).toBe(8644);
    expect(entry.alliance).toBe(AllianceColor.RED);
    expect(entry.disconnect).toBe(DisconnectStatus.NO_DISCONNECT);
    expect(entry.getAutonomousScore()).toEqual(20 + 6*6 + 10 - 30);
    expect(entry.getTeleOpScore()).toEqual(4 * 11 + 6 + 2*4 + 4*6);
    expect(entry.getEndgameScore()).toEqual(20 + 6 + 15);
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
        freightScoredOnSharedHub: 2,
        freightInStorageUnit: 0,
        freightScoredPerLevel: [0, 0, 0],
        warningsPenalties: [0, 0, 0]
    }, kEmptyEndgame, DisconnectStatus.TOTAL))
        .toThrowError('A totally disconnected team cannot score points');
})