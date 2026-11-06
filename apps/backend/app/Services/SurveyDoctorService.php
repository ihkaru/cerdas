<?php

namespace App\Services;

use App\Models\App;
use App\Models\Assignment;

class SurveyDoctorService
{
    /**
     * Diagnose a single survey app and return a comprehensive readiness scorecard.
     */
    public function diagnoseApp(App $app): array
    {
        $app->loadMissing(['tables.latestPublishedVersion', 'tables.versions', 'memberships.user', 'joinLinks']);

        $checks = [];
        $remediations = [];

        // 1. App Active Status
        $isActive = (bool) $app->is_active && ! $app->trashed();
        $checks[] = $this->makeCheck('APP_ACTIVE', 'Activity Status', 'GSBPM 1 & 2', 'critical',
            $isActive ? 'pass' : 'fail',
            $isActive ? 'Survey activity is active and unarchived.' : 'Survey activity is archived or inactive.',
            $isActive ? null : "cerdas app update {$app->id} --active true"
        );
        if (! $isActive) $remediations[] = "cerdas app update {$app->id} --active true";

        // 2. Schedule & Timeline
        $now = now();
        $isExpired = false;
        $scheduleMsg = 'Survey schedule is active or unconstrained.';
        $scheduleStatus = 'pass';
        if ($app->start_date && $now->lt($app->start_date)) {
            $scheduleStatus = 'warn';
            $scheduleMsg = "Survey has not started yet (Starts: {$app->start_date->toIso8601String()}).";
        } elseif ($app->end_date && $now->gt($app->end_date)) {
            $isExpired = true;
            $scheduleStatus = $app->expired_behavior === 'block' ? 'fail' : 'warn';
            $scheduleMsg = "Survey deadline has passed (Ended: {$app->end_date->toIso8601String()}, Behavior: {$app->expired_behavior}).";
        }
        $checks[] = $this->makeCheck('APP_SCHEDULE', 'Schedule & Timeline', 'GSBPM 1 & 2', 'medium',
            $scheduleStatus, $scheduleMsg,
            $isExpired ? "cerdas app update {$app->id} --end-date 'YYYY-MM-DDTHH:MM:SSZ'" : null
        );

        // 3. Enumerator Staffing
        $enumeratorMembers = $app->memberships->where('role', 'enumerator');
        $hasEnumerators = $enumeratorMembers->isNotEmpty();
        $checks[] = $this->makeCheck('ENUMERATORS_ENROLLED', 'Field Enumerator Staffing', 'GSBPM 4.2', 'high',
            $hasEnumerators ? 'pass' : 'warn',
            $hasEnumerators ? "Found {$enumeratorMembers->count()} enrolled enumerator(s)." : 'No field enumerators currently enrolled.',
            $hasEnumerators ? null : "cerdas app member add {$app->id} --user <email> --role enumerator"
        );
        if (! $hasEnumerators) $remediations[] = "cerdas app member add {$app->id} --user <email> --role enumerator";

        // 4. Join Link Readiness
        $activeJoinLink = $app->joinLinks->where('is_active', true)->first();
        $checks[] = $this->makeCheck('JOIN_LINK_READY', 'Surveyor Self-Enrollment Link', 'GSBPM 4.2', 'low',
            $activeJoinLink ? 'pass' : 'info',
            $activeJoinLink ? "Shareable join link is active ({$activeJoinLink->role})." : 'No active public join link (direct member assignment only).',
            $activeJoinLink ? null : "cerdas app share-link {$app->id} enable --role enumerator"
        );

        // 5. Questionnaire Tables Exist
        $tables = $app->tables;
        $hasTables = $tables->isNotEmpty();
        $checks[] = $this->makeCheck('TABLES_EXIST', 'Questionnaire Instruments', 'GSBPM 3', 'critical',
            $hasTables ? 'pass' : 'fail',
            $hasTables ? "Found {$tables->count()} questionnaire table(s)." : 'App has 0 questionnaire tables. Mobile PWA will alert "Aplikasi ini belum memiliki tabel/form data".',
            $hasTables ? null : "cerdas table create --app {$app->id} --name 'Form Utama' --publish"
        );
        if (! $hasTables) $remediations[] = "cerdas table create --app {$app->id} --name 'Form Utama' --publish";

        // 6. Table Version Publishing
        $unpublishedTables = $tables->filter(fn ($t) => ! $t->latestPublishedVersion);
        $allPublished = $hasTables && $unpublishedTables->isEmpty();
        $checks[] = $this->makeCheck('TABLES_PUBLISHED', 'Table Version Publishing', 'GSBPM 3', 'critical',
            $allPublished ? 'pass' : ($hasTables ? 'fail' : 'pass'),
            $allPublished ? 'All questionnaire tables have published live versions.' : ($unpublishedTables->isNotEmpty() ? "Table(s) without published version: {$unpublishedTables->pluck('name')->join(', ')}." : 'No tables to publish.'),
            $unpublishedTables->isNotEmpty() ? "cerdas table publish --app {$app->id} --table {$unpublishedTables->first()->id}" : null
        );
        foreach ($unpublishedTables as $unpub) {
            $remediations[] = "cerdas table publish --app {$app->id} --table {$unpub->id}";
        }

        // 7. Navigation Tabs Configuration
        $nav = is_array($app->navigation) ? $app->navigation : [];
        $hasNav = ! empty($nav);
        $checks[] = $this->makeCheck('NAVIGATION_CONFIGURED', 'Mobile App Shell Navigation', 'GSBPM 3 Layout', 'critical',
            $hasNav ? 'pass' : 'fail',
            $hasNav ? 'Configured with '.count($nav).' navigation tab(s).' : 'Navigation bar has 0 tabs. Mobile bottom navigation will be empty.',
            $hasNav ? null : "cerdas app update {$app->id} --navigation-json '[...]' --view-configs-json '{...}'"
        );
        if (! $hasNav && $hasTables) {
            $remediations[] = "cerdas app update {$app->id} --navigation-json '[...]' --view-configs-json '{...}'";
        }

        // 8. View-to-Table Bindings & Field Integrity
        $viewConfigs = is_array($app->view_configs) ? $app->view_configs : [];
        $tableIds = $tables->pluck('id')->all();
        $brokenBindings = [];
        $viewFieldsIssues = [];

        foreach ($nav as $item) {
            $vId = $item['view_id'] ?? null;
            if (! $vId || ! isset($viewConfigs[$vId])) {
                $brokenBindings[] = "Nav '{$item['label']}' references unconfigured view ID '{$vId}'";
                continue;
            }
            $vc = $viewConfigs[$vId];
            $targetTableId = $vc['table_id'] ?? null;
            if (! $targetTableId || ! in_array($targetTableId, $tableIds)) {
                $brokenBindings[] = "View '{$vId}' references non-existent table '{$targetTableId}'";
                continue;
            }

            $targetTable = $tables->firstWhere('id', $targetTableId);
            $fields = collect($targetTable?->latestPublishedVersion?->fields ?? [])->pluck('name')->all();
            if (! empty($fields)) {
                $primaryField = $vc['deck']['primaryHeaderField'] ?? null;
                if ($primaryField && ! in_array($primaryField, $fields)) {
                    $viewFieldsIssues[] = "View '{$vId}' primaryHeaderField '{$primaryField}' not found in table '{$targetTable->name}'";
                }
                foreach ((array) ($vc['groupBy'] ?? []) as $gb) {
                    if ($gb && ! in_array($gb, $fields)) {
                        $viewFieldsIssues[] = "View '{$vId}' groupBy field '{$gb}' not found in table '{$targetTable->name}'";
                    }
                }
            }
        }

        $bindingsOk = empty($brokenBindings);
        $checks[] = $this->makeCheck('VIEW_BINDINGS', 'View Table Bindings', 'GSBPM 3 Layout', 'critical',
            $bindingsOk ? 'pass' : 'fail',
            $bindingsOk ? 'All views properly resolve to active questionnaire tables.' : implode('; ', $brokenBindings),
            $bindingsOk ? null : "cerdas app update {$app->id} --view-configs-json '{...}'"
        );

        $fieldsOk = empty($viewFieldsIssues);
        $checks[] = $this->makeCheck('VIEW_FIELDS_INTEGRITY', 'View Header & GroupBy Integrity', 'GSBPM 3 Layout', 'medium',
            $fieldsOk ? 'pass' : 'warn',
            $fieldsOk ? 'All card headers and grouping fields exist in published table schemas.' : implode('; ', $viewFieldsIssues),
            $fieldsOk ? null : 'Review column names in table schema vs view_configs groupBy/headerField'
        );

        // 9. Data Availability & Mobile FAB Readiness
        $assignCounts = ! empty($tableIds)
            ? Assignment::whereIn('table_id', $tableIds)->groupBy('table_id')->selectRaw('table_id, count(*) as cnt')->pluck('cnt', 'table_id')->all()
            : [];
        $totalAssignments = array_sum($assignCounts);
        $assignedCount = ! empty($tableIds)
            ? Assignment::whereIn('table_id', $tableIds)->whereNotNull('enumerator_id')->count()
            : 0;
        $unassignedCount = $totalAssignments - $assignedCount;
        $tableReadinessIssues = [];
        $detectedPatterns = [];

        foreach ($tables as $table) {
            $tableAssignCount = $assignCounts[$table->id] ?? 0;
            $settings = $table->settings ?? [];
            $layoutSettings = $table->latestPublishedVersion?->layout['settings'] ?? [];
            $headerActions = $settings['actions']['header'] ?? $layoutSettings['actions']['header'] ?? [];
            $hasCreateAction = collect($headerActions)->contains(fn ($a) => ($a['type'] ?? '') === 'create' || ($a['id'] ?? '') === 'create');

            if ($tableAssignCount > 0) {
                $detectedPatterns[] = 'prelist_driven';
            } elseif ($hasCreateAction) {
                $detectedPatterns[] = 'ad_hoc_reporting';
            } else {
                $tableReadinessIssues[] = "Table '{$table->name}' has 0 assignments AND no '+' FAB create button. Mobile Deck will be blank and stuck!";
                $remediations[] = "Pola Prelist: cerdas prelist upload --app {$app->id} --table {$table->id} --file prelist.json";
                $remediations[] = "Pola Mandiri: cerdas table update --app {$app->id} --table {$table->id} --settings-json '{\"actions\":{\"header\":[{\"id\":\"create\",\"icon\":\"plus\",\"type\":\"create\",\"label\":\"Tambah Baru\"}]}}'";
            }
        }

        $isDataFabReady = empty($tableReadinessIssues);
        $checks[] = $this->makeCheck('DATA_AND_FAB_READINESS', 'Deck View Data & Mobile FAB Readiness', 'GSBPM 4.1 & Mobile UX', 'critical',
            $isDataFabReady ? 'pass' : 'fail',
            $isDataFabReady ? "All tables are operable (Total Assignments: {$totalAssignments}, Prelist / FAB configured)." : implode('; ', $tableReadinessIssues),
            $isDataFabReady ? null : 'Upload prelist or enable header create action on affected tables.'
        );

        // 10. Assignment Allocation Check
        $allocStatus = 'pass';
        $allocMsg = "Assignments are allocated ({$assignedCount} assigned, {$unassignedCount} unassigned).";
        if ($totalAssignments > 0 && $assignedCount === 0) {
            if ($app->mode === 'complex') {
                $allocStatus = 'fail';
                $allocMsg = "In Complex Mode, all {$totalAssignments} assignment(s) are unassigned and will be invisible to field enumerators!";
                $remediations[] = 'cerdas assignment bulk-reassign --ids <comma-ids> --enumerator <user_uuid>';
            } else {
                $allocStatus = 'warn';
                $allocMsg = "All {$totalAssignments} assignment(s) are unassigned (Accessible under Simple Mode shared access).";
            }
        }
        $checks[] = $this->makeCheck('ASSIGNMENT_ALLOCATION', 'Enumerator Task Allocation', 'GSBPM 4.2',
            $app->mode === 'complex' ? 'high' : 'medium',
            $allocStatus, $allocMsg,
            $allocStatus === 'pass' ? null : 'cerdas assignment bulk-reassign --ids <comma-ids> --enumerator <uuid>'
        );

        // Overall Score Calculation
        $criticalChecks = collect($checks)->where('level', 'critical');
        $passedCritical = $criticalChecks->where('status', 'pass')->count();
        $totalCritical = $criticalChecks->count();

        $failuresCount = collect($checks)->where('status', 'fail')->count();
        $warningsCount = collect($checks)->where('status', 'warn')->count();
        $passedCount = collect($checks)->where('status', 'pass')->count();
        $readinessScore = $totalCritical > 0 ? (int) round(($passedCritical / $totalCritical) * 100) : 0;

        $overallStatus = $failuresCount > 0 ? 'not_ready' : ($warningsCount > 0 ? 'needs_attention' : 'ready');
        $pattern = in_array('prelist_driven', $detectedPatterns) && in_array('ad_hoc_reporting', $detectedPatterns)
            ? 'hybrid (prelist + ad-hoc)'
            : (in_array('prelist_driven', $detectedPatterns) ? 'prelist_driven' : (in_array('ad_hoc_reporting', $detectedPatterns) ? 'ad_hoc_reporting' : 'unconfigured'));

        return [
            'app_id' => $app->id,
            'app_name' => $app->name,
            'app_slug' => $app->slug,
            'status' => $overallStatus,
            'readiness_score' => $readinessScore,
            'survey_pattern' => $pattern,
            'summary' => [
                'passed' => $passedCount,
                'warnings' => $warningsCount,
                'failures' => $failuresCount,
                'total_checks' => count($checks),
            ],
            'metrics' => [
                'tables_count' => $tables->count(),
                'published_tables_count' => $tables->filter(fn ($t) => $t->latestPublishedVersion)->count(),
                'members_count' => $app->memberships->count(),
                'enumerators_count' => $enumeratorMembers->count(),
                'assignments_count' => $totalAssignments,
                'assigned_assignments_count' => $assignedCount,
                'unassigned_assignments_count' => $unassignedCount,
                'navigation_items_count' => count($nav),
            ],
            'checks' => $checks,
            'remediations' => array_values(array_unique($remediations)),
        ];
    }

    /**
     * Diagnose multiple survey apps.
     */
    public function diagnoseAll($apps): array
    {
        $reports = [];
        $summary = ['ready' => 0, 'needs_attention' => 0, 'not_ready' => 0];

        foreach ($apps as $app) {
            $report = $this->diagnoseApp($app);
            $reports[] = [
                'app_id' => $report['app_id'],
                'app_name' => $report['app_name'],
                'app_slug' => $report['app_slug'],
                'status' => $report['status'],
                'readiness_score' => $report['readiness_score'],
                'survey_pattern' => $report['survey_pattern'],
                'failures_count' => $report['summary']['failures'],
                'warnings_count' => $report['summary']['warnings'],
                'assignments_count' => $report['metrics']['assignments_count'],
                'remediations_count' => count($report['remediations']),
            ];
            $summary[$report['status']]++;
        }

        return [
            'total_apps' => count($reports),
            'summary' => $summary,
            'apps' => $reports,
        ];
    }

    private function makeCheck(string $id, string $name, string $phase, string $level, string $status, string $message, ?string $fix = null): array
    {
        return [
            'id' => $id,
            'name' => $name,
            'phase' => $phase,
            'level' => $level,
            'status' => $status,
            'message' => $message,
            'fix_suggestion' => $fix,
        ];
    }
}
