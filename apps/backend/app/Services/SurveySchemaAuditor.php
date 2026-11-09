<?php

namespace App\Services;

class SurveySchemaAuditor
{
    public const CANONICAL_TYPES = [
        'text', 'long_text', 'textarea', 'number', 'url', 'date', 'time', 'datetime',
        'select', 'radio', 'checkbox', 'gps', 'image', 'signature',
        'nested_form', 'nested', 'separator', 'html_block', 'lookup',
    ];

    public const OPTION_REQUIRED_TYPES = ['select', 'radio', 'checkbox'];

    /**
     * Audit questionnaire table schemas per the Cerdas JSON Validator & Technical Manual.
     *
     * @param  \Illuminate\Support\Collection|\App\Models\Table[]  $tables
     * @return array<string> List of detected schema issues
     */
    public function audit($tables): array
    {
        $issues = [];

        foreach ($tables as $table) {
            $version = $table->latestPublishedVersion ?? $table->versions()->latest()->first();
            if ($version && is_array($version->fields)) {
                $this->auditFields($version->fields, $table->name, '', $issues);
                $this->auditGoogleSheetsLineage($table, $version->fields, $issues);
            }
        }

        return $issues;
    }

    /**
     * Recursively audit fields, options, labels, duplicates, and nested sub-forms.
     */
    private function auditFields(array $fields, string $tableName, string $prefix, array &$issues): void
    {
        $seenNames = [];

        foreach ($fields as $field) {
            if (! is_array($field)) {
                $issues[] = "Table '{$tableName}' contains an invalid non-object field entry.";
                continue;
            }

            $fieldName = $field['name'] ?? $field['key'] ?? '';
            $fullPath = $prefix ? "{$prefix}.{$fieldName}" : $fieldName;

            // 1. Name validation & Duplicate detection
            if (empty($fieldName) || ! is_string($fieldName) || trim($fieldName) === '') {
                $issues[] = "Table '{$tableName}' field at '{$prefix}' is missing required string 'name'.";
            } elseif (in_array($fieldName, $seenNames, true)) {
                $issues[] = "Table '{$tableName}' has duplicate field name '{$fieldName}'".($prefix ? " in '{$prefix}'" : '').'.';
            } else {
                $seenNames[] = $fieldName;
            }

            $type = $field['type'] ?? null;

            // 2. Canonical Type validation
            if (! $type || ! in_array($type, self::CANONICAL_TYPES, true)) {
                $issues[] = "Table '{$tableName}' field '{$fullPath}' uses invalid/unknown type '{$type}'. Must be one of: ".implode(', ', self::CANONICAL_TYPES);
            }

            // 3. Label validation (required for all types except html_block)
            if ($type !== 'html_block') {
                $label = $field['label'] ?? null;
                if (empty($label) || ! is_string($label) || trim($label) === '') {
                    $issues[] = "Table '{$tableName}' field '{$fullPath}' is missing required string 'label'.";
                }
            }

            // 4. Options validation (select, radio, checkbox)
            if (in_array($type, self::OPTION_REQUIRED_TYPES, true)) {
                $hasOptions = ! empty($field['options']) && is_array($field['options']);
                $hasOptionsFn = ! empty($field['options_fn']) && is_string($field['options_fn']);

                if (! $hasOptions && ! $hasOptionsFn) {
                    $issues[] = "Table '{$tableName}' field '{$fullPath}' requires 'options' array or 'options_fn' function.";
                } elseif ($hasOptions) {
                    foreach ($field['options'] as $idx => $opt) {
                        if (! is_array($opt)) {
                            $issues[] = "Table '{$tableName}' field '{$fullPath}' option [{$idx}] must be an object with 'label' and 'value'.";
                            break;
                        }
                        if (! array_key_exists('label', $opt) || ! is_string($opt['label'])) {
                            $issues[] = "Table '{$tableName}' field '{$fullPath}' option [{$idx}] is missing string 'label'.";
                            break;
                        }
                        if (! array_key_exists('value', $opt) || $opt['value'] === '') {
                            $issues[] = "Table '{$tableName}' field '{$fullPath}' option [{$idx}] is missing 'value'.";
                            break;
                        }
                    }
                }
            }

            // 5. Nested form recursion
            if ($type === 'nested_form' || $type === 'nested') {
                $childFields = $field['fields'] ?? [];
                if (! is_array($childFields) || empty($childFields)) {
                    $issues[] = "Table '{$tableName}' nested sub-form '{$fullPath}' has no child fields defined.";
                } else {
                    $this->auditFields($childFields, $tableName, $fullPath, $issues);
                }
            }
        }
    }

    /**
     * Audit Google Sheets sync sub-tab relational lineage.
     */
    private function auditGoogleSheetsLineage($table, array $fields, array &$issues): void
    {
        if (($table->source_type ?? '') !== 'google_sheets') {
            return;
        }

        $sourceConfig = $table->source_config ?? [];
        $gsConfig = $sourceConfig['google_sheet'] ?? [];
        $tabs = $gsConfig['tabs'] ?? [];

        if (empty($tabs) || ! is_array($tabs)) {
            return;
        }

        // Collect all nested field names in schema
        $nestedFieldNames = [];
        foreach ($fields as $f) {
            if (in_array($f['type'] ?? '', ['nested_form', 'nested'], true)) {
                $nestedFieldNames[] = $f['name'] ?? $f['key'] ?? '';
            }
        }

        foreach ($tabs as $tab) {
            if (($tab['type'] ?? '') === 'nested') {
                $fieldKey = $tab['field_key'] ?? '';
                if (! in_array($fieldKey, $nestedFieldNames, true)) {
                    $issues[] = "Table '{$table->name}' Google Sheet nested tab '{$tab['sheet_name']}' references non-existent nested form field '{$fieldKey}'.";
                }
            }
        }
    }
}
