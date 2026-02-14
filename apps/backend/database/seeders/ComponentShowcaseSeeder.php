<?php

namespace Database\Seeders;

use App\Models\App;
use App\Models\Assignment;
use App\Models\Organization;
use App\Models\Table;
use App\Models\TableVersion;
use App\Models\User;
use App\Models\View;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ComponentShowcaseSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();
        $supervisor = User::where('email', 'supervisor@cerdas.com')->first();
        $enumerator = User::where('email', 'user@example.com')->first();

        if (! $supervisor || ! $enumerator) {
            $this->command->error('Supervisor or Enumerator not found. Run DatabaseSeeder first.');
            // Create dummy if not found (fallback for standalone run)
            $supervisor = User::firstOrCreate(['email' => 'supervisor@cerdas.com'], ['name' => 'Supervisor', 'password' => bcrypt('password')]);
            $enumerator = User::firstOrCreate(['email' => 'user@example.com'], ['name' => 'User', 'password' => bcrypt('password')]);
        }

        // Create or get global Organization
        $org = Organization::firstOrCreate(
            ['code' => 'default-org'],
            ['name' => 'Default Organization']
        );

        // 0. Create or Get App (Simple Mode)
        // We use a specific slug to identify this showcase app
        $app = App::updateOrCreate(
            ['slug' => 'housing-survey-2026'],
            [
                'name' => 'Housing Survey 2026',
                'description' => 'Demo App for Cerdas Platform',
                'is_active' => true,
                'mode' => 'simple', // Simple mode - direct membership
                'created_by' => $supervisor->id,
            ]
        );

        // Attach Organization to App (via pivot)
        $app->organizations()->syncWithoutDetaching([$org->id]);

        // Create App Memberships (required for API authorization)
        \App\Models\AppMembership::firstOrCreate(
            ['app_id' => $app->id, 'user_id' => $supervisor->id],
            ['organization_id' => $org->id, 'role' => 'supervisor']
        );
        \App\Models\AppMembership::firstOrCreate(
            ['app_id' => $app->id, 'user_id' => $enumerator->id],
            ['organization_id' => $org->id, 'role' => 'enumerator', 'supervisor_id' => $supervisor->id]
        );

        // 1. Define the Fields with ALL Components
        // Note: 'schema' wrapper removed, using direct array of fields
        $fields = [
            // --- Section 1: Basic Inputs ---
            [
                'name' => 'basic_header',
                'type' => 'html_block',
                'content' => '<h3 class="no-margin-bottom">Basic Inputs</h3><p class="text-color-gray no-margin-top">Standard data entry fields.</p>',
            ],
            [
                'name' => 'fullname',
                'label' => 'Full Name (Text)',
                'displayName' => 'Nama',
                'description' => 'Nama lengkap responden sesuai KTP',
                'type' => 'text',
                'required' => true,
                'placeholder' => 'Enter your full name',
                'searchable' => true,
                'key' => true,
                'preview' => true,
                // Warning if name is too short
                'warning_fn' => 'if (value && value.length < 3) return "Nama terlalu pendek, pastikan sesuai KTP"; return null;',
            ],
            [
                'name' => 'age',
                'label' => 'Age (Number)',
                'displayName' => 'Umur',
                'description' => 'Usia dalam tahun',
                'type' => 'number',
                'required' => true,
                'min' => 0,
                'max' => 120,
                'preview' => true,
                // Warning for non-productive age
                'warning_fn' => 'if (value < 17) return "Responden di bawah usia produktif"; if (value > 65) return "Responden di atas usia produktif"; return null;',
            ],
            [
                'name' => 'birthdate',
                'label' => 'Date of Birth (Date)',
                'type' => 'date',
                'required' => true,
            ],

            // --- Section 2: Choices ---
            [
                'name' => 'choices_header',
                'type' => 'html_block',
                'content' => '<h3 class="no-margin-bottom">Selection Controls</h3><p class="text-color-gray no-margin-top">Single and multiple choice options.</p>',
            ],
            [
                'name' => 'gender',
                'label' => 'Gender (Radio)',
                'displayName' => 'JK',
                'type' => 'radio',
                'options' => [
                    ['value' => 'M', 'label' => 'Male'],
                    ['value' => 'F', 'label' => 'Female'],
                ],
                'searchable' => true,
                'preview' => true,
            ],
            [
                'name' => 'education',
                'label' => 'Education Level (Select)',
                'type' => 'select',
                'options' => [
                    ['value' => 'SD', 'label' => 'Elementary School'],
                    ['value' => 'SMP', 'label' => 'Junior High School'],
                    ['value' => 'SMA', 'label' => 'Senior High School'],
                    ['value' => 'S1', 'label' => 'Bachelor Degree'],
                    ['value' => 'S2', 'label' => 'Master Degree'],
                ],
            ],

            // --- Section 3: Rich Media & Sensors ---
            [
                'name' => 'media_header',
                'type' => 'html_block',
                'content' => '<h3 class="no-margin-bottom">Rich Media & Sensors</h3><p class="text-color-gray no-margin-top">Camera, GPS, and Signature.</p>',
            ],
            [
                'name' => 'location',
                'label' => 'Current Location (GPS)',
                'type' => 'gps',
                'required' => true,
                'hint' => 'Please wait for high accuracy.',
            ],
            [
                'name' => 'house_photo',
                'label' => 'House Photo (Image)',
                'type' => 'image',
                'required' => true,
                'max_items' => 3,
            ],
            [
                'name' => 'signature',
                'label' => 'Respondent Signature',
                'type' => 'signature',
                'required' => true,
            ],

            // --- Section 4: Nested / Repeater ---
            [
                'name' => 'family_members_header',
                'type' => 'html_block',
                'content' => '<h3>Family Members (Nested Table)</h3>',
            ],
            [
                'name' => 'family_members',
                'label' => 'Family Members',
                'type' => 'nested_form',
                // Flattened structure as per FieldDefinition in TS
                'fields' => [
                    [
                        'name' => 'member_name',
                        'label' => 'Name',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'member_age',
                        'label' => 'Member Age',
                        'type' => 'number',
                        // Required only if parent (respondent) is older than 25
                        'required_if_fn' => 'const parentAge = ctx.parentRow?.age || 0; return parentAge > 25;',
                        // Warning if this member is older than the main respondent
                        'warning_fn' => 'const parentAge = ctx.parentRow?.age || 999; if (value > parentAge) return "Anggota keluarga lebih tua dari responden utama!"; return null;',
                    ],
                    [
                        'name' => 'member_relation',
                        'label' => 'Relation',
                        'type' => 'select',
                        'options' => [
                            ['value' => 'head', 'label' => 'Head of Family'],
                            ['value' => 'spouse', 'label' => 'Spouse'],
                            ['value' => 'child', 'label' => 'Child'],
                            ['value' => 'other', 'label' => 'Other'],
                        ],
                    ],
                    [
                        'name' => 'member_bio',
                        'label' => 'Detailed Biography & Notes (This is a very long question label to test how the UI handles wrapping text when the question is significantly more verbose than usual, potentially spanning multiple lines on smaller mobile device screens)',
                        'type' => 'text',
                        'placeholder' => 'Tell us about this person...',
                    ],

                    // --- LEVEL 3 NESTING: Vacation History ---
                    [
                        'name' => 'vacation_history',
                        'label' => 'Vacation History (Nested Level 2)',
                        'type' => 'nested_form',
                        'fields' => [
                            [
                                'name' => 'destination',
                                'label' => 'Destination City/Country',
                                'type' => 'text',
                            ],
                            [
                                'name' => 'year',
                                'label' => 'Year of Visit',
                                'type' => 'number',
                            ],
                            [
                                'name' => 'notes',
                                'label' => 'Memorable Moments',
                                'type' => 'text',
                            ],
                        ],
                    ],
                ],
            ],

            // --- Test: Parent accessing Nested data ---
            [
                'name' => 'family_count',
                'label' => 'Total Family Members (Auto-calculated)',
                'type' => 'number',
                'readonly' => true,
                // Formula accesses nested array and counts items
                'formula_fn' => 'const members = row.family_members || []; return members.length;',
            ],
            [
                'name' => 'has_children_check',
                'label' => 'Family Has Children?',
                'type' => 'text',
                'readonly' => true,
                // Checks if any family member has relation = 'child'
                'formula_fn' => "const members = row.family_members || []; const hasChild = members.some(m => m.member_relation === 'child'); return hasChild ? 'Yes, has children' : 'No children yet';",
            ],
            [
                'name' => 'family_summary',
                'label' => 'Family Summary (Dynamic HTML)',
                'type' => 'html_block',
                'content' => '<div class="padding bg-color-gray" style="border-radius: 8px;"><p><b>📊 Family Info:</b></p><p id="family-summary-text">Add family members above to see summary.</p></div>',
                // This is static HTML - dynamic content would need formula_fn returning HTML (future feature)
            ],

            // --- Section 5: Advanced Logic (True Closure) ---
            [
                'name' => 'logic_header',
                'type' => 'html_block',
                'content' => '<h3 class="no-margin-bottom">Advanced Logic</h3><p class="text-color-gray no-margin-top">Demonstrating Closures & Formulas.</p>',
            ],
            [
                'name' => 'province',
                'label' => 'Province',
                'type' => 'select',
                'options' => [
                    ['value' => 'jabar', 'label' => 'Jawa Barat'],
                    ['value' => 'jatim', 'label' => 'Jawa Timur'],
                    ['value' => 'bali', 'label' => 'Bali'],
                ],
            ],
            [
                'name' => 'city',
                'label' => 'City (Dynamic Options)',
                'type' => 'select',
                'options_fn' => "
                    const map = {
                        'jabar': [{value:'bdg', label:'Bandung'}, {value:'bogor', label:'Bogor'}],
                        'jatim': [{value:'sby', label:'Surabaya'}, {value:'mlg', label:'Malang'}],
                        'bali': [{value:'dps', label:'Denpasar'}, {value:'gianyar', label:'Gianyar'}]
                    };
                    return map[ctx.row.province] || [];
                ",
            ],
            [
                'name' => 'item_a',
                'label' => 'Item A Score (0-10)',
                'type' => 'number',
                'min' => 0,
                'max' => 10,
            ],
            [
                'name' => 'item_b',
                'label' => 'Item B Score (0-10)',
                'type' => 'number',
                'min' => 0,
                'max' => 10,
            ],
            [
                'name' => 'total_score',
                'label' => 'Total Score (Formula: (A+B)*10)',
                'type' => 'number',
                'editable_if' => false,
                'formula_fn' => "
                    // ctx.row.item_a might be string '5', convert implicitly via utils.sum or Number logic
                    const sum = ctx.utils.sum([ctx.row.item_a, ctx.row.item_b]);
                    return sum * 10;
                ",
            ],
            [
                'name' => 'high_score_note',
                'label' => 'High Score Note (Shows if > 100)',
                'type' => 'text',
                'show_if_fn' => 'return (ctx.row.total_score || 0) > 100;',
            ],
            [
                'name' => 'lock_status',
                'label' => 'Lock Status',
                'type' => 'radio',
                'options' => [
                    ['value' => 'open', 'label' => 'Open'],
                    ['value' => 'locked', 'label' => 'Locked'],
                ],
                'initialValue' => 'open',
            ],
            [
                'name' => 'notes_locked',
                'label' => 'Locked Notes (Editable only if Open)',
                'type' => 'text',
                'editable_if_fn' => "return ctx.row.lock_status !== 'locked';",
            ],
            [
                'name' => 'logic_trigger_header',
                'type' => 'html_block',
                'content' => '<h5>Logic Triggers (Required If & Show If)</h5>',
            ],
            [
                'name' => 'trigger_options',
                'label' => 'Trigger Action',
                'type' => 'radio',
                'options' => [
                    ['value' => 'none', 'label' => 'None'],
                    ['value' => 'show', 'label' => 'Show Secret Field'],
                    ['value' => 'require', 'label' => 'Make Next Field Required'],
                ],
                'initialValue' => 'none',
            ],
            [
                'name' => 'conditional_show_field',
                'label' => 'Secret Field (Visible only if Trigger = Show)',
                'type' => 'text',
                'show_if_fn' => "return ctx.row.trigger_options === 'show';",
            ],
            [
                'name' => 'conditional_required_field',
                'label' => 'Conditional Required Field',
                'type' => 'text',
                'hint' => 'This field becomes required if Trigger = Require',
                'required_if_fn' => "return ctx.row.trigger_options === 'require';",
            ],
        ];

        // 2. Create the Table (Data Source)
        $settings = [
            'icon' => 'doc_text_search',
            'actions' => [
                'header' => [
                    ['id' => 'create', 'label' => 'Tambah Baru', 'icon' => 'plus', 'type' => 'create'],
                    ['id' => 'sync', 'label' => 'Sync Data', 'icon' => 'arrow_2_circlepath', 'type' => 'sync'],
                    ['id' => 'export', 'label' => 'Export CSV', 'icon' => 'square_arrow_up', 'type' => 'export'],
                    ['id' => 'settings', 'label' => 'Pengaturan App', 'icon' => 'gear', 'type' => 'settings'],
                ],
                'row' => [
                    ['id' => 'open', 'label' => 'Buka', 'icon' => 'doc_text', 'type' => 'open', 'primary' => true],
                    ['id' => 'delete', 'label' => 'Hapus', 'icon' => 'trash', 'type' => 'delete', 'color' => 'red'],
                    ['id' => 'duplicate', 'label' => 'Duplikat', 'icon' => 'doc_on_doc', 'type' => 'duplicate'],
                    ['id' => 'complete', 'label' => 'Tandai Selesai', 'icon' => 'checkmark_circle', 'type' => 'complete', 'color' => 'green'],
                ],
                'swipe' => [
                    'left' => ['delete'],
                    'right' => ['complete'],
                ],
            ],
        ];

        $table = Table::updateOrCreate(
            ['slug' => 'component-showcase', 'app_id' => $app->id],
            [
                'name' => 'Component Showcase',
                'description' => 'A demo app to test all available field components.',
                'current_version' => 1,
                'settings' => $settings,
            ]
        );

        // 3. Create Table Version (The Data Structure)
        // Note: Layout is simplified now, real View Logic is in 'Views' table
        $version = TableVersion::updateOrCreate(
            ['table_id' => $table->id, 'version' => 1],
            [
                'fields' => $fields,
                'layout' => [
                    'type' => 'standard',
                    'views' => [
                        'default' => [
                            'type' => 'deck',
                            'title' => 'Assignments',
                            'groupBy' => ['province', 'city'],
                            'deck' => [
                                'primaryHeaderField' => 'fullname',
                                'secondaryHeaderField' => 'description',
                                'imageField' => 'house_photo',
                                'imageShape' => 'square',
                            ],
                            'actions' => ['open', 'delete', 'complete'],
                        ],
                        'map_main' => [
                            'type' => 'map',
                            'title' => 'Map Monitoring',
                            'map' => [
                                'mapbox_style' => 'satellite',
                                'lat' => 'location.lat',
                                'long' => 'location.long',
                                'label' => 'fullname',
                            ],
                        ],
                    ],
                ],
                'published_at' => now(),
            ]
        );

        // 4. Create Core Views (Presentation)
        $this->command->info('Creating Views...');

        $viewList = View::updateOrCreate(
            ['app_id' => $app->id, 'name' => 'Default Assignments'],
            [
                'table_id' => $table->id,
                'type' => 'deck',
                'description' => 'Main list of assignments',
                'config' => [
                    'groupBy' => ['province', 'city'],
                    'deck' => [
                        'primaryHeaderField' => 'fullname',
                        'secondaryHeaderField' => 'description',
                        'imageField' => 'house_photo',
                        'imageShape' => 'square',
                    ],
                    'actions' => ['open', 'delete', 'complete'],
                    'filter' => null, // All data
                ],
            ]
        );

        $viewMap = View::updateOrCreate(
            ['app_id' => $app->id, 'name' => 'Map Monitoring'],
            [
                'table_id' => $table->id,
                'type' => 'map',
                'description' => 'Visual map distribution',
                'config' => [
                    'mapbox_style' => 'satellite',
                    'lat' => 'location.lat',
                    'long' => 'location.long',
                    'label' => 'fullname',
                ],
            ]
        );

        // 5. Setup App Navigation (The Menu)
        $app->navigation = [
            [
                'id' => 'nav_home',
                'type' => 'view',
                'view_id' => $viewList->id,
                'label' => 'Assignments',
                'icon' => 'list_bullet',
            ],
            [
                'id' => 'nav_map',
                'type' => 'view',
                'view_id' => $viewMap->id,
                'label' => 'Monitoring Peta',
                'icon' => 'map',
            ],
            [
                'id' => 'nav_web',
                'type' => 'link',
                'url' => 'https://cerdas.com',
                'label' => 'External Link',
                'icon' => 'globe',
            ],
        ];
        $app->save();

        // 6. Create Assignments Data
        $this->command->info('Creating assignments for Showcase App...');

        // Cleanup old assignments for this table
        Assignment::where('table_id', $table->id)->forceDelete();

        // Assignment 1: Empty
        Assignment::create([
            'table_id' => $table->id,
            'table_version_id' => $version->id,
            'organization_id' => $org->id,
            'supervisor_id' => $supervisor->id,
            'enumerator_id' => $enumerator->id,
            'external_id' => Str::uuid(),
            'prelist_data' => [
                'name' => 'Test Case 1: All Empty',
                'description' => 'Please fill all fields from scratch.',
                'province' => 'jabar',
                'city' => 'bdg',
            ],
            'status' => 'assigned',
        ]);

        // Assignment 2: Partially Filled
        Assignment::create([
            'table_id' => $table->id,
            'table_version_id' => $version->id,
            'organization_id' => $org->id,
            'supervisor_id' => $supervisor->id,
            'enumerator_id' => $enumerator->id,
            'external_id' => Str::uuid(),
            'prelist_data' => [
                'name' => 'Test Case 2: Pre-filled Basic',
                'description' => 'Basic fields are pre-filled via prelist.',
                'fullname' => 'John Doe',
                'age' => 35,
                'gender' => 'M',
                'province' => 'jabar',
                'city' => 'bogor',
            ],
            'status' => 'in_progress',
        ]);

        // Mass Assignments for Grouping Test
        $provinces = ['jabar', 'jatim', 'bali'];
        $cities = [
            'jabar' => ['bdg', 'bogor', 'depok'],
            'jatim' => ['sby', 'mlg', 'sda'],
            'bali' => ['dps', 'gianyar', 'kuta'],
        ];

        $names = ['Budi', 'Siti', 'Agus', 'Dewi', 'Eko', 'Rina', 'Joko', 'Hani'];

        // Get second enumerator for split testing
        $enumerator2 = User::where('email', 'enum2@cerdas.com')->first();
        if (! $enumerator2) {
            $enumerator2 = User::firstOrCreate(['email' => 'enum2@cerdas.com'], ['name' => 'Siti Enumerator', 'password' => bcrypt('password')]);
        }

        for ($i = 0; $i < 50; $i++) {
            $prov = $provinces[array_rand($provinces)];
            $city = $cities[$prov][array_rand($cities[$prov])];
            $name = $names[array_rand($names)].' '.$i;

            // Alternate ownership
            $targetEnum = ($i % 2 === 0) ? $enumerator : $enumerator2;

            Assignment::create([
                'table_id' => $table->id,
                'table_version_id' => $version->id,
                'organization_id' => $org->id,
                'supervisor_id' => $supervisor->id,
                'enumerator_id' => $targetEnum->id,
                'external_id' => Str::uuid(),
                'prelist_data' => [
                    'name' => "Task $i (".($targetEnum->id == $enumerator->id ? 'Enum 1' : 'Enum 2').')',
                    'description' => "Auto generated task $i",
                    'fullname' => $name,
                    'province' => $prov,
                    'city' => $city,
                    'age' => rand(20, 60),
                    // Only ~20% have photos pre-filled, mostly NULL
                    'house_photo' => (rand(0, 10) > 8) ? 'https://picsum.photos/seed/'.$i.'/200' : null,
                ],
                'status' => rand(0, 10) > 7 ? 'completed' : 'assigned',
            ]);
        }

        $this->command->info('Showcase App created successfully with VIEWS and NAVIGATION!');
    }
}
