import { entryKey } from "../local-storage"
import { MatchEntry, AllianceColor, DisconnectStatus } from "../match"
import { kEmptyAuto, kEmptyTeleOp, kEmptyEndgame } from './match';

test('entry key includes match code and team number', () => {
    expect(entryKey(new MatchEntry('Q12', 12897, AllianceColor.BLUE, kEmptyAuto, kEmptyTeleOp, kEmptyEndgame, DisconnectStatus.PARTIAL)))
        .toBe('Q12:12897');
});