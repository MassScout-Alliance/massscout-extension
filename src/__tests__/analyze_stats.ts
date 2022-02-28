import { stats } from "../stats";

test('Stats sum', () => {
    expect(stats.sum([1, 5, 9, 3, -4])).toBe(1 + 5 + 9 + 3 - 4);
    expect(stats.sum([3])).toBe(3);
    expect(stats.sum([])).toBe(0);
});

test('Stats average', () => {
    expect(stats.average([1, 9, 6, 2, 4])).toBe((1 + 9 + 6 + 2 + 4) / 5);
    expect(stats.average([4])).toBe(4);
    expect(stats.average([])).toBe(0);
});

test('Stats count', () => {
    expect(stats.count([4, 1, 9, 2, 8, -5, 4, 19, 2], 4)).toBe(2);
    expect(stats.count([1, 1, 1, 3, 2], 1)).toBe(3);
    expect(stats.count([], 9)).toBe(0);
});

test('Stats over', () => {
    expect(stats.overRatio([9, 5, 3, 4, 2, 6, 7, 4], 6)).toBe(5 / 8);
    expect(stats.overRatio([2, 4, 9, 5, 5, 1, 4, 6], 5)).toBe(4 / 8);
    expect(stats.overRatio([3], 4)).toBe(1);
    expect(stats.overRatio([], 2)).toBe(NaN);
});

test('Stats rank', () => {
    expect(stats.rank([12, 4, 8, 1, 1, 3, 7, 5, 2, 4, 2, 6, 3], 3)).toEqual([7, 9]);
    expect(stats.rank([1, 2, 3, 6], 3)).toEqual([2, 4]);
    expect(stats.rank([2, 9, 4, 1], 5)).toEqual([2, 4]);
});

test('Randomized Stats rank', () => {
    const rand = () => Math.floor(Math.random() * 500 + 1);
    for (let len = 1; len < 100; ++len) {
        const series = new Array(len).fill(0).map(rand);
        const item = series[Math.floor(Math.random() * len)];
        const uniqSorted = [...new Set(series)].sort((a, b) => b - a);
        const expectedRank = uniqSorted.indexOf(item) + 1;
        expect(stats.rank(series, item)).toEqual([expectedRank, uniqSorted.length]);
    }
});