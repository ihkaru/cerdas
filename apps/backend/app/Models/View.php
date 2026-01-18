<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class View extends Model {
    use HasFactory, HasUuids;

    protected $fillable = [
        'app_id',
        'form_id',
        'name',
        'type',
        'description',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function app(): BelongsTo {
        return $this->belongsTo(App::class);
    }

    public function form(): BelongsTo {
        return $this->belongsTo(Form::class);
    }
}
