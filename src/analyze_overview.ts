import { getAllMatches } from "./local-storage";
import { MatchEntry, ParkArea, ParkingResult, ScoringResult } from "./match";
import { createApp } from 'vue';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import * as ag from 'ag-grid-community';
import $ from 'jquery';
import { getFavoriteTeams, addFavoriteTeam, removeFavoriteTeam } from "./favorites";
import { collateMatchesByTeam } from "./utils";
import { stats } from "./stats";

export function getEntriesForTeam(teamNumber: number): Promise<MatchEntry[]> {
    return getAllMatches().then(matches => matches.filter(it => it.teamNumber === teamNumber));
}

interface TeamOverviewInsights {
    teamNumber: number;

    // autonomous
    autoDuckDeliveryAvg: number;
    preLoadedAvg: number;
    autoAshDeliveryAvg: number;
    autoParkAvg: number;
    autoTotalAvg: number;
    autoPenaltiesAvg: number;

    // teleop
    teleOpAshDeliveryAvg: number;
    sharedDeliveryAvg: number;
    storageUnitAvg: number;
    teleOpTotalAvg: number;
    teleOpPenaltiesAvg: number;

    // endgame
    endDuckDeliveryAvg: number;
    endTseCapAvg: number;
    endAshBalanceAvg: number;
    endParkAvg: number;
    endTotalAvg: number;
    endPenaltiesAvg: number;

    averageContribution: number;
    // a penalty-free Freight Frenzy match is rare in Massachusetts :')
    penaltiesAvg: number;
}

export function analyzeOverview(entries: MatchEntry[]): TeamOverviewInsights {
    function reliability(results: ScoringResult[]): number {
        return 1 - stats.count(results, ScoringResult.FAILED) / results.length;
    }
    function autoParkToNumber(entry: MatchEntry): number {
        switch (entry.auto.parked) {
            case ParkArea.CIN_STORAGE_UNIT, ParkArea.CIN_WAREHOUSE:
                return 1;
            case ParkArea.PIN_STORAGE_UNIT, ParkArea.PIN_WAREHOUSE:
                return 0.5;
            default:
                return 0;
        }
    }

    return {
        teamNumber: entries[0].teamNumber,
        autoDuckDeliveryAvg: reliability(entries.map(e => e.auto.deliveredCarouselDuck)),
        preLoadedAvg: reliability(entries.map(e => e.auto.deliveredPreLoaded)),
        autoAshDeliveryAvg: stats.average(entries.map(e => stats.sum(e.auto.freightScoredPerLevel))),
        autoParkAvg: stats.average(entries.map(autoParkToNumber)),
        autoTotalAvg: stats.average(entries.map(entry => entry.getAutonomousScore())),
        autoPenaltiesAvg: stats.average(entries.map(e => MatchEntry.pointsPenalizedDuring(e.auto))),

        teleOpAshDeliveryAvg: stats.average(entries.map(e => stats.sum(e.teleOp.freightScoredPerLevel))),
        sharedDeliveryAvg: stats.average(entries.map(e => e.teleOp.freightScoredOnSharedHub)),
        storageUnitAvg: stats.average(entries.map(e => e.teleOp.freightScoredInStorageUnit)),
        teleOpTotalAvg: stats.average(entries.map(entry => entry.getTeleOpScore())),
        teleOpPenaltiesAvg: stats.average(entries.map(e => MatchEntry.pointsPenalizedDuring(e.teleOp))),

        endDuckDeliveryAvg: stats.average(entries.map(e => e.endgame.ducksDelivered)),
        endAshBalanceAvg: stats.average(entries.map(e => e.endgame.allianceHubTipped ? 0 : 1)),
        // DID_NOT_TRY is considered failed here because time budgeting is a skill being assessed/ranked
        endTseCapAvg: stats.average(entries.map(e => e.endgame.tseScored === ScoringResult.SCORED ? 1 : 0)),
        endParkAvg: stats.average(entries.map(e => e.endgame.parked === ParkingResult.COMPLETELY_IN ? 1 : (e.endgame.parked === ParkingResult.PARTIALLY_IN ? 0.5 : 0))),
        endTotalAvg: stats.average(entries.map(entry => entry.getEndgameScore())),
        endPenaltiesAvg: stats.average(entries.map(e => MatchEntry.pointsPenalizedDuring(e.endgame))),

        averageContribution: stats.average(entries.map(entry => entry.getTotalScore())),
        penaltiesAvg: stats.average(entries.map(e =>
            MatchEntry.pointsPenalizedDuring(e.auto) + MatchEntry.pointsPenalizedDuring(e.teleOp) + MatchEntry.pointsPenalizedDuring(e.endgame)))
    };
}

function renderOverviewInsights(insights: TeamOverviewInsights[]) {
    const columns: {headerName: string, field: keyof TeamOverviewInsights, sortable: boolean, cellStyle?: any, minWidth?: number}[] = [
        { headerName: 'Team', field: 'teamNumber', sortable: true, cellStyle: { fontWeight: 'bold' }, minWidth: 80 },
        { headerName: 'A.Duck', field: 'autoDuckDeliveryAvg', sortable: true },
        { headerName: 'A.Preload', field: 'preLoadedAvg', sortable: true },
        { headerName: 'A.Hub Avg', field: 'autoAshDeliveryAvg', sortable: true },
        { headerName: 'A.Park', field: 'autoParkAvg', sortable: true },
        { headerName: 'A.Avg', field: 'autoTotalAvg', sortable: true, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'A.Penalties Avg', field: 'autoPenaltiesAvg', sortable: true, cellStyle: { fontWeight: 'bold', color: 'red' } },
        { headerName: 'ASH Avg', field: 'teleOpAshDeliveryAvg', sortable: true },
        { headerName: 'Shared Hub Avg', field: 'sharedDeliveryAvg', sortable: true },
        { headerName: 'Storage Unit Avg', field: 'storageUnitAvg', sortable: true },
        { headerName: 'T.Avg', field: 'teleOpTotalAvg', sortable: true, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'T.Penalties Avg', field: 'teleOpPenaltiesAvg', sortable: true, cellStyle: { fontWeight: 'bold', color: 'red' } },
        { headerName: 'E.Duck', field: 'endDuckDeliveryAvg', sortable: true },
        { headerName: 'E.TSE', field: 'endTseCapAvg', sortable: true },
        // ASH balance omitted
        { headerName: 'E.Park', field: 'endParkAvg', sortable: true },
        { headerName: 'Endgame Avg', field: 'endTotalAvg', sortable: true, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Endgame Penalties Avg', field: 'endPenaltiesAvg', sortable: true, cellStyle: { fontWeight: 'bold', color: 'red' } },
        { headerName: 'OPR', field: 'averageContribution', sortable: true, cellStyle: { fontWeight: 'bold' } },
        { headerName: 'Penalized Avg', field: 'penaltiesAvg', sortable: true, cellStyle: { fontWeight: 'bold', color: 'red' } }
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
    const favorites = await getFavoriteTeams();
    const availableTeams = allTeams.filter(it => favorites.indexOf(it) === -1);
    createApp({
        data: () => ({
            teams: favorites,
            allTeams: availableTeams,
            newFavorite: availableTeams[0]
        }),
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
    }).mount('#favorites');
}