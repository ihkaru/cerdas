import { describe, expect, it } from 'vitest';
import { sanitizeColumnKey, safeParseJson, AssignmentQueryService } from '../src/app/dashboard/services/AssignmentQueryService';
import { sanitizePrelistData } from '../src/common/services/sync/AssignmentSyncHelpers';

describe('Defensive Data Layer - Unit Tests', () => {
    describe('sanitizeColumnKey', () => {
        it('should strip punctuation, quotes, semicolons, and spaces', () => {
            expect(sanitizeColumnKey('kecamatan; DROP TABLE')).toBe('kecamatanDROPTABLE');
            expect(sanitizeColumnKey('col"name\'test')).toBe('colnametest');
            expect(sanitizeColumnKey('foo-bar.baz')).toBe('foobarbaz');
            expect(sanitizeColumnKey('sls_nama 01')).toBe('sls_nama01');
        });

        it('should preserve valid alphanumeric and underscore column identifiers', () => {
            expect(sanitizeColumnKey('kd_prov')).toBe('kd_prov');
            expect(sanitizeColumnKey('nama_sls_2026')).toBe('nama_sls_2026');
            expect(sanitizeColumnKey('noUrut123')).toBe('noUrut123');
        });

        it('should handle empty or non-string input safely', () => {
            expect(sanitizeColumnKey('')).toBe('');
            // @ts-ignore
            expect(sanitizeColumnKey(null)).toBe('');
            // @ts-ignore
            expect(sanitizeColumnKey(undefined)).toBe('');
        });
    });

    describe('safeParseJson', () => {
        it('should parse valid JSON object strings', () => {
            const result = safeParseJson('{"name":"Budi","age":30}');
            expect(result).toEqual({ name: 'Budi', age: 30 });
        });

        it('should unwrap double-stringified JSON cleanly', () => {
            const doubleEncoded = JSON.stringify(JSON.stringify({ village: 'Parit Banjar', code: '001' }));
            const result = safeParseJson(doubleEncoded);
            expect(result).toEqual({ village: 'Parit Banjar', code: '001' });
        });

        it('should return already-parsed objects as-is', () => {
            const obj = { province: 'Kalbar' };
            expect(safeParseJson(obj)).toBe(obj);
        });

        it('should return empty object on null, undefined, or empty string', () => {
            expect(safeParseJson(null)).toEqual({});
            expect(safeParseJson(undefined)).toEqual({});
            expect(safeParseJson('')).toEqual({});
            expect(safeParseJson('   ')).toEqual({});
            expect(safeParseJson('invalid-json-text')).toEqual({});
        });
    });

    describe('sanitizePrelistData', () => {
        it('should serialize JavaScript objects to valid JSON strings', () => {
            const data = { id: 180, name: 'Sample A' };
            const serialized = sanitizePrelistData(data);
            expect(JSON.parse(serialized)).toEqual(data);
        });

        it('should leave single-stringified JSON intact without double-encoding', () => {
            const jsonStr = '{"kecamatan":"Mempawah Timur","subdist":4}';
            const result = sanitizePrelistData(jsonStr);
            expect(result).toBe(jsonStr);
        });

        it('should fix double-stringified JSON and return single-stringified JSON', () => {
            const inner = '{"rt":"01","rw":"02"}';
            const doubleStr = JSON.stringify(inner);
            const result = sanitizePrelistData(doubleStr);
            expect(result).toBe(inner);
        });

        it('should return "{}" for null, undefined, or empty values', () => {
            expect(sanitizePrelistData(null)).toBe('{}');
            expect(sanitizePrelistData(undefined)).toBe('{}');
            expect(sanitizePrelistData('')).toBe('{}');
        });
    });

    describe('AssignmentQueryService SQL Builder Guards', () => {
        it('buildOrderBy should use sanitized column and assignments table alias', () => {
            const orderSql = AssignmentQueryService.buildOrderBy({ field: 'status', order: 'asc' });
            expect(orderSql).toBe('assignments.status ASC');

            const customOrder = AssignmentQueryService.buildOrderBy({ field: 'nama; DROP TABLE', order: 'desc' });
            expect(customOrder).toContain('$.namaDROPTABLE');
            expect(customOrder).toContain('DESC');
        });

        it('buildOrderBy should fallback safely when field is missing or empty', () => {
            const fallback = AssignmentQueryService.buildOrderBy();
            expect(fallback).toBe('assignments.updated_at DESC, assignments.id DESC');

            const emptyFallback = AssignmentQueryService.buildOrderBy({ field: '', order: 'asc' });
            expect(emptyFallback).toBe('assignments.updated_at DESC, assignments.id DESC');
        });

        it('buildFilterWhere should sanitize fields and prefix standard columns with assignments.', () => {
            const res = AssignmentQueryService.buildFilterWhere([
                { field: 'status', operator: 'equals', value: 'assigned' },
                { field: 'subdistrict; injection', operator: 'contains', value: 'Timur' }
            ]);

            expect(res.where).toContain('assignments.status = ?');
            expect(res.where).toContain('$.subdistrictinjection');
            expect(res.params).toEqual(['assigned', '%Timur%']);
        });
    });
});
