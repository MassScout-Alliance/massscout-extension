import {createApp} from 'vue';
import Chart from 'chart.js/auto';
import {getAllMatches} from './local-storage';
import {MatchEntry, ScoringResult} from './match';
import {getFavoriteTeams} from './favorites';
import {stats} from './stats';
import { BoxPlotChart } from "@sgratzl/chartjs-chart-boxplot";

function renderBarGraph(id: string, field: string, labels: string[], data: number[], maxY?: number) {
    return new Chart(id, {
        type: 'bar',
        data: {
            labels,
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
                y: {
                    max: maxY,
                    beginAtZero: true
                }
            }
        }
    });
}

function renderCompareBoxplot(id: string, label: string, data: [number, number[]][]) {
    const palette = [
        '#a6cee3',
        '#1f78b4',
        '#b2df8a',
        '#33a02c',
        '#fb9a99',
        '#e31a1c',
        '#fdbf6f',
        '#ff7f00',
        '#cab2d6',
        '#6a3d9a',
        '#ffff99',
        '#b15928'
    ];
    return new BoxPlotChart(id, {
        data: {
            labels: data.map(i => i[0].toString()),
            datasets: [
                {
                    label,
                    data: data.map(i => i[1]),
                    backgroundColor: palette.slice(0, data.length),
                    borderWidth: 3,
                    borderColor: 'rgba(0,0,0,0.6)'
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: false
        },
    });
}

function renderTeamGraphs(team: number, entries: MatchEntry[], maxStats: MaxStatistics): Chart[] {
    const matches = entries.filter(it => it.teamNumber === team);
    const labels = matches.map(it => it.matchCode);

    // Duck delivery attempted
    const ddaMatches = matches.filter(it => it.endgame.duckDeliveryAttempted);
    const ddaLabels = ddaMatches.map(it => it.matchCode);
    return [
        renderBarGraph(`graph-auto-ash-${team}`, 'Freight scored', labels,
            matches.map(it => stats.sum(it.auto.freightScoredPerLevel)), maxStats.maxAutoFreightScored),
        
        new Chart(`graph-teleop-freight-${team}`, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Alliance hub',
                        data: matches.map(it => stats.sum(it.teleOp.freightScoredPerLevel)),
                        backgroundColor: '#ebd50e'
                    },
                    {
                        label: 'Shared hub',
                        data: matches.map(it => it.teleOp.freightScoredOnSharedHub),
                        backgroundColor: 'rgba(27, 60, 133, 0.7)'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: maxStats.maxTeleOpHub
                    },
                    x: {
                        stacked: true
                    }
                }
            }
        }),

        renderBarGraph(`graph-teleop-su-${team}`, 'Storage unit', labels,
            matches.map(it => it.teleOp.freightScoredInStorageUnit), maxStats.maxTeleOpStorageUnit),
        renderBarGraph(`graph-endgame-duck-${team}`, 'Ducks delivered', ddaLabels,
            ddaMatches.map(it => it.endgame.ducksDelivered), maxStats.maxEndgameDuck)
    ];

}

type MaxStatistics = {
    maxAutoFreightScored: number;
    maxTeleOpHub: number;
    maxTeleOpStorageUnit: number;
    maxEndgameDuck: number;
};

function getMaxStats(matches: MatchEntry[]): MaxStatistics {
    // FIXME repetitive?
    return {
        maxAutoFreightScored: Math.max(...matches.map(it => stats.sum(it.auto.freightScoredPerLevel))),
        maxTeleOpHub: Math.max(...matches.map(it => Math.max(it.teleOp.freightScoredOnSharedHub, stats.sum(it.teleOp.freightScoredPerLevel)))),
        maxTeleOpStorageUnit: Math.max(...matches.map(it => it.teleOp.freightScoredInStorageUnit)),
        maxEndgameDuck: Math.max(...matches.map(it => it.endgame.ducksDelivered))
    };
}

async function setup() {
    const entries = await getAllMatches();
    const favorites = await getFavoriteTeams();
    const maxStats = getMaxStats(entries.filter(it => favorites.indexOf(it.teamNumber) !== -1));

    let graphs: Chart[] = [];
    let boxplot: Chart|undefined = undefined;
    function renderAllTeamGraphs() {
        for (let graph of graphs) {
            graph.destroy();
        }
        graphs = [];
        for (let number of favorites) {
            graphs = graphs.concat(renderTeamGraphs(number, entries, maxStats));
        }
    }

    function rerenderBoxplot(matches: [number, MatchEntry[]][], sortMode) {
        type Extractor = (m: MatchEntry) => number;
        const extractors: {[sorter: string]: Extractor} = {
            auto: e => e.getAutonomousScore(),
            ash: e => e.getAshTotalScore(),
            shared: e => e.teleOp.freightScoredOnSharedHub,
            teleop: e => e.getTeleOpScore(),
            endgame: e => e.getEndgameScore(),
            total: e => e.getTotalScore(),
            'end-duck': e => e.endgame.duckDeliveryAttempted ? e.endgame.ducksDelivered : NaN,
            penalties: e => e.getTotalPenalty()
        };
        if (!(sortMode in extractors)) {
            if (boxplot !== undefined) {
                boxplot.destroy();
                boxplot = undefined;
            }
            return;
        }
        if (boxplot !== undefined) boxplot.destroy();
        boxplot = renderCompareBoxplot('graph-boxplot', sortMode,
            matches.map(([team, entries]) =>
                [team, entries.map(extractors[sortMode]).filter(i => !isNaN(i))]));
    }

    const app = createApp({
        data: () => ({
            favoriteTeams: favorites.slice(),
            sortingMethod: 'natural'
        }),
        mounted: renderAllTeamGraphs,
        methods: {
            teamMatches: function(team: number) {
                return entries.filter(it => it.teamNumber === team);
            },
            resort: function(method: string) {
                type Comparator = ((team1: number, team2: number) => number);
                const averageOf: (team: number, extractor: (m: MatchEntry) => number) => number = (team, extractor) => {
                    return stats.average(this.teamMatches(team).map(extractor));
                } 
                const compareAverage: (a: number, b: number, ext: (m: MatchEntry) => number) => number = (a, b, ext) =>
                    averageOf(a, ext) - averageOf(b, ext);

                function comparing(comparing: (e: MatchEntry) => number): Comparator {
                    return (a, b) => compareAverage(a, b, comparing);
                }
                const comparingReliability = (extScoring: (e: MatchEntry) => ScoringResult): Comparator => {
                    const rating = (matches: MatchEntry[]) => {
                        const binary = matches.map(extScoring)
                            .filter(r => r !== ScoringResult.DID_NOT_TRY)
                            .map(r => r === ScoringResult.SCORED ? 1 : 0);
                        return binary.length === 0 ? 0 : stats.average(binary);
                    }
                    return (a, b) => rating(this.teamMatches(a)) - rating(this.teamMatches(b));
                }

                const comparators: {[method: string]: (a: number, b: number) => number} = {
                    number: (a, b) => a - b,
                    'auto-duck': comparingReliability(it => it.auto.deliveredCarouselDuck),
                    'auto-preload': comparingReliability(it => it.auto.deliveredPreLoaded),
                    auto: comparing(it => it.getAutonomousScore()),
                    ash: comparing(it => it.getAshTotalScore()),
                    shared: comparing(it => it.teleOp.freightScoredOnSharedHub),
                    teleop: (a, b) => compareAverage(a, b, it => it.getTeleOpScore()),
                    'end-duck': (a, b) => {
                        const avgEndgameDucks = (me: MatchEntry[]) => {
                            const deliveries = me
                                .filter(it => it.endgame.duckDeliveryAttempted)
                                .map(it => it.endgame.ducksDelivered);
                            return deliveries.length === 0 ? 0 : stats.average(deliveries);
                        }
                        return avgEndgameDucks(this.teamMatches(a)) - avgEndgameDucks(this.teamMatches(b));
                    },
                    'end-cap': comparingReliability(it => it.endgame.tseScored),
                    endgame: comparing(it => it.getEndgameScore()),
                    total: comparing(it => it.getTotalScore()),
                    penalties: comparing(it => it.getTotalPenalty())
                };
                
                if (method === 'natural') {
                    this.favoriteTeams = favorites;
                } else {
                    this.favoriteTeams.sort(comparators[method]);
                }
                this.$nextTick(renderAllTeamGraphs);
                this.$nextTick(() => rerenderBoxplot(this.favoriteTeams.map(team => [team, this.teamMatches(team)]), method));
            }
        }
    })

    app.component('scoring-summary', {
        data: function() { return {}; },
        props: {
            period: String,
            task: String,
            team: Number
        },
        template: '<div class="row scoring-results"><span class="scoring-result" v-for="result in results" v-bind:value="expressResult(result)"></span></div>',
        computed: {
            results: function() {
                return entries.filter(it => it.teamNumber === this.team)
                    .map(it => it[this.period as string][this.task] as ScoringResult);
            }
        },
        methods: {
            expressResult: function(result: ScoringResult) {
                switch (result) {
                    case ScoringResult.DID_NOT_TRY: return 'dnt';
                    case ScoringResult.FAILED: return 'failed';
                    case ScoringResult.SCORED: return 'scored';
                }
            }
        }
    });
    app.mount('#app');

}

setup();