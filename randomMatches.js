// seed has { auto: { alliance: 0 to 1, duck: 0 to 1, preloaded: 0 to 1, park: -1 to 1 }, teleOp: { alliance: 0 to 1, shared: 0 to 1 }, endgame: { duck: 0 to 1, park: 0 to 1, tse: 0 to 1 }, penalties: 0 to 1 }
const teamList = [
    1,
    3565,
    4029,
    4096,
    4410,
    5273,
    5397,
    5436,
    5897,
    6040,
    6055,
    8227,
    8379,
    9006,
    9326,
    10331,
    12589,
    13406,
    13620,
    14079,
    14273,
    14506,
    17195,
    17218,
    18224,
    18438,
    18754,
    19397,
    19411,
    20340,
    20409,
    20748
]

const seeds = {
    4410: {
        auto: {
            alliance: 0.2,
            duck: 0.7,
            preloaded: 0.4,
            park: 0.9
        },
        teleOp: {
            alliance: 0.47,
            shared: 0.7
        },
        endgame: {
            duck: 0.6,
            park: 0.9,
            tse: 0.1,
        },
        penalties: 0.45
    },
    5273: {
        auto: {
            alliance: 0.4,
            duck: 0.75,
            preloaded: 0.8,
            park: 0.7
        },
        teleOp: {
            alliance: 0.78,
            shared: 0.5
        },
        endgame: {
            duck: 0.85,
            park: 0.77,
            tse: 0,
        },
        penalties: 0.6
    },
    10331: {
        auto: {
            alliance: 0.1,
            duck: 0.6,
            preloaded: 0.5,
            park: 0.8
        },
        teleOp: {
            alliance: 0.35,
            shared: 0.45
        },
        endgame: {
            duck: 0.4,
            park: 0.8,
            tse: 0.1
        },
        penalties: 0.3
    }
}

function generateEntry(team, seed) {
    const alliance = Math.random() > 0.5 ? 0 : 1;
    let autoPark = 0;
    if (Math.random() < 0.8) {
        // attempted
        // 1 2 3, 4 5 6
        const discriminator = Math.random();
        const total = discriminator < Math.abs(seed.auto.park);
        const partial = discriminator < Math.sqrt(Math.abs(seed.auto.park));
        const su = Math.random() < 0.5;
        if (total) autoPark = su ? 6 : 3;
        else if (partial) autoPark = su ? 5 : 2;
        else autoPark = su ? 4 : 1;
    }

    function genPenalties() {
        // 1: 0-3 minors, 0-1 major
        // 0.5: 0-1.5 minors, 0-0.5 major
        const minors = Math.floor(Math.random() * 3 * seed.penalties);
        const majors = Math.floor(Math.random() * 1.5 * seed.penalties);
        return [0, minors, majors];
    }

    const ashAuto = [0, 0, Math.floor(Math.random() * seed.auto.alliance * 8)];
    const sharedHubDuty = Math.random() < (0.5 + (seed.teleOp.shared - seed.teleOp.alliance) / 2);
    const ashTeleOp = sharedHubDuty ? [0, 0, 0] : [0, Math.floor(Math.random() * seed.teleOp.alliance * 3), Math.floor(Math.random() * seed.auto.alliance * 8)];
    const ashTotal = [...ashAuto, ...ashTeleOp].reduce((a, b) => a + b, 0);
    const endDuckDuty = Math.random() < 0.7;
    const endDucks = endDuckDuty ? Math.floor(Math.random() * 10 * seed.endgame.duck) : 0;
    const sharedHub = sharedHubDuty ? Math.floor(Math.random() * 8 * seed.teleOp.shared) : 0;

    return {
        alliance,
        auto: {
            deliveredCarouselDuck: Math.random() < seed.auto.carousel ? 1 : 0,
            deliveredPreLoaded: Math.random() < seed.auto.preloaded ? 1 : 0,
            freightScoredInStorageUnit: 0,
            freightScoredPerLevel: ashAuto,
            parked: autoPark,
            usedTse: Math.random() < 0.8 ? 1 : 0,
            warningsPenalties: genPenalties()
        },
        disconnect: 0,
        endgame: {
            allianceHubTipped: ashTotal > 6 ? (Math.random() < 0.7 ? 1 : 0) : 0,
            duckDeliveryAttempted: endDuckDuty,
            ducksDelivered: endDucks,
            parked: Math.random() < seed.endgame.park ? 1 : -1,
            sharedHubTipped: Math.random() < sharedHub / 10 ? 1 : (Math.random() < 0.3 ? -1 : 0),
            tseScored: Math.random() < 0.2 ? 0 : (Math.random() < seed.endgame.tse ? 1 : -1),
            warningsPenalties: genPenalties()
        },
        matchCode: "Q" + Math.floor(Math.random() * 32 * 5 / 4),
        teamNumber: team,
        teleOp: {
            freightScoredInStorageUnit: Math.floor(Math.random() * 3),
            freightScoredOnSharedHub: sharedHub,
            freightScoredPerLevel: ashTeleOp,
            warningsPenalties: genPenalties()
        }
    }
}

const numMatches = 24;
const seedEntries = Object.entries(seeds);
const out = [];
for (let i = 0; i < numMatches; ++i) {
    const team = Object.keys(seeds)[Math.floor(i / numMatches * Object.keys(seeds).length)];
    out.push(generateEntry(parseInt(team), seeds[team]));
}
console.log(JSON.stringify(out));