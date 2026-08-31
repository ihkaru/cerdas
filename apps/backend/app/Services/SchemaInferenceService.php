<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * SchemaInferenceService
 *
 * Infers field data types, categorical options, and key columns from tabular raw data
 * (Excel, CSV, Google Sheets API sample rows).
 */
class SchemaInferenceService
{
    /**
     * Infer full schema definition, key column, and preview data from tabular rows.
     *
     * @param  array<int, array<int, mixed>>  $rows  Tabular data where row[0] is headers
     * @return array{
     *     columns: array<int, array{
     *         name: string,
     *         label: string,
     *         original_header: string,
     *         type: string,
     *         options?: array<int, array{label: string, value: string}>,
     *         source_index: int,
     *         is_key?: bool
     *     }>,
     *     suggested_key: string,
     *     preview: array<int, array<int, mixed>>
     * }
     */
    public function inferSchema(array $rows): array
    {
        if (empty($rows)) {
            return [
                'columns' => [],
                'suggested_key' => '_cerdas_id',
                'preview' => [],
            ];
        }

        $headers = $rows[0] ?? [];
        $previewData = array_slice($rows, 1, 30); // sample up to 30 rows
        $columns = [];
        $suggestedKey = null;

        foreach ($headers as $index => $header) {
            $headerStr = trim((string) $header);
            if ($headerStr === '') {
                continue;
            }

            $sampleValues = array_column($previewData, $index);
            $inferred = $this->inferColumnType($headerStr, $sampleValues);

            $columnName = Str::slug($headerStr, '_') ?: 'col_'.$index;

            // Check if this column is a strong candidate for primary Key column
            if (! $suggestedKey && $this->isLikelyKeyColumn($headerStr, $sampleValues)) {
                $suggestedKey = $columnName;
            }

            $columnDef = [
                'name' => $columnName,
                'label' => $headerStr,
                'original_header' => $headerStr,
                'type' => $inferred['type'],
                'options' => $inferred['options'] ?? [],
                'source_index' => $index,
            ];

            $columns[] = $columnDef;
        }

        // If no natural key column was identified, fallback to '_cerdas_id'
        if (! $suggestedKey) {
            $suggestedKey = '_cerdas_id';
        }

        return [
            'columns' => $columns,
            'suggested_key' => $suggestedKey,
            'preview' => array_slice($previewData, 0, 10),
        ];
    }

    /**
     * Infer column type and optional categorical options based on header and sample values.
     */
    public function inferColumnType(string $header, array $sampleValues): array
    {
        $h = strtolower(trim($header));

        // Filter non-empty trimmed string values
        $nonEmpty = [];
        foreach ($sampleValues as $v) {
            if ($v !== null) {
                $str = trim((string) $v);
                if ($str !== '') {
                    $nonEmpty[] = $str;
                }
            }
        }

        // 1. Text Protection for Codes, IDs, NIK, Phone, Zip (Prevent Loss of Leading Zeros / Text IDs)
        if (preg_match('/(^|_)(nik|nokk|no_kk|kk|ktp|id_|kode_|kd_|rt|rw|telepon|telp|hp|wa|phone|postal|kodepos|nip|nisn)($|_)/i', $h)) {
            return ['type' => 'text'];
        }

        // 2. Keyword check for GPS coordinates
        if (preg_match('/(^|_)(gps|koordinat|coordinate|lat_long|latlong|lat_lng|titik_lokasi)($|_)/i', $h)) {
            return ['type' => 'gps'];
        }

        // 3. Keyword check for Image / Photo
        if (preg_match('/(^|_)(foto|photo|gambar|image|lampiran|file_ktp|file_kk)($|_)/i', $h)) {
            return ['type' => 'image'];
        }

        // 4. Keyword check for Signature
        if (preg_match('/(^|_)(ttd|signature|paraf|tanda_tangan)($|_)/i', $h)) {
            return ['type' => 'signature'];
        }

        // 5. Keyword check for URL / Link
        if (preg_match('/(^|_)(url|link|tautan|website|web)($|_)/i', $h)) {
            return ['type' => 'url'];
        }

        // 6. Keyword check for Currency / Rupiah
        if (preg_match('/(^|_)(harga|biaya|gaji|omset|omzet|nominal|tarif|upah|rupiah|rp)($|_)/i', $h)) {
            return ['type' => 'number'];
        }

        // 7. If no sample values are available, use header hints or default to 'text'
        if (empty($nonEmpty)) {
            if (preg_match('/(^|_)(tgl|tanggal|date|tgl_lahir|birth_date)($|_)/i', $h)) {
                return ['type' => 'date'];
            }
            if (preg_match('/(^|_)(jam|pukul|time)($|_)/i', $h)) {
                return ['type' => 'time'];
            }
            if (preg_match('/(^|_)(jumlah|total|pengeluaran|pendapatan|target|kuota|usia|umur|skor|nilai|bobot|luas|volume|berat|tinggi)($|_)/i', $h)) {
                return ['type' => 'number'];
            }

            return ['type' => 'text'];
        }

        // 8. Value Pattern Analysis on Non-Empty Values

        // 8a. Check GPS coordinates pattern (e.g. "-0.4791, 108.9585" or "-0.4791,108.9585")
        $isGps = true;
        foreach ($nonEmpty as $val) {
            if (! preg_match('/^-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+$/', $val)) {
                $isGps = false;
                break;
            }
        }
        if ($isGps) {
            return ['type' => 'gps'];
        }

        // 8b. Check URL pattern
        $isUrl = true;
        foreach ($nonEmpty as $val) {
            if (! filter_var($val, FILTER_VALIDATE_URL) && ! preg_match('/^https?:\/\//i', $val)) {
                $isUrl = false;
                break;
            }
        }
        if ($isUrl) {
            return ['type' => 'url'];
        }

        // 8c. Check Image filename/extension pattern
        $isImage = true;
        foreach ($nonEmpty as $val) {
            if (! preg_match('/\.(jpg|jpeg|png|webp|gif|svg)$/i', $val)) {
                $isImage = false;
                break;
            }
        }
        if ($isImage) {
            return ['type' => 'image'];
        }

        // 8d. Check Time pattern (HH:MM or HH:MM:SS)
        $isTime = true;
        foreach ($nonEmpty as $val) {
            if (! preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/', $val)) {
                $isTime = false;
                break;
            }
        }
        if ($isTime) {
            return ['type' => 'time'];
        }

        // 8e. Check Date / DateTime pattern
        $isDate = true;
        $isDateTime = false;
        foreach ($nonEmpty as $val) {
            $isIsoDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $val);
            $isIsoDateTime = preg_match('/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/', $val);
            $isDmy = preg_match('/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/', $val);

            if ($isIsoDateTime) {
                $isDateTime = true;
            } elseif ($isIsoDate || $isDmy) {
                // valid date format
            } else {
                $isDate = false;
                break;
            }
        }
        if ($isDate) {
            return ['type' => $isDateTime ? 'datetime' : 'date'];
        }

        // 8f. Check Numeric (Numbers without leading zeros, or clean decimals)
        $isNumeric = true;
        foreach ($nonEmpty as $val) {
            if (! is_numeric($val)) {
                $isNumeric = false;
                break;
            }
            // Check for leading zero like "01", "08123" (indicates code/string, except "0" or "0.5")
            if (preg_match('/^0\d+/', $val)) {
                $isNumeric = false;
                break;
            }
        }
        if ($isNumeric) {
            return ['type' => 'number'];
        }

        // 8g. Check Categorical Choices (Options like "1. Ya", "2. Tidak", or survey codes with <= 15 distinct items)
        $uniqueValues = array_values(array_unique($nonEmpty));
        $hasNumberedPrefix = false;
        foreach ($uniqueValues as $uv) {
            if (preg_match('/^\d+[\.\-\)]\s*.+/', $uv)) {
                $hasNumberedPrefix = true;
                break;
            }
        }

        if (($hasNumberedPrefix || count($uniqueValues) <= 8) && count($uniqueValues) >= 2 && count($nonEmpty) >= 3) {
            $options = array_map(fn ($v) => ['label' => $v, 'value' => $v], $uniqueValues);

            return ['type' => 'select', 'options' => $options];
        }

        // 9. Default fallback to text
        return ['type' => 'text'];
    }

    /**
     * Determine if a column is likely a unique primary key column.
     */
    public function isLikelyKeyColumn(string $header, array $sampleValues): bool
    {
        $h = strtolower(trim($header));

        // Direct key keyword match
        if (in_array($h, ['id', 'uuid', 'key', '_id', 'no_responden', 'kode_responden', 'kode_keluarga'])) {
            return true;
        }

        // Check if sample values are unique and non-empty
        $nonEmpty = array_filter(array_map('trim', $sampleValues), fn ($v) => $v !== '');
        if (count($nonEmpty) >= 3 && count($nonEmpty) === count(array_unique($nonEmpty))) {
            if (preg_match('/(^|_)(id|kode|nik|no|nomor|code|key)($|_)/i', $h)) {
                return true;
            }
        }

        return false;
    }
}
