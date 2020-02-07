import { kImportStrategies, convertExcelFormat, extractMatchPairings } from '../import';
import { AllianceColor, StoneType, ScoringResult } from '../match';

test('Import normal Excel pairings', () => {
    const pairings = {
        'Match #': 18,
        Alliance: 'Blue',
        '# of cyc. attempt': 1,
        '# of Stones deliver': 1,
        '# of sky delivered': 0,
        '# placed found': 1,
        'Auto Park': 'Y',
        'Auto Found': 'Y',
        'Ally Cyc.': 5,
        'Center Cyc.': 0,
        'End Found': 'N',
        Capped: 'N',
        'End Park': 'Y',
        L1: 2,
        L2: 1,
        L3: 1,
        L4: 1,
        L5: 1,
        L6: 0,
        L7: 0,
        L8: 0,
        L9: 0,
        L10: 0,
        'Average Pts': 47
    };
    const entry = convertExcelFormat(pairings, 14875);

    expect(entry.matchCode).toBe("Q18");
    expect(entry.alliance).toBe(AllianceColor.BLUE);
    expect(entry.teamNumber).toBe(14875);
    expect(entry.auto.cyclesAttempted).toBe(1);
    expect(entry.auto.deliveredStones).toEqual([StoneType.STONE]);
    expect(entry.auto.stonesOnFoundation).toBe(1);
    expect(entry.auto.parked).toBe(ScoringResult.SCORED);
    expect(entry.auto.movedFoundation).toBe(ScoringResult.SCORED);
    expect(entry.teleOp.allianceStonesDelivered).toBe(5);
    expect(entry.teleOp.neutralStonesDelivered).toBe(0);
    expect(entry.endgame.movedFoundation).toBe(ScoringResult.FAILED);
    expect(entry.endgame.capstoneLevel).toBeUndefined();
    expect(entry.endgame.parked).toBe(ScoringResult.SCORED);
    expect(entry.teleOp.stonesPerLevel).toEqual([2, 1, 1, 1, 1]);
});

test('Import normal Excel pairings without stacking', () => {
    const pairings = {
        'Match #': 18,
        Alliance: 'Blue',
        '# of cyc. attempt': 1,
        '# of Stones deliver': 1,
        '# of sky delivered': 0,
        '# placed found': 1,
        'Auto Park': 'Y',
        'Auto Found': 'Y',
        'Ally Cyc.': 5,
        'Center Cyc.': 0,
        'End Found': 'N',
        Capped: 'N',
        'End Park': 'Y',
        L1: 0,
        L2: 0,
        L3: 0,
        L4: 0,
        L5: 0,
        L6: 0,
        L7: 0,
        L8: 0,
        L9: 0,
        L10: 0,
        'Average Pts': 47
    };
    const entry = convertExcelFormat(pairings, 14875);

    expect(entry.matchCode).toBe("Q18");
    expect(entry.alliance).toBe(AllianceColor.BLUE);
    expect(entry.teamNumber).toBe(14875);
    expect(entry.auto.cyclesAttempted).toBe(1);
    expect(entry.auto.deliveredStones).toEqual([StoneType.STONE]);
    expect(entry.auto.stonesOnFoundation).toBe(1);
    expect(entry.auto.parked).toBe(ScoringResult.SCORED);
    expect(entry.auto.movedFoundation).toBe(ScoringResult.SCORED);
    expect(entry.teleOp.allianceStonesDelivered).toBe(5);
    expect(entry.teleOp.neutralStonesDelivered).toBe(0);
    expect(entry.endgame.movedFoundation).toBe(ScoringResult.FAILED);
    expect(entry.endgame.capstoneLevel).toBeUndefined();
    expect(entry.endgame.parked).toBe(ScoringResult.SCORED);
    expect(entry.teleOp.stonesPerLevel).toEqual([]);
});

test('Extract matches from sheet', () => {
    const sheet = [
        {
            'Match #': 2,
            Alliance: 'Blue',
            '# of cyc. attempt': 1,
            '# of Stones deliver': 1,
            '# of sky delivered': 1,
            '# placed found': 0,
            'Auto Park': 'Y',
            'Auto Found': 'Y',
            'Ally Cyc.': 0,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'N',
            L1: 0,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 27,
            __EMPTY: 'Disconnected'
        },
        {
            'Match #': 7,
            Alliance: 'Blue',
            '# of cyc. attempt': 1,
            '# of Stones deliver': 0,
            '# of sky delivered': 1,
            '# placed found': 1,
            'Auto Park': 'Y',
            'Auto Found': 'Y',
            'Ally Cyc.': 0,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'N',
            L1: 1,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 32,
            __EMPTY: 'Disconnected'
        },
        {
            'Match #': 17,
            Alliance: 'Red',
            '# of cyc. attempt': 0,
            '# of Stones deliver': 0,
            '# of sky delivered': 0,
            '# placed found': 0,
            'Auto Park': 'Y',
            'Auto Found': 'N',
            'Ally Cyc.': 3,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'Y',
            L1: 0,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 13
        },
        {
            'Match #': 19,
            Alliance: 'Blue',
            '# of cyc. attempt': 0,
            '# of Stones deliver': 0,
            '# of sky delivered': 0,
            '# placed found': 0,
            'Auto Park': 'N',
            'Auto Found': 'N',
            'Ally Cyc.': 3,
            'Center Cyc.': 1,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'Y',
            L1: 2,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 12
        },
        {
            'Match #': 26,
            Alliance: 'Red',
            '# of cyc. attempt': 1,
            '# of Stones deliver': 0,
            '# of sky delivered': 1,
            '# placed found': 1,
            'Auto Park': 'N',
            'Auto Found': 'Y',
            'Ally Cyc.': 5,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'Y',
            L1: 4,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 40
        },
        { 'Average Pts': 0 },
        { 'Average Pts': 0 },
        { 'Average Pts': 0 },
        {
            '# of cyc. attempt': 0.6,
            '# of Stones deliver': 0.2,
            '# of sky delivered': 0.6,
            '# placed found': 0.4,
            'Auto Park': 'Y',
            'Auto Found': 'Y',
            'Ally Cyc.': 2.2,
            'Center Cyc.': 0.2,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'Y',
            L1: 1.4,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 24.8
        }
    ];

    const pairings = extractMatchPairings(sheet);
    expect(pairings).toEqual(sheet.slice(0, 5));
});

test('Extract fewer than 5 matches from sheet', () => {
    const sheet = [
        {
            'Match #': 1,
            Alliance: 'Blue',
            '# of cyc. attempt': 0,
            '# of Stones deliver': 0,
            '# of sky delivered': 0,
            '# placed found': 0,
            'Auto Park': 'N',
            'Auto Found': 'N',
            'Ally Cyc.': 3,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'N',
            L1: 3,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 8,
            __EMPTY: 'No auto'
        },
        {
            'Match #': 12,
            Alliance: 'Red',
            '# of cyc. attempt': 5,
            '# of Stones deliver': 0,
            '# of sky delivered': 0,
            '# placed found': 0,
            'Auto Park': 'N',
            'Auto Found': 'N',
            'Ally Cyc.': 0,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'N',
            L1: 0,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 0,
            __EMPTY: 'Disconnected'
        },
        {
            'Match #': 17,
            Alliance: 'Blue',
            '# of cyc. attempt': 3,
            '# of Stones deliver': 0,
            '# of sky delivered': 3,
            '# placed found': 0,
            'Auto Park': 'Y',
            'Auto Found': 'N',
            'Ally Cyc.': 3,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'N',
            L1: 2,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 42
        },
        {
            'Match #': 22,
            Alliance: 'Red',
            '# of cyc. attempt': 0,
            '# of Stones deliver': 0,
            '# of sky delivered': 0,
            '# placed found': 0,
            'Auto Park': 'N',
            'Auto Found': 'N',
            'Ally Cyc.': 4,
            'Center Cyc.': 0,
            'End Found': 'Y',
            Capped: 'N',
            'End Park': 'N',
            L1: 0,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 19
        },
        { 'Average Pts': 0 },
        { 'Average Pts': 0 },
        { 'Average Pts': 0 },
        { 'Average Pts': 0 },
        {
            '# of cyc. attempt': 2,
            '# of Stones deliver': 0,
            '# of sky delivered': 0.75,
            '# placed found': 0,
            'Auto Park': 'N',
            'Auto Found': 'N',
            'Ally Cyc.': 2.5,
            'Center Cyc.': 0,
            'End Found': 'N',
            Capped: 'N',
            'End Park': 'N',
            L1: 1.25,
            L2: 0,
            L3: 0,
            L4: 0,
            L5: 0,
            L6: 0,
            L7: 0,
            L8: 0,
            L9: 0,
            L10: 0,
            'Average Pts': 23
        }
    ];

    const pairings = extractMatchPairings(sheet);
    expect(pairings).toEqual(sheet.slice(0, 4));
})