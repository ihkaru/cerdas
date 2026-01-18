<?php

namespace App\Imports;

use App\Models\Assignment;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class PrelistImport implements ToCollection, WithHeadingRow {
    private $formVersionId;
    private $appId;
    private $supervisorCache = [];
    private $enumeratorCache = [];
    private $orgCache = [];

    public function __construct(int $formVersionId, int $appId) {
        $this->formVersionId = $formVersionId;
        $this->appId = $appId;
    }

    public function collection(Collection $rows) {
        foreach ($rows as $row) {
            $this->createAssignment($row);
        }
    }

    private function createAssignment($row) {
        // Extract known fields
        $externalId = $row['external_id'] ?? null;
        $orgCode = $row['organization'] ?? null;
        $supervisorEmail = $row['supervisor'] ?? null;
        $enumeratorEmail = $row['enumerator'] ?? null;

        // Find Organization
        $orgId = null;
        if ($orgCode) {
            if (!isset($this->orgCache[$orgCode])) {
                // Assuming organization still uses project_id column or we use app_id if migrated
                // The AppSeeder used firstOrCreate assuming Organization model checks 'project_id' or 'app_id'.
                // If migration didn't rename organization.project_id, we keep it as is or assume App ID matches.
                // Safest bet: query using 'project_id' column if it exists, matching $this->appId
                $org = Organization::where('project_id', $this->appId)
                    ->where('code', $orgCode)
                    ->first();
                $this->orgCache[$orgCode] = $org?->id;
            }
            $orgId = $this->orgCache[$orgCode];
        }

        // Find Supervisor
        $supervisorId = null;
        if ($supervisorEmail) {
            if (!isset($this->supervisorCache[$supervisorEmail])) {
                $user = User::where('email', $supervisorEmail)->first();
                $this->supervisorCache[$supervisorEmail] = $user?->id;
            }
            $supervisorId = $this->supervisorCache[$supervisorEmail];
        }

        // Find Enumerator
        $enumeratorId = null;
        if ($enumeratorEmail) {
            if (!isset($this->enumeratorCache[$enumeratorEmail])) {
                $user = User::where('email', $enumeratorEmail)->first();
                $this->enumeratorCache[$enumeratorEmail] = $user?->id;
            }
            $enumeratorId = $this->enumeratorCache[$enumeratorEmail];
        }

        // Remove known fields from prelist data
        $prelistData = $row->except(['external_id', 'organization', 'supervisor', 'enumerator'])->toArray();

        // Create Assignment
        Assignment::create([
            'form_version_id' => $this->formVersionId,
            'organization_id' => $orgId,
            'supervisor_id' => $supervisorId,
            'enumerator_id' => $enumeratorId,
            'external_id' => $externalId,
            'status' => 'assigned',
            'prelist_data' => $prelistData,
        ]);
    }
}
