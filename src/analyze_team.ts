import { Chart } from 'chart.js';
import { getAllMatches } from './local-storage';
import { MatchEntry, ParkArea, ParkingResult, ScoringResult } from './match';
import * as $ from 'jquery';
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
    // const extractSkystone = it => stats.count(it.auto.deliveredStones, StoneType.SKYSTONE);
    // const extractStone = it => it.auto.deliveredStones.length;
    // const matchCodes = matches.map(it => it.matchCode);
    // const extractFoundation = it => it.auto.movedFoundation === ScoringResult.SCORED ? 1 : 0;
    // const extractPark = it => it.auto.parked === ScoringResult.SCORED ? 1 : 0;

    // const skystones = matches.map(extractSkystone);
    // const stones = matches.map(extractStone);
    // const foundations = matches.map(extractFoundation);
    // const parks = matches.map(extractPark);

    // populateAverageStat('auto-skystone-row', skystones);
    // renderBarGraph('auto-skystone', '# Skystones delivered', matchCodes, skystones);

    // populateAverageStat('auto-stone-row', stones);
    // renderBarGraph('auto-stone', '# stones delivered', matchCodes, stones);
    
    // populateAverageStat('auto-foundation-row', foundations);
    // renderBarGraph('auto-foundation', 'Foundation moved?', matchCodes, foundations);

    // populateAverageStat('auto-navigate-row', parks);
    // renderBarGraph('auto-navigate', 'Navigated?', matchCodes, parks);
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
    freightOver: number;
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

    const extractSkystoneStat: (_: MatchEntry) => number = entry => stats.count(entry.auto.deliveredStones, StoneType.SKYSTONE);
    const extractStoneStat: (_: MatchEntry) => number = entry => entry.auto.deliveredStones.length;
    const comparativeRatio: (_: (_: MatchEntry) => number) => number = extractor =>
        stats.overRatio(allMatches.map(extractor), stats.average(teamMatches.map(extractor)));
    
    return {
        skystoneOver: comparativeRatio(extractSkystoneStat),
        stoneOver: comparativeRatio(extractStoneStat),
        autoOver: comparativeRatio(it => it.getAutonomousScore()),

        deliveryOver: comparativeRatio(it => it.teleOp.allianceStonesDelivered + it.teleOp.neutralStonesDelivered),
        placementOver: comparativeRatio(it => it.teleOp.stonesPerLevel.length),
        maxHeightRank: -1,
        teleOpOver: comparativeRatio(it => it.getTeleOpScore()),

        endgameOver: comparativeRatio(it => it.getEndgameScore())
    };
}

async function populateRelativeStats(team: number) {
    const stats = await relativeStats(team);
    new Chart('relative-rank', {
        type: 'radar',
        data: {
            labels: ['Auto Skystone', 'Auto any stone', 'Auto Total', 'Delivery', 'Placement', 'TeleOp Total', 'Endgame Total'],
            datasets: [
                {
                    label: `${team} vs event`,
                    data: [
                        stats.skystoneOver,
                        stats.stoneOver,
                        stats.autoOver,
                        stats.deliveryOver,
                        stats.placementOver,
                        stats.teleOpOver,
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

    {
        const autoCycles = matches.map(it => it.auto.cyclesAttempted);
        const autoSkystoneCycles = autoCycles.map(it => Math.min(2, it));
        const skystoneAttemptMax = Math.max(...autoCycles);
        const skystoneAttemptSum = stats.sum(autoCycles);
        const autoStones = new Array<StoneType>().concat(...matches.map(it => it.auto.deliveredStones));
        const autoSkystoneCount = stats.count(autoStones, StoneType.SKYSTONE);
        
        if (skystoneAttemptSum > 0) {
            messages.push(`<b>Autonomous</b>: For stone delivery, ${team} has ` +
                `attempted up to ${skystoneAttemptMax} stone(s) per match. For a total of ${skystoneAttemptSum} attempt(s),` +
                ` ${autoStones.length} stone(s) were delivered, ${autoSkystoneCount} of which were/was (a) Skystone(s). This results` +
                ` in an any-stone reliability rating of ${expressPercentage(autoStones.length / skystoneAttemptSum)}` +
                ` and a Skystone reliability rating of ${expressPercentage(autoSkystoneCount / stats.sum(autoSkystoneCycles))}.`);
        } else {
            messages.push(`<b>Autonomous</b>: ${team} never attempted to deliver stones.`);
        }
    }
    {
        const asDeliverySum = stats.sum(matches.map(it => it.teleOp.allianceStonesDelivered));
        const anDeliverySum = stats.sum(matches.map(it => it.teleOp.neutralStonesDelivered));
        const placementAvg = stats.average(matches.map(it => stats.sum(it.teleOp.stonesPerLevel)));
        const levels = matches.map(it => it.teleOp.stonesPerLevel.length);
        const maxLevel = Math.max(...levels);
        const avgLevel = stats.average(levels);

        const deliveryMessage = `They have delivered a total of ${asDeliverySum + anDeliverySum} stone(s) in ${matches.length} matches,` +
        `  ${asDeliverySum} (${expressPercentage(asDeliverySum / (asDeliverySum + anDeliverySum))}) of which were under ` +
        `the alliance-specific Skybridge. This results in an average of ${Math.round((asDeliverySum + anDeliverySum) / matches.length * 1000) / 1000} stone(s) delivered per match.`;
        const placementMessage = `They have placed an average of ${Math.round(placementAvg * 1000) / 1000} stone(s) on the foundation per match.` +
        ` Their maximum stacking level is ${maxLevel}, and their average stacking level is ${Math.round(avgLevel * 1000) / 1000}.`;

        if (relStats.deliveryOver < 0.3 && relStats.placementOver < 0.3) {
            messages.push(`<b>TeleOp</b>: ${team} does not seem to excel at either delivery or placement.`);
        } else if (Math.abs(relStats.deliveryOver - relStats.placementOver) > 0.3) {
            if (relStats.deliveryOver > relStats.placementOver) {
                messages.push(`<b>TeleOp</b>: ${team} seems to specialize in delivery. ${deliveryMessage}`);
            } else {
                messages.push(`<b>TeleOp</b>: ${team} seems to specialize in placement. ${placementMessage}`);
            }
        } else {
            messages.push(`<b>TeleOp</b>: ${team} seems to deliver and place similarly well. ${deliveryMessage} ${placementMessage}`);
        }
    }

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