<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class View extends Model {
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted() {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'app_id',
        'table_id', // Renamed from form_id
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

    public function table(): BelongsTo {
        return $this->belongsTo(Table::class);
    }
}
