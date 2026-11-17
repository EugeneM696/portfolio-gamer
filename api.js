"use strict";

// 1. Клас для HTTP-помилок (коли сервер відповів кодом 400..599)
class HttpError extends Error {
  constructor(status) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
  }
}

// 2. Універсальна функція запиту JSON із тайм-аутом та підтримкою AbortSignal
async function fetchJson(url, options = {}) {
  const { timeoutMs = 8000, signal } = options;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal
    ? AbortSignal.any([timeoutSignal, signal])
    : timeoutSignal;

  let response;
  try {
    response = await fetch(url, { signal: combinedSignal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }
    if (error.name === "TimeoutError") {
      throw new Error("Сервер не відповів вчасно. Спробуйте ще раз.");
    }
    throw new Error("Немає з'єднання з сервером. Перевірте інтернет.");
  }

  if (!response.ok) {
    throw new HttpError(response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Сервер повернув некоректні дані (не у форматі JSON).");
  }
}

// 3. Перетворення технічної помилки на зрозуміле повідомлення для користувача
function describeError(error) {
  if (error instanceof HttpError) {
    if (error.status === 404) return "Нічого не знайдено (код 404).";
    if (error.status === 429) return "Забагато запитів. Зачекайте хвилину і спробуйте знову.";
    if (error.status >= 500) return "Помилка на боці сервісу. Спробуйте пізніше.";
    return `Сервіс відповів помилкою (код ${error.status}).`;
  }
  return error.message || "Сталася невідома помилка.";
}

// 4. Посилання на DOM-елементи сторінки
const form = document.querySelector("#search-form");
const queryInput = document.querySelector("#query-input");
const formError = document.querySelector("#form-error");
const statusBox = document.querySelector("#status");
const placesList = document.querySelector("#places");
const resultBox = document.querySelector("#result");
const loadMoreBtn = document.querySelector("#load-more-btn");
const favoritesBox = document.querySelector("#favorites-box");
const favoritesList = document.querySelector("#favorites-list");

const state = { status: "idle", message: "" };
let lastAction = null;

function setStatus(status, message = "") {
  state.status = status;
  state.message = message;
  renderStatus();
}

function renderStatus() {
  statusBox.replaceChildren();
  if (state.status === "loading") {
    statusBox.textContent = "Завантаження...";
  } else if (state.status === "empty") {
    statusBox.textContent = state.message;
  } else if (state.status === "error") {
    const text = document.createElement("p");
    text.textContent = state.message;

    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.textContent = "Повторити";
    retryBtn.addEventListener("click", () => {
      if (lastAction) lastAction();
    });

    statusBox.append(text, retryBtn);
  }
}

// 5. Робота з «Обраним» у localStorage (Варіант № 12 — функція Г)
const FAV_KEY = "lab8-favorites-12";
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  } catch {}
}

function isFavorite(id) {
  return favorites.some((item) => String(item.id) === String(id));
}

function toggleFavorite(item) {
  if (isFavorite(item.id)) {
    favorites = favorites.filter((f) => String(f.id) !== String(item.id));
  } else {
    favorites.push(item);
  }
  saveFavorites();
  renderFavorites();
}

function renderFavorites() {
  favoritesList.replaceChildren();
  if (favorites.length === 0) {
    favoritesBox.hidden = true;
    return;
  }
  favoritesBox.hidden = false;
  for (const item of favorites) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `★ ${item.title || item.name} (натисніть, щоб видалити з обраного)`;
    btn.addEventListener("click", () => toggleFavorite(item));
    li.append(btn);
    favoritesList.append(li);
  }
}

// 6. Робота з PokéAPI (Варіант № 12)
const API = {
  pokemon: "https://pokeapi.co/api/v2/pokemon"
};

async function searchPokemon(query) {
  const cleanQuery = query.trim().toLowerCase();
  lastAction = () => searchPokemon(cleanQuery);
  setStatus("loading");
  placesList.replaceChildren();
  resultBox.replaceChildren();

  try {
    const url = `${API.pokemon}/${encodeURIComponent(cleanQuery)}`;
    const data = await fetchJson(url);

    setStatus("success");
    renderPokemon(data);
  } catch (error) {
    if (error.name === "AbortError") return;

    // PokéAPI повертає статус 404, якщо покемона не знайдено
    if (error instanceof HttpError && error.status === 404) {
      setStatus("empty", `За запитом «${query}» покемона не знайдено.`);
      return;
    }

    setStatus("error", describeError(error));
  }
}

function renderPokemon(pokemon) {
  const card = document.createElement("article");
  card.className = "api-card";

  // Назва та номер у Pokédex
  const title = document.createElement("h3");
  const formattedName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
  title.textContent = `#${pokemon.id} ${formattedName}`;

  // Спрайт (картинка) з перевіркою на null та атрибутом alt
  if (pokemon.sprites && pokemon.sprites.front_default) {
    const img = document.createElement("img");
    img.src = pokemon.sprites.front_default;
    img.alt = `Спрайт покемона ${formattedName}`;
    img.loading = "lazy";
    card.append(img);
  } else {
    const noImg = document.createElement("p");
    noImg.textContent = "Зображення відсутнє";
    card.append(noImg);
  }

  // Типи покемона
  const typesText = pokemon.types.map((t) => t.type.name).join(", ");
  const typesEl = document.createElement("p");
  typesEl.textContent = `Типи: ${typesText}`;

  // Зріст та вага
  const sizeEl = document.createElement("p");
  sizeEl.textContent = `Зріст: ${pokemon.height / 10} м · Вага: ${pokemon.weight / 10} кг`;

  // Базові характеристики
  const statsTitle = document.createElement("strong");
  statsTitle.textContent = "Базові характеристики:";

  const statsList = document.createElement("ul");
  statsList.className = "days";
  for (const statObj of pokemon.stats) {
    const li = document.createElement("li");
    li.textContent = `${statObj.stat.name}: ${statObj.base_stat}`;
    statsList.append(li);
  }

  // Кнопка додавання в обране
  const favBtn = document.createElement("button");
  favBtn.type = "button";
  const favItem = { id: pokemon.id, name: `#${pokemon.id} ${formattedName}` };

  const updateFavText = () => {
    favBtn.textContent = isFavorite(pokemon.id)
      ? "★ В обраному (видалити)"
      : "☆ Додати в обране";
  };
  updateFavText();

  favBtn.addEventListener("click", () => {
    toggleFavorite(favItem);
    updateFavText();
  });

  card.append(title, typesEl, sizeEl, statsTitle, statsList, favBtn);
  resultBox.replaceChildren(card);
}

// 7. Валідація та відправка форми пошуку
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();

  if (query.length < 1) {
    formError.textContent = "Введіть ім'я або номер покемона (наприклад, pikachu або 25).";
    queryInput.focus();
    return;
  }

  formError.textContent = "";
  searchPokemon(query);
});

// 8. Початкове відображення при відкритті сторінки
renderFavorites();
searchPokemon("pikachu");