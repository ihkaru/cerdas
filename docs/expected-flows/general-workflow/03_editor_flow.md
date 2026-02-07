# 3. Editor Flow

## Page: `/editor/:slug` (Port 9982)

### Expected URL
`http://localhost:9982/editor/housing-survey-2026`

### Expected UI Layout
- **Left Sidebar**: Table/View navigation
- **Center**: Form field editor
- **Right Panel**: Field properties
- **Bottom**: Preview iframe

### Expected Tables
The "Housing Survey 2026" app should have 1 table from ComponentShowcaseSeeder:

| Table Name | Description |
|------------|-------------|
| Component Showcase | A demo app to test all available field components |

### Expected Fields (29 total)
ComponentShowcaseSeeder creates these field sections:

#### Section 1: Basic Inputs
- `fullname` (text) - Required, searchable
- `age` (number) - Required, min 0, max 120
- `birthdate` (date) - Required

#### Section 2: Selection Controls
- `gender` (radio) - Male/Female
- `province` (select) - Dropdown
- `city` (select) - Dynamic based on province
- `interests` (checkbox) - Multiple select

#### Section 3: Media Fields
- `house_photo` (image) - Camera/Gallery
- `signature` (signature)
- `location` (gps)

#### Section 4: Advanced
- `lock_status` (select) - With conditional logic
- `trigger_options` (select)
- `family_count` (counter)
- `total_score` (number) - Formula field

### Expected Behavior
1. Open `/editor/housing-survey-2026`
2. Left sidebar shows "Component Showcase" table
3. Center panel shows form fields
4. Click field to edit properties in right panel
5. Bottom shows live preview
