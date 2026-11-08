const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Theme toggle: follows the system until the visitor picks one */
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch {}
document.querySelector(".theme").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
});

/* Timeline: bars placed on a shared axis; jobs without data-end run until today */
const gantt = document.querySelector(".gantt");
const jobs = [...gantt.querySelectorAll(".job")];
const toM = (ym) => { const [y, m] = ym.split("-").map(Number); return y * 12 + m - 1; };
const now = new Date();
const nowM = now.getFullYear() * 12 + now.getMonth() + now.getDate() / 31;
const firstYear = Math.min(...jobs.map((j) => +j.dataset.start.slice(0, 4)));
const from = firstYear * 12;
const to = (now.getFullYear() + 1) * 12;
const pct = (m) => `${((m - from) / (to - from)) * 100}%`;

for (const job of jobs) {
  const start = toM(job.dataset.start);
  const end = job.dataset.end ? toM(job.dataset.end) + 1 : nowM;
  job.classList.toggle("running", !job.dataset.end);
  job.style.setProperty("--start", pct(start));
  job.style.setProperty("--len", `${((end - start) / (to - from)) * 100}%`);
}
const axis = gantt.querySelector(".axis");
for (let y = firstYear; y <= now.getFullYear() + 1; y++) {
  const tick = document.createElement("span");
  tick.textContent = y;
  tick.style.left = pct(y * 12);
  axis.append(tick);
}
gantt.style.setProperty("--now", pct(nowM));
gantt.style.setProperty("--rows", jobs.length);
gantt.classList.add("ready");

const onView = (el, fn, threshold = 0.3) => {
  if (reduced || !("IntersectionObserver" in window)) return fn();
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { fn(); io.disconnect(); }
  }, { threshold });
  io.observe(el);
};
onView(gantt, () => gantt.classList.add("grown"));

/* Weeks: one cell per week since the first job, shaded by how many jobs were running that week.
   Reads the same data-start/data-end as the timeline, so there is a single source of truth. */
const weeksGrid = document.querySelector(".weeks-grid");
const readout = document.querySelector(".readout");
const spans = jobs.map((j) => ({
  name: j.querySelector(".label").firstChild.textContent.trim(),
  from: toM(j.dataset.start),
  to: j.dataset.end ? toM(j.dataset.end) + 1 : Infinity,
}));
const fmt = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
const firstJob = Math.min(...spans.map((s) => s.from));
const describe = (cell) => cell.dataset.names
  ? `${cell.dataset.when} · ${cell.dataset.names}`
  : cell.dataset.when ? `${cell.dataset.when} · idle` : "";
let idx = 0;
for (let y = firstYear; y <= now.getFullYear(); y++) {
  const label = document.createElement("span");
  label.className = "year";
  label.textContent = y;
  weeksGrid.append(label);
  for (let w = 0; w < 52; w++) {
    const day = new Date(y, 0, 1 + w * 7);
    const m = day.getFullYear() * 12 + day.getMonth() + day.getDate() / 31;
    const cell = document.createElement("i");
    cell.style.setProperty("--i", idx++);
    if (day > now) cell.className = "future";
    else if (m >= firstJob) {
      const running = spans.filter((s) => m >= s.from && m < s.to);
      cell.dataset.load = Math.min(6, running.length);
      cell.dataset.when = `week of ${fmt.format(day)}`;
      if (running.length) cell.dataset.names = running.map((s) => s.name).join(" + ");
      if (now - day < 7 * 864e5) cell.classList.add("now");
    }
    weeksGrid.append(cell);
  }
}
const nowCell = weeksGrid.querySelector(".now");
const showDefault = () => { readout.textContent = nowCell ? `now · ${nowCell.dataset.names}` : ""; };
weeksGrid.addEventListener("mouseover", (e) => { if (e.target.dataset?.when) readout.textContent = describe(e.target); });
weeksGrid.addEventListener("mouseleave", showDefault);
showDefault();
// Once the staggered reveal ends, drop the per-cell delay so hover shrinks back immediately
onView(weeksGrid, () => {
  weeksGrid.classList.add("on");
  setTimeout(() => weeksGrid.classList.add("settled"), reduced ? 0 : idx * 3 + 400);
}, 0.2);

/* Count-up for the big numbers */
document.querySelectorAll("[data-count]").forEach((el) => {
  const target = +el.dataset.count;
  onView(el, () => {
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1200);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, 0.6);
});

/* Highlight the section being read in the top bar */
const links = new Map([...document.querySelectorAll(".topbar nav a")].map((a) => [a.hash.slice(1), a]));
if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove("active"));
      links.get(e.target.id)?.classList.add("active");
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  // The last section is short: mark it when the page bottom is reached
  addEventListener("scroll", () => {
    if (innerHeight + scrollY < document.documentElement.scrollHeight - 4) return;
    links.forEach((a) => a.classList.remove("active"));
    [...links.values()].at(-1).classList.add("active");
  }, { passive: true });
}
