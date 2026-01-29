// === CONFIG PATH (adatta se hai cartelle diverse) ===
const PATH_QUOTES  = "/data/quotes/prequotes_b365_unified_top_leagues.csv";
const PATH_RESULTS = "/data/results/results_unified_top_leagues.csv";

// --- CSV parser semplice (gestisce virgole, niente campi quotati complessi) ---
function parseCSV(text) {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  const header = lines[0].split(",").map(s => s.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(","); // OK per i tuoi file standard
    if (cols.length < header.length) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = (cols[j] ?? "").trim();
    rows.push(obj);
  }
  return rows;
}

function toDate(s) {
  // accetta YYYY-MM-DD
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function fmt2(n){ return (Math.round(n * 100) / 100).toFixed(2); }
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }

// --- Poisson ---
function poissonP(k, lambda) {
  // P(K=k) = e^-λ * λ^k / k!
  let fact = 1;
  for (let i=2;i<=k;i++) fact *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / fact;
}
function pDrawFromLambda(totalGoalsLambda) {
  // stima molto semplice: split 50/50 tra le squadre
  const lh = totalGoalsLambda / 2;
  const la = totalGoalsLambda / 2;
  let p = 0;
  // sommo fino a 6-6 per stabilità
  for (let k=0;k<=6;k++) p += poissonP(k, lh) * poissonP(k, la);
  return clamp(p, 0.0001, 0.9999);
}

// --- Build "ultime N partite" per squadra ---
function buildTeamHistory(resultsRows) {
  // risultatiRows: league,date,home_team,away_team,fthg,ftag,ftr
  // per ogni squadra memorizzo match in ordine data
  const map = new Map(); // key = league|team -> array {date, gf, ga, tot}
  for (const r of resultsRows) {
    const league = r.league;
    const d = toDate(r.date);
    if (!d) continue;

    const ht = r.home_team;
    const at = r.away_team;
    const hg = Number(r.fthg);
    const ag = Number(r.ftag);
    if (!isFinite(hg) || !isFinite(ag)) continue;

    const homeKey = `${league}|${ht}`;
    const awayKey = `${league}|${at}`;

    if (!map.has(homeKey)) map.set(homeKey, []);
    if (!map.has(awayKey)) map.set(awayKey, []);

    map.get(homeKey).push({date:d, gf:hg, ga:ag, tot:hg+ag});
    map.get(awayKey).push({date:d, gf:ag, ga:hg, tot:hg+ag});
  }

  // ordina cronologico
  for (const [k, arr] of map.entries()) {
    arr.sort((a,b)=>a.date-b.date);
  }
  return map;
}

function avgLastN(arr, n) {
  if (!arr || arr.length === 0) return null;
  const slice = arr.slice(-n);
  const tot = slice.reduce((s,x)=>s+x.tot,0) / slice.length;
  return { totAvg: tot, nUsed: slice.length };
}

async function loadCSV(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch fallita: ${path} (${res.status})`);
  const txt = await res.text();
  return parseCSV(txt);
}

// --- UI ---
const $ = (id) => document.getElementById(id);

function rowHTML(o) {
  const note = o.note ?? "";
  const evClass = o.evPct >= 30 ? "ok" : "warn";
  return `
    <tr>
      <td>${o.league}</td>
      <td>${o.date}</td>
      <td>${o.home} – ${o.away}</td>
      <td>${fmt2(o.qx)}</td>
      <td>${fmt2(o.px * 100)}%</td>
      <td>${fmt2(o.fairOdds)}</td>
      <td class="${evClass}">${fmt2(o.evPct)}%</td>
      <td>${fmt2(o.gMean)}</td>
      <td>${note}</td>
    </tr>
  `;
}

async function runScan() {
  const btn = $("btnRun");
  btn.disabled = true;
  $("status").textContent = "Carico CSV…";

  const leaguePick = $("league").value;
  const nLast = Number($("nLast").value);
  const evMin = Number($("evMin").value);
  const qxMin = Number($("qxMin").value);
  const qxMax = Number($("qxMax").value);
  const gMax  = Number($("gMax").value);
  const ban4050 = $("ban4050").checked;
  const daysAhead = Number($("daysAhead").value);

  try {
    const [quotes, results] = await Promise.all([
      loadCSV(PATH_QUOTES),
      loadCSV(PATH_RESULTS),
    ]);

    $("status").textContent = "Costruisco storico squadre…";

    // Filtra risultati per league se serve
    const resultsF = (leaguePick === "ALL")
      ? results
      : results.filter(r => r.league === leaguePick);

    const hist = buildTeamHistory(resultsF);

    const now = new Date();
    const maxDate = new Date(now.getTime() + daysAhead * 24*3600*1000);

    // Filtra quote per league e finestra temporale
    let quotesF = quotes.filter(q => {
      if (leaguePick !== "ALL" && q.league !== leaguePick) return false;
      const d = toDate(q.date);
      if (!d) return false;
      return (d >= now && d <= maxDate) || daysAhead >= 3650; // debug
    });

    // Scansiona
    $("status").textContent = "Scansiono partite…";
    const out = [];

    for (const q of quotesF) {
      const qx = Number(q.b365_x);
      const qh = Number(q.b365_h);
      const qa = Number(q.b365_a);
      if (!isFinite(qx) || !isFinite(qh) || !isFinite(qa)) continue;

      if (qx < qxMin || qx > qxMax) continue;

      const league = q.league;
      const home = q.home_team;
      const away = q.away_team;

      const hAvg = avgLastN(hist.get(`${league}|${home}`), nLast);
      const aAvg = avgLastN(hist.get(`${league}|${away}`), nLast);

      // se manca storia sufficiente, scarto (o puoi decidere di tenere)
      if (!hAvg || !aAvg) continue;

      // "gol mean": media dei total-goals medi delle due squadre
      const gMean = (hAvg.totAvg + aAvg.totAvg) / 2;
      if (gMean > gMax) continue;

      // Stima P(X) (semplice Poisson su lambda totale = gMean)
      const px = pDrawFromLambda(gMean);
      const fairOdds = 1 / px;
      const evPct = (qx * px - 1) * 100;

      if (ban4050 && evPct >= 40 && evPct <= 50) continue;
      if (evPct < evMin) continue;

      out.push({
        league,
        date: q.date,
        home, away,
        qx,
        px,
        fairOdds,
        evPct,
        gMean,
        note: `Nhome=${hAvg.nUsed}, Naway=${aAvg.nUsed}`
      });
    }

    // ordina per EV desc
    out.sort((a,b)=>b.evPct-a.evPct);

    // Render
    const tbody = document.querySelector("#tbl tbody");
    tbody.innerHTML = out.map(rowHTML).join("");

    $("summary").textContent =
      `Quote lette: ${quotesF.length} | Candidate: ${out.length} | Parametri: N=${nLast}, EV≥${evMin}%, qX=[${qxMin}-${qxMax}], gMean≤${gMax}`;

    $("status").textContent = "Fatto ✅";

  } catch (e) {
    console.error(e);
    $("status").textContent = `Errore: ${e.message}`;
    $("summary").textContent = "";
    document.querySelector("#tbl tbody").innerHTML = "";
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("btnRun").addEventListener("click", runScan);
});
