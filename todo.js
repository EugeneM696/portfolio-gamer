// 1. Ключ сховища localStorage (замініть 1 на ваш номер варіанта!)
const STORAGE_KEY = "lab7-todos-12";

function save() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
} catch (error) {
errorBox.textContent = "Не вдалося зберегти дані у сховищі браузера.";
}
}
function load() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
if (raw === null) return [];
const data = JSON.parse(raw);
if (!Array.isArray(data)) return [];
return data.filter(
(t) => t && typeof t.id === "number" && typeof t.text ===
"string" && typeof t.done === "boolean"
);
} catch (error) {
return []; // Якщо JSON пошкоджений, безпечно повертаємо порожній масив
}
}
// 2. Стан застосунку (єдине джерело правди)
let tasks = load(); // масив об'єктів завдань: { id, text, done, ... }
let filter = "all"; // поточний фільтр: "all" | "active" | "done"
let editingId = null; // id завдання, яке зараз редагується (або null)
let searchQuery = "";
// 3. Посилання на елементи DOM
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-text");
const errorBox = document.querySelector("#form-error");
const list = document.querySelector("#todo-list");
const counter = document.querySelector("#todo-counter");
const filtersBox = document.querySelector(".filters");
const dueInput = document.querySelector("#todo-due");
const searchInput = document.querySelector("#todo-search");
// Допоміжна функція для створення кнопки з атрибутом data-action
function todayString() {
const d = new Date();
const m = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");
return `${d.getFullYear()}-${m}-${day}`;
}
function makeButton(action, label) {
const button = document.createElement("button");
button.type = "button";
button.dataset.action = action;
button.textContent = label;
return button;
}
// Створення одного елемента <li> для завдання
function createItem(task) {
const li = document.createElement("li");
li.dataset.id = task.id;
if (task.done) li.classList.add("is-done");
const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.checked = task.done;
checkbox.dataset.action = "toggle";
checkbox.setAttribute("aria-label", "Виконано: " + task.text);
li.append(checkbox);
if (task.id === editingId) {
const editInput = document.createElement("input");
editInput.type = "text";
editInput.className = "edit-input";
editInput.value = task.text;
editInput.maxLength = 100;
editInput.setAttribute("aria-label", "Редагування завдання");
li.append(
editInput,
makeButton("save", "Зберегти"),
makeButton("cancel", "Скасувати")
);
} else {
const span = document.createElement("span");
span.className = "text";
span.textContent = task.text; // БЕЗПЕЧНЕ виведення тексту (захист від XSS)
const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = task.due
      ? new Date(task.due).toLocaleDateString("uk-UA") : "-";

    li.append(
      span,
      meta,
      makeButton("edit", "Редагувати"),
      makeButton("delete", "Видалити")
    );
}
return li;
}
// Отримання відфільтрованого списку завдань
function getVisibleTasks() {
let list = tasks;
if (filter === "active") list = list.filter((t) => !t.done);
if (filter === "done") list = list.filter((t) => t.done);
if (searchQuery !== "") {
const q = searchQuery.toLowerCase();
list = list.filter((t) => t.text.toLowerCase().includes(q));
}
return list;
}
// Головна функція відмальовування інтерфейсу за поточним станом
function render() {
list.replaceChildren();
const visible = getVisibleTasks();
if (visible.length === 0) {
const empty = document.createElement("li");
empty.className = "empty";
empty.textContent = "Завдань немає";
list.append(empty);
} else {
for (const task of visible) {
list.append(createItem(task));
}
}
// Оновлення лічильника (завжди рахує загальний масив tasks)
const left = tasks.filter((t) => !t.done).length;
counter.textContent = `Залишилось виконати: ${left} із
${tasks.length}`;
// Підсвічування активної кнопки фільтра
for (const button of filtersBox.querySelectorAll("button")) {
button.classList.toggle("is-active", button.dataset.filter === filter);
}
// Автофокус на поле редагування, якщо воно відкрите
const editField = list.querySelector(".edit-input");
if (editField) {
editField.focus();
editField.select();
}
}
// Перевірка коректності тексту завдання
function validateText(text, ignoreId) {
if (text === "") return "Введіть текст завдання.";
if (text.length > 100) return "Максимум 100 символів.";
const duplicate = tasks.some(
(t) => t.id !== ignoreId && t.text.toLowerCase() === text.toLowerCase()
);
if (duplicate) return "Таке завдання вже є у списку.";
return "";
}
// Обробка додавання нового завдання
form.addEventListener("submit", (event) => {
event.preventDefault();
const text = input.value.trim();
const message = validateText(text, null);
errorBox.textContent = message;
if (message !== "") {
input.focus();
return;
}
const due = dueInput.value;
  if (due === "") {
    errorBox.textContent = "Оберіть дату виконання.";
    dueInput.focus();
    return;
  }
  if (due < todayString()) {
    errorBox.textContent = "Дата виконання не може бути в минулому.";
    dueInput.focus();
    return;
  }
tasks.push({
id: Date.now(),
text: text,
done: false,
due: dueInput.value
});
save();
input.value = "";
render();
input.focus();
});
render();

function toggleTask(id) {
const task = tasks.find((t) => t.id === id);
if (!task) return;
task.done = !task.done;
save();
render();
}
function deleteTask(id) {
if (editingId === id) editingId = null;
tasks = tasks.filter((t) => t.id !== id);
save();
render();
}
// Делегування кліків по елементах керування всередині списку <ul>
list.addEventListener("click", (event) => {
const control = event.target.closest("[data-action]");
if (!control) return;
const li = control.closest("li");
if (!li) return;
const id = Number(li.dataset.id); // Перетворюємо рядок data-idна число!
const action = control.dataset.action;
if (action === "toggle") {
toggleTask(id);
} else if (action === "delete") {
deleteTask(id);
} else if (action === "edit") {
editingId = id;
errorBox.textContent = "";
render();
} else if (action === "cancel") {
editingId = null;
errorBox.textContent = "";
render();
} else if (action === "save") {
const editField = li.querySelector(".edit-input");
if (editField) saveEdit(id, editField.value);
}
});
// Збереження відредагованого тексту завдання
function saveEdit(id, newText) {
const text = newText.trim();
const message = validateText(text, id); // id передаємо як ignoreId
if (message !== "") {
errorBox.textContent = message;
return;
}
const task = tasks.find((t) => t.id === id);
if (task) {
task.text = text;
}
editingId = null;
errorBox.textContent = "";
save();
render();
}
// Підтримка клавіш Enter (зберегти) та Escape (скасувати) у полі редагування
list.addEventListener("keydown", (event) => {
if (!event.target.classList.contains("edit-input")) return;
const li = event.target.closest("li");
const id = Number(li.dataset.id);
if (event.key === "Enter") {
event.preventDefault();
saveEdit(id, event.target.value);
} else if (event.key === "Escape") {
editingId = null;
errorBox.textContent = "";
render();
}
});
filtersBox.addEventListener("click", (event) => {
const button = event.target.closest("[data-filter]");
if (!button) return;
filter = button.dataset.filter;
editingId = null;
render();
});
searchInput.addEventListener("input", () => {
searchQuery = searchInput.value.trim();
render();
});