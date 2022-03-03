import { createApp, Component } from 'vue';
import Chart from 'chart.js/auto';
import { getAllMatches } from './local-storage';
import { ScoringResult, MatchEntry } from './match';
import { getFavoriteTeams } from './favorites';
import { stats } from './stats';

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


function renderTeamGraphs(team: number, entries: MatchEntry[], maxStats: MaxStatistics): Chart[] {
    const matches = entries.filter(it => it.teamNumber === team);
    const labels = matches.map(it => it.matchCode);
    return [
        new Chart(`graph-auto-${team}`, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '🦆 Ducks delivered',
                        data: matches.map(it => it.auto.deliveredCarouselDuck === ScoringResult.SCORED ? 1 : 0),
                        backgroundColor: '#333'
                    },
                    {
                        label: 'Preloaded box delivered',
                        data: matches.map(it => it.auto.deliveredPreLoaded === ScoringResult.SCORED ? 1 : 0),
                        backgroundColor: '#ebd50e'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: 1
                    },
                    x: {
                        stacked: true
                    }
                }
            }
        }),
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

        renderBarGraph(`graph-teleop-su-${team}`, 'Storage hub', labels,
            matches.map(it => it.teleOp.freightInStorageUnit), maxStats.maxTeleOpStorageUnit)];

}

type MaxStatistics = {
    maxAutoFreightScored: number;
    maxTeleOpHub: number;
    maxTeleOpStorageUnit: number;
};

function getMaxStats(matches: MatchEntry[]): MaxStatistics {
    // FIXME repetitive?
    return {
        maxAutoFreightScored: Math.max(...matches.map(it => stats.sum(it.auto.freightScoredPerLevel))),
        maxTeleOpHub: Math.max(...matches.map(it => Math.max(it.teleOp.freightScoredOnSharedHub, stats.sum(it.teleOp.freightScoredPerLevel)))),
        maxTeleOpStorageUnit: Math.max(...matches.map(it => it.teleOp.freightInStorageUnit))
    };
}

async function setup() {
    const entries = await getAllMatches();
    const favorites = await getFavoriteTeams();
    const maxStats = getMaxStats(entries.filter(it => favorites.indexOf(it.teamNumber) !== -1));

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
                const averageOf: (team: number, extractor: (m: MatchEntry) => number) => number = (team, extractor) => {
                    return stats.average(this.teamMatches(team).map(extractor));
                } 
                const compareAverage: (a: number, b: number, ext: (m: MatchEntry) => number) => number = (a, b, ext) =>
                    averageOf(a, ext) - averageOf(b, ext);

                const comparators: {[method: string]: (a: number, b: number) => number} = {
                    number: (a, b) => a - b,
                    auto: (a, b) => compareAverage(a, b, it => it.getAutonomousScore()),
                    sharedHub: (a, b) => compareAverage(a, b, it => it.teleOp.freightScoredOnSharedHub),
                    allianceHub: (a, b) => compareAverage(a, b, it => stats.sum(it.teleOp.freightScoredPerLevel)),
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
    
    app.mount('#app');
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

}

setup();