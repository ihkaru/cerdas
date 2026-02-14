<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'is_super_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
        ];
    }

    /**
     * Check if user is a super admin
     */
    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    // ========== Relationships ==========

    public function createdApps(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(App::class, 'created_by');
    }

    public function appMemberships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AppMembership::class);
    }

    /**
     * Get all apps the user is a member of.
     */
    public function apps(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        // Use pivot model AppMembership
        return $this->belongsToMany(App::class, 'app_memberships')
            ->using(AppMembership::class)
            ->withPivot(['role', 'organization_id', 'is_active', 'supervisor_id'])
            ->withTimestamps();
    }

    public function supervisedAppMemberships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AppMembership::class, 'supervisor_id');
    }

    public function assignments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Assignment::class, 'enumerator_id');
    }

    public function supervisedAssignments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Assignment::class, 'supervisor_id');
    }

    /**
     * Get all organizations the user is a member of.
     * New: Reusable Teams logic.
     */
    public function organizations(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    // ========== Helpers ==========

    /**
     * Get membership for a specific app
     */
    public function getMembershipForApp(string $appId): ?AppMembership
    {
        return $this->appMemberships()
            ->where('app_id', $appId)
            ->first();
    }

    /**
     * Check if user has access to an app
     */
    public function hasAppAccess(string $appId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        // 1. Direct App Membership
        $direct = $this->appMemberships()
            ->where('app_id', $appId)
            ->where('is_active', true)
            ->exists();

        if ($direct) {
            return true;
        }

        // 2. Indirect Access via Organization Membership (Reusable Teams)
        // Check if user is a member of any organization that is attached to this app.
        return $this->organizations()
            ->whereHas('apps', function ($q) use ($appId) {
                $q->where('apps.id', $appId);
            })
            ->exists();
    }

    /**
     * Helper: Accept all pending App Invitations for this user
     */
    public function acceptPendingInvitations()
    {
        // Process App Invitations (Auto-Accept)
        $appInvitations = \App\Models\AppInvitation::where('email', $this->email)->get();
        foreach ($appInvitations as $invite) {
            // Check if already member
            $existing = \App\Models\AppMembership::where('app_id', $invite->app_id)
                ->where('user_id', $this->id)
                ->exists();

            if (! $existing) {
                \App\Models\AppMembership::create([
                    'app_id' => $invite->app_id,
                    'user_id' => $this->id,
                    'role' => $invite->role,
                    'is_active' => true,
                ]);
            }

            $invite->delete();
        }

        return $appInvitations->count();
    }
}
