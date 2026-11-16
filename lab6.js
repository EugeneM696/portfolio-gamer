// 1. Довідник одиниць конвертера: скільки базових одиниць міститься в одній одиниці
const units = {
"Б": 1,
"КБ": 1024,
"МБ": 1048576,
"ГБ": 1073741824,
"ТБ": 1099511627776,
};
function convert(value, from, to) {
const inBase = value * units[from]; // переводимо в базові одиниці
return inBase / units[to]; // переводимо з базових у цільові
}
// Перевірка логіки конвертації у консолі браузера:
console.log("Тест конвертера 1:", convert(5, "МБ", "ГБ"));
console.log("Тест конвертера 2:", convert(2, "ТБ", "ГБ"));

function parseValue(text) {
const normalized = text.trim().replace(",", ".");
if (normalized === "") {
return { error: "Введіть значення." };
}
const number = Number(normalized);
if (!Number.isFinite(number)) {
return { error: "Введіть коректне число, наприклад 5,5." };
}
if (number < 0) {
return { error: "Значення не може бути від’ємним." };
}
return { number: number };
}
// П'ять обов'язкових тестів parseValue у консолі:
console.log('parseValue("5,5"):', parseValue("5,5")); // {number: 5.5 }
console.log('parseValue(""):', parseValue("")); // {error: "Введіть значення." }
console.log('parseValue("abc"):', parseValue("abc")); // {error: "Введіть коректне число..." }
console.log('parseValue("-3"):', parseValue("-3")); // {error: "Значення не може..." }
console.log('parseValue(" 12 "):', parseValue(" 12 ")); // {number: 12 }

const form = document.querySelector("#converter");
const valueInput = document.querySelector("#value");
const fromSelect = document.querySelector("#from");
const toSelect = document.querySelector("#to");
const resultBox = document.querySelector("#conv-result");
// Заповнюємо обидва випадаючі списки одиницями з об'єкта units циклом for...in
for (const name in units) {
fromSelect.add(new Option(name, name));
toSelect.add(new Option(name, name));
}
toSelect.selectedIndex = 1; // обираємо другу одиницю за замовчуванням
form.addEventListener("submit", (event) => {
event.preventDefault(); // скасовуємо перезавантаження сторінки!
const parsed = parseValue(valueInput.value);
if (parsed.error) {
resultBox.textContent = parsed.error;
return;
}
const result = convert(parsed.number, fromSelect.value, toSelect.value);
const pretty = result.toLocaleString("uk-UA", { maximumFractionDigits: 4 });
resultBox.textContent = `${parsed.number} ${fromSelect.value} = ${pretty} ${toSelect.value}`;
});

// 2. Набір даних каталогу (10 товарів за темою варіанта)
const products = [
{ id: 1, name: "Миша HyperX Pulsefire Surge", category: "Миша", price: 300, qty: 4, rating: 4.9 },
{ id: 2, name: "Миша Ajazz AJ159 PRO", category: "Миша", price:450, qty: 18, rating: 4.8 },
{ id: 3, name: "Миша Hator Starfall 2", category: "Миша", price: 375, qty: 0, rating: 4.7 },
{ id: 4, name: "Навушники SteelSeries Arctic Nova 5", category: "Навушники", price: 720, qty: 2, rating: 4.6 },
{ id: 5, name: "Навушники HyperX Cloud Stinger 2", category: "Навушники", price: 460, qty: 25, rating: 4.5 },
{ id: 6, name: "Клавіатура AtackShark X85", category: "Клавіатура", price: 500, qty: 3, rating: 4.9 },
{ id: 7, name: "Клавіатура AULA F75", category: "Клавіатура", price: 480, qty: 0, rating: 4.5 },
{ id: 8, name: "Клавіатура Hator Icefall PRO", category: "Клавіатура", price: 220, qty: 7, rating: 4.3 },
{ id: 9, name: "Мікрофон Fifine Q6", category: "Мікрофон", price: 230, qty: 5, rating: 4.8 },
{ id: 10, name: "Мікрофон Fifine AM8", category: "Мікрофон", price: 390, qty: 1, rating: 4.7 }
];

// Константи варіанта 
const PRICE_LIMIT = 400; // поріг ціни для фільтра «Дорожчі за поріг», грн
const DISCOUNT = 10; // знижка, %
const LOW_STOCK = 4; // межа «закінчується», шт.
function formatMoney(amount) {
return amount.toLocaleString("uk-UA", {
minimumFractionDigits: 2,
maximumFractionDigits: 2
}) + " грн";
}
function priceWithDiscount(price) {
return price * (100 - DISCOUNT) / 100;
}
function getStatus(qty) {
if (qty === 0) {
return "немає в наявності";
} else if (qty <= LOW_STOCK) {
return "закінчується";
} else {
return "є в наявності";
}
}

function addDiscount(product) {
return {
id: product.id,
name: product.name,
category: product.category,
price: product.price,
qty: product.qty,
rating: product.rating,
discounted: priceWithDiscount(product.price)
};
}
const catalog = products.map(addDiscount);
console.table(catalog);

const tbody = document.querySelector("#products-body");
function renderTable(list) {
if (list.length === 0) {
tbody.innerHTML = '<tr><td colspan="6">Нічого не знайдено</td></tr>';
return;
}
let rows = "";
for (const item of list) {
rows += `<tr>
<td>${item.name}</td>
<td>${item.category}</td>
<td>${formatMoney(item.price)}</td>
<td>${formatMoney(item.discounted)}</td>
<td>${item.qty}</td>
<td>${getStatus(item.qty)}</td>
</tr>`;
}
tbody.innerHTML = rows;
}

const summary = document.querySelector("#summary");
function renderSummary(list) {
if (list.length === 0) {
summary.textContent = "Немає товарів для розрахунку підсумків.";
return;
}
const totalValue = list.reduce(
(sum, item) => sum + item.price * item.qty,
0
);
const avgRating = list.reduce(
(sum, item) => sum + item.rating,
0
) / list.length;
const maxPrice = list.reduce(
(max, item) => (item.price > max ? item.price : max),
0
);
summary.textContent =
`Товарів: ${list.length}. ` +
`Вартість залишків: ${formatMoney(totalValue)}. ` +
`Середній рейтинг: ${avgRating.toFixed(2)}. ` +
`Найвища ціна: ${formatMoney(maxPrice)}.`;
}
function show(list) {
renderTable(list);
renderSummary(list);
}
// Перший показ повного каталогу під час завантаження сторінки:
show(catalog);

const toolbar = document.querySelector(".toolbar");
toolbar.addEventListener("click", (event) => {
const action = event.target.dataset.action;
if (!action) return; // якщо клікнули повз кнопку — нічого не робимо
let list = catalog; // за замовчуванням (зокрема для action === "all") беремо всі товари
if (action === "expensive") {
list = catalog.filter((item) => item.price > PRICE_LIMIT);
} else if (action === "available") {
list = catalog.filter((item) => item.qty > 0);
} else if (action === "sort-asc") {
list = catalog.slice().sort((a, b) => a.price - b.price);
} else if (action === "sort-desc") {
list = catalog.slice().sort((a, b) => b.price - a.price);
}
show(list);
});
// Підрахунок кількості товарів у кожній категорії через reduce (у консоль):
const countByCategory = catalog.reduce((acc, item) => {
acc[item.category] = (acc[item.category] || 0) + 1;
return acc;
}, {});
console.log("Кількість товарів за категоріями:", countByCategory);