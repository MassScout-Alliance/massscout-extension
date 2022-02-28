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
        // There's an O(n) solution to this that uses quicksort's partition method
        const unique = [...new Set(set)];
        if (unique.length === 1) return [1, 1];
        
        let start = 0, end = unique.length - 1;
        // first take the target out
        const ind = unique.indexOf(target);
        if (ind !== -1) {
            [unique[ind], unique[end]] = [unique[end], unique[ind]];
            --end;
        }
        while (true) {
            while (start < end && unique[start] > target) ++start;
            while (start < end && unique[end] < target) --end;
            if (start < end) {
                // suppose we swapped
                [unique[start], unique[end]] = [unique[end], unique[start]];
                ++start;
                --end;
            } else break;
        }
        // return [unique.sort((a, b) => b - a).indexOf(target) + 1, unique.length];
        return [end + (unique[end] > target ? 2 : 1), unique.length];
    }
};