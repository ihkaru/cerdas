<?php

namespace App\Services;

/**
 * GoogleSheetColumnMapper
 *
 * Maps between Cerdas field schema (TableVersion.fields) and Google Sheet columns.
 * Responsible for:
 * - Building header rows (column names)
 * - Building data rows (values in header order)
 * - Detecting repeatable (nested) fields that need separate Sheet tabs
 */
class GoogleSheetColumnMapper
{
    /**
     * Fixed system columns that always appear first in every Sheet tab.
     * These are metadata columns, not form fields.
     */
    private const SYSTEM_COLUMNS_ROOT = [
        '_response_id' => 'Response ID',
        '_status' => 'Status',
        '_enumerator' => 'Enumerator',
        '_submitted_at' => 'Submitted At',
        '_status_updated_at' => 'Status Updated At',
        '_status_history' => 'Status History',
        '_synced_at' => 'Synced At',
        '_assignment' => 'Assignment ID',
    ];

    private const SYSTEM_COLUMNS_NESTED = [
        '_child_response_id' => 'Child Response ID',
        '_parent_response_id' => 'Parent Response ID',
        '_submitted_at' => 'Submitted At',
        '_synced_at' => 'Synced At',
    ];

    /**
     * Build the header row (array of column labels) for a Sheet tab.
     *
     * For root tabs: system columns + all non-repeatable field labels.
     * For nested tabs: nested system columns + fields inside the repeatable section.
     *
     * @param  array  $fields  TableVersion.fields array
     * @param  bool  $isRoot  True for root tab, false for nested tab
     * @param  string|null  $nestedFieldKey  For nested tabs: the field_key of the repeatable section
     * @return array<string> Ordered list of column headers (human-readable labels)
     */
    public function buildHeaders(array $fields, bool $isRoot = true, ?string $nestedFieldKey = null): array
    {
        if ($isRoot) {
            $headers = array_values(self::SYSTEM_COLUMNS_ROOT);

            foreach ($fields as $field) {
                // Skip layout-only / structural fields (separators, html blocks) that carry no data
                if ($this->isLayoutField($field)) {
                    continue;
                }
                // Skip repeatable/nested fields — they go to their own tabs
                if ($this->isRepeatableField($field)) {
                    continue;
                }
                $headers[] = $field['name'] ?? $field['key'] ?? $field['label'] ?? 'Unknown';
            }

            return $headers;
        }

        // Nested tab: find the repeatable field and use its sub-fields
        $headers = array_values(self::SYSTEM_COLUMNS_NESTED);

        foreach ($fields as $field) {
            if (! $this->isRepeatableField($field)) {
                continue;
            }

            $fieldKey = $field['name'] ?? $field['key'] ?? null;
            if ($fieldKey !== $nestedFieldKey) {
                continue;
            }

            // Add each sub-field as a column
            $subFields = $field['fields'] ?? $field['sub_fields'] ?? [];
            foreach ($subFields as $subField) {
                if ($this->isLayoutField($subField)) {
                    continue;
                }
                $headers[] = ($field['name'] ?? $field['key'] ?? $field['label']).'.'.($subField['name'] ?? $subField['key'] ?? $subField['label'] ?? 'Unknown');
            }

            break;
        }

        return $headers;
    }

    /**
     * Build a single data row (array of values) matching the header order.
     *
     * @param  array  $responseData  Response.data array (the form submission JSON)
     * @param  array  $fields  TableVersion.fields array
     * @param  bool  $isRoot  True for root response, false for nested
     * @param  array  $metadata  System column values: response_id, submitted_at, etc.
     * @param  string|null  $nestedFieldKey  For nested tabs: which repeatable field this is for
     * @return array<mixed> Ordered values matching buildHeaders()
     */
    public function buildRowValues(
        array $responseData,
        array $fields,
        bool $isRoot,
        array $metadata,
        ?string $nestedFieldKey = null
    ): array {
        if ($isRoot) {
            $row = [
                $metadata['response_id'] ?? '',
                $metadata['status'] ?? '',
                $metadata['enumerator'] ?? '',
                $metadata['submitted_at'] ?? '',
                $metadata['status_updated_at'] ?? '',
                $metadata['status_history'] ?? '',
                $metadata['synced_at'] ?? now()->toISOString(),
                $metadata['assignment'] ?? '',
            ];

            foreach ($fields as $field) {
                if ($this->isLayoutField($field)) {
                    continue;
                }
                if ($this->isRepeatableField($field)) {
                    continue;
                }

                $key = $field['name'] ?? $field['key'] ?? null;
                $value = $key ? ($responseData[$key] ?? '') : '';

                // Flatten complex values (arrays, objects) to string for Sheets
                $row[] = $this->flattenValue($value);
            }

            return $row;
        }

        // Nested row
        $row = [
            $metadata['child_response_id'] ?? '',
            $metadata['parent_response_id'] ?? '',
            $metadata['submitted_at'] ?? '',
            $metadata['synced_at'] ?? now()->toISOString(),
        ];

        foreach ($fields as $field) {
            if (! $this->isRepeatableField($field)) {
                continue;
            }

            $fieldKey = $field['name'] ?? $field['key'] ?? null;
            if ($fieldKey !== $nestedFieldKey) {
                continue;
            }

            $subFields = $field['fields'] ?? $field['sub_fields'] ?? [];
            foreach ($subFields as $subField) {
                if ($this->isLayoutField($subField)) {
                    continue;
                }
                $subKey = $subField['name'] ?? $subField['key'] ?? null;
                $value = $subKey ? ($responseData[$subKey] ?? '') : '';
                $row[] = $this->flattenValue($value);
            }

            break;
        }

        return $row;
    }

    /**
     * Get all repeatable (nested) fields from a schema recursively.
     * Supports arbitrary N-level deeply nested forms.
     * Returns [field_key => field_label] mapping.
     *
     * @param  array  $fields  TableVersion.fields array
     * @param  string  $prefix  Prefix for nested field keys
     * @return array<string, string>
     */
    public function getRepeatableFields(array $fields, string $prefix = ''): array
    {
        $result = [];

        foreach ($fields as $field) {
            if ($this->isRepeatableField($field)) {
                $key = $field['name'] ?? $field['key'] ?? null;
                $label = $field['label'] ?? $key ?? 'Unknown';

                if ($key) {
                    $fullKey = $prefix ? "{$prefix}.{$key}" : $key;
                    $result[$fullKey] = $label;

                    // Recursively inspect sub-fields for multi-level nested repeatable forms
                    $subFields = $field['fields'] ?? $field['sub_fields'] ?? [];
                    if (! empty($subFields) && is_array($subFields)) {
                        $nestedResults = $this->getRepeatableFields($subFields, $fullKey);
                        $result = array_merge($result, $nestedResults);
                    }
                }
            } elseif (isset($field['fields']) && is_array($field['fields'])) {
                // If it's a non-repeatable group carrying sub-fields, check inside
                $nestedResults = $this->getRepeatableFields($field['fields'], $prefix);
                $result = array_merge($result, $nestedResults);
            }
        }

        return $result;
    }

    /**
     * Get the system column keys (for mapping response_id in Sheet → row lookup).
     *
     * @return array<string>
     */
    public function getSystemColumnKeys(bool $isRoot = true): array
    {
        return array_keys($isRoot ? self::SYSTEM_COLUMNS_ROOT : self::SYSTEM_COLUMNS_NESTED);
    }

    /**
     * Format status_history array into a clean multi-line bullet list string for Google Sheets.
     */
    public function formatStatusHistory(?array $history): string
    {
        if (empty($history) || ! is_array($history)) {
            return '';
        }

        $lines = [];
        foreach ($history as $entry) {
            $status = match ($entry['status'] ?? '') {
                'submitted' => 'Submitted',
                'in_progress' => 'In Progress',
                'verified', 'approved' => 'Approved',
                'rejected' => 'Rejected',
                default => ucfirst(str_replace('_', ' ', $entry['status'] ?? 'unknown')),
            };

            $timestampStr = '';
            if (! empty($entry['timestamp'])) {
                try {
                    $dt = new \DateTimeImmutable($entry['timestamp']);
                    $timestampStr = $dt->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d H:i:s').' UTC';
                } catch (\Throwable $e) {
                    $timestampStr = $entry['timestamp'];
                }
            }

            $by = $entry['user_email'] ?? $entry['user_name'] ?? 'System';

            $lines[] = "• {$status} ({$timestampStr} by {$by})";
        }

        return implode("\n", $lines);
    }

    /**
     * Determine the column letter for a given 0-based index (A, B, ..., Z, AA, AB, ...).
     */
    public function indexToColumnLetter(int $index): string
    {
        $letter = '';

        while ($index >= 0) {
            $letter = chr(($index % 26) + ord('A')).$letter;
            $index = intdiv($index, 26) - 1;
        }

        return $letter;
    }

    // ========== Private Helpers ==========

    /**
     * Check if a field is purely structural/layout (separator, html_block, section_header, note)
     * and carries no user input data.
     */
    private function isLayoutField(array $field): bool
    {
        $type = strtolower($field['type'] ?? '');

        return in_array($type, ['separator', 'html_block', 'html', 'header', 'section_header', 'note', 'divider'], true);
    }

    /**
     * Check if a field is a repeatable/nested section.
     * Supports common field type names used in Cerdas schema.
     */
    private function isRepeatableField(array $field): bool
    {
        $type = strtolower($field['type'] ?? '');

        return in_array($type, ['nested', 'repeatable', 'sub_form', 'subform', 'array', 'repeat', 'nested_form'], true);
    }

    /**
     * Flatten a value to a string suitable for a Sheet cell.
     * - Strings, numbers, booleans: returned as-is (cast to string)
     * - Media/Image paths: converted to full absolute Clickable URLs
     * - Arrays/objects: JSON-encoded (e.g. GPS coordinates, checkbox lists)
     * - Null: empty string
     */
    private function flattenValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_string($value)) {
            return $this->formatMediaUrl($value);
        }

        if (is_array($value) || is_object($value)) {
            // Process media URLs inside arrays if applicable
            $processed = is_array($value)
                ? array_map(fn ($item) => is_string($item) ? $this->formatMediaUrl($item) : $item, $value)
                : $value;

            return json_encode($processed, JSON_UNESCAPED_UNICODE);
        }

        return (string) $value;
    }

    /**
     * Convert relative /storage/ paths into full absolute /media/ URLs
     * so links are directly clickable in Google Sheets and external tools.
     */
    private function formatMediaUrl(string $val): string
    {
        if (str_starts_with($val, '/storage/') || str_starts_with($val, 'storage/')) {
            $relativePath = ltrim(preg_replace('/^\/?storage\//', '', $val), '/');
            $baseUrl = rtrim(config('app.url', 'http://localhost:9980'), '/');

            return "{$baseUrl}/media/{$relativePath}";
        }

        return $val;
    }
}
