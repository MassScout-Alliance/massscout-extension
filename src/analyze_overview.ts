import { getAllMatches } from "./local-storage";
import { MatchEntry, ScoringResult, StoneType } from "./match";
import * as $ from 'jquery';

export function getEntriesForTeam(teamNumber: number): Promise<MatchEntry[]> {
    return getAllMatches().then(matches => matches.filter(it => it.teamNumber === teamNumber));
}

interface TeamOverviewInsights {
    teamNumber: number;

    // autonomous
    skystoneDeliveryAverage: number;
    stoneDeliveryAverage: number;
    repositionAverage: number;
    navigateAverage: number;

    // teleop
    allianceSpecificDeliveryAverage: number;
    neutralDeliveryAverage: number;
    placementAverage: number;
    stackAverage: number;
    stackMax: number;

    // endgame
    endRepositionAverage: number;
    capstoneAverage: number;
    capstoneMaxLevel: number;
    parkAverage: number;

    averageContribution: number;
}

export function analyzeOverview(entries: MatchEntry[]): TeamOverviewInsights {
    function reliability(results: ScoringResult[]): number {
        return count(results, ScoringResult.SCORED) / results.length;
    }
    function average(results: number[]): number {
        if (results.length === 0) return -1;
        return results.reduce((a, b) => a + b) / results.length;
    }
    function count<T>(set: T[], desired: T): number {
        return set.filter(it => it === desired).length;
    }
    function max(set: number[]): number {
        return set.reduce((a, b) => Math.max(a, b), 0);
    }

    return {
        teamNumber: entries[0].teamNumber,
        skystoneDeliveryAverage: average(entries.map(entry => count(entry.auto.deliveredStones, StoneType.SKYSTONE))),
        stoneDeliveryAverage: average(entries.map(entry => count(entry.auto.deliveredStones, StoneType.STONE))),
        repositionAverage: reliability(entries.map(entry => entry.auto.movedFoundation)),
        navigateAverage: reliability(entries.map(entry => entry.auto.parked)),

        allianceSpecificDeliveryAverage: average(entries.map(entry => entry.teleOp.allianceStonesDelivered)),
        neutralDeliveryAverage: average(entries.map(entry => entry.teleOp.neutralStonesDelivered)),
        placementAverage: average(entries.map(entry => entry.teleOp.stonesPerLevel.reduce((a, b) => a + b, 0))),
        stackAverage: average(entries.map(entry => entry.teleOp.stonesPerLevel.length)),
        stackMax: max(entries.map(entry => entry.teleOp.stonesPerLevel.length)),

        endRepositionAverage: reliability(entries.map(entry => entry.endgame.movedFoundation)),
        capstoneAverage: average(entries.map(entry => entry.endgame.capstoneLevel === undefined ? 0 : 1)),
        capstoneMaxLevel: max(entries.map(entry => entry.endgame.capstoneLevel || 0)),
        parkAverage: reliability(entries.map(entry => entry.endgame.parked)),

        averageContribution: average(entries.map(entry => entry.getTotalScore()))
    };
}

export function collateMatchesByTeam(entries: MatchEntry[]): {[team: number]: MatchEntry[]} {
    const output = {};
    for (let entry of entries) {
        if (entry.teamNumber in output) {
            output[entry.teamNumber].push(entry);
        } else {
            output[entry.teamNumber] = [entry];
        }
    }
    return output;
}

function renderOverviewInsights(insights: TeamOverviewInsights[]) {
    function htmlForRow(insights: TeamOverviewInsights): string {
        return `<tr>
                    <td>${insights.teamNumber}</td>
                    <td>${insights.skystoneDeliveryAverage + insights.stoneDeliveryAverage}</td>
                    <td>${insights.repositionAverage}</td>
                    <td>${insights.navigateAverage}</td>
                    <td>${insights.allianceSpecificDeliveryAverage}</td>
                    <td>${insights.neutralDeliveryAverage}</td>
                    <td>${insights.placementAverage}</td>
                    <td>${insights.stackAverage}</td>
                    <td>${insights.stackMax}</td>
                    <td>${insights.endRepositionAverage}</td>
                    <td>${insights.capstoneAverage /* we are missing capstone max level */}</td>
                    <td>${insights.parkAverage}</td>
                    <td>${insights.averageContribution}</td>
                </tr>`;
    }
    const root = $('tbody');
    let contents = "";

    for (let insight of insights) {
        contents += htmlForRow(insight);
    }
    root.html(contents);
}

$(() => {
    getAllMatches().then(entries => {
        const teamInsights = collateMatchesByTeam(entries);
        const teams = Object.keys(teamInsights).map(item => parseInt(item)).sort();

        console.log(teamInsights);
        renderOverviewInsights(teams.map(team => teamInsights[team]).map(analyzeOverview));
    });
});