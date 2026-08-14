/*
 * Pred MMA — Data + Render
 *
 * HOW TO ADD AN EVENT:
 *   Push a new object to EVENTS[].
 *   pA/pB = null means "awaiting model output."
 *   result = "A" | "B" | null (null = not yet fought).
 *   me = true marks the main event (red left bar).
 *   edge = true/false forces the gold +EV border; omit to auto-detect
 *   when the model favorite has +edge vs open odds.
 *   For fights with charts (any status), set:
 *     charts: "fights/<slug>"
 *   Expected PNGs under that folder:
 *     feature_impact.png, grouped_stats.png, individual_stats.png
 */

const EVENTS = [
  {
    name: " UFC 330: Makhachev vs. Machado Garry",
    date: "2026-08-15",
    location: " Philadelphia, Pennsylvania, USA",
    status: "upcoming",
    fights: [
      { a: "Islam Makhachev", b: "Ian Machado Garry", pA: 58.2, pB: 41.8, oA: -317, oB: 300, me: true, charts: "fights/ISLAM MAKHACHEV_vs_IAN MACHADO GARRY"},
      { a: "Mansur Abdul-Malik", b: "Dustin Stoltzfus", pA: 84.6, pB: 15.4, oA: -614, oB: 567, me: false, charts: 'fights/MANSUR ABDUL-MALIK_vs_DUSTIN STOLTZFUS'},
      { a: "Edson Barboza", b: "Esteban Ribovics", pA: 36.0, pB: 64.0, oA: 525, oB: -567, me: false , charts: "fights/EDSON BARBOZA_vs_Esteban Ribovics"},
      { a: "Jalin Turner", b: "Kaue Fernandes", pA: 42.6, pB: 57.4, oA: -150, oB: +144, me: false, edge :true , charts:"fights/JALIN TURNER_vs_KAUE FERNANDES"},
      { a: "Neil Magny", b: "Ramiz Brahimaj", pA: 57.0, pB: 43.0, oA: 127, oB: -133, me: false, edge :true , charts:"fights/NEIL MAGNY_vs_RAMIZ BRAHIMAJ"},
      { a: "Vicente Luque", b: "Tresean Gore", pA: 68.8, pB: 31.2, oA: 104, oB: -108, me: false, edge :true , charts:"fights/Vicente Luque_vs_Tresean Gore"},
      { a: "Chidi Njokuani", b: "Joel Alvarez", pA: 34.4, pB: 65.6, oA: 252, oB: -307, me: false, edge :true , charts:"fights/CHIDI NJOKUANI_vs_Joel Alvarez"},
      { a: "Donte Johnson", b: "Eric McConico", pA: 90.8, pB: 9.2, oA: -277, oB: +217, me: false, edge:true, charts:"fights/DONTE JOHNSON_vs_Eric McConico"},
      { a: "Jeremiah Wells", b: "Myktybek Orolbai", pA: 21.5, pB: 78.5, oA: +733, oB: -809, me: false , charts: "fights/JEREMIAH WELLS_vs_MYKTYBEK OROLBAI"},
    ]
  },
  {
    name: "UFC Fight Night: Gamrot vs. Salkilld",
    date: "2026-08-08",
    location: "Las Vegas, NV",
    status: "completed",
    fights: [
      { a: "Mateusz Gamrot", b: "Quillan Salkilld", pA: 41.4, pB: 58.6, oA: -131, oB: 111, me: true, result: "B", charts: "fights/mateusz-gamrot-vs-quillan-salkilld" },
      { a: "Diego Ferreira", b: "Billy Quarantillo", pA: 58.4, pB: 41.6, oA: -205, oB: 177, me: false, result: "A", charts: "fights/diego-ferreira-vs-billy-quarantillo" },
      { a: "Darren Elkins", b: "Yadier del Valle", pA: 35.4, pB: 64.6, oA: 263, oB: -325, me: false, result: "B", charts: "fights/darren-elkins-vs-yadier-del-valle" },
      { a: "Diyar Nurgozhay", b: "Bruno Lopes", pA: 78.5, pB: 21.5, oA: 186, oB: -220, me: false, result: "A", charts: "fights/diyar-nurgozhay-vs-bruno-lopes" },
    ]
  },
  {
    name: "UFC Fight Night: Medic vs. Rodriguez",
    date: "2026-08-01",
    location: "Belgrade, Serbia",
    status: "completed",
    fights: [
      { a: "Uros Medic", b: "Daniel Rodriguez", pA: 65.5, pB: 34.5, oA: -501, oB: 386, me: true, result: "A" },
      { a: "Jan Blachowicz", b: "Navajo Stirling", pA: 19.0, pB: 81.0, oA: 170, oB: -200, me: false, result: "B" },
      { a: "Aleksandar Rakic", b: "Marcin Tybura", pA: 72.7, pB: 27.3, oA: -250, oB: 210, me: false, result: "A" },
      { a: "Dusko Todorovic", b: "Robert Valentin", pA: 76.0, pB: 24.0, oA: 110, oB: -130, me: false, result: "B" },
      { a: "Ludovit Klein", b: "Tofiq Musayev", pA: 69.9, pB: 30.1, oA: -145, oB: 125, me: false, result: "B" },
      { a: "Mateusz Rebecki", b: "Kyle Prepolec", pA: 85.7, pB: 14.3, oA: -500, oB: 385, me: false, result: "A" },
    ]
  }
  
];

const CHART_SPECS = [
  { id: "impact", file: "feature_impact.png", label: "Impact", caption: "Features that raised or lowered fighter A’s win probability" },
  { id: "grouped", file: "grouped_stats.png", label: "Profile", caption: "Strength areas — descriptive profile, not model weights" },
  { id: "individual", file: "individual_stats.png", label: "Stats", caption: "Adjusted career stats comparison" },
];

// ---- helpers ----

function fmtDate(s) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtOdds(o) {
  if (o == null) return "—";
  return o > 0 ? "+" + o : "" + o;
}

function impliedProb(o) {
  if (o == null) return null;
  return o < 0 ? -o / (-o + 100) : 100 / (o + 100);
}

function decimalOdds(o) {
  if (o == null) return null;
  return o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o);
}

function hasPositiveEdge(f) {
  if (f.edge === true) return true;
  if (f.edge === false) return false;
  if (f.pA == null) return false;
  const pickA = f.pA >= 50;
  const conf = pickA ? f.pA : f.pB;
  const odds = pickA ? f.oA : f.oB;
  const ip = impliedProb(odds);
  if (ip == null) return false;
  return conf / 100 - ip > 0;
}

/**
 * Flat 1u on model favorite only when that side has +EV vs open odds.
 * Never bets the dog. Returns null if fight not graded.
 * status: "win" | "loss" | "nobet"
 */
function getBetDecision(f) {
  if (f.pA == null || f.result == null) return null;

  const pickA = f.pA >= 50;
  const side = pickA ? "A" : "B";
  const conf = pickA ? f.pA : f.pB;
  const odds = pickA ? f.oA : f.oB;
  const ip = impliedProb(odds);

  if (ip == null || odds == null) {
    return { status: "nobet", side, edge: null, odds: null, conf, reason: "no odds" };
  }

  const edge = conf / 100 - ip;
  if (edge <= 0) {
    return { status: "nobet", side, edge, odds, conf, reason: "no edge" };
  }

  const won = f.result === side;
  const profit = won ? decimalOdds(odds) - 1 : -1;
  return {
    status: won ? "win" : "loss",
    side,
    edge,
    odds,
    conf,
    won,
    profit,
    stake: 1,
  };
}

/** Live track-record metrics from completed EVENTS only. */
function computeLiveMetrics(events) {
  const predicted = [];
  const valueBets = [];

  const chrono = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  chrono.forEach(ev => {
    if (ev.status !== "completed") return;
    ev.fights.forEach((f, fi) => {
      if (f.pA == null || f.result == null) return;

      const conf = Math.max(f.pA, f.pB);
      const pickA = f.pA >= 50;
      const pick = pickA ? "A" : "B";
      const correct = pick === f.result;
      predicted.push({ date: ev.date, conf, correct, event: ev.name });

      const d = getBetDecision(f);
      if (!d || d.status === "nobet") return;

      valueBets.push({
        date: ev.date,
        month: ev.date.slice(0, 7),
        side: d.side,
        odds: d.odds,
        edge: d.edge,
        won: d.won,
        profit: d.profit,
        stake: 1,
        a: f.a,
        b: f.b,
        order: fi,
      });
    });
  });

  const nPred = predicted.length;
  const nCorrect = predicted.filter(p => p.correct).length;
  const accuracy = nPred ? (nCorrect / nPred) * 100 : null;
  const avgConf = nPred
    ? predicted.reduce((s, p) => s + p.conf, 0) / nPred
    : null;

  let bankroll = 100;
  const bankrollSeries = [{ label: "Start", date: null, bankroll: 100, profit: 0 }];
  let staked = 0;
  let pnl = 0;
  const monthly = {};

  valueBets.forEach((b, i) => {
    staked += b.stake;
    pnl += b.profit;
    bankroll += b.profit;
    bankrollSeries.push({
      label: String(i + 1),
      date: b.date,
      bankroll,
      profit: b.profit,
      won: b.won,
      a: b.a,
      b: b.b,
    });
    monthly[b.month] = (monthly[b.month] || 0) + b.profit;
  });

  const roi = staked > 0 ? (pnl / staked) * 100 : null;
  const totalGain = staked > 0 ? ((bankroll - 100) / 100) * 100 : null;

  const monthKeys = Object.keys(monthly).sort();
  const monthlySeries = monthKeys.map(m => ({
    month: m,
    label: fmtMonth(m),
    units: monthly[m],
  }));

  return {
    nPred,
    nCorrect,
    accuracy,
    avgConf,
    nBets: valueBets.length,
    staked,
    pnl,
    roi,
    totalGain,
    bankroll,
    bankrollSeries,
    monthlySeries,
    valueBets,
  };
}

function fmtMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function fmtSigned(n, digits = 1, suffix = "") {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(digits) + suffix;
}

function renderDashboard(m) {
  const strip = document.getElementById("kpi-strip");
  if (!strip) return;

  const kpis = [
    {
      label: "Accuracy",
      tip: "Share of completed fights where the model favorite (p ≥ 50%) won.",
      value: m.accuracy == null ? "—" : m.accuracy.toFixed(1) + "%",
      cls: "",
      meta: m.nPred ? `${m.nCorrect}W-${m.nPred - m.nCorrect}L` : "—",
    },
    {
      label: "Avg AI Confidence",
      tip: "Mean of max(pA, pB) on completed fights with a result.",
      value: m.avgConf == null ? "—" : m.avgConf.toFixed(1) + "%",
      cls: "",
      meta: "model favorite side",
    },
    {
      label: "Fights Predicted",
      tip: "Completed fights on this site with model probs and official results.",
      value: m.nPred ? String(m.nPred) : "—",
      cls: m.nPred ? "" : "muted",
      meta: "live cards only",
    },
  ];

  strip.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">
        ${k.label}
        <span class="kpi-tip" tabindex="0" data-tip="${k.tip}">i</span>
      </div>
      <div class="kpi-value ${k.cls}">${k.value}</div>
      <div class="kpi-meta">${k.meta}</div>
    </div>
  `).join("");

  const foot = document.getElementById("dash-footnote");
  if (foot) {
    foot.textContent = m.nPred
      ? `Live track record · ${m.nPred} graded fights. ROI / bankroll after more cards.`
      : "Live track record · ROI / bankroll after more graded fights.";
  }
}

function record(ev) {
  if (ev.status !== "completed") return null;
  let w = 0, l = 0;
  ev.fights.forEach(f => {
    if (f.result == null || f.pA == null) return;
    const pickA = f.pA >= 50;
    const correct = (pickA && f.result === "A") || (!pickA && f.result === "B");
    correct ? w++ : l++;
  });
  return { w, l };
}

function fightSlug(f) {
  if (f.charts) return f.charts.replace(/^fights\//, "").replace(/\/$/, "");
  return (f.a + "-vs-" + f.b)
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function chartsBase(f) {
  if (f.charts) return f.charts.replace(/\/$/, "");
  return null;
}

function fightsPane(eventEl) {
  return eventEl && eventEl.querySelector(".fights");
}

/** Keep event accordion tall enough for current content; animate parent max-height. */
function setFightsHeight(eventEl, px, animate) {
  const fights = fightsPane(eventEl);
  if (!fights || !eventEl.classList.contains("open")) return;
  if (!animate) {
    const prev = fights.style.transition;
    fights.style.transition = "none";
    fights.style.maxHeight = px + "px";
    void fights.offsetHeight;
    fights.style.transition = prev || "";
  } else {
    fights.style.maxHeight = px + "px";
  }
}

function measureFights(eventEl) {
  const fights = fightsPane(eventEl);
  return fights ? fights.scrollHeight : 0;
}

function collapseEl(detail) {
  return detail && detail.querySelector(".viz-collapse");
}

function openFightDetail(row, detail, eventEl) {
  const box = collapseEl(detail);
  const fights = fightsPane(eventEl);
  if (!box || !fights) return;

  row.classList.add("open");
  detail.hidden = false;
  detail.classList.add("is-open");

  const inner = box.querySelector(".viz-collapse-inner");
  box.classList.remove("is-open");
  const h0 = measureFights(eventEl);
  setFightsHeight(eventEl, h0, false);

  requestAnimationFrame(() => {
    box.classList.add("is-open");
    const panelH = inner ? inner.scrollHeight : 0;
    detail.dataset.panelH = String(panelH);
    setFightsHeight(eventEl, h0 + panelH + 24, true);

    const settle = () => {
      if (!row.classList.contains("open")) return;
      const ph = inner ? inner.scrollHeight : 0;
      detail.dataset.panelH = String(ph);
      setFightsHeight(eventEl, measureFights(eventEl) + 8, true);
    };
    setTimeout(settle, 380);
    detail.querySelectorAll("img").forEach(img => {
      if (!img.complete) img.addEventListener("load", settle, { once: true });
    });
  });
}

function closeFightDetail(row, detail, eventEl) {
  const box = collapseEl(detail);
  const fights = fightsPane(eventEl);
  if (!box || !fights) {
    row.classList.remove("open");
    detail.hidden = true;
    return;
  }

  const inner = box.querySelector(".viz-collapse-inner");
  const panelH = parseInt(detail.dataset.panelH || "0", 10) || (inner ? inner.scrollHeight : 0);
  const hStart = measureFights(eventEl);
  setFightsHeight(eventEl, hStart, false);

  row.classList.remove("open");
  detail.classList.remove("is-open");

  requestAnimationFrame(() => {
    box.classList.remove("is-open");
    const hEnd = Math.max(hStart - panelH, 60);
    setFightsHeight(eventEl, hEnd, true);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      box.removeEventListener("transitionend", onEnd);
      if (!row.classList.contains("open")) {
        detail.hidden = true;
        setFightsHeight(eventEl, measureFights(eventEl) + 4, true);
      }
    };
    const onEnd = (e) => {
      if (e.target !== box) return;
      finish();
    };
    box.addEventListener("transitionend", onEnd);
    setTimeout(finish, 400);
  });
}

// ---- render ----

function renderVizPanel(f) {
  const base = chartsBase(f);
  if (!base) {
    return `<div class="viz-collapse"><div class="viz-collapse-inner"><div class="viz-panel">
      <p class="viz-empty">Charts not generated yet for this fight.</p>
    </div></div></div>`;
  }
  const tabs = CHART_SPECS.map((s, i) =>
    `<button type="button" class="viz-tab${i === 0 ? " active" : ""}" data-tab="${s.id}"
      onclick="switchVizTab(event, '${s.id}')">${s.label}</button>`
  ).join("");
  const panes = CHART_SPECS.map((s, i) =>
    `<div class="viz-pane${i === 0 ? " active" : ""}" data-pane="${s.id}">
      <div class="viz-stage">
        <img class="viz-img" src="${base}/${s.file}?v=light1" alt="${s.label}" loading="lazy"
          onerror="this.closest('.viz-pane').classList.add('missing')">
        <p class="viz-fallback">Chart not available</p>
      </div>
      <p class="viz-caption">${s.caption}</p>
    </div>`
  ).join("");
  return `<div class="viz-collapse"><div class="viz-collapse-inner"><div class="viz-panel">
    <div class="viz-tabs">${tabs}</div>
    ${panes}
  </div></div></div>`;
}

function switchVizTab(evt, tabId) {
  evt.stopPropagation();
  const panel = evt.currentTarget.closest(".viz-panel");
  if (!panel) return;
  panel.querySelectorAll(".viz-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === tabId);
  });
  panel.querySelectorAll(".viz-pane").forEach(p => {
    p.classList.toggle("active", p.dataset.pane === tabId);
  });
  const eventEl = panel.closest(".event");
  if (eventEl) {
    const row = eventEl.querySelector(".fight-row.open");
    const detail = row && document.getElementById(row.dataset.fightId + "-detail");
    const inner = detail && detail.querySelector(".viz-collapse-inner");
    if (inner && detail) {
      detail.dataset.panelH = String(inner.scrollHeight);
      setFightsHeight(eventEl, measureFights(eventEl) + 8, true);
    }
  }
}

function betBadgeHtml(f, ev) {
  if (ev.status !== "completed" || f.result == null || f.pA == null) return "";
  const d = getBetDecision(f);
  if (!d) return "";
  if (d.status === "win") {
    const e = d.edge != null ? ` · +${(d.edge * 100).toFixed(1)}% edge` : "";
    return `<span class="bet-badge bet-win" title="Flat 1u on model favorite${e}">MODEL WIN</span>`;
  }
  if (d.status === "loss") {
    const e = d.edge != null ? ` · +${(d.edge * 100).toFixed(1)}% edge` : "";
    return `<span class="bet-badge bet-loss" title="Flat 1u on model favorite${e}">MODEL LOSS</span>`;
  }
  const why = d.reason === "no odds" ? "No open odds" : "No +EV on model favorite";
  return `<span class="bet-badge bet-nobet" title="${why}">NO BET</span>`;
}

function renderFight(f, ev, idx) {
  const has = f.pA != null;
  const pickA = has && f.pA >= 50;
  const clickable = f.charts != null;
  const fid = `fight-${ev.date}-${idx}`;

  let edgeA = "", edgeB = "";
  if (has) {
    const ipA = impliedProb(f.oA);
    const ipB = impliedProb(f.oB);
    if (ipA != null) {
      const eA = f.pA / 100 - ipA;
      edgeA = (eA > 0 ? "+" : "") + (eA * 100).toFixed(1) + "%";
    }
    if (ipB != null) {
      const eB = f.pB / 100 - ipB;
      edgeB = (eB > 0 ? "+" : "") + (eB * 100).toFixed(1) + "%";
    }
  }

  const eAn = parseFloat(edgeA) || 0;
  const eBn = parseFloat(edgeB) || 0;
  // Only highlight +edge on the model favorite side
  const edgeACls = pickA && eAn > 0 ? "pos" : "neg";
  const edgeBCls = !pickA && has && eBn > 0 ? "pos" : "neg";

  let resA = "", resB = "";
  if (f.result === "A") { resA = '<span class="result-w">W</span>'; resB = '<span class="result-l">L</span>'; }
  if (f.result === "B") { resA = '<span class="result-l">L</span>'; resB = '<span class="result-w">W</span>'; }

  const badge = betBadgeHtml(f, ev);

  const rowCls = [
    f.me ? "main-event" : "",
    hasPositiveEdge(f) ? "edge-pick" : "",
    clickable ? "fight-row clickable" : "fight-row",
  ].filter(Boolean).join(" ");

  const clickAttr = clickable
    ? ` data-fight-id="${fid}" onclick="toggleFight(event, '${fid}')" role="button" tabindex="0"`
    : "";

  const mainRow = `<tr class="${rowCls}"${clickAttr}>
    <td><span class="fname ${pickA ? "pick" : ""}">${f.a}</span> ${resA}</td>
    <td class="prob ${has ? (f.pA >= 50 ? "high" : "low") : ""}">${has ? f.pA.toFixed(1) + "%" : "—"}</td>
    <td class="odds hide-sm">${fmtOdds(f.oA)}</td>
    <td class="hide-sm edge ${edgeACls}">${edgeA || "—"}</td>
    <td class="vs">${badge || "VS"}</td>
    <td class="hide-sm edge ${edgeBCls}">${edgeB || "—"}</td>
    <td class="odds hide-sm">${fmtOdds(f.oB)}</td>
    <td class="prob ${has ? (f.pB >= 50 ? "high" : "low") : ""}" style="text-align:right">${has ? f.pB.toFixed(1) + "%" : "—"}</td>
    <td style="text-align:right"><span class="fname ${!pickA && has ? "pick" : ""}">${f.b}</span> ${resB}</td>
  </tr>`;

  if (!clickable) return mainRow;

  const detail = `<tr class="fight-detail" id="${fid}-detail" hidden>
    <td colspan="9">${renderVizPanel(f)}</td>
  </tr>`;

  return mainRow + detail;
}

function renderEvent(ev, isFirst) {
  const rec = record(ev);
  const recStr = rec ? `${rec.w}W-${rec.l}L` : `${ev.fights.length} fights`;
  const tagCls = ev.status === "upcoming" ? "tag-upcoming" : "tag-completed";

  const rows = ev.fights.map((f, i) => renderFight(f, ev, i)).join("");
  const hint = ev.fights.some(f => f.charts != null)
    ? `<p class="fights-hint">Click a fight to view feature impact and profile charts</p>`
    : "";

  return `<div class="event${isFirst ? " open" : ""}" id="ev-${ev.date}">
    <div class="event-header" onclick="toggle('ev-${ev.date}')">
      <div class="event-left">
        <span class="event-title">${ev.name}</span>
        <span class="event-date">${fmtDate(ev.date)} · ${ev.location}</span>
      </div>
      <div class="event-right">
        <span class="tag ${tagCls}">${ev.status}</span>
        <span class="record">${recStr}</span>
        <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="fights">
      ${hint}
      <table class="fights-table">
        <thead>
          <tr>
            <th>Fighter A</th><th>Prob</th><th class="hide-sm">Odds</th><th class="hide-sm">Edge</th>
            <th class="c"></th>
            <th class="hide-sm">Edge</th><th class="hide-sm">Odds</th><th class="r">Prob</th><th class="r">Fighter B</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

function init() {
  const metrics = computeLiveMetrics(EVENTS);
  renderDashboard(metrics);

  const sorted = [...EVENTS].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById("app").innerHTML = sorted.map((ev, i) => renderEvent(ev, i === 0)).join("");

  const first = document.querySelector(".event.open .fights");
  if (first) first.style.maxHeight = first.scrollHeight + "px";

  if (metrics.nPred > 0) {
    const acc = metrics.accuracy.toFixed(1);
    document.getElementById("nav-record").textContent =
      `${metrics.nCorrect}W-${metrics.nPred - metrics.nCorrect}L (${acc}%)`;
  }

  document.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = e.target.closest(".fight-row.clickable");
    if (!row) return;
    e.preventDefault();
    toggleFight(e, row.dataset.fightId);
  });
}

function toggle(id) {
  const el = document.getElementById(id);
  const fights = el.querySelector(".fights");
  const isOpen = el.classList.contains("open");

  if (isOpen) {
    fights.style.maxHeight = "0";
    el.classList.remove("open");
  } else {
    fights.style.maxHeight = fights.scrollHeight + "px";
    el.classList.add("open");
  }
}

function toggleFight(evt, fid) {
  if (evt) evt.stopPropagation();
  const row = document.querySelector(`[data-fight-id="${fid}"]`);
  const detail = document.getElementById(fid + "-detail");
  if (!row || !detail) return;

  const eventEl = row.closest(".event");
  const wasOpen = row.classList.contains("open");

  // animate-close other open fights in this event
  eventEl.querySelectorAll(".fight-row.open").forEach(r => {
    if (r === row) return;
    const d = document.getElementById(r.dataset.fightId + "-detail");
    if (d) closeFightDetail(r, d, eventEl);
  });

  if (wasOpen) {
    closeFightDetail(row, detail, eventEl);
  } else {
    openFightDetail(row, detail, eventEl);
  }
}

document.addEventListener("DOMContentLoaded", init);
