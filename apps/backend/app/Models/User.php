<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable {
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
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
    protected function casts(): array {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
        ];
    }

    /**
     * Check if user is a super admin
     */
    public function isSuperAdmin(): bool {
        return (bool) $this->is_super_admin;
    }

    // ========== Relationships ==========

    public function createdApps(): \Illuminate\Database\Eloquent\Relations\HasMany {
        return $this->hasMany(App::class, 'created_by');
    }

    public function appMemberships(): \Illuminate\Database\Eloquent\Relations\HasMany {
        return $this->hasMany(AppMembership::class);
    }

    /**
     * Get all apps the user is a member of.
     */
    public function apps(): \Illuminate\Database\Eloquent\Relations\BelongsToMany {
        // Use pivot model AppMembership
        return $this->belongsToMany(App::class, 'app_memberships')
            ->using(AppMembership::class)
            ->withPivot(['role', 'organization_id', 'is_active', 'supervisor_id'])
            ->withTimestamps();
    }

    public function supervisedAppMemberships(): \Illuminate\Database\Eloquent\Relations\HasMany {
        return $this->hasMany(AppMembership::class, 'supervisor_id');
    }

    public function assignments(): \Illuminate\Database\Eloquent\Relations\HasMany {
        return $this->hasMany(Assignment::class, 'enumerator_id');
    }

    public function supervisedAssignments(): \Illuminate\Database\Eloquent\Relations\HasMany {
        return $this->hasMany(Assignment::class, 'supervisor_id');
    }

    // ========== Helpers ==========

    /**
     * Get membership for a specific app
     */
    public function getMembershipForApp(int $appId): ?AppMembership {
        return $this->appMemberships()
            ->where('app_id', $appId)
            ->first();
    }

    /**
     * Check if user has access to an app
     */
    public function hasAppAccess(int $appId): bool {
        if ($this->isSuperAdmin()) {
            return true;
        }
        return $this->appMemberships()
            ->where('app_id', $appId)
            ->where('is_active', true)
            ->exists();
    }
}
