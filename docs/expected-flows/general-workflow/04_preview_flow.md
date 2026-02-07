# 4. Preview App Flow

## Page: Preview Iframe in Editor

### Accessing Preview
1. Open Editor at `/editor/housing-survey-2026`
2. Bottom of page has embedded preview iframe
3. Preview connects to Client app (Port 9981)

### Expected Client App UI (Port 9981)

#### Login Page
- Same credentials as Editor
- Login with: `admin@cerdas.com` / `password`

#### AppShell (After opening app)

##### Expected Groups (Grouping by `province`)
ComponentShowcaseSeeder creates 59 assignments with mock data:

| Province | Expected Count |
|----------|----------------|
| jabar (Jawa Barat) | ~20 |
| jatim (Jawa Timur) | ~20 |
| bali | ~19 |

##### Drill-Down to City
After clicking a province group, sub-grouped by `city`:

| City | Parent Province |
|------|-----------------|
| bdg (Bandung) | jabar |
| sby (Surabaya) | jatim |
| dps (Denpasar) | bali |
| kuta | bali |
| etc... | ... |

### Expected Assignment List
After drilling down to leaf level:
- List of assignments with name, status
- Each row shows: `Task X (Enum Y)` where X = task number, Y = enumerator

### Expected Form (Click Assignment)
Opening an assignment shows form with all 29 fields:
- Pre-filled with `prelist_data` (name, description, province, city, age, house_photo)
- Empty fields for user input (signature, location, etc.)

### Expected Form Data (Sample)
```json
{
  "name": "Task 8 (Enum 1)",
  "description": "Auto generated task 8",
  "fullname": "Siti 8",
  "province": "jabar",
  "city": "bdg",
  "age": 57,
  "house_photo": "https://picsum.photos/seed/8/200"
}
```

### Expected Behavior
1. Preview iframe shows mobile app view
2. Navigate to app (may need login)
3. See groups (provinces)
4. Drill down to city
5. See assignment list
6. Open assignment to see form
7. Form shows 29 fields with pre-filled data
