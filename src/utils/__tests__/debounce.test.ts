import { createDebouncer } from '../debounce';

describe('createDebouncer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('saves only the last value after the delay', () => {
    const save = jest.fn();
    const d = createDebouncer(save, 400);
    d.schedule(1);
    jest.advanceTimersByTime(300);
    d.schedule(2);
    jest.advanceTimersByTime(399);
    expect(save).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(2);
  });

  it('flushes immediately and only once', () => {
    const save = jest.fn();
    const d = createDebouncer(save, 400);
    d.schedule('a');
    d.flush();
    d.flush();
    jest.advanceTimersByTime(1000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('a');
  });

  it('cancels a pending value', () => {
    const save = jest.fn();
    const d = createDebouncer(save, 400);
    d.schedule('a');
    d.cancel();
    jest.advanceTimersByTime(1000);
    d.flush();
    expect(save).not.toHaveBeenCalled();
  });
});
