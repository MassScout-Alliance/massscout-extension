export const stats = {
    sum: function(data: number[]): number {
        if (data.length === 0) return 0;
        return data.reduce((a, b) => a + b);
    },
    average: function(data: number[]): number {
        if (data.length === 0) return 0;
        return stats.sum(data) / data.length;
    },
    count: function<T> (data: T[], desired: T): number {
        let out = 0;
        for (let item of data) {
            if (item === desired) {
                ++out;
            }
        }
        return out;
    },
    overRatio: function(set: number[], target: number): number {
        return set.filter(it => it < target).length / set.length;
    },
    rank: function(set: number[], target: number): [number, number] {
        let unique = [...new Set(set)];
        
        return [unique.sort((a, b) => b - a).indexOf(target) + 1, unique.length];
    }
};