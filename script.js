/* =========================================================
   Global State & Style Config
   ---------------------------------------------------------
   - CURRENT: 儲存目前各區域 gene 結果（供點擊互動使用）
   - STYLE: 控制 SVG 顯示樣式（字體 / 字體大小 / 百分比顯示）
   ========================================================= */
let CURRENT = {};

let STYLE = {
  fontFamily: "'Times New Roman', serif",
  fontSize: 18,
  showPct: true
};


/* =========================================================
   Basic Set Operations（核心資料處理）
   ---------------------------------------------------------
   將輸入文字轉為 Set 並提供：
   - 交集 inter
   - 聯集 union
   - 差集 diff
   ========================================================= */

/* 將 textarea 輸入轉為 Set（支援換行 / 逗號 / tab） */
function parseList(text) {
  return new Set(
    text
      .split(/\n|,|\t/)
      .map((x) => x.trim())
      .filter((x) => x !== "")
  );
}

/* 交集 */
function inter(a, b) {
  return new Set([...a].filter((x) => b.has(x)));
}

/* 聯集（多集合） */
function union(...sets) {
  return new Set(sets.flatMap((s) => [...s]));
}

/* 差集（a - b） */
function diff(a, b) {
  return new Set([...a].filter((x) => !b.has(x)));
}


/* =========================================================
   SVG UI Components（繪圖元件）
   ---------------------------------------------------------
   - label: 顯示集合名稱
   - value: 顯示數值 + 百分比（可點擊）
   ========================================================= */

/* 畫 label（集合名稱） */
function label(x, y, text) {
  return `<text x="${x}" y="${y}" 
    font-size="${STYLE.fontSize + 2}" 
    font-family="${STYLE.fontFamily}">
    ${text}
  </text>`;
}


/* 畫數值（可點擊區域）
   - 顯示 count
   - optionally 顯示 percentage
   - click → showGenes() */
function value(x, y, key, n, pct) {

  const hasPct = STYLE.showPct;

  // 控制上下排版（有無百分比）
  const dyTop = hasPct ? "-0.4em" : "0em";

  const pctLine = hasPct
    ? `<tspan x="${x}" dy="1.2em">(${pct(n)}%)</tspan>`
    : "";

  return `
    <text x="${x}" y="${y}"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="${STYLE.fontFamily}"
      font-size="${STYLE.fontSize}"
      style="cursor:pointer"
      onclick="showGenes('${key}')">
      
      <tspan x="${x}" dy="${dyTop}">${n}</tspan>
      ${pctLine}

    </text>
  `;
}


/* =========================================================
   SVG Templates（圖形模板）
   ---------------------------------------------------------
   - venn2: 2-set Venn
   - venn3: 3-set Venn
   - colors: 固定配色（可後續主題化）
   ========================================================= */

const TEMPLATE = {
  colors: ["#6A6CE0", "#F2F06A", "#6AF26A", "#F26A6A"],

  /* ===== 2 sets ===== */
  venn2: ({ A, B, AB, names, pct }) => {
    const cx1 = 220;
    const cx2 = 380;
    const cy = 200;
    const offset = 80;

    return `
    <svg viewBox="0 0 600 400" width="500" preserveAspectRatio="xMidYMid meet">
      <circle cx="${cx1}" cy="${cy}" r="140" fill="${TEMPLATE.colors[0]}" fill-opacity="0.7"/>
      <circle cx="${cx2}" cy="${cy}" r="140" fill="${TEMPLATE.colors[1]}" fill-opacity="0.7"/>

      ${label(cx1 - offset, 40, names[0])}
      ${label(cx2 + offset, 40, names[1])}

      ${value(cx1 - 40, cy, "A", A, pct)}
      ${value(cx2 + 40, cy, "B", B, pct)}
      ${value(300, cy, "AB", AB, pct)}
    </svg>
    `;
  },

  /* ===== 3 sets ===== */
  venn3: ({ onlyA, onlyB, onlyC, AB, AC, BC, ABC, names, pct }) => {
    const cx1 = 220;
    const cx2 = 380;
    const cx3 = 300;

    const cyTop = 180;
    const cyBottom = 320;

    const offset = 80;

    return `
    <svg viewBox="0 0 600 500" width="100%" preserveAspectRatio="xMidYMid meet">
      <circle cx="${cx1}" cy="${cyTop}" r="140" fill="${TEMPLATE.colors[0]}" fill-opacity="0.7"/>
      <circle cx="${cx2}" cy="${cyTop}" r="140" fill="${TEMPLATE.colors[1]}" fill-opacity="0.7"/>
      <circle cx="${cx3}" cy="${cyBottom}" r="140" fill="${TEMPLATE.colors[2]}" fill-opacity="0.7"/>

      ${label(cx1 - offset, 30, names[0])}
      ${label(cx2 + offset, 30, names[1])}
      ${label(cx3, 480, names[2])}

      ${value(cx1 - 60, cyTop, "onlyA", onlyA, pct)}
      ${value(cx2 + 60, cyTop, "onlyB", onlyB, pct)}
      ${value(cx3, cyBottom + 60, "onlyC", onlyC, pct)}

      ${value(300, 140, "AB", AB, pct)}
      ${value(220, 260, "AC", AC, pct)}
      ${value(380, 260, "BC", BC, pct)}

      ${value(300, 220, "ABC", ABC, pct)}
    </svg>
    `;
  }
};


/* =========================================================
   Core Logic（集合計算）
   ---------------------------------------------------------
   - calc2 / calc3
   - 同時更新 CURRENT（供 UI 點擊用）
   ========================================================= */

/* ===== 2-set 計算 ===== */
function calc2(A, B) {

  const onlyA = diff(A,B);
  const onlyB = diff(B,A);
  const AB = inter(A,B);

  // 儲存實際 gene（供點擊）
  CURRENT = {
    A: [...onlyA],
    B: [...onlyB],
    AB: [...AB]
  };

  return {
    A: onlyA.size,
    B: onlyB.size,
    AB: AB.size,
    total: union(A,B).size
  };
}


/* ===== 3-set 計算 ===== */
function calc3(A, B, C) {

  const AB = inter(A,B);
  const AC = inter(A,C);
  const BC = inter(B,C);
  const ABC = inter(AB,C);

  const onlyA = diff(A, union(B,C));
  const onlyB = diff(B, union(A,C));
  const onlyC = diff(C, union(A,B));

  const AB_only = diff(AB, C);
  const AC_only = diff(AC, B);
  const BC_only = diff(BC, A);

  CURRENT = {
    onlyA: [...onlyA],
    onlyB: [...onlyB],
    onlyC: [...onlyC],
    AB: [...AB_only],
    AC: [...AC_only],
    BC: [...BC_only],
    ABC: [...ABC]
  };

  return {
    onlyA: onlyA.size,
    onlyB: onlyB.size,
    onlyC: onlyC.size,
    AB: AB_only.size,
    AC: AC_only.size,
    BC: BC_only.size,
    ABC: ABC.size,
    total: union(A,B,C).size
  };
}


/* =========================================================
   Interaction Layer（點擊 → 顯示 gene）
   ========================================================= */

function showGenes(key) {

  const genes = CURRENT[key] || [];

  /* key → human readable label */
  const titleMap = {
    A: "List A only",
    B: "List B only",
    C: "List C only",
    AB: "A ∩ B",
    AC: "A ∩ C",
    BC: "B ∩ C",
    ABC: "A ∩ B ∩ C",
    onlyA: "List A only",
    onlyB: "List B only",
    onlyC: "List C only"
  };

  document.getElementById("resultSelected").innerText =
    "Selected: " + (titleMap[key] || key);

  document.getElementById("resultMeta").innerText =
    `${genes.length} genes`;

  document.getElementById("resultGenes").innerText =
    genes.length ? genes.join("\n") : "No genes";
}


/* =========================================================
   Controller（主流程入口）
   ---------------------------------------------------------
   - 收集輸入
   - 判斷 2-set / 3-set
   - 產生 SVG
   ========================================================= */

document.getElementById("runBtn").addEventListener("click", () => {
  const cards = document.querySelectorAll(".card");

  let sets = [];
  let names = [];

  /* 收集所有輸入 */
  cards.forEach((card, i) => {
    const name = card.querySelector(".title").value || `Set ${i + 1}`;
    const text = card.querySelector("textarea").value;

    const set = parseList(text);

    if (set.size > 0) {
      sets.push(set);
      names.push(name);
    }
  });

  if (sets.length < 2) {
    alert("至少需要兩個 list");
    return;
  }

  let svg = "";

  /* ===== 2-set ===== */
  if (sets.length === 2) {
    const res = calc2(...sets);
    const pct = (n) => ((n / res.total) * 100).toFixed(1);

    svg = TEMPLATE.venn2({
      ...res,
      names,
      pct,
    });
  }

  /* ===== 3-set ===== */
  if (sets.length === 3) {
    const res = calc3(...sets);
    const pct = (n) => ((n / res.total) * 100).toFixed(1);

    svg = TEMPLATE.venn3({
      ...res,
      names,
      pct,
    });
  }

  document.getElementById("venn").innerHTML = svg;
});


/* =========================================================
   Utility（Copy 功能）
   ========================================================= */

function copyGenes() {
  const text = document.getElementById("resultGenes").innerText;

  if (!text || text === "No genes") return;

  navigator.clipboard.writeText(text);

  // UX feedback
  const btn = document.getElementById("copyBtn");
  btn.innerText = "Copied!";
  setTimeout(() => btn.innerText = "Copy", 1200);
}


/* =========================================================
   Event Bindings（UI 控制）
   ========================================================= */

document.getElementById("copyBtn").addEventListener("click", copyGenes);
document.getElementById("resultGenes").addEventListener("click", copyGenes);

/* 字體切換 */
document.getElementById("fontSelect").addEventListener("change", (e) => {
  STYLE.fontFamily = e.target.value;
  document.getElementById("runBtn").click();
});

/* 字體大小 */
document.getElementById("fontSize").addEventListener("input", (e) => {
  STYLE.fontSize = parseInt(e.target.value);
  document.getElementById("runBtn").click();
});

/* 顯示百分比 toggle */
document.getElementById("togglePct").addEventListener("change", (e) => {
  STYLE.showPct = e.target.checked;
  document.getElementById("runBtn").click();
});
