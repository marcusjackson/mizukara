/**
 * Tests for timeouts constants
 */

import { describe, expect, it } from 'vitest';

import { TIMEOUTS } from './timeouts';

describe('TIMEOUTS', () => {
  it('defines a toast duration', () => {
    expect(typeof TIMEOUTS.TOAST_DURATION).toBe('number');
    expect(TIMEOUTS.TOAST_DURATION).toBeGreaterThan(0);
  });

  it('defines an inference idle teardown delay', () => {
    expect(typeof TIMEOUTS.INFERENCE_IDLE_TEARDOWN).toBe('number');
    expect(TIMEOUTS.INFERENCE_IDLE_TEARDOWN).toBeGreaterThan(0);
  });

  it('toast duration is 2000ms', () => {
    expect(TIMEOUTS.TOAST_DURATION).toBe(2000);
  });
});
