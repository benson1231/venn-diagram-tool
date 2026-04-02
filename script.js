let CURRENT = {};
let STYLE = {
  fontFamily: "'Times New Roman', serif",
  fontSize: 18,
  showPct: true
};

// ===== 基本工具 =====
function parseList(text) {
  return new Set(
    text
      .split(/\n|,|\t/)
      .map((x) => x.trim())
      .filter((x) => x !== ""),
  );
}

function inter(a, b) {
  return new Set([...a].filter((x) => b.has(x)));
}

function union(...sets) {
  return new Set(sets.flatMap((s) => [...s]));
}

function diff(a, b) {
  return new Set([...a].filter((x) => !b.has(x)));
}

// ===== UI 元件 =====
function label(x, y, text) {
  return `<text x="${x}" y="${y}" 
    font-size="${STYLE.fontSize + 2}" 
    font-family="${STYLE.fontFamily}">
    ${text}
  </text>`;
}

function value(x, y, key, n, pct) {

  const hasPct = STYLE.showPct;

  const dyTop = hasPct ? "-0.4em" : "0em";   // ⭐ 關鍵
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

// ===== 模板 =====
const TEMPLATE = {
  colors: ["#6A6CE0", "#F2F06A", "#6AF26A", "#F26A6A"],

  venn2: ({ A, B, AB, names, pct }) => `
  <svg viewBox="0 0 600 400" width="500">
    <circle cx="220" cy="200" r="140" fill="${TEMPLATE.colors[0]}" fill-opacity="0.7"/>
    <circle cx="380" cy="200" r="140" fill="${TEMPLATE.colors[1]}" fill-opacity="0.7"/>

    ${label(150, 40, names[0])}
    ${label(450, 40, names[1])}

    ${value(180,200,"A",A,pct)}
    ${value(420,200,"B",B,pct)}
    ${value(300,200,"AB",AB,pct)}
  </svg>
  `,

  venn3: ({ onlyA, onlyB, onlyC, AB, AC, BC, ABC, names, pct }) => `
  <svg viewBox="0 0 600 500" width="100%">
    <circle cx="220" cy="180" r="140" fill="${TEMPLATE.colors[0]}" fill-opacity="0.7"/>
    <circle cx="380" cy="180" r="140" fill="${TEMPLATE.colors[1]}" fill-opacity="0.7"/>
    <circle cx="300" cy="320" r="140" fill="${TEMPLATE.colors[2]}" fill-opacity="0.7"/>

    ${label(140, 30, names[0])}
    ${label(460, 30, names[1])}
    ${label(300, 480, names[2])}

    ${value(160,160,"onlyA",onlyA,pct)}
    ${value(440,160,"onlyB",onlyB,pct)}
    ${value(300,380,"onlyC",onlyC,pct)}

    ${value(300,140,"AB",AB,pct)}
    ${value(220,260,"AC",AC,pct)}
    ${value(380,260,"BC",BC,pct)}

    ${value(300,220,"ABC",ABC,pct)}
  </svg>
  `
};

// ===== 邏輯 =====
function calc2(A, B) {

  const onlyA = diff(A,B);
  const onlyB = diff(B,A);
  const AB = inter(A,B);

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

function showGenes(key) {

  const genes = CURRENT[key] || [];

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

// ===== controller =====
document.getElementById("runBtn").addEventListener("click", () => {
  const cards = document.querySelectorAll(".card");

  let sets = [];
  let names = [];

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

  if (sets.length === 2) {
    const res = calc2(...sets);
    const pct = (n) => ((n / res.total) * 100).toFixed(1);

    svg = TEMPLATE.venn2({
      ...res,
      names,
      pct,
    });
  }

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

function copyGenes() {
  const text = document.getElementById("resultGenes").innerText;

  if (!text || text === "No genes") return;

  navigator.clipboard.writeText(text);

  // 小提示
  const btn = document.getElementById("copyBtn");
  btn.innerText = "Copied!";
  setTimeout(() => btn.innerText = "Copy", 1200);
}

document.getElementById("copyBtn").addEventListener("click", copyGenes);
document.getElementById("resultGenes").addEventListener("click", copyGenes);
document.getElementById("fontSelect").addEventListener("change", (e) => {
  STYLE.fontFamily = e.target.value;
  document.getElementById("runBtn").click();
});

document.getElementById("fontSize").addEventListener("input", (e) => {
  STYLE.fontSize = parseInt(e.target.value);
  document.getElementById("runBtn").click();
});

document.getElementById("togglePct").addEventListener("change", (e) => {
  STYLE.showPct = e.target.checked;
  document.getElementById("runBtn").click();
});