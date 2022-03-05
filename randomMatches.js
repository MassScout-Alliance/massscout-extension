// seed has { auto: { alliance: 0 to 1, duck: 0 to 1, preloaded: 0 to 1, park: -1 to 1 }, teleOp: { alliance: 0 to 1, shared: 0 to 1 }, endgame: { duck: 0 to 1, park: 0 to 1, tse: 0 to 1 }, penalties: 0 to 1 }

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
        const discriminator = Math.random();
        
    }
    return {
        alliance,
        auto: {
            deliveredCarouselDuck: Math.random() < seed.auto.carousel ? 1 : 0,
            deliveredPreLoaded: Math.random() < seed.auto.preloaded ? 1 : 0,
            freightScoredInStorageUnit: 0,
            freightScoredPerLevel: [0, 0, Math.floor(Math.random() * seed.auto.alliance * 8)],
            parked: autoPark,
            usedTse: Math.random() < 0.8 ? 1 : 0,
            warningsPenalties: [0, 0, 0]
        },
        disconnect: 0,
        "endgame": {
            "allianceHubTipped": 0,
            "duckDeliveryAttempted": false,
            "ducksDelivered": 0,
            "parked": -1,
            "sharedHubTipped": 0,
            "tseScored": 0,
            "warningsPenalties": [
                0,
                0,
                0
            ]
        },
        "matchCode": "Q24",
        "teamNumber": 5273,
        "teleOp": {
            "freightInStorageUnit": 0,
            "freightScoredOnSharedHub": 0,
            "freightScoredPerLevel": [
                0,
                0,
                3
            ],
            "warningsPenalties": [
                0,
                0,
                0
            ]
        }
    }
}