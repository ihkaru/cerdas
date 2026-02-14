<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * AppMembership Model
 *
 * Links users to apps with roles.
 * Previously known as "ProjectMembership".
 */
class AppMembership extends Pivot
{
    use HasFactory;

    public $incrementing = true;

    protected $table = 'app_memberships';

    protected $fillable = [
        'app_id',
        'user_id',
        'organization_id',
        'supervisor_id',
        'role',
    ];

    // ========== Relationships ==========

    public function app(): BelongsTo
    {
        return $this->belongsTo(App::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    // ========== Scopes ==========

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    public function scopeAppAdmins($query)
    {
        return $query->where('role', 'app_admin');
    }

    public function scopeOrgAdmins($query)
    {
        return $query->where('role', 'org_admin');
    }

    public function scopeSupervisors($query)
    {
        return $query->where('role', 'supervisor');
    }

    public function scopeEnumerators($query)
    {
        return $query->where('role', 'enumerator');
    }
}
