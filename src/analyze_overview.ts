import { getAllMatches } from "./local-storage";
import { MatchEntry, ScoringResult } from "./match";
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import * as ag from 'ag-grid-community';
import * as $ from 'jquery';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from "./favorites";
import { collateMatchesByTeam } from "./utils";

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
    averageAutoTotal: number;

    // teleop
    allianceSpecificDeliveryAverage: number;
    neutralDeliveryAverage: number;
    placementAverage: number;
    stackAverage: number;
    stackMax: number;
    averageTeleOpTotal: number;

    // endgame
    endRepositionAverage: number;
    capstoneAverage: number;
    capstoneMaxLevel: number;
    parkAverage: number;
    averageEndgameTotal: number;

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
        averageAutoTotal: average(entries.map(entry => entry.getAutonomousScore())),

        allianceSpecificDeliveryAverage: average(entries.map(entry => entry.teleOp.allianceStonesDelivered)),
        neutralDeliveryAverage: average(entries.map(entry => entry.teleOp.neutralStonesDelivered)),
        placementAverage: average(entries.map(entry => entry.teleOp.stonesPerLevel.reduce((a, b) => a + b, 0))),
        stackAverage: average(entries.map(entry => entry.teleOp.stonesPerLevel.length)),
        stackMax: max(entries.map(entry => entry.teleOp.stonesPerLevel.length)),
        averageTeleOpTotal: average(entries.map(entry => entry.getTeleOpScore())),

        endRepositionAverage: reliability(entries.map(entry => entry.endgame.movedFoundation)),
        capstoneAverage: average(entries.map(entry => entry.endgame.capstoneLevel === undefined ? 0 : 1)),
        capstoneMaxLevel: max(entries.map(entry => entry.endgame.capstoneLevel || 0)),
        parkAverage: reliability(entries.map(entry => entry.endgame.parked)),
        averageEndgameTotal: average(entries.map(entry => entry.getEndgameScore())),

        averageContribution: average(entries.map(entry => entry.getTotalScore()))
    };
}

function renderOverviewInsights(insights: TeamOverviewInsights[]) {
    const columns = [
        {headerName: 'Team', field: 'teamNumber', sortable: true, cellStyle: {fontWeight: 'bold'}, minWidth: 80},
        {headerName: 'Skystone Avg', field: 'skystoneDeliveryAverage', sortable: true},
        {headerName: 'Stone Avg', field: 'stoneDeliveryAverage', sortable: true},
        {headerName: 'Auto Foundation', field: 'repositionAverage', sortable: true},
        {headerName: 'Navigate', field: 'navigateAverage', sortable: true},
        {headerName: 'Auto Average', field: 'averageAutoTotal', sortable: true, cellStyle: {fontWeight: 'bold'}},
        {headerName: 'A-S Delivery', field: 'allianceSpecificDeliveryAverage', sortable: true},
        {headerName: 'A-N Delivery', field: 'neutralDeliveryAverage', sortable: true},
        {headerName: 'Placement', field: 'placementAverage', sortable: true},
        {headerName: 'Stack Avg', field: 'stackAverage', sortable: true},
        {headerName: 'Stack Max', field: 'stackMax', sortable: true},
        {headerName: 'TeleOp Average', field: 'averageTeleOpTotal', sortable: true, cellStyle: {fontWeight: 'bold'}},
        {headerName: 'End Foundation', field: 'endRepositionAverage', sortable: true},
        {headerName: 'Capstone Avg', field: 'capstoneAverage', sortable: true},
        {headerName: 'Capstone Max Lvl', field: 'capstoneMaxLevel', sortable: true},
        {headerName: 'End Park', field: 'parkAverage', sortable: true},
        {headerName: 'End Average', field: 'averageEndgameTotal', sortable: true, cellStyle: {fontWeight: 'bold'}},
        {headerName: 'Avg Cont.', field: 'averageContribution', sortable: true, cellStyle: {fontWeight: 'bold'}}
    ];
    
    new ag.Grid(document.getElementById('table')!, {
        columnDefs: columns,
        rowData: insights,
        pagination: true,
        onFirstDataRendered: it => it.api.sizeColumnsToFit()
    });
}

function populateTeams(teams: number[]) {
    const select = $('#team_number');
    for (let team of teams) {
        select.append(`<option>${team}</option>`);
    }
}

getAllMatches().then(entries => {
    const teamInsights = collateMatchesByTeam(entries);
    const teams = Object.keys(teamInsights).map(item => parseInt(item)).sort((a, b) => a - b);

    setupFavorites(teams);
    $(() => {
        populateTeams(teams);
        renderOverviewInsights(teams.map(team => teamInsights[team]).map(analyzeOverview));
    });
});

async function setupFavorites(allTeams: number[]) { 
    const Vue = (await import('vue')).default;
    const favorites = await getFavoriteTeams();
    const availableTeams = allTeams.filter(it => favorites.indexOf(it) === -1);
    new Vue({
        el: '#favorites',
        data: {
            teams: favorites,
            allTeams: availableTeams,
            newFavorite: availableTeams[0]
        },
        methods: {
            addFavorite(team: string) {
                const teamNum = parseInt(team);
                if (isNaN(teamNum)) {
                    alert(`Invalid team number: ${team}`);
                    return;
                }
                addFavoriteTeam(teamNum)
                    .then(() => {
                        this.teams.push(teamNum);
                        this.allTeams.splice(this.allTeams.indexOf(teamNum), 1);
                        this.newFavorite = this.allTeams[0];
                    })
                    .catch(alert);
            },
            removeFavorite(team: string) {
                const teamNum = parseInt(team);
                if (isNaN(teamNum)) {
                    alert(`Invalid team number: ${team}`);
                    return;
                }
                removeFavoriteTeam(teamNum)
                    .then(() => {
                        this.teams.splice(this.teams.indexOf(teamNum), 1);
                        this.allTeams.push(teamNum);
                        this.allTeams.sort((a, b) => a - b);
                    });
            }
        }
    });
}