import Vue from 'vue';
import { Chart } from 'chart.js';
import { getAllMatches } from './local-storage';
import { ScoringResult, MatchEntry, StoneType } from './match';
import { getFavoriteTeams } from './favorites';
import { stats } from './stats';

function renderBarGraph(id: string, field: string, labels: string[], data: number[], maxY?: number) {
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

function renderTeamGraphs(team: number, entries: MatchEntry[], maxStats: MaxStatistics) {
    const matches = entries.filter(it => it.teamNumber === team);
    const labels = matches.map(it => it.matchCode);
    
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
    });

    renderBarGraph(`graph-auto-placement-${team}`, 'Stones placed', labels,
        matches.map(it => it.auto.stonesOnFoundation), maxStats.maxAutoStonesPlaced);
        
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
    });

    renderBarGraph(`graph-teleop-level-${team}`, 'Stack level', labels,
        matches.map(it => it.teleOp.stonesPerLevel.length), maxStats.maxStackLevel);

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

    const vm = new Vue({
        el: '#app',
        data: {
            favoriteTeams: favorites
        },
        mounted: function() {
            for (let number of favorites) {
                renderTeamGraphs(number, entries, maxStats);
            }
        },
        methods: {
            teamMatches: function(team: number) {
                return entries.filter(it => it.teamNumber === team);
            }
        }
    });

}

setup();