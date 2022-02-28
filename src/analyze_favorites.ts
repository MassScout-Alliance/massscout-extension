import Vue from 'vue';
import { Chart } from 'chart.js';
import { getAllMatches } from './local-storage';
import { ScoringResult, MatchEntry } from './match';
import { getFavoriteTeams } from './favorites';
import { stats } from './stats';

function renderBarGraph(id: string, field: string, labels: string[], data: number[], maxY?: number): Chart {
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
                        beginAtZero: true,
                        max: maxY
                    }
                }]
            }
        }
    });
}

function renderTeamGraphs(team: number, entries: MatchEntry[], maxStats: MaxStatistics): Chart[] {
    const matches = entries.filter(it => it.teamNumber === team);
    const labels = matches.map(it => it.matchCode);
    return [
        new Chart(`graph-auto-delivery-${team}`, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Skystones delivered',
                        data: matches.map(it => stats.count(it.auto.deliveredStones, StoneType.SKYSTONE)),
                        backgroundColor: '#333'
                    },
                    {
                        label: 'Stones delivered',
                        data: matches.map(it => stats.count(it.auto.deliveredStones, StoneType.STONE)),
                        backgroundColor: '#ebd50e'
                    }
                ]
            },
            options: {
                scales: {
                    yAxes: [{
                        stacked: true,
                        ticks: {
                            beginAtZero: true,
                            max: maxStats.maxAutoStonesDelivered
                        }
                    }],
                    xAxes: [{
                        stacked: true
                    }]
                }
            }
        }),
        renderBarGraph(`graph-auto-placement-${team}`, 'Stones placed', labels,
            matches.map(it => it.auto.stonesOnFoundation), maxStats.maxAutoStonesPlaced),
        
        new Chart(`graph-teleop-delivery-${team}`, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'A-N deliveries',
                        data: matches.map(it => it.teleOp.neutralStonesDelivered),
                        backgroundColor: '#ebd50e'
                    },
                    {
                        label: 'A-S deliveries',
                        data: matches.map(it => it.teleOp.allianceStonesDelivered),
                        backgroundColor: 'rgba(27, 60, 133, 0.7)'
                    }
                ]
            },
            options: {
                scales: {
                    yAxes: [{
                        stacked: true,
                        ticks: {
                            beginAtZero: true,
                            max: maxStats.maxDelivery
                        }
                    }],
                    xAxes: [{
                        stacked: true
                    }]
                }
            }
        }),

        renderBarGraph(`graph-teleop-level-${team}`, 'Stack level', labels,
            matches.map(it => it.teleOp.stonesPerLevel.length), maxStats.maxStackLevel)];

}

type MaxStatistics = {
    maxAutoStonesDelivered: number;
    maxAutoStonesPlaced: number;
    maxDelivery: number;
    maxStackLevel: number;
};

function getMaxStats(matches: MatchEntry[]): MaxStatistics {
    // FIXME repetitive?
    return {
        maxAutoStonesDelivered: Math.max(...matches.map(it => it.auto.deliveredStones.length)),
        maxAutoStonesPlaced: Math.max(...matches.map(it => it.auto.stonesOnFoundation)),
        maxDelivery: Math.max(...matches.map(it => it.teleOp.neutralStonesDelivered + it.teleOp.allianceStonesDelivered)),
        maxStackLevel: Math.max(...matches.map(it => it.teleOp.stonesPerLevel.length))
    };
}

async function setup() {
    const entries = await getAllMatches();
    const favorites = await getFavoriteTeams();
    const maxStats = getMaxStats(entries.filter(it => favorites.indexOf(it.teamNumber) !== -1));

    Vue.component('scoring-summary', {
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

    let graphs: Chart[] = [];
    function renderAllTeamGraphs() {
        for (let graph of graphs) {
            graph.destroy();
        }
        graphs = [];
        for (let number of favorites) {
            graphs = graphs.concat(renderTeamGraphs(number, entries, maxStats));
        }
    }

    const vm = new Vue({
        el: '#app',
        data: {
            favoriteTeams: favorites.slice(),
            sortingMethod: 'natural'
        },
        mounted: renderAllTeamGraphs,
        methods: {
            teamMatches: function(team: number) {
                return entries.filter(it => it.teamNumber === team);
            },
            resort: function(method: string) {
                const averageOf: (team: number, extractor: (m: MatchEntry) => number) => number = (team, extractor) => {
                    return stats.average(this.teamMatches(team).map(extractor));
                } 
                const compareAverage: (a: number, b: number, ext: (m: MatchEntry) => number) => number = (a, b, ext) =>
                    averageOf(a, ext) - averageOf(b, ext);

                const comparators: {[method: string]: (a: number, b: number) => number} = {
                    number: (a, b) => a - b,
                    auto: (a, b) => compareAverage(a, b, it => it.getAutonomousScore()),
                    delivery: (a, b) => compareAverage(a, b, it => it.teleOp.allianceStonesDelivered + it.teleOp.neutralStonesDelivered),
                    stack: (a, b) => compareAverage(a, b, it => it.teleOp.stonesPerLevel.length),
                    teleop: (a, b) => compareAverage(a, b, it => it.getTeleOpScore()),
                    endgame: (a, b) => compareAverage(a, b, it => it.getEndgameScore()),
                    total: (a, b) => compareAverage(a, b, it => it.getTotalScore())
                };
                
                if (method === 'natural') {
                    this.favoriteTeams = favorites;
                } else {
                    this.favoriteTeams.sort(comparators[method]);
                }
                this.$nextTick(renderAllTeamGraphs);
            }
        }
    });

}

setup();