<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

/**
 * GoogleOAuthToken Model
 *
 * Stores encrypted Google OAuth tokens at the App level (Opsi B: App-Level Token Owner).
 * One token per App. The user who first connects becomes the token owner.
 * All Sheet sync operations for the App use this token.
 *
 * Security: access_token and refresh_token are encrypted at rest using
 * Laravel's Crypt::encryptString() / decryptString().
 *
 * @property string $id
 * @property string $app_id
 * @property string $user_id
 * @property string $access_token (auto-decrypted on access)
 * @property string $refresh_token (auto-decrypted on access)
 * @property string $scopes
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class GoogleOAuthToken extends Model
{
    // Must be explicit: Laravel would infer 'google_o_auth_tokens' (splits each capital)
    protected $table = 'google_oauth_tokens';

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'app_id',
        'user_id',
        'access_token',
        'refresh_token',
        'scopes',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    // ========== Encrypted Accessors / Mutators ==========

    /**
     * Store access_token encrypted.
     */
    public function setAccessTokenAttribute(string $value): void
    {
        $this->attributes['access_token'] = Crypt::encryptString($value);
    }

    /**
     * Retrieve access_token decrypted.
     */
    public function getAccessTokenAttribute(string $value): string
    {
        return Crypt::decryptString($value);
    }

    /**
     * Store refresh_token encrypted.
     */
    public function setRefreshTokenAttribute(string $value): void
    {
        $this->attributes['refresh_token'] = Crypt::encryptString($value);
    }

    /**
     * Retrieve refresh_token decrypted.
     */
    public function getRefreshTokenAttribute(string $value): string
    {
        return Crypt::decryptString($value);
    }

    // ========== Relationships ==========

    public function app(): BelongsTo
    {
        return $this->belongsTo(App::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ========== Helpers ==========

    /**
     * Check if the access token is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the access token should be refreshed proactively
     * (expires within the next 10 minutes).
     */
    public function needsRefresh(): bool
    {
        return $this->expires_at->isBefore(now()->addMinutes(10));
    }

    /**
     * Build a token array compatible with Google Client setAccessToken().
     */
    public function toGoogleTokenArray(): array
    {
        return [
            'access_token' => $this->access_token,
            'refresh_token' => $this->refresh_token,
            'expires_in' => max(0, now()->diffInSeconds($this->expires_at, false)),
            'created' => $this->updated_at?->timestamp ?? $this->created_at->timestamp,
            'scope' => $this->scopes,
        ];
    }
}
