**Project Requirement Document (PRD) — Gym Progress Tracker**

**Overview:**
- **Summary:** A simple, single-page web app to track nutrition (meals/macros), workouts (sets/reps/weight), and body measurements. Built with plain HTML, CSS and vanilla JavaScript and stored in `localStorage` for the MVP. Desktop-first design; deploy on GitHub Pages.
- **Primary user:** Casual tracker who logs meals and weight; anyone wanting a single place to monitor their fitness journey.

**Goals & Success Metrics:**
- **Primary goal:** Help users consistently log nutrition, workouts, and measurements in one place and easily view progress over time.
- **Success metrics:**
  - Daily Active Logging: % of users who log at least one item per day (target: baseline for class project).
  - Retention: % of users returning to log within 7 days.
  - Visibility of progress: Users can view weight/body-fat trends and PRs within the app.

**Persona:**
- Casual tracker: wants lightweight, easy entry for meals and body weight; some interest in tracking workouts but not advanced programming needs.

**MVP Scope (must-haves):**
- Meal logging: Food name, calories, protein, carbohydrates, fat, meal type (breakfast/lunch/dinner/snack), date.
- Weight/body measurements logging: body weight (required), optional body fat %, date.
- Simple workout logging: choose exercise from a pre-populated library or add custom exercise; support multiple sets per exercise with weight and reps; date required.
- Personal records detection: detect PRs based on highest weight lifted per exercise.
- Persistent storage using `localStorage` (no accounts) and desktop-first UI.

**Out of scope (MVP):**
- Accounts/sync across devices, CSV export/import (explicitly excluded), Trash/undo, onboarding flow, external chart libraries.

**Main Screens:**
- Dashboard — snapshot: Today's calories/macros, latest body weight + small trend, quick-add buttons (meal/weight/workout), personal records highlights.
- Log Meal — form to add/edit meal entries.
- Log Workout — form to add/edit workout entries (select exercise, add multiple sets per exercise).
- Measurements / History — table of measurements and simple line charts (weight and body-fat) with date-range filter.
- Settings — set preferred units (kg/lb), daily calorie target and macro breakdown (protein/carbs/fat).

**Exercise Library (pre-populated):**
- Bench Press, Incline Bench Press, Squat, Deadlift, Overhead Press, Barbell Row, Pull-Up, Lat Pulldown, Leg Press, Leg Extension, Leg Curl, Dumbbell Shoulder Press, Dumbbell Bench Press, Bicep Curl, Tricep Pushdown. Users can add custom exercises.

**Data model (summary):**
- `meals` (array): { id, name, calories, protein, carbs, fat, mealType, date }
- `workouts` (array): { id, exerciseId|name, date, sets: [{weight, reps}], notes }
- `measurements` (array): { id, weight, bodyFat? , date }
- `settings`: { units: 'metric'|'imperial', dailyCalories, macros: { protein, carbs, fat } }
- Persisted in `localStorage` under a single app key (e.g. `gym-tracker:v1`).

**Validation Rules:**
- Required fields: food/exercise name, date, and main numeric fields for the entry type.
- Meals: calories > 0; protein, carbs, fat >= 0.
- Workouts: weight > 0, sets > 0, reps > 0 for each set.
- Measurements: weight > 0; bodyFat if present must be 0–100.
- Dates: allowed = today or past only (no future dates).

**Charts & Visualization:**
- Build simple line charts with vanilla JS (SVG/Canvas) for weight and body-fat trends on Measurements/History and a small dashboard snapshot.

**Behavior & UX details:**
- Desktop-first responsive layout (scale down to smaller screens).
- Entries may be edited and deleted; deletion is permanent after a confirmation dialog (no Trash in MVP).
- Empty states: show friendly messages like "No workout data available" or "Add your first measurement to see progress charts."

**Non-functional requirements:**
- Tech: plain HTML/CSS/vanilla JS. No frameworks or external chart libraries.
- Storage: `localStorage`. App must handle typical single-user dataset smoothly in-browser.
- Accessibility: basic keyboard and screen-reader friendliness where feasible.
- Performance: fast load and snappy UI for local usage.

**Acceptance Criteria (testable):**
- Users can add/edit/delete meal entries and see them reflected in today's calorie/macros summary.
- Users can add/edit/delete workout entries with multiple sets; the app detects and highlights PRs by exercise.
- Users can add/edit/delete measurements; charts show weight and body-fat trends for selected date ranges.
- Settings persist and apply preferred units and daily calorie/macros targets.
- Input validation prevents invalid values (per rules above) and shows clear error messages.

**Milestones & Timeline:**
- Today (June 22): Finalize PRD (this file).
- Core functionality complete (data model + logging + settings + PR detection + basic dashboard): by June 24.
- Testing, UI polish, charts implementation and bug fixes: June 24–25.
- Final submission / deploy to GitHub Pages: June 26.

**Assumptions & Risks:**
- Single-device `localStorage` suits MVP; migration to accounts/sync is future work.
- Building charts in vanilla JS increases development time but aligns with learning goals.

**Future improvements (post-MVP):**
- CSV export/import or account sync, Trash/undo, richer PR metrics (reps at weight, estimated 1RM), exercise library management, mobile-first redesign, charts with interactions.

---

This PRD reflects choices made during planning discussions: desktop-first, localStorage, no CSV, pre-populated exercise library, PR detection by highest weight lifted, simple vanilla JS charts, and editable entries with immediate deletion after confirmation.
