import { Chart } from 'chart.js';
import { getAllMatches } from './local-storage';
import { MatchEntry, ParkArea, ParkingResult, ScoringResult } from './match';
import $ from 'jquery';
import { collateMatchesByTeam } from './utils';
import { stats } from './stats';
import { isFavoriteTeam } from './favorites';

async function getTeamMatches(team: number): Promise<MatchEntry[]> {
    return (await getAllMatches()).filter(it => it.teamNumber === team);
}

function populateTeam(team: number) {
    $('#team-title').text(`Team ${team}`);
    $('title').append(' ' + team);

    isFavoriteTeam(team).then(favorite => {
        if (favorite) {
            $('#favorite-badge').html('<span class="tooltip bottom" aria-label="Favorite team">⭐</span>');
        }
    });
}

async function populateTopStats(matches: MatchEntry[]) {
    function populateAverageTopStat(selector: string, extractor: (entry: MatchEntry) => number) {
        const avg = stats.average(matches.map(extractor));
        $(selector).text(Math.round(avg));
        return avg;
    }

    $('stat[match-count]').text(matches.length);

    populateAverageTopStat('stat[auto]', it => it.getAutonomousScore());
    populateAverageTopStat('stat[teleop]', it => it.getTeleOpScore());
    populateAverageTopStat('stat[endgame]', it => it.getEndgameScore());
    const myContribution = populateAverageTopStat('stat[total]', it => it.getTotalScore());

    const teams = collateMatchesByTeam(await getAllMatches());
    const contributions = Object.keys(teams).map(team =>
        stats.average(teams[team].map(entry => entry.getTotalScore())));

    const ranking = stats.rank(contributions, myContribution);
    $('stat[rank]').text(`${ranking[0]}/${ranking[1]}`);
}

function populateAverageStat(id: string, set: number[]) {
    const avg = Math.round(stats.average(set) * 100) / 100;
    $(`#${id} .col-sm-4`).append(`AVG ${avg}`);
}

function populateAutonomous(matches: MatchEntry[]) {
    const extractDuck = (it: MatchEntry) => it.auto.deliveredCarouselDuck === ScoringResult.SCORED ? 1 : 0;
    const extractPreLoaded = (it: MatchEntry) => it.auto.deliveredPreLoaded === ScoringResult.SCORED ? 1 : 0;
    const matchCodes = matches.map(it => it.matchCode);
    const extractCycles = (it: MatchEntry) => stats.sum(it.auto.freightScoredPerLevel);
    const extractParkWarehouse = (it: MatchEntry) =>
        it.auto.parked === ParkArea.CIN_WAREHOUSE ? 1 : (it.auto.parked === ParkArea.PIN_WAREHOUSE ? 0.5 : 0);
    const extractParkSU = (it: MatchEntry) =>
        it.auto.parked === ParkArea.CIN_STORAGE_UNIT ? 1 : (it.auto.parked === ParkArea.PIN_STORAGE_UNIT ? 0.5 : 0);
    
    const ducks = matches.map(extractDuck);
    const preLoads = matches.map(extractPreLoaded);
    const cycles = matches.map(extractCycles);
    const parkWarehouse = matches.map(extractParkWarehouse);
    const parkSu = matches.map(extractParkSU);

    populateAverageStat('auto-duck-row', ducks);
    renderBarGraph('auto-duck', 'Duck delivered?', matchCodes, ducks);

    populateAverageStat('auto-preload-row', preLoads);
    renderBarGraph('auto-preload', 'Preloaded freight delivered?', matchCodes, preLoads);
    
    populateAverageStat('auto-cycles-row', cycles);
    renderBarGraph('auto-cycles', '# Freight delivered to ASH', matchCodes, cycles);

    populateAverageStat('auto-park-warehouse-row', parkWarehouse);
    renderBarGraph('auto-park-warehouse', 'Parked in Warehouse?', matchCodes, parkWarehouse);
    
    populateAverageStat('auto-park-su-row', parkSu);
    renderBarGraph('auto-park-su', 'Parked in SU?', matchCodes, parkSu);
}

function populateTeleOp(matches: MatchEntry[]) {
    const storageUnitCounts = matches.map(it => it.teleOp.freightInStorageUnit);
    const sharedHubCounts = matches.map(it => it.teleOp.freightScoredOnSharedHub);
    const [lowCounts, midCounts, highCounts] = [0, 1, 2].map(index => matches.map(it => it.teleOp.freightScoredPerLevel[index]));
    const matchCodes = matches.map(it => it.matchCode);

    populateAverageStat('teleop-su-row', storageUnitCounts);
    renderBarGraph('teleop-su', '# placed in Storage Unit', matchCodes, storageUnitCounts);
    
    populateAverageStat('teleop-sh-row', sharedHubCounts);
    renderBarGraph('teleop-sh', '# placed on Shared Hub', matchCodes, sharedHubCounts);
    
    populateAverageStat('teleop-ash-low-row', lowCounts);
    renderBarGraph('teleop-ash-low', '# placed on ASH level 1', matchCodes, lowCounts);

    populateAverageStat('teleop-ash-mid-row', midCounts);
    renderBarGraph('teleop-ash-mid', '# placed on ASH level 2', matchCodes, midCounts);

    populateAverageStat('teleop-ash-high-row', highCounts);
    renderBarGraph('teleop-ash-high', '# placed on ASH level 3', matchCodes, highCounts);
}

function populateEndgame(matches: MatchEntry[]) {
    const duckCounts = matches.map(it => it.endgame.ducksDelivered);
    const tseCounts = matches.map(it => it.endgame.tseScored !== undefined ? 1 : 0);
    const warehouseParkData = matches.map(it => it.endgame.parked === ParkingResult.COMPLETELY_IN ? 1 :
        (it.endgame.parked === ParkingResult.PARTIALLY_IN ? 0.5 : 0));
    const matchCodes = matches.map(it => it.matchCode);

    populateAverageStat('endgame-duck-row', duckCounts);
    renderBarGraph('endgame-duck', '# ducks delivered', matchCodes, duckCounts);

    populateAverageStat('endgame-tse-row', tseCounts);
    renderBarGraph('endgame-tse', 'TSE capped?', matchCodes, tseCounts);

    populateAverageStat('endgame-park-row', warehouseParkData);
    renderBarGraph('endgame-park', 'Parked in Warehouse?', matchCodes, warehouseParkData);
}

function getSelectedTeam(): number|undefined {
    const url = new URL(window.location.href);
    const parameter = url.searchParams.get('team_number');

    if (parameter == null) return undefined;
    const number = parseInt(parameter);

    if (isNaN(number) || number == null) {
        return undefined;
    }
    return number;
}

function renderBarGraph(id: string, field: string, labels: string[], data: number[]) {
    return new Chart(id, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: field,
                    data: data,
                    backgroundColor: 'rgba(27, 60, 133, 0.7)'
                }
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

interface RelativeStatistics {
    preLoadedOver: number;
    autoDuckOver: number;
    autoOver: number;

    ashScoreOver: number;
    sharedScoreOver: number;
    teleOpOver: number;

    endgameDuckOver: number;
    endgameOver: number;
}

async function relativeStats(team: number): Promise<RelativeStatistics> {
    const allMatches = await getAllMatches();
    const teamMatches = allMatches.filter(it => it.teamNumber === team);

    const extractPreloaded: (_: MatchEntry) => number = entry => entry.auto.deliveredPreLoaded === ScoringResult.SCORED ? 1 : 0;
    const extractAutoDuck: (_: MatchEntry) => number = entry => entry.auto.deliveredCarouselDuck === ScoringResult.SCORED ? 1 : 0;
    const comparativeRatio: (_: (_: MatchEntry) => number) => number = extractor =>
        stats.overRatio(allMatches.map(extractor), stats.average(teamMatches.map(extractor)));
    
    return {
        preLoadedOver: comparativeRatio(extractPreloaded),
        autoDuckOver: comparativeRatio(extractAutoDuck),
        autoOver: comparativeRatio(it => it.getAutonomousScore()),

        ashScoreOver: comparativeRatio(it => it.getAshTotalScore()),
        sharedScoreOver: comparativeRatio(it => it.teleOp.freightInStorageUnit * 2),
        teleOpOver: comparativeRatio(it => it.getTeleOpScore()),

        endgameDuckOver: comparativeRatio(it => it.endgame.ducksDelivered),
        endgameOver: comparativeRatio(it => it.getEndgameScore())
    };
}

async function populateRelativeStats(team: number) {
    const stats = await relativeStats(team);
    new Chart('relative-rank', {
        type: 'radar',
        data: {
            labels: [
                'Auto Pre-loaded',
                'Auto Duck',
                'Auto Total',
                'Alliance Hub',
                'Shared Hub',
                'TeleOp Total',
                'Endgame Duck',
                'Endgame Total'
            ],
            datasets: [
                {
                    label: `${team} vs event`,
                    data: [
                        stats.preLoadedOver,
                        stats.autoDuckOver,
                        stats.autoOver,
                        stats.ashScoreOver,
                        stats.sharedScoreOver,
                        stats.teleOpOver,
                        stats.endgameDuckOver,
                        stats.endgameOver
                    ],
                    backgroundColor: 'rgba(27, 60, 133, 0.7)'
                }
            ]
        },
        options: {
            scale: {
                ticks: {
                    beginAtZero: true,
                    max: 1.0
                }
            }
        }
    });
    $('#describe').html(describeTeam(await getTeamMatches(team), team, stats));
}

function describeTeam(matches: MatchEntry[], team: number, relStats: RelativeStatistics): string {
    function expressPercentage(ratio: number): string {
        return `<b>${Math.round(ratio * 100)}%</b>`;
    }

    const messages: string[] = [];

    messages.push('not implemented for Freight Frenzy yet');

    return `<ul>${messages.map(it => `<li>${it}</li>`).join('')}</ul>`;
}

async function onLoad() {
    const team = getSelectedTeam();
    if (team === undefined) {
        alert('Missing team!');
        return;
    }

    const entries = await getTeamMatches(team);
    entries.sort((a, b) => parseInt(a.matchCode.slice(1)) - parseInt(b.matchCode.slice(1)));

    if (entries.length === 0) {
        alert(`Unknown team: ${team}`);
        return;
    }
    populateTeam(team);
    populateTopStats(entries);
    populateAutonomous(entries);
    populateTeleOp(entries);
    populateEndgame(entries);
    await populateRelativeStats(team);
}

$(onLoad);