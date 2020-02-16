import { Chart } from 'chart.js';
import { getAllMatches } from './local-storage';
import { MatchEntry, StoneType, ScoringResult } from './match';
import * as $ from 'jquery';
import { collateMatchesByTeam } from './analyze_overview';
import { stats } from './stats';

async function getTeamMatches(team: number): Promise<MatchEntry[]> {
    return (await getAllMatches()).filter(it => it.teamNumber === team);
}

function populateTeam(team: number) {
    $('#team-title').prepend(`Team ${team}`);
    $('title').append(' ' + team);
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
    console.log(contributions, myContribution);
    $('stat[rank]').text(`${ranking[0]}/${ranking[1]}`);
}

function populateAverageStat(id: string, set: number[]) {
    const avg = Math.round(stats.average(set) * 100) / 100;
    $(`#${id} .col-sm-4`).append(`AVG ${avg}`);
}

function populateAutonomous(matches: MatchEntry[]) {
    const extractSkystone = it => stats.count(it.auto.deliveredStones, StoneType.SKYSTONE);
    const extractStone = it => it.auto.deliveredStones.length;
    const matchCodes = matches.map(it => it.matchCode);
    const extractFoundation = it => it.auto.movedFoundation === ScoringResult.SCORED ? 1 : 0;
    const extractPark = it => it.auto.parked === ScoringResult.SCORED ? 1 : 0;

    // TODO move .map to above

    populateAverageStat('auto-skystone-row',
        matches.map(extractSkystone));
    renderBarGraph('auto-skystone', '# Skystones delivered',
        matchCodes, matches.map(extractSkystone));

    populateAverageStat('auto-stone-row',
        matches.map(extractStone));
    renderBarGraph('auto-stone', '# stones delivered',
        matchCodes, matches.map(extractStone));
    
    populateAverageStat('auto-foundation-row',
        matches.map(extractFoundation));
    renderBarGraph('auto-foundation', 'Foundation moved?',
        matchCodes, matches.map(extractFoundation))

    populateAverageStat('auto-navigate-row',
        matches.map(extractPark));
    renderBarGraph('auto-navigate', 'Navigated?',
        matchCodes, matches.map(extractPark));
}

function populateTeleOp(matches: MatchEntry[]) {
    const asDeliveryData = matches.map(it => it.teleOp.allianceStonesDelivered);
    const anDeliveryData = matches.map(it => it.teleOp.neutralStonesDelivered);
    const levelData = matches.map(it => it.teleOp.stonesPerLevel.length);
    const matchCodes = matches.map(it => it.matchCode);
    const placementData = matches.map(it => stats.sum(it.teleOp.stonesPerLevel));

    populateAverageStat('teleop-as-deliver-row', asDeliveryData);
    renderBarGraph('teleop-as-deliver', '# alliance delivered', matchCodes, asDeliveryData);
    
    populateAverageStat('teleop-an-deliver-row', anDeliveryData);
    renderBarGraph('teleop-an-deliver', '# neutral delivered', matchCodes, anDeliveryData);
    
    populateAverageStat('teleop-level-row', levelData);
    renderBarGraph('teleop-level', 'Skyscraper level', matchCodes, levelData);

    populateAverageStat('teleop-place-row', placementData);
    renderBarGraph('teleop-place', '# stones placed', matchCodes, placementData);
}

function populateEndgame(matches: MatchEntry[]) {
    const foundationData = matches.map(it => it.endgame.movedFoundation === ScoringResult.SCORED ? 1 : 0);
    const capstoneUseData = matches.map(it => it.endgame.capstoneLevel !== undefined ? 1 : 0);
    const capstoneMax = Math.max(...matches.map(it => it.endgame.capstoneLevel)
        .filter(it => it !== undefined) as number[]);
    const parkData = matches.map(it => it.endgame.parked === ScoringResult.SCORED ? 1 : 0);
    const matchCodes = matches.map(it => it.matchCode);

    populateAverageStat('endgame-foundation-row', foundationData);
    renderBarGraph('endgame-foundation', 'Foundation moved out?', matchCodes, foundationData);

    populateAverageStat('endgame-capstone-row', capstoneUseData);
    renderBarGraph('endgame-capstone', 'Capped?', matchCodes, capstoneUseData);

    $('#endgame-capstone-row .col-sm-4').append(`<br>MAX LVL ${capstoneMax == -Infinity ? 'N/A' : capstoneMax}`);

    populateAverageStat('endgame-park-row', parkData);
    renderBarGraph('endgame-park', 'Parked in Build Site?', matchCodes, parkData);
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
    skystoneOver: number;
    stoneOver: number;
    autoOver: number;

    deliveryOver: number;
    placementOver: number;
    maxHeightRank: number;
    teleOpOver: number;

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
    function qualify(ratio: number): string {
        const adjectives = [
            [0, 0.1, 'nonexistent'],
            [0.1, 0.25, 'very poor'],
            [0.25, 0.4, 'poor'],
            [0.4, 0.6, 'average'],
            [0.6, 0.75, 'fair'],
            [0.75, 0.85, 'good'],
            [0.85, 0.95, 'excellent'],
            [0.95, 0.99, 'outstanding'],
            [0.99, 1.1, 'perfect']
        ];
        for (let option of adjectives) {
            if (ratio >= option[0] && ratio < option[1]) {
                return option[2] as string;
            }
        }
        return 'impossible';
    }

    function expressPercentage(ratio: number): string {
        return `<b>${Math.round(ratio * 100)}%</b>`;
    }

    const messages: string[] = [];

    {
        const autoCycles = matches.map(it => it.auto.cyclesAttempted);
        const skystoneAttemptMax = Math.max(...autoCycles);
        const skystoneAttemptSum = stats.sum(autoCycles);
        const autoStones = new Array<StoneType>().concat(...matches.map(it => it.auto.deliveredStones));
        const autoSkystoneCount = stats.count(autoStones, StoneType.SKYSTONE);
        
        if (skystoneAttemptSum > 0) {
            messages.push(`<b>Autonomous</b>: For stone delivery, ${team} has ` +
                `attempted up to ${skystoneAttemptMax} stone(s) per match. For a total of ${skystoneAttemptSum} attempt(s),` +
                ` ${autoStones.length} stone(s) were delivered, ${autoSkystoneCount} of which were/was (a) Skystone(s). This results` +
                ` in an any-stone reliability rating of ${expressPercentage(autoStones.length / skystoneAttemptSum)}` +
                ` and a Skystone reliability rating of ${expressPercentage(autoSkystoneCount / skystoneAttemptSum)}.`);
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