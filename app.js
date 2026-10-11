(() => {
  "use strict";
  const STORAGE_KEY = "cluecount-state-v1";
  const ROUND_LABELS = { regular: "Regular round", double: "Double round", final: "Final round" };
  const VALUES = { regular: [200, 400, 600, 800, 1000], double: [400, 800, 1200, 1600, 2000] };
  const $ = (id) => document.getElementById(id);
  const money = (n) => (n < 0 ? "−$" + Math.abs(n).toLocaleString("en-US") : "$" + n.toLocaleString("en-US"));
  let state = { score: 0, round: "regular", selectedValue: null, dailyDouble: false, history: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Number.isFinite(saved.score) && Array.isArray(saved.history)) {
      state.score = saved.score; state.history = saved.history;
      state.round = ["regular", "double", "final"].includes(saved.round) ? saved.round : "regular";
    }
  } catch (_) {}
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2300);
  }
  function maxDailyWager() { return Math.max(0, state.score, VALUES[state.round][VALUES[state.round].length - 1]); }
  function maxFinalWager() { return Math.max(0, state.score); }
  function setRound(round) {
    state.round = round; state.selectedValue = null; state.dailyDouble = false;
    document.querySelectorAll('input[name="round"]').forEach(r => r.checked = r.value === round);
    $("clueSection").classList.toggle("hidden", round === "final");
    $("finalSection").classList.toggle("hidden", round !== "final");
    $("roundLabel").textContent = ROUND_LABELS[round];
    $("roundHelp").textContent = round === "regular" ? "Choose the value of the clue, then mark your result." : round === "double" ? "Clue values are doubled in this round." : "Wager any amount up to your current score, then mark your result.";
    renderValues(); renderSelection(); updateWagerLimits(); save();
  }
  function renderValues() {
    const grid = $("valueGrid"); grid.replaceChildren();
    (VALUES[state.round] || []).forEach(value => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "value-button" + (state.selectedValue === value ? " selected" : "");
      button.textContent = money(value); button.setAttribute("aria-pressed", String(state.selectedValue === value));
      button.addEventListener("click", () => {
        state.selectedValue = value; state.dailyDouble = false;
        $("dailyDoublePanel").classList.add("hidden"); $("dailyDoubleButton").textContent = "＋ Daily Double";
        renderValues(); renderSelection();
      });
      grid.appendChild(button);
    });
  }
  function renderSelection() {
    const hasValue = state.selectedValue !== null;
    $("selectedSummary").textContent = hasValue ? (state.dailyDouble ? "Daily Double · " : "") + money(state.selectedValue) : "Select a value";
    ["correctButton", "wrongButton", "passButton"].forEach(id => $(id).disabled = !hasValue);
  }
  function updateWagerLimits() {
    const ddMax = maxDailyWager(); $("wagerLimit").textContent = "Maximum wager: " + money(ddMax); $("dailyWager").max = String(ddMax);
    if (Number($("dailyWager").value) > ddMax) $("dailyWager").value = ddMax;
    const finalMax = maxFinalWager(); $("finalLimit").textContent = "Maximum wager: " + money(finalMax); $("finalWager").max = String(finalMax);
    if (Number($("finalWager").value) > finalMax) $("finalWager").value = finalMax;
  }
  function clampWager(input, max) {
    let value = Number(input.value); if (!Number.isFinite(value) || value < 0) value = 0;
    value = Math.floor(value); if (value > max) value = max; input.value = String(value); return value;
  }
  function record({ title, detail, delta, result }) {
    state.score += delta;
    state.history.unshift({ title, detail, delta, result, scoreAfter: state.score, time: Date.now() });
    state.history = state.history.slice(0, 100); state.selectedValue = null; state.dailyDouble = false;
    $("dailyDoublePanel").classList.add("hidden"); $("dailyDoubleButton").textContent = "＋ Daily Double";
    renderValues(); renderSelection(); renderScore(); updateWagerLimits(); renderHistory(); save();
    toast((delta > 0 ? "+" : "") + money(delta) + " · Total " + money(state.score));
  }
  function scoreClue(result) {
    if (state.selectedValue === null) return;
    let wager = state.selectedValue;
    let title = (state.round === "double" ? "Double" : "Regular") + " · " + money(state.selectedValue);
    let delta = result === "correct" ? wager : result === "wrong" ? -wager : 0;
    let detail = result === "correct" ? "Correct" : result === "wrong" ? "Incorrect" : "Passed";
    if (state.dailyDouble) {
      wager = clampWager($("dailyWager"), maxDailyWager()); title = "Daily Double";
      delta = result === "correct" ? wager : result === "wrong" || result === "pass" ? -wager : 0;
      detail = (result === "correct" ? "Correct" : result === "wrong" ? "Incorrect" : "Passed") + " · wager " + money(wager);
    }
    record({ title, detail, delta, result });
  }
  function scoreFinal(result) {
    const wager = clampWager($("finalWager"), maxFinalWager());
    const delta = result === "correct" ? wager : result === "wrong" || result === "pass" ? -wager : 0;
    const detail = (result === "correct" ? "Correct" : result === "wrong" ? "Incorrect" : "Passed") + " · wager " + money(wager);
    record({ title: "Final round", detail, delta, result });
  }
  function renderScore() {
    $("score").textContent = money(state.score);
    $("clueCount").textContent = state.history.length + (state.history.length === 1 ? " clue scored" : " clues scored");
  }
  function renderHistory() {
    const list = $("history"); list.replaceChildren();
    if (!state.history.length) {
      const li = document.createElement("li"); li.className = "empty-history"; li.textContent = "Your scored clues will appear here."; list.appendChild(li);
    } else state.history.slice(0, 12).forEach(item => {
      const li = document.createElement("li"), main = document.createElement("div");
      main.className = "history-main";
      const title = document.createElement("span"); title.className = "history-title"; title.textContent = item.title;
      const detail = document.createElement("span"); detail.className = "history-detail"; detail.textContent = item.detail;
      main.append(title, detail);
      const delta = document.createElement("span"); delta.className = "history-delta " + (item.delta > 0 ? "positive" : item.delta < 0 ? "negative" : "");
      delta.textContent = (item.delta > 0 ? "+" : "") + money(item.delta); li.append(main, delta); list.appendChild(li);
    });
    $("undoButton").disabled = state.history.length === 0;
  }
  document.querySelectorAll('input[name="round"]').forEach(r => r.addEventListener("change", () => setRound(r.value)));
  $("dailyDoubleButton").addEventListener("click", () => {
    if (state.selectedValue === null) { toast("Select the clue value first."); return; }
    state.dailyDouble = !state.dailyDouble; $("dailyDoublePanel").classList.toggle("hidden", !state.dailyDouble);
    $("dailyDoubleButton").textContent = state.dailyDouble ? "✓ Daily Double selected" : "＋ Daily Double";
    if (state.dailyDouble) { $("dailyWager").value = Math.min(state.selectedValue, maxDailyWager()); updateWagerLimits(); $("dailyWager").focus(); }
    renderSelection();
  });
  $("cancelDailyDouble").addEventListener("click", () => {
    state.dailyDouble = false; $("dailyDoublePanel").classList.add("hidden"); $("dailyDoubleButton").textContent = "＋ Daily Double"; renderSelection();
  });
  $("correctButton").addEventListener("click", () => scoreClue("correct"));
  $("wrongButton").addEventListener("click", () => scoreClue("wrong"));
  $("passButton").addEventListener("click", () => scoreClue("pass"));
  $("finalCorrect").addEventListener("click", () => scoreFinal("correct"));
  $("finalWrong").addEventListener("click", () => scoreFinal("wrong"));
  $("finalPass").addEventListener("click", () => scoreFinal("pass"));
  $("dailyWager").addEventListener("change", () => clampWager($("dailyWager"), maxDailyWager()));
  $("finalWager").addEventListener("change", () => clampWager($("finalWager"), maxFinalWager()));
  $("undoButton").addEventListener("click", () => {
    const last = state.history.shift(); if (!last) return;
    state.score -= last.delta; renderScore(); renderHistory(); updateWagerLimits(); save(); toast("Last clue undone.");
  });
  $("resetButton").addEventListener("click", () => {
    if (!confirm("Start a new game and clear this game's score history?")) return;
    state = { score: 0, round: "regular", selectedValue: null, dailyDouble: false, history: [] };
    $("dailyWager").value = 200; $("finalWager").value = 0;
    setRound("regular"); renderScore(); renderHistory(); updateWagerLimits(); save(); toast("New game started.");
  });
  setRound(state.round); renderScore(); renderHistory(); updateWagerLimits();
})();