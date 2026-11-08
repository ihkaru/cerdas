import { describe, expect, it } from 'bun:test';
import { extractDeckOptions, resolvePath, useDeckData } from '../src/components/views/deck/useDeckData';
import { ref } from 'vue';

describe('DeckView & useDeckData Resilience Tests', () => {
    it('should extract deck options from flat or nested config', () => {
        const flatConfig = {
            type: 'deck',
            primaryHeaderField: 'nama_krt',
            secondaryHeaderField: 'nus'
        };
        const nestedConfig = {
            deck: {
                primaryHeaderField: 'nama_krt',
                secondaryHeaderField: 'nus'
            }
        };

        expect(extractDeckOptions(flatConfig)).toEqual({
            title: 'nama_krt',
            subtitle: 'nus',
            image: undefined
        });

        expect(extractDeckOptions(nestedConfig)).toEqual({
            title: 'nama_krt',
            subtitle: 'nus',
            image: undefined
        });
    });

    it('should resolve numeric fields without throwing TypeError on trim', () => {
        const prelist = { nus: 15, nama_krt: 'KURNIAWATI' };
        const response = {};
        const item = { id: 'asgn-1', prelist_data: prelist, response_data: response };

        const title = resolvePath(item, response, prelist, 'nama_krt');
        const subtitle = resolvePath(item, response, prelist, 'nus');

        expect(title).toBe('KURNIAWATI');
        expect(subtitle).toBe(15);
    });

    it('should prepare Sakernas data with numeric secondaryHeaderField (nus: 15) without crashing', () => {
        const config = ref({
            deck: {
                imageShape: 'square',
                primaryHeaderField: 'nama_krt',
                secondaryHeaderField: 'nus'
            },
            type: 'deck',
            title: 'Foto Rumah',
            sortBy: 'nus'
        });

        // 180 assignments like Sakernas
        const rawAssignments = Array.from({ length: 180 }, (_, i) => ({
            id: `asgn-uuid-${i + 1}`,
            table_id: '36d0f44c-3504-41c8-8c60-b96defd87de6',
            status: 'assigned',
            prelist_data: {
                nus: i + 1, // NUMBER type!
                nama_krt: `Responden ${i + 1}`,
                sls: `SLS 00${i + 1}`
            },
            response_data: null
        }));

        const dataRef = ref(rawAssignments);
        const contextId = ref('0c77bbd8-9b96-43b5-861e-4a2ed3941031');

        const { preparedData, options } = useDeckData(config, dataRef, contextId);

        expect(options.value.title).toBe('nama_krt');
        expect(options.value.subtitle).toBe('nus');

        // MUST NOT CRASH and MUST RETURN all 180 items
        expect(preparedData.value.length).toBe(180);
        expect(preparedData.value[0]._resolvedTitle).toBe('Responden 1');
        expect(preparedData.value[0]._resolvedSubtitle).toBe(1);
    });

    it('should NOT collapse repeating nus across multiple SLS blocks in real survey prelists', () => {
        const config = ref({
            deck: {
                primaryHeaderField: 'nama_krt',
                secondaryHeaderField: 'nus'
            },
            type: 'deck'
        });

        // 12 SLS blocks, each with NUS 1 to 15 (total 180 households)
        const clusterAssignments: any[] = [];
        for (let block = 1; block <= 12; block++) {
            for (let nus = 1; nus <= 15; nus++) {
                clusterAssignments.push({
                    id: `asgn-block-${block}-nus-${nus}`,
                    status: 'assigned',
                    prelist_data: {
                        external_id: `SAK-2026-${block}-${nus}`,
                        kode_sls: 100 * block,
                        nus: nus,
                        nama_krt: `Kepala RT ${block} No ${nus}`
                    }
                });
            }
        }

        expect(clusterAssignments.length).toBe(180);

        const { preparedData } = useDeckData(config, ref(clusterAssignments), 'app-sakernas');
        expect(preparedData.value.length).toBe(180);
        expect(preparedData.value[0]._dedupKey).toBe('k_external_id_SAK-2026-1-1');
    });

    it('should handle numeric primaryHeaderField and null fields gracefully', () => {
        const config = ref({
            deck: {
                primaryHeaderField: 'nus',
                secondaryHeaderField: 'missing_field'
            }
        });

        const dataRef = ref([
            {
                id: 'item-1',
                status: 'assigned',
                prelist_data: { nus: 42 },
                response_data: null
            }
        ]);

        const { preparedData } = useDeckData(config, dataRef, 'test-app');
        expect(preparedData.value.length).toBe(1);
        expect(preparedData.value[0]._resolvedTitle).toBe(42);
        expect(preparedData.value[0]._resolvedSubtitle).toBe('Status: Pending');
    });
});
