const STORAGE_KEY = "gym-tracker:v1";
const todayString = new Date().toISOString().slice(0, 10);

const exerciseLibrary = [
  "Bench Press",
  "Incline Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-Up",
  "Lat Pulldown",
  "Leg Press",
  "Leg Extension",
  "Leg Curl",
  "Dumbbell Shoulder Press",
  "Dumbbell Bench Press",
  "Bicep Curl",
  "Tricep Pushdown"
];

let state = {
  meals: [],
  workouts: [],
  measurements: [],
  settings: {
    units: "imperial",
    dailyCalories: 2200,
    macros: {
      protein: 150,
      carbs: 250,
      fat: 70
    }
  }
};

const sections = document.querySelectorAll(".page-section");
const tabButtons = document.querySelectorAll(".tab-button");

const nutritionForm = document.querySelector("#nutritionForm");
const workoutForm = document.querySelector("#workoutForm");
const measurementForm = document.querySelector("#measurementForm");
const settingsForm = document.querySelector("#settingsForm");

// Load saved data once at startup so entries stay after refresh.
function loadState() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    const parsedData = JSON.parse(savedData);
    state = {
      ...state,
      ...parsedData,
      settings: {
        ...state.settings,
        ...parsedData.settings,
        macros: {
          ...state.settings.macros,
          ...(parsedData.settings ? parsedData.settings.macros : {})
        }
      }
    };
  }
}

// Save the whole app state in one localStorage key.
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function formatNumber(value) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
}

function getUnitLabel() {
  return state.settings.units === "metric" ? "kg" : "lb";
}

function sortNewestFirst(entries) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

function sortOldestFirst(entries) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function isFutureDate(dateValue) {
  return dateValue > todayString;
}

function showMessage(elementId, message, isSuccess = false) {
  const messageElement = document.querySelector(elementId);
  messageElement.textContent = message;
  messageElement.classList.toggle("success", isSuccess);
}

function clearMessage(elementId) {
  showMessage(elementId, "", false);
}

function setDefaultDates() {
  document.querySelector("#mealDate").value = todayString;
  document.querySelector("#workoutDate").value = todayString;
  document.querySelector("#measurementDate").value = todayString;
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.max = todayString;
  });
}

function setupExerciseLibrary() {
  const datalist = document.querySelector("#exerciseLibrary");
  datalist.innerHTML = exerciseLibrary
    .map((exercise) => `<option value="${exercise}"></option>`)
    .join("");
}

function switchSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });

  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
}

function getNutritionTotals() {
  return state.meals.reduce(
    (totals, meal) => {
      totals.calories += meal.calories;
      totals.protein += meal.protein;
      return totals;
    },
    { calories: 0, protein: 0 }
  );
}

function getTodayMeals() {
  return state.meals.filter((meal) => meal.date === todayString);
}

function getTodayNutritionTotals() {
  return getTodayMeals().reduce(
    (totals, meal) => {
      totals.calories += meal.calories;
      totals.protein += meal.protein;
      return totals;
    },
    { calories: 0, protein: 0 }
  );
}

function getWorkoutVolume(workout) {
  return workout.weight * workout.sets * workout.reps;
}

function getTotalWorkoutVolume() {
  return state.workouts.reduce((total, workout) => total + getWorkoutVolume(workout), 0);
}

// Build one personal record per exercise using highest weight lifted.
function getPersonalRecords() {
  const records = {};

  state.workouts.forEach((workout) => {
    const key = workout.exercise.toLowerCase();
    if (!records[key] || workout.weight > records[key].weight) {
      records[key] = workout;
    }
  });

  return Object.values(records).sort((a, b) => a.exercise.localeCompare(b.exercise));
}

function getMeasurementStats() {
  const sortedMeasurements = sortOldestFirst(state.measurements);

  if (sortedMeasurements.length === 0) {
    return null;
  }

  const first = sortedMeasurements[0];
  const latest = sortedMeasurements[sortedMeasurements.length - 1];

  return {
    first,
    latest,
    change: latest.weight - first.weight
  };
}

function renderDashboard() {
  const todayTotals = getTodayNutritionTotals();
  const measurementStats = getMeasurementStats();
  const unit = getUnitLabel();

  document.querySelector("#todayLabel").textContent = `Today: ${todayString}`;
  document.querySelector("#todayCalories").textContent = formatNumber(todayTotals.calories);
  document.querySelector("#todayProtein").textContent = `${formatNumber(todayTotals.protein)}g`;
  document.querySelector("#calorieTargetText").textContent = `Target: ${formatNumber(state.settings.dailyCalories)}`;
  document.querySelector("#proteinTargetText").textContent = `Target: ${formatNumber(state.settings.macros.protein)}g`;
  document.querySelector("#totalVolume").textContent = formatNumber(getTotalWorkoutVolume());

  if (measurementStats) {
    document.querySelector("#latestWeight").textContent = `${formatNumber(measurementStats.latest.weight)} ${unit}`;
    document.querySelector("#weightChange").textContent = `Change: ${formatNumber(measurementStats.change)} ${unit}`;
  } else {
    document.querySelector("#latestWeight").textContent = "--";
    document.querySelector("#weightChange").textContent = "Add measurements to see change";
  }

  renderPersonalRecords("#dashboardPrs", 5);
  renderWeightChart("#dashboardChart");
}

function renderNutrition() {
  const tableBody = document.querySelector("#nutritionTable");
  const totals = getNutritionTotals();
  document.querySelector("#nutritionTotalCalories").textContent = `${formatNumber(totals.calories)} calories`;
  document.querySelector("#nutritionTotalProtein").textContent = `${formatNumber(totals.protein)}g protein`;

  if (state.meals.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5"><div class="empty-state">No nutrition entries yet. Add your first meal above.</div></td></tr>`;
    return;
  }

  tableBody.innerHTML = sortNewestFirst(state.meals)
    .map(
      (meal) => `
        <tr>
          <td>${meal.date}</td>
          <td><strong>${meal.name}</strong><br><span class="muted">${meal.mealType}</span></td>
          <td>${formatNumber(meal.calories)}</td>
          <td>P ${formatNumber(meal.protein)}g / C ${formatNumber(meal.carbs)}g / F ${formatNumber(meal.fat)}g</td>
          <td>
            <button class="table-action" type="button" data-edit-meal="${meal.id}">Edit</button>
            <button class="table-action delete-action" type="button" data-delete-meal="${meal.id}">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderWorkouts() {
  const tableBody = document.querySelector("#workoutTable");
  const unit = getUnitLabel();

  if (state.workouts.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state">No workout data available. Add your first workout above.</div></td></tr>`;
  } else {
    tableBody.innerHTML = sortNewestFirst(state.workouts)
      .map(
        (workout) => `
          <tr>
            <td>${workout.date}</td>
            <td><strong>${workout.exercise}</strong></td>
            <td>${formatNumber(workout.weight)} ${unit}</td>
            <td>${workout.sets} x ${workout.reps}</td>
            <td>${formatNumber(getWorkoutVolume(workout))}</td>
            <td>
              <button class="table-action" type="button" data-edit-workout="${workout.id}">Edit</button>
              <button class="table-action delete-action" type="button" data-delete-workout="${workout.id}">Delete</button>
            </td>
          </tr>
        `
      )
      .join("");
  }

  renderPersonalRecords("#personalRecords");
}

function renderMeasurements() {
  const tableBody = document.querySelector("#measurementTable");
  const stats = getMeasurementStats();
  const unit = getUnitLabel();

  if (stats) {
    document.querySelector("#measurementLatest").textContent = `Latest: ${formatNumber(stats.latest.weight)} ${unit}`;
    document.querySelector("#measurementChange").textContent = `Change: ${formatNumber(stats.change)} ${unit}`;
  } else {
    document.querySelector("#measurementLatest").textContent = "Latest: --";
    document.querySelector("#measurementChange").textContent = "Change: --";
  }

  if (state.measurements.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4"><div class="empty-state">Add your first measurement to see progress charts.</div></td></tr>`;
  } else {
    tableBody.innerHTML = sortNewestFirst(state.measurements)
      .map(
        (measurement) => `
          <tr>
            <td>${measurement.date}</td>
            <td>${formatNumber(measurement.weight)} ${unit}</td>
            <td>${measurement.bodyFat === "" ? "--" : `${formatNumber(measurement.bodyFat)}%`}</td>
            <td>
              <button class="table-action" type="button" data-edit-measurement="${measurement.id}">Edit</button>
              <button class="table-action delete-action" type="button" data-delete-measurement="${measurement.id}">Delete</button>
            </td>
          </tr>
        `
      )
      .join("");
  }

  renderWeightChart("#measurementChart");
}

function renderPersonalRecords(selector, limit) {
  const container = document.querySelector(selector);
  const unit = getUnitLabel();
  const records = getPersonalRecords();
  const visibleRecords = limit ? records.slice(0, limit) : records;

  if (records.length === 0) {
    container.innerHTML = `<div class="empty-state">No personal records yet. Add workouts to start tracking PRs.</div>`;
    return;
  }

  container.innerHTML = visibleRecords
    .map(
      (record) => `
        <div class="record-item">
          <span>${record.exercise}<br><small class="muted">${record.date}</small></span>
          <strong>${formatNumber(record.weight)} ${unit}</strong>
        </div>
      `
    )
    .join("");
}

// Draw a small SVG line chart without using any chart libraries.
function renderWeightChart(selector) {
  const container = document.querySelector(selector);
  const measurements = sortOldestFirst(state.measurements);

  if (measurements.length < 2) {
    container.innerHTML = `<div class="empty-state">Add at least two measurements to draw a trend chart.</div>`;
    return;
  }

  const width = 620;
  const height = 230;
  const padding = 34;
  const weights = measurements.map((entry) => entry.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight || 1;

  const points = measurements.map((entry, index) => {
    const x = padding + (index * (width - padding * 2)) / (measurements.length - 1);
    const y = height - padding - ((entry.weight - minWeight) / range) * (height - padding * 2);
    return { x, y, entry };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const circles = points
    .map(
      (point) => `<circle cx="${point.x}" cy="${point.y}" r="5"><title>${point.entry.date}: ${formatNumber(point.entry.weight)} ${getUnitLabel()}</title></circle>`
    )
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Weight trend chart">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#cbd5e1"></line>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#cbd5e1"></line>
      <text x="${padding}" y="18" class="chart-label">${formatNumber(maxWeight)} ${getUnitLabel()}</text>
      <text x="${padding}" y="${height - 8}" class="chart-label">${formatNumber(minWeight)} ${getUnitLabel()}</text>
      <polyline points="${polylinePoints}" fill="none" stroke="#166534" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      <g fill="#f59e0b" stroke="#ffffff" stroke-width="2">${circles}</g>
    </svg>
  `;
}

function renderSettings() {
  document.querySelector("#units").value = state.settings.units;
  document.querySelector("#dailyCalories").value = state.settings.dailyCalories;
  document.querySelector("#targetProtein").value = state.settings.macros.protein;
  document.querySelector("#targetCarbs").value = state.settings.macros.carbs;
  document.querySelector("#targetFat").value = state.settings.macros.fat;
}

function renderAll() {
  renderDashboard();
  renderNutrition();
  renderWorkouts();
  renderMeasurements();
  renderSettings();
}

function validateDate(dateValue, messageId) {
  if (!dateValue) {
    showMessage(messageId, "Please choose a date.");
    return false;
  }

  if (isFutureDate(dateValue)) {
    showMessage(messageId, "Dates cannot be in the future.");
    return false;
  }

  return true;
}

function handleNutritionSubmit(event) {
  event.preventDefault();
  const id = document.querySelector("#nutritionId").value;
  const date = document.querySelector("#mealDate").value;
  const name = document.querySelector("#foodName").value.trim();
  const mealType = document.querySelector("#mealType").value;
  const calories = Number(document.querySelector("#calories").value);
  const protein = Number(document.querySelector("#protein").value);
  const carbs = Number(document.querySelector("#carbs").value);
  const fat = Number(document.querySelector("#fat").value);

  if (!validateDate(date, "#nutritionMessage")) return;
  if (!name || calories <= 0 || protein < 0 || carbs < 0 || fat < 0) {
    showMessage("#nutritionMessage", "Please enter a meal name and valid nutrition numbers.");
    return;
  }

  const meal = { id: id || createId(), date, name, mealType, calories, protein, carbs, fat };

  if (id) {
    state.meals = state.meals.map((entry) => (entry.id === id ? meal : entry));
  } else {
    state.meals.push(meal);
  }

  saveState();
  nutritionForm.reset();
  document.querySelector("#nutritionId").value = "";
  document.querySelector("#cancelNutritionEdit").classList.remove("show");
  setDefaultDates();
  showMessage("#nutritionMessage", "Nutrition entry saved.", true);
  renderAll();
}

function handleWorkoutSubmit(event) {
  event.preventDefault();
  const id = document.querySelector("#workoutId").value;
  const date = document.querySelector("#workoutDate").value;
  const exercise = document.querySelector("#exerciseName").value.trim();
  const weight = Number(document.querySelector("#weight").value);
  const sets = Number(document.querySelector("#sets").value);
  const reps = Number(document.querySelector("#reps").value);

  if (!validateDate(date, "#workoutMessage")) return;
  if (!exercise || weight <= 0 || sets <= 0 || reps <= 0) {
    showMessage("#workoutMessage", "Please enter an exercise and valid workout numbers.");
    return;
  }

  const workout = { id: id || createId(), date, exercise, weight, sets, reps };

  if (id) {
    state.workouts = state.workouts.map((entry) => (entry.id === id ? workout : entry));
  } else {
    state.workouts.push(workout);
  }

  if (!exerciseLibrary.includes(exercise)) {
    exerciseLibrary.push(exercise);
    setupExerciseLibrary();
  }

  saveState();
  workoutForm.reset();
  document.querySelector("#workoutId").value = "";
  document.querySelector("#cancelWorkoutEdit").classList.remove("show");
  setDefaultDates();
  showMessage("#workoutMessage", "Workout saved.", true);
  renderAll();
}

function handleMeasurementSubmit(event) {
  event.preventDefault();
  const id = document.querySelector("#measurementId").value;
  const date = document.querySelector("#measurementDate").value;
  const weight = Number(document.querySelector("#bodyWeight").value);
  const bodyFatInput = document.querySelector("#bodyFat").value;
  const bodyFat = bodyFatInput === "" ? "" : Number(bodyFatInput);

  if (!validateDate(date, "#measurementMessage")) return;
  if (weight <= 0 || (bodyFat !== "" && (bodyFat < 0 || bodyFat > 100))) {
    showMessage("#measurementMessage", "Please enter valid weight and body fat values.");
    return;
  }

  const measurement = { id: id || createId(), date, weight, bodyFat };

  if (id) {
    state.measurements = state.measurements.map((entry) => (entry.id === id ? measurement : entry));
  } else {
    state.measurements.push(measurement);
  }

  saveState();
  measurementForm.reset();
  document.querySelector("#measurementId").value = "";
  document.querySelector("#cancelMeasurementEdit").classList.remove("show");
  setDefaultDates();
  showMessage("#measurementMessage", "Measurement saved.", true);
  renderAll();
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  const dailyCalories = Number(document.querySelector("#dailyCalories").value);
  const protein = Number(document.querySelector("#targetProtein").value);
  const carbs = Number(document.querySelector("#targetCarbs").value);
  const fat = Number(document.querySelector("#targetFat").value);

  if (dailyCalories <= 0 || protein < 0 || carbs < 0 || fat < 0) {
    showMessage("#settingsMessage", "Please enter valid target numbers.");
    return;
  }

  state.settings = {
    units: document.querySelector("#units").value,
    dailyCalories,
    macros: { protein, carbs, fat }
  };

  saveState();
  showMessage("#settingsMessage", "Settings saved.", true);
  renderAll();
}

function editMeal(id) {
  const meal = state.meals.find((entry) => entry.id === id);
  if (!meal) return;

  switchSection("nutrition");
  document.querySelector("#nutritionId").value = meal.id;
  document.querySelector("#mealDate").value = meal.date;
  document.querySelector("#foodName").value = meal.name;
  document.querySelector("#mealType").value = meal.mealType;
  document.querySelector("#calories").value = meal.calories;
  document.querySelector("#protein").value = meal.protein;
  document.querySelector("#carbs").value = meal.carbs;
  document.querySelector("#fat").value = meal.fat;
  document.querySelector("#cancelNutritionEdit").classList.add("show");
  clearMessage("#nutritionMessage");
}

function editWorkout(id) {
  const workout = state.workouts.find((entry) => entry.id === id);
  if (!workout) return;

  switchSection("workouts");
  document.querySelector("#workoutId").value = workout.id;
  document.querySelector("#workoutDate").value = workout.date;
  document.querySelector("#exerciseName").value = workout.exercise;
  document.querySelector("#weight").value = workout.weight;
  document.querySelector("#sets").value = workout.sets;
  document.querySelector("#reps").value = workout.reps;
  document.querySelector("#cancelWorkoutEdit").classList.add("show");
  clearMessage("#workoutMessage");
}

function editMeasurement(id) {
  const measurement = state.measurements.find((entry) => entry.id === id);
  if (!measurement) return;

  switchSection("measurements");
  document.querySelector("#measurementId").value = measurement.id;
  document.querySelector("#measurementDate").value = measurement.date;
  document.querySelector("#bodyWeight").value = measurement.weight;
  document.querySelector("#bodyFat").value = measurement.bodyFat;
  document.querySelector("#cancelMeasurementEdit").classList.add("show");
  clearMessage("#measurementMessage");
}

function deleteEntry(type, id) {
  if (!confirm("Delete this entry permanently?")) {
    return;
  }

  state[type] = state[type].filter((entry) => entry.id !== id);
  saveState();
  renderAll();
}

function resetAllData() {
  if (!confirm("Clear all saved tracker data? This cannot be undone.")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  state.meals = [];
  state.workouts = [];
  state.measurements = [];
  saveState();
  renderAll();
}

function setupEventListeners() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchSection(button.dataset.section));
  });

  nutritionForm.addEventListener("submit", handleNutritionSubmit);
  workoutForm.addEventListener("submit", handleWorkoutSubmit);
  measurementForm.addEventListener("submit", handleMeasurementSubmit);
  settingsForm.addEventListener("submit", handleSettingsSubmit);

  document.querySelector("#cancelNutritionEdit").addEventListener("click", () => {
    nutritionForm.reset();
    document.querySelector("#nutritionId").value = "";
    document.querySelector("#cancelNutritionEdit").classList.remove("show");
    setDefaultDates();
  });

  document.querySelector("#cancelWorkoutEdit").addEventListener("click", () => {
    workoutForm.reset();
    document.querySelector("#workoutId").value = "";
    document.querySelector("#cancelWorkoutEdit").classList.remove("show");
    setDefaultDates();
  });

  document.querySelector("#cancelMeasurementEdit").addEventListener("click", () => {
    measurementForm.reset();
    document.querySelector("#measurementId").value = "";
    document.querySelector("#cancelMeasurementEdit").classList.remove("show");
    setDefaultDates();
  });

  document.querySelector("#resetButton").addEventListener("click", resetAllData);

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (target.dataset.editMeal) editMeal(target.dataset.editMeal);
    if (target.dataset.editWorkout) editWorkout(target.dataset.editWorkout);
    if (target.dataset.editMeasurement) editMeasurement(target.dataset.editMeasurement);

    if (target.dataset.deleteMeal) deleteEntry("meals", target.dataset.deleteMeal);
    if (target.dataset.deleteWorkout) deleteEntry("workouts", target.dataset.deleteWorkout);
    if (target.dataset.deleteMeasurement) deleteEntry("measurements", target.dataset.deleteMeasurement);
  });
}

loadState();
setDefaultDates();
setupExerciseLibrary();
setupEventListeners();
renderAll();
