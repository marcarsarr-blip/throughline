// Throughline Figma plugin — turns the analysis JSON (copied from the web app) into
// editable frames on the canvas. Runs inside Figma via the Plugin API.

figma.showUI(__html__, { width: 440, height: 480 });

const PAPER = { r: 0.98, g: 0.976, b: 0.969 };
const INK = { r: 0.18, g: 0.165, b: 0.133 };
const MUTED = { r: 0.54, g: 0.52, b: 0.46 };
const WHITE = { r: 1, g: 1, b: 1 };
const LINE = { r: 0.9, g: 0.886, b: 0.855 };
const ACCENT = { r: 0.42, g: 0.37, b: 0.78 };

async function loadFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Regular" }),
    figma.loadFontAsync({ family: "Inter", style: "Medium" }),
    figma.loadFontAsync({ family: "Inter", style: "Bold" }),
  ]);
}

function text(chars, opts) {
  const o = opts || {};
  const t = figma.createText();
  t.fontName = { family: "Inter", style: o.style || "Regular" };
  t.characters = String(chars == null ? "" : chars);
  t.fontSize = o.size || 14;
  t.fills = [{ type: "SOLID", color: o.color || INK }];
  t.textAutoResize = "HEIGHT";
  if (o.lh) t.lineHeight = { unit: "PERCENT", value: o.lh };
  if (o.stretch) t.layoutAlign = "STRETCH";
  return t;
}

function frame(opts) {
  const o = opts || {};
  const f = figma.createFrame();
  f.name = o.name || "frame";
  f.layoutMode = o.dir || "VERTICAL";
  if (o.wrap) f.layoutWrap = "WRAP";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  const p = o.pad || 0;
  f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = p;
  f.itemSpacing = o.gap || 0;
  if (o.wrap) f.counterAxisSpacing = o.gap || 0;
  f.cornerRadius = o.radius || 0;
  f.fills = o.fill ? [{ type: "SOLID", color: o.fill }] : [];
  f.strokes = [];
  return f;
}

function card(width, gap) {
  const f = frame({ dir: "VERTICAL", pad: 22, gap: gap == null ? 8 : gap, fill: WHITE, radius: 14, name: "card" });
  f.strokes = [{ type: "SOLID", color: LINE }];
  f.strokeWeight = 1;
  if (width) {
    f.counterAxisSizingMode = "FIXED";
    f.resize(width, f.height);
  }
  return f;
}

function sectionTitle(s) {
  const t = text(s, { size: 20, style: "Bold" });
  t.layoutAlign = "STRETCH";
  return t;
}

async function buildBoard(d) {
  await loadFonts();

  const board = frame({ dir: "VERTICAL", pad: 56, gap: 30, fill: PAPER, name: `Throughline — ${(d.team && d.team.name) || "Team"}` });
  board.counterAxisSizingMode = "FIXED";
  board.resize(1240, board.height);

  // Header
  board.appendChild(text(`Throughline — ${(d.team && d.team.name) || "Team"}`, { size: 34, style: "Bold" }));
  if (d.team && d.team.sector) board.appendChild(text(d.team.sector, { size: 14, color: MUTED, stretch: true }));
  board.appendChild(text(`${(d.team && d.team.source) || ""} · A basis for discussion, not a decision.`, { size: 13, color: MUTED, stretch: true }));

  // Mission
  if (d.mission) {
    const m = card();
    m.layoutAlign = "STRETCH";
    m.appendChild(text("MISSION", { size: 11, style: "Medium", color: ACCENT }));
    m.appendChild(text(`"${d.mission.inferred || ""}"`, { size: 20, style: "Medium", stretch: true, lh: 135 }));
    (d.mission.pillars || []).forEach((p) => m.appendChild(text("• " + p, { size: 13, color: MUTED, stretch: true, lh: 140 })));
    board.appendChild(m);
  }

  // Jobs to be done
  if ((d.roles || []).length) {
    board.appendChild(sectionTitle("Jobs to be done"));
    const rw = frame({ dir: "HORIZONTAL", gap: 16, wrap: true, name: "roles" });
    rw.layoutAlign = "STRETCH";
    rw.primaryAxisSizingMode = "FIXED";
    d.roles.forEach((r) => {
      const c = card(360, 8);
      c.appendChild(text(`${r.title}  ×${r.count}`, { size: 15, style: "Bold", stretch: true, lh: 130 }));
      if (r.summary) c.appendChild(text(r.summary, { size: 12, color: MUTED, stretch: true, lh: 140 }));
      (r.jtbd || []).forEach((j) => c.appendChild(text("› " + j.statement, { size: 12.5, stretch: true, lh: 140 })));
      rw.appendChild(c);
    });
    board.appendChild(rw);
  }

  // AI map
  if ((d.activities || []).length) {
    board.appendChild(sectionTitle("Where AI changes the work"));
    const am = card(null, 14);
    am.layoutAlign = "STRETCH";
    d.activities.forEach((act) => {
      const row = frame({ dir: "VERTICAL", gap: 2 });
      row.layoutAlign = "STRETCH";
      row.appendChild(text(act.name, { size: 14, style: "Medium", stretch: true }));
      const oc = act.outcome || {};
      row.appendChild(text(`${act.currentLabel} → ${act.proposedLabel}   ·   ${oc.value || ""} ${oc.metric || ""}`, { size: 12, color: MUTED, stretch: true }));
      am.appendChild(row);
    });
    board.appendChild(am);
  }

  // Team shape
  if (d.teamShape) {
    board.appendChild(sectionTitle("Team shape"));
    const cols = frame({ dir: "HORIZONTAL", gap: 24, name: "team shape" });
    cols.layoutAlign = "STRETCH";
    cols.primaryAxisSizingMode = "FIXED";

    const today = card(null, 8);
    today.layoutGrow = 1;
    today.appendChild(text("TODAY", { size: 11, style: "Medium", color: MUTED }));
    (d.teamShape.before || []).forEach((b) => today.appendChild(text(`${b.label}  ×${b.count}`, { size: 13, stretch: true })));

    const aft = card(null, 10);
    aft.layoutGrow = 1;
    aft.appendChild(text("AFTER REDESIGN", { size: 11, style: "Medium", color: ACCENT }));
    (d.teamShape.after || []).forEach((x) => {
      aft.appendChild(text(`${x.label}  ×${x.count}  (${x.change})`, { size: 13, style: "Medium", stretch: true }));
      if (x.note) aft.appendChild(text(x.note, { size: 11.5, color: MUTED, stretch: true, lh: 140 }));
    });

    cols.appendChild(today);
    cols.appendChild(aft);
    board.appendChild(cols);
  }

  // Transition
  if (d.transition) {
    board.appendChild(sectionTitle("Transition"));
    if ((d.transition.phases || []).length) {
      const pw = frame({ dir: "HORIZONTAL", gap: 16, wrap: true, name: "phases" });
      pw.layoutAlign = "STRETCH";
      pw.primaryAxisSizingMode = "FIXED";
      d.transition.phases.forEach((p) => {
        const c = card(360, 6);
        c.appendChild(text(`${p.name} — ${p.tag}`, { size: 14, style: "Bold", stretch: true, lh: 130 }));
        if (p.focus) c.appendChild(text(p.focus, { size: 12, color: MUTED, stretch: true, lh: 140 }));
        (p.moves || []).forEach((m) => c.appendChild(text("• " + m, { size: 12, stretch: true, lh: 140 })));
        pw.appendChild(c);
      });
      board.appendChild(pw);
    }
    if ((d.transition.skills || []).length) {
      const sc = card(null, 6);
      sc.layoutAlign = "STRETCH";
      sc.appendChild(text("Skills to acquire", { size: 14, style: "Bold" }));
      d.transition.skills.forEach((s) =>
        sc.appendChild(text(`${s.name}   ·   ${s.type} · ${s.mode} · ${s.forRole}`, { size: 12.5, color: INK, stretch: true, lh: 140 })),
      );
      board.appendChild(sc);
    }
  }

  figma.currentPage.appendChild(board);
  board.x = Math.round(figma.viewport.center.x - board.width / 2);
  board.y = Math.round(figma.viewport.center.y - 200);
  figma.currentPage.selection = [board];
  figma.viewport.scrollAndZoomIntoView([board]);
}

figma.ui.onmessage = async (msg) => {
  if (!msg || msg.type !== "generate") return;
  let data;
  try {
    data = JSON.parse(msg.json);
  } catch (e) {
    figma.ui.postMessage({ type: "error", message: "That doesn't look like valid JSON. Copy again from the Throughline app." });
    return;
  }
  try {
    await buildBoard(data);
    figma.ui.postMessage({ type: "done" });
    figma.notify("Throughline frames created ✓");
  } catch (e) {
    figma.ui.postMessage({ type: "error", message: (e && e.message) || "Could not build frames." });
  }
};
