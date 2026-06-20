/// <reference types="jest" />

import { generateCode } from './code-generator';

describe('generateCode', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it('should return a string', () => {
    const code = generateCode();
    expect(typeof code).toBe('string');
  });

  it('should return a code that is exactly 6 characters long', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
  });

  it('should only contain digits', () => {
    const code = generateCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should include leading zeros when the number is less than 100000', () => {
    // Mock Math.random to return a value that produces a number < 100000
    // 0.000001 * 1_000_000 = 1 → "000001"
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.000001);

    const code = generateCode();
    expect(code).toBe('000001');
  });

  it('should produce "999999" when Math.random returns 0.999999', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.999999);

    const code = generateCode();
    expect(code).toBe('999999');
  });

  it('should produce values across the full range', () => {
    const results = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      results.add(generateCode());
    }
    // With 1000 runs, we should get at least some variety
    expect(results.size).toBeGreaterThan(1);
  });
});
