import { entryKey } from "../local-storage"
import { MatchEntry, AllianceColor } from "../match"
import { kEmptyAuto, kEmptyTeleOp, kEmptyEndgame } from './match';

test('entry key includes match code and team number', () => {
    expect(entryKey(new MatchEntry('Q12', 12897, AllianceColor.BLUE, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame)))
        .toBe('Q12:12897');
});