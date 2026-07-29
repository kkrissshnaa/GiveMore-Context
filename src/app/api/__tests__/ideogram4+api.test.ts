// @ts-ignore
import { expect, test, describe } from 'bun:test';
import { normalizeAspectRatio } from '../ideogram4+api';

describe('normalizeAspectRatio', () => {
    test('returns "1:1" for missing or undefined inputs', () => {
        expect(normalizeAspectRatio(undefined)).toBe('1:1');
        expect(normalizeAspectRatio(null)).toBe('1:1');
    });

    test('returns "1:1" for non-string inputs', () => {
        expect(normalizeAspectRatio(123)).toBe('1:1');
        expect(normalizeAspectRatio({})).toBe('1:1');
        expect(normalizeAspectRatio([])).toBe('1:1');
        expect(normalizeAspectRatio(true)).toBe('1:1');
    });

    test('returns "1:1" for malformed or non-width:height string inputs', () => {
        expect(normalizeAspectRatio('')).toBe('1:1');
        expect(normalizeAspectRatio('   ')).toBe('1:1');
        expect(normalizeAspectRatio('invalid')).toBe('1:1');
        expect(normalizeAspectRatio('16x9')).toBe('1:1');
        expect(normalizeAspectRatio('1:1 (Square)')).toBe('1:1');
        expect(normalizeAspectRatio('16:9:4')).toBe('1:1');
    });

    test('returns trimmed valid width:height ratio strings', () => {
        expect(normalizeAspectRatio('1:1')).toBe('1:1');
        expect(normalizeAspectRatio('16:9')).toBe('16:9');
        expect(normalizeAspectRatio('4:5')).toBe('4:5');
        expect(normalizeAspectRatio('9:16')).toBe('9:16');
        expect(normalizeAspectRatio(' 21:9 ')).toBe('21:9');
    });
});
