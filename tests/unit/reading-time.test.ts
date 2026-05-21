import { describe, expect, it } from 'vitest';
import { readingTimeMinutes } from '../../src/lib/reading-time';

describe('readingTimeMinutes', () => {
  it('returns at least 1 minute for short text', () => {
    expect(readingTimeMinutes('Hello world.')).toBe(1);
  });

  it('strips fenced code blocks before counting', () => {
    const md = 'word '.repeat(50) + '\n\n```ts\n' + 'noise '.repeat(2000) + '\n```';
    expect(readingTimeMinutes(md)).toBeLessThan(3);
  });

  it('scales linearly with body length', () => {
    const long = 'word '.repeat(2200); // ~10 min at 220 wpm
    expect(readingTimeMinutes(long)).toBe(10);
  });
});
