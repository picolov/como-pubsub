import { describe, expect, test } from 'bun:test';
import { emit, listen, unlisten } from '../index';

describe('Linko', () => {
  test('emit should be a function', () => {
    expect(typeof emit).toBe('function');
  });

  test('listen should be a function', () => {
    expect(typeof listen).toBe('function');
  });

  test('unlisten should be a function', () => {
    expect(typeof unlisten).toBe('function');
  });
}); 