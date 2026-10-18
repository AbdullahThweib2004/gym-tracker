import { moveItem } from '../list';

describe('moveItem', () => {
  it('moves items up and down', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('ignores out-of-range moves and does not mutate', () => {
    const list = ['a', 'b'];
    expect(moveItem(list, 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(list, 1, 2)).toEqual(['a', 'b']);
    expect(list).toEqual(['a', 'b']);
  });
});
