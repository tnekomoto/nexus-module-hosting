// MemoraModule.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var MODULE_ID = "memora-working-memory";
var MODULE_VERSION = "1.19.2";
var MODULE_CODE = "MEMORA";
var BPR_DOMAIN = "Working Memory";
var STYLE_ID = "pfm-memora-styles";
var BRAND = {
  bg: "#000000",
  surface: "#0F0D08",
  surface2: "#15110A",
  border: "rgba(212, 169, 92, 0.22)",
  borderStrong: "rgba(212, 169, 92, 0.45)",
  gold: "#D4A95C",
  goldLight: "#F2D680",
  goldDark: "#8B6F2F",
  text: "#F5EFE0",
  muted: "#A89881",
  warn: "#E8B855",
  error: "#C44545"
};
var COLORS = [
  { id: 0, label: "Red", base: "#DC2626", glow: "#FCA5A5", freq: 392 },
  { id: 1, label: "Green", base: "#16A34A", glow: "#86EFAC", freq: 523.25 },
  { id: 2, label: "Blue", base: "#2563EB", glow: "#93C5FD", freq: 659.25 },
  { id: 3, label: "Yellow", base: "#FACC15", glow: "#FDE68A", freq: 784 }
];
var LOCKED_SEQUENCES = [
  // Sequence #0
  [0, 2, 3, 1, 3, 0, 2, 0, 1, 3, 1, 2, 3, 2, 0, 1, 3, 2, 2, 3, 0, 1, 2, 3, 0, 3, 1, 0, 1, 2, 1, 0],
  // Sequence #1
  [2, 1, 0, 2, 0, 3, 2, 1, 1, 0, 0, 1, 2, 3, 1, 0, 3, 1, 2, 1, 0, 2, 3, 3, 2, 0, 3, 2, 3, 1, 0, 3],
  // Sequence #2
  [0, 1, 2, 3, 0, 3, 2, 0, 1, 0, 3, 1, 2, 1, 0, 1, 3, 0, 2, 2, 0, 1, 3, 1, 0, 2, 3, 1, 2, 3, 3, 2]
];
var LOCKED_RETEST_SEQUENCES = [
  // Retest Sequence #0
  [2, 1, 3, 1, 1, 0, 3, 2, 1, 0, 0, 1, 3, 2, 1, 0, 2, 2, 3, 3, 0, 2, 3, 0, 2, 0, 3, 2, 1, 1, 3, 0],
  // Retest Sequence #1
  [1, 3, 0, 2, 0, 1, 0, 3, 2, 0, 3, 0, 2, 1, 2, 3, 1, 3, 0, 1, 2, 1, 0, 3, 2, 1, 3, 0, 3, 2, 1, 2],
  // Retest Sequence #2
  [2, 1, 0, 2, 3, 2, 1, 3, 0, 1, 3, 0, 2, 1, 3, 0, 2, 1, 0, 3, 1, 0, 1, 3, 2, 2, 1, 0, 3, 2, 0, 3]
];
var BUILT_IN_RETAKE_SEQUENCES = [
  // Retake Sequence #0
  [3, 2, 0, 2, 3, 0, 3, 2, 0, 2, 1, 2, 0, 3, 1, 0, 2, 1, 3, 1, 1, 0, 3, 2, 0, 1, 0, 3, 1, 2, 1, 3],
  // Retake Sequence #1
  [2, 3, 0, 1, 3, 2, 0, 1, 1, 2, 3, 1, 1, 0, 3, 2, 1, 3, 0, 2, 0, 3, 2, 1, 0, 3, 2, 0, 3, 1, 2, 0],
  // Retake Sequence #2
  [3, 1, 0, 2, 2, 3, 1, 0, 3, 2, 0, 1, 3, 0, 2, 0, 1, 2, 1, 3, 0, 3, 2, 0, 1, 3, 1, 2, 0, 3, 1, 2],
  // Retake Sequence #3
  [2, 0, 3, 1, 1, 3, 0, 3, 1, 0, 3, 1, 2, 3, 0, 2, 1, 3, 0, 2, 1, 2, 0, 2, 3, 0, 1, 2, 3, 0, 1, 2],
  // Retake Sequence #4
  [1, 2, 0, 3, 2, 1, 2, 0, 3, 3, 1, 2, 1, 0, 3, 1, 2, 1, 3, 0, 2, 2, 0, 1, 3, 1, 0, 3, 0, 2, 3, 0],
  // Retake Sequence #5
  [3, 1, 2, 1, 0, 3, 1, 2, 3, 2, 0, 1, 3, 0, 2, 2, 3, 2, 1, 3, 0, 3, 1, 0, 1, 2, 0, 1, 0, 2, 3, 0],
  // Retake Sequence #6
  [1, 0, 3, 0, 1, 3, 2, 0, 2, 1, 3, 1, 0, 2, 1, 3, 2, 1, 0, 3, 2, 0, 3, 2, 3, 1, 0, 2, 3, 1, 0, 2],
  // Retake Sequence #7
  [1, 0, 2, 3, 0, 2, 2, 1, 2, 0, 3, 1, 0, 2, 1, 3, 0, 1, 3, 0, 2, 1, 2, 3, 0, 3, 1, 0, 2, 3, 1, 3],
  // Retake Sequence #8
  [1, 0, 2, 0, 1, 2, 3, 0, 2, 1, 0, 3, 3, 1, 3, 0, 2, 3, 2, 1, 1, 3, 0, 2, 3, 0, 1, 3, 2, 0, 1, 2]
];
var DEV_EXPOSE_GENERATOR = false;
function generateCandidateSequence(length = 32) {
  const seq = [];
  while (seq.length < length) {
    const last = seq[seq.length - 1];
    const second = seq[seq.length - 2];
    const third = seq[seq.length - 3];
    let options = [0, 1, 2, 3];
    if (last !== void 0 && last === second) {
      options = options.filter((id) => id !== last);
    }
    if (third !== void 0 && third === last && second !== last) {
      options = options.filter((id) => id !== second);
    }
    if (options.length === 0) options = [0, 1, 2, 3];
    const weights = options.map((id) => {
      for (let i = 1; i <= 4 && i <= seq.length; i++) {
        if (seq[seq.length - i] === id) return 0.15 + 0.2 * (i - 1);
      }
      return 1;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosen = options[0];
    for (let i = 0; i < options.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = options[i];
        break;
      }
    }
    seq.push(chosen);
  }
  return seq;
}
function generateCandidateSet(count = 3, length = 32) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const seq = generateCandidateSequence(length);
    out.push(seq);
    if (typeof console !== "undefined") {
      console.log(`Candidate #${i}:`, JSON.stringify(seq));
    }
  }
  return out;
}
function generateBalancedSet(count = 3, length = 32, samples = 2e3) {
  const pool = [];
  for (let k = 0; k < samples; k++) {
    const s = generateCandidateSequence(length);
    const counts = [0, 0, 0, 0];
    s.forEach((id) => counts[id]++);
    const mean = length / 4;
    const variance = counts.reduce((a, c) => a + (c - mean) * (c - mean), 0);
    pool.push({ s, variance });
  }
  pool.sort((a, b) => a.variance - b.variance);
  const picked = pool.slice(0, count).map((p) => p.s);
  if (typeof console !== "undefined") {
    picked.forEach((s, i) => console.log(`Balanced #${i}:`, JSON.stringify(s)));
  }
  return picked;
}
if (DEV_EXPOSE_GENERATOR && typeof window !== "undefined") {
  window.__memoraGenerateCandidates = generateCandidateSet;
  window.__memoraGenerateCandidate = generateCandidateSequence;
  window.__memoraGenerateBalancedSet = generateBalancedSet;
}
var CSS = `
.pfm-memora-root {
  position: relative;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: 28px 20px;
  background: radial-gradient(ellipse at top, #1a1610 0%, ${BRAND.bg} 65%);
  color: ${BRAND.text};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: background 180ms ease;
}
.pfm-memora-root[data-wrong="true"] {
  background: radial-gradient(ellipse at top, #7B1A1A 0%, #2a0606 65%);
}
@keyframes pfm-memora-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-10px); }
  30% { transform: translateX(10px); }
  45% { transform: translateX(-7px); }
  60% { transform: translateX(7px); }
  75% { transform: translateX(-4px); }
}
.pfm-memora-card[data-shake="true"] {
  animation: pfm-memora-shake 350ms ease-in-out;
}
@keyframes pfm-memora-error-pop {
  0%   { opacity: 0; transform: translateY(-6px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0)    scale(1); }
}
.pfm-memora-error-banner {
  margin-top: 18px; padding: 16px 20px; border-radius: 14px;
  background: rgba(220, 38, 38, 0.22);
  border: 2px solid rgba(248, 113, 113, 0.55);
  color: #FECACA; font-size: 18px; font-weight: 700;
  letter-spacing: 0.03em; text-align: center; line-height: 1.4;
  animation: pfm-memora-error-pop 280ms ease-out;
  text-shadow: 0 0 14px rgba(220, 38, 38, 0.45);
}
.pfm-memora-root *, .pfm-memora-root *::before, .pfm-memora-root *::after { box-sizing: border-box; }

.pfm-memora-card {
  max-width: 1080px;
  margin: 0 auto;
  background: linear-gradient(180deg, ${BRAND.surface} 0%, ${BRAND.surface2} 100%);
  border: 1px solid ${BRAND.border};
  border-radius: 22px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(212, 169, 92, 0.08);
  padding: 32px;
}

.pfm-memora-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 36px;
  align-items: start;
}
@media (max-width: 820px) {
  .pfm-memora-grid { grid-template-columns: 1fr; gap: 24px; }
  .pfm-memora-card { padding: 24px; }
}

.pfm-memora-eyebrow {
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: ${BRAND.gold};
  font-weight: 600;
  margin: 0;
}
.pfm-memora-title {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
  margin: 8px 0 10px;
  background: linear-gradient(135deg, ${BRAND.goldLight} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.pfm-memora-subtitle {
  color: ${BRAND.muted};
  font-size: 14px;
  line-height: 1.55;
  margin: 0 0 20px;
  max-width: 46ch;
}

.pfm-memora-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 460px;
  margin-top: 24px;
}
.pfm-memora-btn {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${BRAND.text};
  background: var(--btn-base);
  cursor: pointer;
  font-family: inherit;
  transition: transform 90ms ease, filter 90ms ease, box-shadow 120ms ease, background 90ms ease;
  outline: none;
}
.pfm-memora-btn:focus-visible {
  box-shadow: 0 0 0 2px ${BRAND.gold};
}
.pfm-memora-btn[data-armed="true"] {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.18) inset, 0 8px 18px rgba(0,0,0,0.35);
}
.pfm-memora-btn[data-armed="false"] { opacity: 0.85; }
.pfm-memora-btn[data-active="true"] {
  background: var(--btn-glow);
  filter: brightness(1.15) saturate(1.1);
  box-shadow: 0 0 32px var(--btn-glow), 0 0 8px rgba(255,255,255,0.4) inset;
  transform: scale(1.02);
}
.pfm-memora-btn[data-armed="true"]:not([data-active="true"]):active { transform: scale(0.96); }

.pfm-memora-aside { display: flex; flex-direction: column; gap: 14px; }

.pfm-memora-panel {
  background: rgba(11, 9, 5, 0.55);
  border: 1px solid ${BRAND.border};
  border-radius: 16px;
  padding: 16px 18px;
}
.pfm-memora-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pfm-memora-label {
  font-size: 10.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: ${BRAND.muted};
  margin: 0 0 4px;
}
.pfm-memora-status-msg {
  font-size: 16px; font-weight: 600; margin: 0; color: ${BRAND.text};
}
.pfm-memora-status-msg[data-wrong="true"] { color: #F2A6A6; }
.pfm-memora-trial-counter {
  font-size: 24px; font-weight: 800; color: ${BRAND.goldLight}; margin: 0;
  font-variant-numeric: tabular-nums;
}

.pfm-memora-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pfm-memora-stat-value {
  font-size: 26px; font-weight: 800; margin: 2px 0 0; color: ${BRAND.text};
  font-variant-numeric: tabular-nums;
}
.pfm-memora-stat-value-sm { font-size: 18px; font-weight: 700; margin: 2px 0 0; color: ${BRAND.text}; }

.pfm-memora-trials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.pfm-memora-trial {
  background: rgba(0,0,0,0.45);
  border: 1px solid ${BRAND.border};
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
}
.pfm-memora-trial-num { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${BRAND.muted}; }
.pfm-memora-trial-score { font-size: 22px; font-weight: 800; color: ${BRAND.text}; margin-top: 4px; font-variant-numeric: tabular-nums; }

.pfm-memora-summary {
  background: rgba(0,0,0,0.5);
  border: 1px solid ${BRAND.border};
  border-radius: 12px;
  padding: 14px;
  font-size: 14px;
  line-height: 1.7;
}
.pfm-memora-summary span { color: ${BRAND.muted}; }

.pfm-memora-retest {
  margin-top: 14px;
  border: 1px solid rgba(232, 184, 85, 0.45);
  background: rgba(232, 184, 85, 0.08);
  border-radius: 12px;
  padding: 14px;
}
.pfm-memora-retest p { margin: 0 0 10px; color: #F2DBA0; font-size: 13.5px; line-height: 1.5; }

.pfm-memora-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.pfm-memora-btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 11px 22px; border-radius: 12px; border: none;
  font-family: inherit; font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
  cursor: pointer;
  background: linear-gradient(135deg, ${BRAND.goldLight} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);
  color: #1A1308;
  box-shadow: 0 6px 18px rgba(212, 169, 92, 0.28);
  transition: filter 100ms ease, transform 80ms ease, box-shadow 120ms ease;
}
.pfm-memora-btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
.pfm-memora-btn-primary:active:not(:disabled) { transform: translateY(1px); }
.pfm-memora-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

.pfm-memora-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 11px 20px; border-radius: 12px;
  font-family: inherit; font-size: 14px; font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: ${BRAND.gold};
  border: 1px solid ${BRAND.borderStrong};
  transition: background 100ms ease;
}
.pfm-memora-btn-secondary:hover { background: rgba(212, 169, 92, 0.08); }

.pfm-memora-foot {
  font-size: 11.5px; line-height: 1.55; color: ${BRAND.muted};
  margin: 12px 0 0; max-width: 52ch;
}
.pfm-memora-tm { font-size: 0.6em; vertical-align: super; opacity: 0.8; }

.pfm-memora-exit {
  /* Shifted left to make room for the always-visible version chip in the
     top-right corner. When onExit isn't supplied, the chip sits alone. */
  position: absolute;
  top: 18px; right: 110px;
  background: transparent;
  border: 1px solid ${BRAND.border};
  color: ${BRAND.muted};
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: color 100ms ease, border-color 100ms ease;
}
.pfm-memora-exit:hover { color: ${BRAND.gold}; border-color: ${BRAND.borderStrong}; }

/* ---- Always-visible version chip (top-right corner of every screen) ---- */
.pfm-memora-version-chip {
  position: absolute; top: 18px; right: 22px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em;
  color: ${BRAND.goldLight};
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid ${BRAND.borderStrong};
  border-radius: 999px; padding: 4px 11px;
  user-select: none;
  pointer-events: none;
}

/* ---- Results page ---- */
.pfm-memora-results-meta {
  display: flex; flex-wrap: wrap; gap: 18px;
  color: ${BRAND.muted}; font-size: 13px; margin: 4px 0 18px;
}
.pfm-memora-results-meta b { color: ${BRAND.gold}; font-weight: 600; }
.pfm-memora-summary-row {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0 22px;
}
.pfm-memora-summary-stat {
  background: rgba(11,9,5,0.55); border: 1px solid ${BRAND.border};
  border-radius: 14px; padding: 16px 18px; text-align: center;
}
.pfm-memora-summary-stat-label {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.muted};
}
.pfm-memora-summary-stat-value {
  font-size: 32px; font-weight: 800; color: ${BRAND.text};
  margin-top: 6px; font-variant-numeric: tabular-nums;
}
.pfm-memora-trial-card {
  background: rgba(11,9,5,0.6); border: 1px solid ${BRAND.border};
  border-radius: 16px; padding: 16px 20px; margin-top: 14px;
}
.pfm-memora-trial-card-retest {
  border-color: rgba(232, 184, 85, 0.45);
  background: rgba(232, 184, 85, 0.06);
}
.pfm-memora-trial-header {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 10px; margin-bottom: 12px; padding-bottom: 10px;
  border-bottom: 1px solid rgba(212, 169, 92, 0.12);
}
.pfm-memora-trial-header h3 {
  margin: 0; font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;
  color: ${BRAND.gold}; font-weight: 700;
}
.pfm-memora-trial-stats {
  display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: #C9BBA0;
}
.pfm-memora-trial-stats b { color: ${BRAND.muted}; font-weight: 500; margin-right: 4px; }
.pfm-memora-rounds { display: flex; flex-direction: column; gap: 4px; }
.pfm-memora-round-row {
  display: grid; grid-template-columns: 76px 22px 70px 1fr; gap: 10px; align-items: center;
  padding: 6px 8px; border-radius: 8px; font-size: 12.5px; color: #C9BBA0;
}
.pfm-memora-round-row[data-failed="true"] { background: rgba(220, 38, 38, 0.10); color: #F2A6A6; }
.pfm-memora-round-status { font-weight: 700; color: #4ADE80; text-align: center; font-size: 14px; }
.pfm-memora-round-row[data-failed="true"] .pfm-memora-round-status { color: #FCA5A5; }
.pfm-memora-round-time { font-variant-numeric: tabular-nums; font-size: 12px; opacity: 0.85; }
.pfm-memora-round-presses { display: flex; flex-wrap: wrap; gap: 4px; }
.pfm-memora-press-dot {
  display: inline-block; width: 12px; height: 12px; border-radius: 999px;
  box-shadow: 0 0 4px rgba(0,0,0,0.4);
}
.pfm-memora-press-dot[data-correct="false"] { outline: 2px solid #FCA5A5; outline-offset: 1px; }

/* ---- Storage panel (results page) ---- */
/* ---- Auto-save banner (results page, sits above the trial cards) ---- */
.pfm-memora-autosave {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 14px;
  margin: 14px 0 22px;
  padding: 16px 20px;
  border-radius: 14px;
  border: 1.5px solid;
  background: rgba(11, 9, 5, 0.55);
}
.pfm-memora-autosave[data-state="saved"]   { border-color: rgba(74, 222, 128, 0.55); background: rgba(74, 222, 128, 0.08); }
.pfm-memora-autosave[data-state="saving"]  { border-color: rgba(212, 169, 92, 0.55); background: rgba(212, 169, 92, 0.10); }
.pfm-memora-autosave[data-state="error"]   { border-color: rgba(248, 113, 113, 0.55); background: rgba(220, 38, 38, 0.10); }
.pfm-memora-autosave[data-state="warn"]    { border-color: rgba(232, 184, 85, 0.55); background: rgba(232, 184, 85, 0.08); }
.pfm-memora-autosave[data-state="pending"]    { border-color: rgba(212, 169, 92, 0.40); background: rgba(212, 169, 92, 0.06); }
.pfm-memora-autosave[data-state="permission"] { border-color: rgba(232, 184, 85, 0.60); background: rgba(232, 184, 85, 0.10); }
.pfm-memora-autosave-icon {
  font-size: 26px; line-height: 1; flex-shrink: 0; padding-top: 2px;
}
.pfm-memora-autosave[data-state="saved"]   .pfm-memora-autosave-icon { color: #86EFAC; }
.pfm-memora-autosave[data-state="saving"]  .pfm-memora-autosave-icon { color: ${BRAND.goldLight}; }
.pfm-memora-autosave[data-state="error"]   .pfm-memora-autosave-icon { color: #FCA5A5; }
.pfm-memora-autosave[data-state="warn"]    .pfm-memora-autosave-icon { color: ${BRAND.goldLight}; }
.pfm-memora-autosave[data-state="pending"]    .pfm-memora-autosave-icon { color: ${BRAND.goldLight}; }
.pfm-memora-autosave[data-state="permission"] .pfm-memora-autosave-icon { color: ${BRAND.goldLight}; }
.pfm-memora-autosave-body { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.pfm-memora-autosave-title {
  font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700;
}
.pfm-memora-autosave[data-state="saved"]   .pfm-memora-autosave-title { color: #86EFAC; }
.pfm-memora-autosave[data-state="saving"]  .pfm-memora-autosave-title { color: ${BRAND.goldLight}; }
.pfm-memora-autosave[data-state="error"]   .pfm-memora-autosave-title { color: #FCA5A5; }
.pfm-memora-autosave[data-state="warn"]    .pfm-memora-autosave-title { color: ${BRAND.goldLight}; }
.pfm-memora-autosave[data-state="pending"]    .pfm-memora-autosave-title { color: ${BRAND.goldLight}; }
.pfm-memora-autosave[data-state="permission"] .pfm-memora-autosave-title { color: ${BRAND.goldLight}; }
.pfm-memora-autosave-rows {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 14px; row-gap: 4px;
  font-size: 13px;
  margin-top: 2px;
}
.pfm-memora-autosave-label {
  font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${BRAND.muted}; font-weight: 600; align-self: center;
}
.pfm-memora-autosave-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px; color: ${BRAND.text}; word-break: break-all;
}
.pfm-memora-autosave-message {
  font-size: 13.5px; line-height: 1.5; color: ${BRAND.text};
}
.pfm-memora-autosave-actions {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;
}
.pfm-memora-autosave-actions button {
  font-size: 12.5px; padding: 7px 14px;
}
.pfm-memora-autosave-note {
  font-size: 11.5px; color: ${BRAND.muted}; line-height: 1.45;
}
.pfm-memora-autosave-migrated {
  color: ${BRAND.goldLight};
  background: rgba(212, 169, 92, 0.1);
  border: 1px solid rgba(212, 169, 92, 0.4);
  border-radius: 8px; padding: 8px 12px; margin-top: 6px;
}
.pfm-memora-autosave-migrated code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 4px; font-size: 11.5px;
}

.pfm-memora-storage {
  background: rgba(11,9,5,0.55);
  border: 1px solid ${BRAND.border};
  border-radius: 16px;
  padding: 14px 18px;
  margin-top: 18px;
}
.pfm-memora-storage-header {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.muted}; margin-bottom: 8px;
}
.pfm-memora-storage-row {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 10px; font-size: 13.5px; color: #C9BBA0;
}
.pfm-memora-storage-row b { color: ${BRAND.text}; font-weight: 600; }
.pfm-memora-storage-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.pfm-memora-storage-warn  { margin-top: 10px; font-size: 12.5px; color: #F2DBA0; }
.pfm-memora-storage-ok    { margin-top: 10px; font-size: 12.5px; color: #86EFAC; word-break: break-all; }
.pfm-memora-storage-error { margin-top: 10px; font-size: 12.5px; color: #FCA5A5; }
.pfm-memora-storage-note  { margin-top: 6px;  font-size: 11.5px; color: ${BRAND.muted}; opacity: 0.85; }

/* ---- Prep screen (candidate ID confirmation) ---- */
.pfm-memora-prep-row {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 14px; align-items: center;
}
.pfm-memora-prep-input {
  flex: 1 1 220px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: rgba(11, 9, 5, 0.6);
  border: 1px solid ${BRAND.border};
  border-radius: 12px;
  color: ${BRAND.text};
  outline: none;
  transition: border-color 100ms ease, box-shadow 100ms ease;
}
.pfm-memora-prep-input:focus {
  border-color: ${BRAND.gold};
  box-shadow: 0 0 0 3px rgba(212, 169, 92, 0.18);
}
.pfm-memora-prep-input::placeholder {
  color: ${BRAND.muted};
  opacity: 0.65;
  font-weight: 400;
  letter-spacing: 0.04em;
}
.pfm-memora-prep-storage {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid ${BRAND.border};
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: ${BRAND.muted};
}
.pfm-memora-prep-storage b { color: ${BRAND.text}; font-weight: 600; }

/* ---- Admin-call banner (results page top) ---- */
.pfm-memora-admin-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 14px 0 22px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(212, 169, 92, 0.18), rgba(212, 169, 92, 0.08));
  border: 1.5px solid rgba(212, 169, 92, 0.55);
  border-radius: 14px;
  box-shadow: 0 0 24px rgba(212, 169, 92, 0.12), inset 0 1px 0 rgba(255,255,255,0.04);
  animation: pfm-memora-admin-pulse 2.8s ease-in-out infinite;
}
@keyframes pfm-memora-admin-pulse {
  0%, 100% { box-shadow: 0 0 24px rgba(212, 169, 92, 0.12), inset 0 1px 0 rgba(255,255,255,0.04); }
  50%      { box-shadow: 0 0 38px rgba(212, 169, 92, 0.32), inset 0 1px 0 rgba(255,255,255,0.06); }
}
.pfm-memora-admin-banner-icon {
  font-size: 28px; color: ${BRAND.goldLight}; flex-shrink: 0; line-height: 1;
}
.pfm-memora-admin-banner-text { flex: 1; }
.pfm-memora-admin-banner-title {
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.goldLight}; margin-bottom: 4px;
}
.pfm-memora-admin-banner-body {
  font-size: 15px; line-height: 1.45; color: ${BRAND.text}; font-weight: 500;
}

/* ---- File-name preview cards (prep screen) ---- */
.pfm-memora-files-header {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.gold}; font-weight: 700; margin: 22px 0 10px;
}
.pfm-memora-files-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
}
@media (max-width: 600px) {
  .pfm-memora-files-grid { grid-template-columns: 1fr; }
}
.pfm-memora-file-card {
  background: rgba(11, 9, 5, 0.55);
  border: 1px solid ${BRAND.border};
  border-radius: 14px; padding: 14px 16px;
}
.pfm-memora-file-kind {
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.muted}; font-weight: 700; margin-bottom: 6px;
}
.pfm-memora-file-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px; color: ${BRAND.goldLight};
  word-break: break-all; line-height: 1.4; display: block;
}
.pfm-memora-file-name[data-placeholder="true"] {
  color: ${BRAND.muted}; font-style: italic;
}
.pfm-memora-file-note {
  font-size: 11.5px; color: ${BRAND.muted}; margin-top: 8px; line-height: 1.45;
}

/* ---- Setup screen (one-time folder picker landing) ---- */
.pfm-memora-setup-list {
  margin: 20px 0;
  padding-left: 22px;
  color: ${BRAND.text};
  font-size: 14px;
  line-height: 1.6;
}
.pfm-memora-setup-list li { margin-bottom: 10px; }
.pfm-memora-setup-list b { color: ${BRAND.goldLight}; font-weight: 600; }
.pfm-memora-setup-code {
  display: inline-block;
  background: rgba(0,0,0,0.55);
  border: 1px solid ${BRAND.border};
  border-radius: 6px;
  padding: 1px 7px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: ${BRAND.goldLight};
}
.pfm-memora-setup-actions {
  display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px;
}
.pfm-memora-setup-note {
  font-size: 12.5px; color: ${BRAND.muted}; margin-top: 14px; line-height: 1.5;
}
.pfm-memora-setup-note-warn {
  color: #F2A6A6;
  border: 1px solid rgba(248, 113, 113, 0.4);
  background: rgba(220, 38, 38, 0.08);
  border-radius: 10px; padding: 10px 14px;
}

/* ---- End-of-day dedupe panel (Setup screen) ---- */
.pfm-memora-dedupe {
  margin-top: 20px; padding: 16px 18px; border-radius: 14px;
  background: rgba(11,9,5,0.55); border: 1px solid ${BRAND.border};
}
.pfm-memora-dedupe-header {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.gold}; font-weight: 700; margin-bottom: 8px;
}
.pfm-memora-dedupe-body {
  font-size: 13px; line-height: 1.55; color: ${BRAND.text}; margin: 0 0 12px;
}
.pfm-memora-dedupe-row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.pfm-memora-dedupe-label {
  font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${BRAND.muted}; font-weight: 600;
}
.pfm-memora-dedupe-date {
  background: rgba(0,0,0,0.5); color: ${BRAND.text};
  border: 1px solid ${BRAND.border}; border-radius: 8px;
  padding: 6px 10px; font-family: inherit; font-size: 13px;
  color-scheme: dark;
}
.pfm-memora-dedupe-result {
  margin-top: 12px; padding: 10px 14px; border-radius: 10px;
  font-size: 13px; line-height: 1.5;
}
.pfm-memora-dedupe-result[data-state="ok"] {
  color: #86EFAC; border: 1px solid rgba(74, 222, 128, 0.4); background: rgba(74, 222, 128, 0.08);
}
.pfm-memora-dedupe-result[data-state="error"] {
  color: #FCA5A5; border: 1px solid rgba(248, 113, 113, 0.4); background: rgba(220, 38, 38, 0.08);
}
.pfm-memora-dedupe-result code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(0,0,0,0.35); padding: 1px 6px; border-radius: 4px;
}
.pfm-memora-dedupe-preview {
  margin-top: 14px; padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(248, 113, 113, 0.5);
  background: rgba(220, 38, 38, 0.06);
}
.pfm-memora-dedupe-preview-title {
  font-size: 14px; color: ${BRAND.text}; margin-bottom: 4px;
}
.pfm-memora-dedupe-preview-title code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(0,0,0,0.45); padding: 1px 6px; border-radius: 4px; font-size: 12.5px;
}
.pfm-memora-dedupe-preview-counts {
  font-size: 12.5px; color: ${BRAND.muted}; margin-bottom: 10px;
}
.pfm-memora-dedupe-preview-list-header {
  font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${BRAND.muted}; font-weight: 600; margin-bottom: 6px;
}
.pfm-memora-dedupe-preview-list {
  display: flex; flex-direction: column; gap: 4px;
  max-height: 200px; overflow-y: auto;
  padding-right: 4px;
}
.pfm-memora-dedupe-preview-row {
  display: grid; grid-template-columns: minmax(80px, max-content) 1fr max-content;
  gap: 12px; align-items: center;
  padding: 6px 10px;
  background: rgba(0,0,0,0.35); border-radius: 8px;
  font-size: 12px;
}
.pfm-memora-dedupe-preview-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: ${BRAND.goldLight}; font-weight: 700;
}
.pfm-memora-dedupe-preview-session {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: ${BRAND.muted}; font-size: 11px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pfm-memora-dedupe-preview-span {
  color: ${BRAND.text}; font-size: 12px;
}
.pfm-memora-dedupe-actions {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
}

/* ---- Sequence Bank panel (Setup screen) ---- */
.pfm-memora-bank {
  margin-top: 16px; padding: 16px 18px; border-radius: 14px;
  background: rgba(11,9,5,0.55); border: 1px solid ${BRAND.border};
}
.pfm-memora-bank-header {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.gold}; font-weight: 700; margin-bottom: 10px;
}
.pfm-memora-bank-active {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 13px; margin-bottom: 10px; color: ${BRAND.text};
}
.pfm-memora-bank-active-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(0,0,0,0.45); padding: 2px 8px; border-radius: 6px;
  color: ${BRAND.goldLight}; font-size: 12.5px;
}
.pfm-memora-bank-active-tag {
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 999px; font-weight: 700;
  background: rgba(212, 169, 92, 0.16); color: ${BRAND.goldLight};
  border: 1px solid rgba(212, 169, 92, 0.4);
}
.pfm-memora-bank-active-tag--custom {
  background: rgba(74, 222, 128, 0.14); color: #86EFAC;
  border-color: rgba(74, 222, 128, 0.45);
}
.pfm-memora-bank-body {
  font-size: 13px; line-height: 1.55; color: ${BRAND.text}; margin: 0 0 12px;
}
.pfm-memora-bank-actions {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
}
.pfm-memora-bank-import {
  margin-top: 6px; display: flex; flex-direction: column; gap: 6px;
}
.pfm-memora-bank-import-label {
  font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${BRAND.muted}; font-weight: 600;
}
.pfm-memora-bank-import-area {
  width: 100%; box-sizing: border-box;
  background: rgba(0,0,0,0.5); color: ${BRAND.text};
  border: 1px solid ${BRAND.border}; border-radius: 8px;
  padding: 8px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px; line-height: 1.4; resize: vertical; min-height: 88px;
}
.pfm-memora-bank-import-actions {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
}
.pfm-memora-bank-result {
  margin-top: 8px; padding: 8px 12px; border-radius: 8px;
  font-size: 12.5px; line-height: 1.45;
}
.pfm-memora-bank-result[data-state="error"] {
  color: #FCA5A5; border: 1px solid rgba(248, 113, 113, 0.4);
  background: rgba(220, 38, 38, 0.08);
}
.pfm-memora-bank-preview {
  margin-top: 14px; padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(212, 169, 92, 0.55);
  background: rgba(212, 169, 92, 0.08);
}
.pfm-memora-bank-preview-title {
  font-size: 14px; color: ${BRAND.text}; margin-bottom: 10px;
}
.pfm-memora-bank-preview-title code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: rgba(0,0,0,0.45); padding: 2px 8px; border-radius: 6px;
  color: ${BRAND.goldLight}; font-size: 12.5px;
}
.pfm-memora-bank-preview-rows {
  display: grid; grid-template-columns: max-content 1fr;
  column-gap: 14px; row-gap: 4px;
  margin-bottom: 10px;
}
.pfm-memora-bank-preview-label {
  font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: ${BRAND.muted}; font-weight: 600; align-self: center;
}
.pfm-memora-bank-preview-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px; color: ${BRAND.text}; word-break: break-all;
}
.pfm-memora-bank-preview-note {
  font-size: 11.5px; color: ${BRAND.muted}; line-height: 1.5; margin: 6px 0 12px;
}

/* ---- Audio test panel (prep screen) ---- */
.pfm-memora-audio-test {
  margin-top: 18px; padding: 14px 16px; border-radius: 14px;
  background: rgba(11,9,5,0.55); border: 1px solid ${BRAND.border};
  display: flex; flex-direction: column; gap: 10px;
}
.pfm-memora-audio-test-header {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.gold}; font-weight: 700;
}
.pfm-memora-audio-test-body {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
}
.pfm-memora-audio-test-dots { display: flex; gap: 10px; flex-shrink: 0; }
.pfm-memora-audio-test-dot {
  display: inline-block; width: 16px; height: 16px; border-radius: 999px;
  background: var(--dot-base); opacity: 0.6;
  transition: opacity 110ms ease, transform 110ms ease, box-shadow 110ms ease, background 110ms ease;
}
.pfm-memora-audio-test-dot[data-active="true"] {
  opacity: 1; transform: scale(1.35);
  background: var(--dot-glow);
  box-shadow: 0 0 16px var(--dot-glow);
}
.pfm-memora-audio-test-status {
  font-size: 12.5px; color: ${BRAND.muted}; line-height: 1.4; flex: 1;
}
.pfm-memora-audio-test-status[data-state="ok"]    { color: #86EFAC; }
.pfm-memora-audio-test-status[data-state="error"] { color: #F2A6A6; }
`;
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
function speedForLength(length) {
  if (length >= 27) return { on: 230, gap: 105, label: "Level 6" };
  if (length >= 22) return { on: 280, gap: 130, label: "Level 5" };
  if (length >= 17) return { on: 340, gap: 160, label: "Level 4" };
  if (length >= 12) return { on: 420, gap: 190, label: "Level 3" };
  if (length >= 7) return { on: 520, gap: 230, label: "Level 2" };
  return { on: 650, gap: 280, label: "Level 1" };
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function isSignificantOutlier(values) {
  if (values.length < 3) return false;
  const sorted = [...values].sort((a, b) => a - b);
  const [low, mid, high] = sorted;
  const lowIsBelowExpectedAverage = low < 7;
  const otherTwoAreHigher = mid >= 10 && high >= 10;
  const lowIsFarFromCloserScore = mid - low >= 5;
  return lowIsBelowExpectedAverage && otherTwoAreHigher && lowIsFarFromCloserScore;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function suggestNextCandidateCode(prev) {
  if (!prev) return "";
  const m = String(prev).match(/^(.*?)(\d+)$/);
  if (!m) return prev;
  const prefix = m[1];
  const width = m[2].length;
  const num = parseInt(m[2], 10) + 1;
  return prefix + String(num).padStart(width, "0");
}
function makeSessionId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `mem_${Date.now()}_${rand}`;
}
function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}
function toSec(ms) {
  if (ms == null || isNaN(ms)) return null;
  return Math.round(ms / 100) / 10;
}
function summaryFilenameFor(dateStr) {
  return `memora_${dateStr}.csv`;
}
var SUMMARY_HEADER_COLS = [
  "date",
  "candidate_id",
  "session_id",
  "module_version",
  "attempt",
  "set_id",
  "trial_1_sequence_id",
  "trial_1_score",
  "trial_2_sequence_id",
  "trial_2_score",
  "trial_3_sequence_id",
  "trial_3_score",
  "retest_used",
  "retest_sequence_id",
  "retest_score",
  "best_span",
  "median_span",
  "mean_span",
  "mean_reaction_sec",
  "median_reaction_sec",
  "session_duration_sec",
  "outcome"
];
var DETAIL_HEADER_COLS = [
  "attempt",
  "set_id",
  "trial",
  "is_retest",
  "sequence_id",
  "sequence_pool",
  "round_length",
  "round_completed",
  "round_response_time_sec",
  "position",
  "expected",
  "pressed",
  "correct",
  "dt_sec"
];
function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvRow(values) {
  return values.map(csvEscape).join(",") + "\n";
}
function csvHeader(cols) {
  return cols.join(",") + "\n";
}
function sanitizeFilenameSegment(s) {
  return String(s ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}
function buildSummaryRows({ candidateId, sessionId, moduleVersion, trials, retest, dateStr, summaryMetrics, rawOutput }) {
  const t1 = trials[0] || {};
  const t2 = trials[1] || {};
  const t3 = trials[2] || {};
  return csvRow([
    dateStr,
    candidateId ?? "",
    sessionId ?? "",
    moduleVersion,
    rawOutput?.attempt ?? "original",
    rawOutput?.set_id ?? "",
    t1.sequenceId ?? "",
    t1.score ?? "",
    t2.sequenceId ?? "",
    t2.score ?? "",
    t3.sequenceId ?? "",
    t3.score ?? "",
    retest ? "true" : "false",
    retest ? retest.sequenceId : "",
    retest ? retest.score : "",
    rawOutput?.bestSpan ?? "",
    rawOutput?.medianSpan ?? "",
    rawOutput?.meanSpan ?? "",
    rawOutput?.meanReactionSec ?? "",
    rawOutput?.medianReactionSec ?? "",
    rawOutput?.sessionDurationSec ?? "",
    summaryMetrics?.outcome ?? ""
  ]);
}
function buildDetailCsv({ trials, retest, attempt, setId }) {
  const allTrials = [...trials];
  if (retest) allTrials.push(retest);
  const isRetake = typeof attempt === "string" && attempt.startsWith("retake");
  let body = "";
  for (const t of allTrials) {
    const pool = t.isRetest ? "retest" : isRetake ? "retake" : "primary";
    for (const r of t.rounds) {
      for (const p of r.presses) {
        body += csvRow([
          attempt ?? "original",
          setId ?? "",
          t.isRetest ? "retest" : t.trialNumber,
          t.isRetest ? "true" : "false",
          t.sequenceId,
          pool,
          r.length,
          r.completed ? "true" : "false",
          r.responseTimeSec,
          p.position,
          p.expected,
          p.id,
          p.correct ? "true" : "false",
          p.dtSec
        ]);
      }
    }
  }
  return csvHeader(DETAIL_HEADER_COLS) + body;
}
function detailFilenameFor(candidateLabel, dateStr) {
  return `memora_${sanitizeFilenameSegment(candidateLabel)}_${dateStr}.csv`;
}
var IDB_NAME = "pfm-memora-store";
var IDB_STORE = "kv";
var IDB_KEY_FOLDER = "folderHandle";
var IDB_KEY_SEQUENCE_SET = "sequenceSet";
var SEQUENCE_SET_SCHEMA_VERSION = 1;
function makeBuiltInSet() {
  return {
    schemaVersion: SEQUENCE_SET_SCHEMA_VERSION,
    setId: `builtin-v${MODULE_VERSION}`,
    setLabel: `Built-in (v${MODULE_VERSION})`,
    isBuiltIn: true,
    createdAt: null,
    primaries: LOCKED_SEQUENCES,
    retests: LOCKED_RETEST_SEQUENCES,
    retakes: BUILT_IN_RETAKE_SEQUENCES
  };
}
function makeSetId() {
  const d = /* @__PURE__ */ new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8);
  return `set-${ymd}-${rand}`;
}
function generateNewSequenceSet({ length = 32 } = {}) {
  const setId = makeSetId();
  const primaries = generateBalancedSet(3, length, 2e3);
  const retests = generateBalancedSet(3, length, 2e3);
  const retakes = generateBalancedSet(9, length, 3e3);
  const ymd = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return {
    schemaVersion: SEQUENCE_SET_SCHEMA_VERSION,
    setId,
    setLabel: `Generated ${ymd} (${setId.slice(-6)})`,
    isBuiltIn: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    primaries,
    retests,
    retakes
  };
}
function validateSequenceSet(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Not an object.");
  if (obj.schemaVersion !== SEQUENCE_SET_SCHEMA_VERSION) {
    throw new Error(`Unsupported schemaVersion (got ${obj.schemaVersion}, expected ${SEQUENCE_SET_SCHEMA_VERSION}).`);
  }
  if (typeof obj.setId !== "string" || !obj.setId.trim()) throw new Error("Missing setId.");
  if (!Array.isArray(obj.primaries) || obj.primaries.length !== 3) throw new Error("primaries must be an array of 3 sequences.");
  if (!Array.isArray(obj.retests) || obj.retests.length !== 3) throw new Error("retests must be an array of 3 sequences.");
  if (!Array.isArray(obj.retakes) || obj.retakes.length !== 9) throw new Error("retakes must be an array of 9 sequences.");
  const checkSeq = (s, label) => {
    if (!Array.isArray(s) || s.length < 3) throw new Error(`${label} must be a sequence of at least 3 steps.`);
    for (const v of s) {
      if (!Number.isInteger(v) || v < 0 || v > 3) throw new Error(`${label} contains an invalid step value (must be integer 0\u20133).`);
    }
  };
  obj.primaries.forEach((s, i) => checkSeq(s, `primaries[${i}]`));
  obj.retests.forEach((s, i) => checkSeq(s, `retests[${i}]`));
  obj.retakes.forEach((s, i) => checkSeq(s, `retakes[${i}]`));
  return obj;
}
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
var hasFsApi = () => typeof window !== "undefined" && "showDirectoryPicker" in window;
async function pickStorageFolder() {
  const handle = await window.showDirectoryPicker({ mode: "readwrite", id: "pfm-memora-folder" });
  await idbPut(IDB_KEY_FOLDER, handle);
  return handle;
}
async function restoreStorageFolder() {
  if (!hasFsApi()) return null;
  try {
    const handle = await idbGet(IDB_KEY_FOLDER);
    if (!handle) return null;
    if (await handle.queryPermission({ mode: "readwrite" }) === "granted") return handle;
    return { handle, needsPermission: true };
  } catch {
    return null;
  }
}
async function ensureFolderPermission(handle, { autoOnly = false } = {}) {
  try {
    const q = await handle.queryPermission?.({ mode: "readwrite" });
    if (q === "granted") return "granted";
    if (autoOnly) return "needs-permission";
    const r = await handle.requestPermission?.({ mode: "readwrite" });
    return r === "granted" ? "granted" : "denied";
  } catch {
    return "error";
  }
}
function withTimeout(p, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out after ${ms} ms: ${label}`)), ms);
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
async function writeFolderFile(handle, filename, content) {
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
async function readFolderFile(handle, filename) {
  try {
    const fileHandle = await handle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}
function parseCsv(text) {
  if (text == null) return [];
  const rows = [];
  let row = [];
  let field = "";
  let inQuote = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuote = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuote = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
function findDuplicateSummaryRows(parsedRows) {
  if (!parsedRows || parsedRows.length === 0) return { header: [], dataRows: [], kept: [], duplicates: [] };
  const header = parsedRows[0];
  const dataRows = parsedRows.slice(1).filter((r) => r.length > 0 && r.some((c) => c !== ""));
  const sessionIdCol = header.indexOf("session_id");
  const candidateIdCol = header.indexOf("candidate_id");
  const bestSpanCol = header.indexOf("best_span");
  const dateCol = header.indexOf("date");
  const seen = /* @__PURE__ */ new Set();
  const kept = [];
  const duplicates = [];
  for (const row of dataRows) {
    const key = sessionIdCol >= 0 ? row[sessionIdCol] : JSON.stringify(row);
    if (seen.has(key)) {
      duplicates.push({
        sessionId: sessionIdCol >= 0 ? row[sessionIdCol] : "",
        candidateId: candidateIdCol >= 0 ? row[candidateIdCol] : "",
        bestSpan: bestSpanCol >= 0 ? row[bestSpanCol] : "",
        date: dateCol >= 0 ? row[dateCol] : "",
        row
      });
    } else {
      seen.add(key);
      kept.push(row);
    }
  }
  return { header, dataRows, kept, duplicates };
}
function migrateRowsToHeader(oldHeader, oldDataRows, newHeaderCols) {
  return oldDataRows.map(
    (row) => newHeaderCols.map((col) => {
      const idx = oldHeader.indexOf(col);
      return idx >= 0 ? row[idx] ?? "" : "";
    })
  );
}
async function appendCsvInFolder(handle, filename, headerRow, newRows, headerCols) {
  const existing = await readFolderFile(handle, filename);
  if (existing == null) {
    await writeFolderFile(handle, filename, headerRow + newRows);
    return { result: "created" };
  }
  const existingHeaderLine = existing.split("\n", 1)[0] ?? "";
  const expectedHeaderLine = (headerRow || "").replace(/\n$/, "");
  if (existingHeaderLine === expectedHeaderLine) {
    const content = (existing.endsWith("\n") ? existing : existing + "\n") + newRows;
    await writeFolderFile(handle, filename, content);
    return { result: "appended" };
  }
  const cols = headerCols || expectedHeaderLine.split(",");
  const parsed = parseCsv(existing);
  const oldHeader = parsed[0] || [];
  const oldDataRows = parsed.slice(1).filter((r) => r.length > 0 && r.some((c) => c !== ""));
  const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\..*/, "Z");
  const baseFilename = filename.replace(/\.csv$/i, "");
  const backupFilename = `${baseFilename}.preMigration_${ts}.csv`;
  await writeFolderFile(handle, backupFilename, existing);
  const migratedRows = migrateRowsToHeader(oldHeader, oldDataRows, cols);
  const migratedBody = migratedRows.map((r) => csvRow(r)).join("");
  await writeFolderFile(handle, filename, headerRow + migratedBody + newRows);
  return {
    result: "migrated-and-appended",
    backupFilename,
    oldColumnCount: oldHeader.length,
    newColumnCount: cols.length,
    migratedRowCount: oldDataRows.length
  };
}
function browserDownload(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
function formatDuration(ms) {
  if (ms == null || ms < 0 || isNaN(ms)) return "\u2014";
  const s = ms / 1e3;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = (s % 60).toFixed(1);
  return `${m}m ${r}s`;
}
function TrialCard({ trial, kind }) {
  const heading = kind === "retest" ? `RETEST \xB7 Retest Sequence #${trial.sequenceId}` : `TRIAL ${trial.trialNumber} \xB7 Primary Sequence #${trial.sequenceId}`;
  const className = "pfm-memora-trial-card" + (kind === "retest" ? " pfm-memora-trial-card-retest" : "");
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs("div", { className: "pfm-memora-trial-header", children: [
      /* @__PURE__ */ jsx("h3", { children: heading }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-trial-stats", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Score" }),
          trial.score
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Trial" }),
          formatDuration(trial.trialDurationMs)
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Response" }),
          formatDuration(trial.totalResponseTimeMs)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pfm-memora-rounds", children: trial.rounds.map((r, i) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "pfm-memora-round-row",
        "data-failed": r.completed ? "false" : "true",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "pfm-memora-round-label", children: [
            r.length,
            "-step"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "pfm-memora-round-status", children: r.completed ? "\u2713" : "\u2715" }),
          /* @__PURE__ */ jsx("span", { className: "pfm-memora-round-time", children: formatDuration(r.responseTimeMs) }),
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-round-presses", children: r.presses.map((p, j) => /* @__PURE__ */ jsx(
            "span",
            {
              className: "pfm-memora-press-dot",
              "data-correct": p.correct ? "true" : "false",
              style: { background: COLORS[p.id].base },
              title: `${COLORS[p.id].label} \xB7 ${formatDuration(p.dtMs)} \xB7 ${p.correct ? "OK" : "WRONG"}`
            },
            j
          )) })
        ]
      },
      i
    )) })
  ] });
}
function ResultsView({
  trials,
  retest,
  retakeOffered,
  onRetake,
  onSkipRetake,
  onReset,
  onStartRetake,
  onExit,
  sessionId,
  sessionDurationMs,
  scores,
  originalScores,
  folderName,
  folderNeedsPermission,
  hasFsApi: hasFsApi2,
  onChooseFolder,
  onSaveCsvs,
  onDownloadSummary,
  onDownloadDetail,
  saveStatus
}) {
  const baseScores = originalScores && originalScores.length ? originalScores : scores || [];
  const best = baseScores.length ? Math.max(...baseScores) : 0;
  const med = baseScores.length ? median(baseScores) : 0;
  const mean = baseScores.length ? baseScores.reduce((a, b) => a + b, 0) / baseScores.length : 0;
  return /* @__PURE__ */ jsxs("div", { className: "pfm-memora-root", children: [
    typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-exit", onClick: onExit, children: "Close" }),
    /* @__PURE__ */ jsxs("div", { className: "pfm-memora-version-chip", "aria-label": `Memora version ${MODULE_VERSION}`, children: [
      "v",
      MODULE_VERSION
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "pfm-memora-card", children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-memora-eyebrow", children: [
        "Memora",
        /* @__PURE__ */ jsx("span", { className: "pfm-memora-tm", children: "\u2122" }),
        " \xB7 Results \xB7 v",
        MODULE_VERSION
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "pfm-memora-title", children: "Working Memory Span Profile" }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-results-meta", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Session:" }),
          " ",
          sessionId || "\u2014"
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Total time:" }),
          " ",
          formatDuration(sessionDurationMs)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-admin-banner", role: "status", "aria-live": "polite", children: [
        /* @__PURE__ */ jsx("div", { className: "pfm-memora-admin-banner-icon", "aria-hidden": "true", children: "\u2691" }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-admin-banner-text", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-admin-banner-title", children: "Test complete" }),
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-admin-banner-body", children: "Please call the admin to review and record these results before continuing." })
        ] })
      ] }),
      (() => {
        const state = retakeOffered ? "pending" : folderName && folderNeedsPermission ? "permission" : !folderName ? "warn" : saveStatus.type === "saving" ? "saving" : saveStatus.type === "saved" ? "saved" : saveStatus.type === "error" ? "error" : "saving";
        const icon = state === "saved" ? "\u2713" : state === "saving" ? "\u23F3" : state === "pending" ? "\u23F8" : state === "permission" ? "\u{1F512}" : state === "error" ? "\u26A0" : "\u26A0";
        return /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave", "data-state": state, role: "status", "aria-live": "polite", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-icon", "aria-hidden": "true", children: icon }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-body", children: [
            state === "saved" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-title", children: "CSVs auto-saved" }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-rows", children: [
                /* @__PURE__ */ jsx("span", { className: "pfm-memora-autosave-label", children: "Folder" }),
                /* @__PURE__ */ jsx("code", { className: "pfm-memora-autosave-value", children: saveStatus.folder }),
                saveStatus.summaryFile && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "pfm-memora-autosave-label", children: "Summary row" }),
                  /* @__PURE__ */ jsxs("code", { className: "pfm-memora-autosave-value", children: [
                    saveStatus.summaryFile,
                    saveStatus.summary ? ` (${saveStatus.summary})` : ""
                  ] })
                ] }),
                saveStatus.detailFile && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "pfm-memora-autosave-label", children: "Raw data" }),
                  /* @__PURE__ */ jsx("code", { className: "pfm-memora-autosave-value", children: saveStatus.detailFile })
                ] }),
                saveStatus.backupFile && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "pfm-memora-autosave-label", children: "Old file backed up" }),
                  /* @__PURE__ */ jsx("code", { className: "pfm-memora-autosave-value", children: saveStatus.backupFile })
                ] })
              ] }),
              saveStatus.backupFile && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-note pfm-memora-autosave-migrated", children: [
                "\u26A0 Daily ledger was an older schema (",
                saveStatus.oldColumnCount,
                "-column). Backed it up untouched as ",
                /* @__PURE__ */ jsx("code", { children: saveStatus.backupFile }),
                ", migrated its ",
                saveStatus.migratedRowCount,
                " existing row",
                saveStatus.migratedRowCount === 1 ? "" : "s",
                " to the current ",
                saveStatus.newColumnCount,
                "-column schema, then appended this session."
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-note", children: "Browsers only expose the folder name (not its full path). Verify the destination in your folder picker if you need the absolute location." }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-actions", children: [
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onSaveCsvs, children: "Save again" }),
                hasFsApi2 && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onChooseFolder, children: "Change folder" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadSummary, children: "Download summary" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadDetail, children: "Download detail" })
              ] })
            ] }),
            state === "saving" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-title", children: "Saving CSVs\u2026" }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-message", children: [
                "Writing to ",
                /* @__PURE__ */ jsx("b", { children: folderName }),
                ". This usually takes under a second."
              ] })
            ] }),
            state === "pending" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-title", children: "Save deferred \u2014 retake decision pending" }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-message", children: [
                "The outlier retest was offered for this candidate. Choose ",
                /* @__PURE__ */ jsx("b", { children: "Run Retake" }),
                " or ",
                /* @__PURE__ */ jsx("b", { children: "Skip" }),
                " below \u2014 the CSVs save automatically with the final dataset once the decision is made."
              ] })
            ] }),
            state === "permission" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-title", children: "Folder access needs to be granted" }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-message", children: [
                "The browser is blocking auto-save because the folder permission for ",
                /* @__PURE__ */ jsx("b", { children: folderName }),
                " wasn't recently confirmed. Click ",
                /* @__PURE__ */ jsx("b", { children: "Grant access and save" }),
                " below \u2014 that click counts as a user gesture and lets the browser prompt for permission."
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-actions", children: [
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-primary", onClick: onSaveCsvs, children: "Grant access and save" }),
                hasFsApi2 && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onChooseFolder, children: "Choose different folder" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadSummary, children: "Download summary" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadDetail, children: "Download detail" })
              ] })
            ] }),
            state === "error" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-title", children: "Auto-save failed" }),
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-message", children: saveStatus.message }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-actions", children: [
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onSaveCsvs, children: "Try again" }),
                hasFsApi2 && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onChooseFolder, children: folderName ? "Change folder" : "Choose folder" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadSummary, children: "Download summary" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadDetail, children: "Download detail" })
              ] })
            ] }),
            state === "warn" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-title", children: "Files were not auto-saved" }),
              /* @__PURE__ */ jsx("div", { className: "pfm-memora-autosave-message", children: hasFsApi2 ? /* @__PURE__ */ jsx(Fragment, { children: "No save folder is set. Choose one for future sessions, or use the manual download buttons below to grab this candidate's CSVs." }) : /* @__PURE__ */ jsx(Fragment, { children: "This browser doesn't support folder selection. Use the manual download buttons below to save this candidate's CSVs to your default Downloads folder." }) }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-autosave-actions", children: [
                hasFsApi2 && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onChooseFolder, children: "Choose folder" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadSummary, children: "Download summary" }),
                /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onDownloadDetail, children: "Download detail" })
              ] })
            ] })
          ] })
        ] });
      })(),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-summary-row", children: [
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-summary-stat", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-summary-stat-label", children: "Best Span" }),
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-summary-stat-value", children: best })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-summary-stat", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-summary-stat-label", children: "Median Span" }),
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-summary-stat-value", children: med })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-summary-stat", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-summary-stat-label", children: "Mean Span" }),
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-summary-stat-value", children: mean.toFixed(1) })
        ] })
      ] }),
      retakeOffered && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-retest", children: [
        /* @__PURE__ */ jsx("p", { children: "One trial value differs meaningfully from the other two. A single retake can improve confidence in the pattern-span estimate." }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-primary", onClick: onRetake, children: "Run Retake" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onSkipRetake, children: "Skip" })
        ] })
      ] }),
      trials.map((t, i) => /* @__PURE__ */ jsx(TrialCard, { trial: t, kind: "trial" }, i)),
      retest && /* @__PURE__ */ jsx(TrialCard, { trial: retest, kind: "retest" }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-actions", style: { marginTop: 18 }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-primary", onClick: onReset, children: "Next Candidate" }),
        typeof onStartRetake === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: onStartRetake, children: "Retake test (same candidate)" })
      ] })
    ] })
  ] });
}
function MemoraComponent({ onComplete, onExit, candidate, session }) {
  const [trial, setTrial] = useState(1);
  const [phase, setPhase] = useState("setup");
  const [sequence, setSequence] = useState([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [active, setActive] = useState(null);
  const [scores, setScores] = useState([]);
  const [message, setMessage] = useState("Press Start Trial to begin.");
  const [candidateInput, setCandidateInput] = useState(candidate && candidate.id || "");
  const [retakeOffered, setRetakeOffered] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [originalScores, setOriginalScores] = useState([]);
  const [retestScore, setRetestScore] = useState(null);
  const [isRetestTrial, setIsRetestTrial] = useState(false);
  const [isPracticeTrial, setIsPracticeTrial] = useState(false);
  const [sandboxAttempts, setSandboxAttempts] = useState(0);
  const [audioTestStatus, setAudioTestStatus] = useState("idle");
  const [audioTestActive, setAudioTestActive] = useState(null);
  const todayIso = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [dedupeDateStr, setDedupeDateStr] = useState(todayIso);
  const [dedupeStatus, setDedupeStatus] = useState("idle");
  const [dedupeResult, setDedupeResult] = useState(null);
  const builtInSet = useMemo(() => makeBuiltInSet(), []);
  const [activeSet, setActiveSet] = useState(null);
  const effectiveSet = activeSet || builtInSet;
  const effectiveSetRef = useRef(effectiveSet);
  useEffect(() => {
    effectiveSetRef.current = effectiveSet;
  }, [effectiveSet]);
  const [pendingSet, setPendingSet] = useState(null);
  const [bankImportText, setBankImportText] = useState("");
  const [bankImportError, setBankImportError] = useState(null);
  const [bankBusy, setBankBusy] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const retakeOrderRef = useRef(null);
  const usedRetakeIdsRef = useRef(/* @__PURE__ */ new Set());
  const [folderHandle, setFolderHandle] = useState(null);
  const [folderName, setFolderName] = useState(null);
  const [folderNeedsPermission, setFolderNeedsPermission] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: "idle" });
  const audioRef = useRef(null);
  const timersRef = useRef([]);
  const completedRef = useRef(false);
  const sessionIdRef = useRef(null);
  const trialOrderRef = useRef(null);
  const currentSeqIdRef = useRef(null);
  const currentSequenceRef = useRef(null);
  const retestSeqIdRef = useRef(null);
  const sessionStartTimeRef = useRef(null);
  const trialStartTimeRef = useRef(null);
  const roundStartTimeRef = useRef(null);
  const lastPressTimeRef = useRef(null);
  const trialDataRef = useRef(null);
  const roundDataRef = useRef(null);
  const completedTrialsRef = useRef([]);
  const retestDataRef = useRef(null);
  const completionTimeMsRef = useRef(null);
  const lastCandidateRef = useRef(null);
  const finalResultRef = useRef(null);
  const csvSavedRef = useRef(false);
  const currentSpeed = useMemo(
    () => speedForLength(sequence.length || 3),
    [sequence.length]
  );
  useEffect(() => {
    ensureStyles();
    const Ctx = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
    if (Ctx) {
      try {
        audioRef.current = new Ctx();
      } catch (_) {
        audioRef.current = null;
      }
    }
    if (!audioRef.current) setAudioTestStatus("unavailable");
    const primer = () => {
      if (audioRef.current && audioRef.current.state === "suspended") {
        audioRef.current.resume().catch(() => {
        });
      }
      document.removeEventListener("pointerdown", primer, true);
    };
    if (typeof document !== "undefined") {
      document.addEventListener("pointerdown", primer, true);
    }
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (typeof document !== "undefined") {
        document.removeEventListener("pointerdown", primer, true);
      }
      if (audioRef.current && audioRef.current.state !== "closed") {
        try {
          audioRef.current.close();
        } catch (_) {
        }
      }
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await idbGet(IDB_KEY_SEQUENCE_SET);
        if (cancelled || !stored) return;
        validateSequenceSet(stored);
        setActiveSet(stored);
      } catch (e) {
        console.warn("[Memora] Stored sequence set failed validation; using built-in.", e?.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    try {
      window.history.pushState({ pfm: "memora-nav-guard" }, "");
    } catch (_) {
    }
    const onPopState = () => {
      const confirmed = window.confirm(
        "Are you sure you want to navigate away from this page? Your current Memora session will be lost."
      );
      if (confirmed) {
        window.removeEventListener("popstate", onPopState);
        window.removeEventListener("beforeunload", onBeforeUnload);
        window.history.back();
      } else {
        try {
          window.history.pushState({ pfm: "memora-nav-guard" }, "");
        } catch (_) {
        }
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);
  function generatePendingSet() {
    setBankBusy(true);
    setBankImportError(null);
    try {
      const fresh = generateNewSequenceSet({ length: 32 });
      setPendingSet(fresh);
    } catch (e) {
      setBankImportError(e?.message || "Failed to generate.");
    } finally {
      setBankBusy(false);
    }
  }
  function importPendingSetFromText(text) {
    setBankImportError(null);
    try {
      const obj = JSON.parse(text);
      validateSequenceSet(obj);
      setPendingSet(obj);
      setBankImportText("");
    } catch (e) {
      setPendingSet(null);
      setBankImportError(e?.message || "Could not parse JSON.");
    }
  }
  async function lockPendingSet() {
    if (!pendingSet) return;
    setBankBusy(true);
    try {
      await idbPut(IDB_KEY_SEQUENCE_SET, pendingSet);
      setActiveSet(pendingSet);
      setPendingSet(null);
      setBankImportText("");
      setBankImportError(null);
    } catch (e) {
      setBankImportError(e?.message || "Failed to save set to IndexedDB.");
    } finally {
      setBankBusy(false);
    }
  }
  function cancelPendingSet() {
    setPendingSet(null);
    setBankImportText("");
    setBankImportError(null);
  }
  async function revertToBuiltInSet() {
    if (!window.confirm("Revert to the built-in sequence set? The custom set is removed from this machine but the JSON you exported (if any) is unaffected.")) return;
    setBankBusy(true);
    try {
      await idbPut(IDB_KEY_SEQUENCE_SET, null);
      setActiveSet(null);
      setPendingSet(null);
      setBankImportText("");
      setBankImportError(null);
    } finally {
      setBankBusy(false);
    }
  }
  function exportActiveSet() {
    const json = JSON.stringify(effectiveSet, null, 2);
    const fname = `memora-sequences_${effectiveSet.setId}.json`;
    browserDownload(fname, json);
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await restoreStorageFolder();
      if (cancelled || !restored) return;
      if (restored.handle && restored.needsPermission) {
        setFolderHandle(restored.handle);
        setFolderName(restored.handle.name);
        setFolderNeedsPermission(true);
      } else {
        setFolderHandle(restored);
        setFolderName(restored.name);
        setFolderNeedsPermission(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  async function chooseFolder() {
    if (!hasFsApi()) {
      setSaveStatus({ type: "error", message: "This browser does not support choosing a folder. Files will download to your default Downloads folder instead." });
      return;
    }
    try {
      const handle = await pickStorageFolder();
      setFolderHandle(handle);
      setFolderName(handle.name);
      setFolderNeedsPermission(false);
      setSaveStatus({ type: "idle" });
    } catch (e) {
      if (e && e.name !== "AbortError") {
        setSaveStatus({ type: "error", message: e.message || "Could not select folder." });
      }
    }
  }
  async function confirmCandidate() {
    const trimmed = candidateInput.trim();
    if (!trimmed) return;
    setCandidateInput(trimmed);
    lastCandidateRef.current = trimmed;
    await ensureAudioRunning();
    setPhase("intro");
    setMessage("Practice round before the real trials.");
  }
  async function confirmSetup() {
    await ensureAudioRunning();
    setPhase("prep");
  }
  const SANDBOX_CAP_LENGTH = 6;
  const MAX_SANDBOX_ATTEMPTS = 2;
  async function startPractice() {
    clearTimers();
    await ensureAudioRunning();
    if (sessionIdRef.current === null) {
      sessionIdRef.current = makeSessionId();
      sessionStartTimeRef.current = nowMs();
    }
    const sandboxFullSeq = generateCandidateSequence(10);
    currentSequenceRef.current = sandboxFullSeq;
    const initial = sandboxFullSeq.slice(0, 3);
    setIsPracticeTrial(true);
    setSequence(initial);
    setInputIndex(0);
    setPhase("showing");
    setMessage("Watch the practice pattern.");
    showSequence(initial);
  }
  async function startFirstTrial() {
    setIsPracticeTrial(false);
    await ensureAudioRunning();
    startTrial(false);
  }
  function pickRetakeIndices() {
    const retakes = effectiveSetRef.current.retakes;
    const used = usedRetakeIdsRef.current;
    const available = retakes.map((_, i) => i).filter((i) => !used.has(i));
    const pool = available.length >= 3 ? available : retakes.map((_, i) => i);
    const remaining = [...pool];
    const picked = [];
    while (picked.length < 3 && remaining.length > 0) {
      const j = Math.floor(Math.random() * remaining.length);
      picked.push(remaining.splice(j, 1)[0]);
    }
    picked.forEach((i) => used.add(i));
    return picked;
  }
  async function startRetake() {
    const cand = lastCandidateRef.current || candidateInput || "(unknown)";
    const ok = window.confirm(
      `Retake test for ${cand}? The current results stay in the daily summary; the retake will be saved as a separate row with attempt = retake_${attemptNumber + 1}.`
    );
    if (!ok) return;
    await ensureAudioRunning();
    retakeOrderRef.current = pickRetakeIndices();
    clearTimers();
    completedRef.current = false;
    completedTrialsRef.current = [];
    retestDataRef.current = null;
    trialDataRef.current = null;
    roundDataRef.current = null;
    currentSeqIdRef.current = null;
    currentSequenceRef.current = null;
    retestSeqIdRef.current = null;
    completionTimeMsRef.current = null;
    sessionIdRef.current = makeSessionId();
    sessionStartTimeRef.current = nowMs();
    finalResultRef.current = null;
    csvSavedRef.current = false;
    setAttemptNumber((n) => n + 1);
    setTrial(1);
    setPhase("ready");
    setSequence([]);
    setInputIndex(0);
    setActive(null);
    setScores([]);
    setOriginalScores([]);
    setRetestScore(null);
    setRetakeOffered(false);
    setWrongFlash(false);
    setIsRetestTrial(false);
    setIsPracticeTrial(false);
    setSaveStatus({ type: "idle" });
    setMessage("Press Start Trial to begin the retake.");
  }
  async function scanDuplicates() {
    setDedupeResult(null);
    if (!folderHandle) {
      setDedupeStatus("error");
      setDedupeResult({ filename: null, errorMessage: "No save folder is set. Pick a folder first." });
      return;
    }
    setDedupeStatus("scanning");
    const filename = summaryFilenameFor(dedupeDateStr);
    try {
      const perm = await ensureFolderPermission(folderHandle, { autoOnly: false });
      if (perm !== "granted") {
        setDedupeStatus("error");
        setDedupeResult({ filename, errorMessage: "Folder access not granted." });
        return;
      }
      const text = await readFolderFile(folderHandle, filename);
      if (text == null) {
        setDedupeStatus("error");
        setDedupeResult({ filename, errorMessage: `${filename} doesn't exist in ${folderHandle.name} (no sessions saved for that date).` });
        return;
      }
      const parsed = parseCsv(text);
      const { header, dataRows, kept, duplicates } = findDuplicateSummaryRows(parsed);
      if (duplicates.length === 0) {
        setDedupeStatus("no-duplicates");
        setDedupeResult({ filename, header, totalRows: dataRows.length, kept, duplicates: [] });
        return;
      }
      setDedupeStatus("found");
      setDedupeResult({ filename, header, totalRows: dataRows.length, kept, duplicates });
    } catch (e) {
      setDedupeStatus("error");
      setDedupeResult({ filename, errorMessage: e?.message || "Failed to read summary file." });
    }
  }
  async function applyDedupe() {
    if (!folderHandle || !dedupeResult || !dedupeResult.duplicates || dedupeResult.duplicates.length === 0) return;
    setDedupeStatus("applying");
    try {
      const { filename, header, kept } = dedupeResult;
      const content = csvHeader(header) + kept.map(csvRow).join("");
      await writeFolderFile(folderHandle, filename, content);
      setDedupeStatus("done");
    } catch (e) {
      setDedupeStatus("error");
      setDedupeResult({ ...dedupeResult, errorMessage: e?.message || "Failed to write deduped summary." });
    }
  }
  function cancelDedupe() {
    setDedupeStatus("idle");
    setDedupeResult(null);
  }
  async function forgetFolder() {
    try {
      await idbPut(IDB_KEY_FOLDER, null);
    } catch (_) {
    }
    setFolderHandle(null);
    setFolderName(null);
    setFolderNeedsPermission(false);
  }
  function buildCsvBundle() {
    const result = finalResultRef.current;
    if (!result) return null;
    const candidateLabel = result.raw_output.candidate_id || result.raw_output.sessionId;
    const dateStr = (result.completed_at || (/* @__PURE__ */ new Date()).toISOString()).slice(0, 10);
    const summaryRows = buildSummaryRows({
      candidateId: result.raw_output.candidate_id || "",
      sessionId: result.raw_output.sessionId,
      moduleVersion: result.module_version,
      trials: result.raw_output.trials,
      retest: result.raw_output.retest,
      summaryMetrics: result.summary_metrics,
      rawOutput: result.raw_output,
      dateStr
    });
    const detailCsv = buildDetailCsv({
      trials: result.raw_output.trials,
      retest: result.raw_output.retest,
      attempt: result.raw_output.attempt,
      setId: result.raw_output.set_id
    });
    const summaryFilename = summaryFilenameFor(dateStr);
    const detailFilename = detailFilenameFor(candidateLabel, dateStr);
    return { summaryRows, summaryFilename, detailCsv, detailFilename };
  }
  function downloadSummaryOnly() {
    const b = buildCsvBundle();
    if (!b) {
      setSaveStatus({ type: "error", message: "No completed session to download yet." });
      return;
    }
    browserDownload(b.summaryFilename, csvHeader(SUMMARY_HEADER_COLS) + b.summaryRows);
    setSaveStatus({ type: "saved", folder: "Downloads (browser)", summary: "downloaded", summaryFile: b.summaryFilename, detailFile: null });
  }
  function downloadDetailOnly() {
    const b = buildCsvBundle();
    if (!b) {
      setSaveStatus({ type: "error", message: "No completed session to download yet." });
      return;
    }
    browserDownload(b.detailFilename, b.detailCsv);
    setSaveStatus({ type: "saved", folder: "Downloads (browser)", summary: null, summaryFile: null, detailFile: b.detailFilename });
  }
  async function saveCsvs({ auto = false } = {}) {
    const b = buildCsvBundle();
    if (!b) {
      setSaveStatus({ type: "error", message: "No completed session to save yet." });
      return;
    }
    setSaveStatus({ type: "saving" });
    try {
      if (folderHandle) {
        const perm = await ensureFolderPermission(folderHandle, { autoOnly: auto });
        if (perm === "needs-permission") {
          setFolderNeedsPermission(true);
          setSaveStatus({ type: "idle" });
          return;
        }
        if (perm === "denied") {
          setFolderNeedsPermission(true);
          setSaveStatus({ type: "error", message: "Folder access was denied. Choose a different folder, or use the manual download buttons." });
          return;
        }
        if (perm === "error") {
          setSaveStatus({ type: "error", message: "Could not check folder permission. Try again or use the manual download buttons." });
          return;
        }
        setFolderNeedsPermission(false);
        const summaryRes = await withTimeout(
          appendCsvInFolder(
            folderHandle,
            b.summaryFilename,
            csvHeader(SUMMARY_HEADER_COLS),
            b.summaryRows,
            SUMMARY_HEADER_COLS
          ),
          15e3,
          "appending summary CSV"
        );
        await withTimeout(
          writeFolderFile(folderHandle, b.detailFilename, b.detailCsv),
          15e3,
          "writing detail CSV"
        );
        setSaveStatus({
          type: "saved",
          folder: folderHandle.name,
          summary: summaryRes.result,
          summaryFile: b.summaryFilename,
          detailFile: b.detailFilename,
          backupFile: summaryRes.backupFilename || null,
          migratedRowCount: summaryRes.migratedRowCount || 0,
          oldColumnCount: summaryRes.oldColumnCount || 0,
          newColumnCount: summaryRes.newColumnCount || 0
        });
      } else {
        browserDownload(b.summaryFilename, csvHeader(SUMMARY_HEADER_COLS) + b.summaryRows);
        browserDownload(b.detailFilename, b.detailCsv);
        setSaveStatus({ type: "saved", folder: "Downloads (browser)", summary: "downloaded", summaryFile: b.summaryFilename, detailFile: b.detailFilename });
      }
      csvSavedRef.current = true;
    } catch (e) {
      setSaveStatus({ type: "error", message: e?.message || "Save failed." });
    }
  }
  useEffect(() => {
    if (completedRef.current) return;
    if (scores.length < 3) return;
    if (retakeOffered) return;
    if (isRetestTrial) return;
    if (phase !== "complete") return;
    completedRef.current = true;
    const sessionEnd = nowMs();
    const baseScores = originalScores.length ? originalScores : scores;
    const internalTrials = completedTrialsRef.current.map(cloneTrial);
    const internalRetest = retestDataRef.current ? cloneTrial(retestDataRef.current) : null;
    const trialOrder = trialOrderRef.current ? [...trialOrderRef.current] : [];
    const sessionDurationMs = sessionStartTimeRef.current ? Math.round(sessionEnd - sessionStartTimeRef.current) : 0;
    const sessionId = sessionIdRef.current;
    const allDts = [];
    for (const t of internalTrials) {
      for (const r of t.rounds) for (const p of r.presses) {
        if (typeof p.dtMs === "number" && p.dtMs >= 0) allDts.push(p.dtMs);
      }
    }
    if (internalRetest) {
      for (const r of internalRetest.rounds) for (const p of r.presses) {
        if (typeof p.dtMs === "number" && p.dtMs >= 0) allDts.push(p.dtMs);
      }
    }
    const meanRt = allDts.length ? Math.round(allDts.reduce((a, b) => a + b, 0) / allDts.length) : 0;
    const medianRt = allDts.length ? Math.round([...allDts].sort((a, b) => a - b)[Math.floor(allDts.length / 2)]) : 0;
    const bestSpan = Math.max(...baseScores);
    const medianSpan = median(baseScores);
    const meanSpan = Number((baseScores.reduce((a, b) => a + b, 0) / baseScores.length).toFixed(2));
    const result = {
      module_code: MODULE_CODE,
      module_version: MODULE_VERSION,
      bpr_domain: BPR_DOMAIN,
      completed_at: (/* @__PURE__ */ new Date()).toISOString(),
      summary_metrics: {
        max_span: bestSpan,
        mean_reaction_ms: meanRt,
        median_reaction_ms: medianRt,
        trials_total: internalTrials.length + (internalRetest ? 1 : 0),
        retest_used: !!internalRetest,
        outcome: "complete"
      },
      raw_output: {
        sessionId,
        sessionDurationSec: toSec(sessionDurationMs),
        attempt: attemptNumber === 0 ? "original" : `retake_${attemptNumber}`,
        set_id: effectiveSetRef.current.setId,
        set_label: effectiveSetRef.current.setLabel,
        trialOrder,
        trials: internalTrials,
        retest: internalRetest,
        bestSpan,
        medianSpan,
        meanSpan,
        meanReactionSec: toSec(meanRt),
        medianReactionSec: toSec(medianRt),
        candidate_id: candidateInput && candidateInput.trim() || candidate?.id || null,
        session_id: session?.id ?? null
      }
    };
    if (typeof onComplete === "function") onComplete(result);
    finalResultRef.current = result;
    if (folderHandle && !csvSavedRef.current) {
      saveCsvs({ auto: true });
    }
  }, [phase, scores, retakeOffered, isRetestTrial, retestScore, originalScores, onComplete, candidate, session, candidateInput, folderHandle, folderNeedsPermission, attemptNumber]);
  function cloneTrial(t) {
    return {
      trialNumber: t.trialNumber,
      isRetest: !!t.isRetest,
      sequenceId: t.sequenceId,
      sequencePool: t.sequencePool ?? (t.isRetest ? "retest" : "primary"),
      sequence: Array.isArray(t.sequence) ? [...t.sequence] : null,
      score: t.score,
      trialDurationSec: toSec(t.trialDurationMs),
      totalResponseTimeSec: toSec(t.totalResponseTimeMs),
      startedAt: t.startedAt,
      endedAt: t.endedAt,
      rounds: t.rounds.map((r) => ({
        length: r.length,
        completed: r.completed,
        responseTimeSec: toSec(r.responseTimeMs),
        presses: r.presses.map((p) => ({
          id: p.id,
          expected: p.expected,
          correct: p.correct,
          dtSec: toSec(p.dtMs),
          position: p.position
        }))
      }))
    };
  }
  async function playTone(freq, duration = 180) {
    const ctx = audioRef.current;
    if (!ctx) return;
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch (_) {
        return;
      }
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(1e-4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + duration / 1e3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1e3 + 0.02);
  }
  async function ensureAudioRunning() {
    const ctx = audioRef.current;
    if (!ctx) return;
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch (_) {
      }
    }
  }
  async function testSound() {
    if (!audioRef.current) {
      setAudioTestStatus("unavailable");
      return;
    }
    await ensureAudioRunning();
    if (audioRef.current.state !== "running") {
      setAudioTestStatus("unavailable");
      return;
    }
    setAudioTestStatus("playing");
    for (let i = 0; i < COLORS.length; i++) {
      setAudioTestActive(COLORS[i].id);
      playTone(COLORS[i].freq, 250);
      await new Promise((resolve) => {
        const t = setTimeout(() => {
          setAudioTestActive(null);
          resolve();
        }, 320);
        timersRef.current.push(t);
      });
    }
    setAudioTestActive(null);
    setAudioTestStatus("played");
  }
  function playWrongTone() {
    playTone(130.81, 260);
    timersRef.current.push(setTimeout(() => playTone(98, 300), 160));
  }
  function showWrongFeedback() {
    setWrongFlash(true);
    playWrongTone();
    timersRef.current.push(setTimeout(() => setWrongFlash(false), 1100));
  }
  function flash(id, duration) {
    setActive(id);
    playTone(COLORS[id].freq, duration);
    timersRef.current.push(setTimeout(() => setActive(null), duration));
  }
  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  async function startTrial(isRetake = false) {
    clearTimers();
    completedRef.current = false;
    await ensureAudioRunning();
    if (!isRetake) {
      if (sessionIdRef.current === null) {
        sessionIdRef.current = makeSessionId();
        sessionStartTimeRef.current = nowMs();
      }
      if (!trialOrderRef.current) {
        trialOrderRef.current = shuffle([0, 1, 2]);
      }
    }
    const set = effectiveSetRef.current;
    const inRetakeAttempt = attemptNumber > 0;
    const seqId = isRetake ? retestSeqIdRef.current : inRetakeAttempt ? retakeOrderRef.current[trial - 1] : trialOrderRef.current[trial - 1];
    currentSeqIdRef.current = seqId;
    const fullLocked = isRetake ? set.retests[seqId] : inRetakeAttempt ? set.retakes[seqId] : set.primaries[seqId];
    currentSequenceRef.current = fullLocked;
    const initial = fullLocked.slice(0, 3);
    trialDataRef.current = {
      trialNumber: isRetake ? null : trial,
      isRetest: isRetake,
      sequenceId: seqId,
      sequencePool: isRetake ? "retest" : inRetakeAttempt ? "retake" : "primary",
      sequence: [...fullLocked],
      rounds: [],
      score: 0,
      trialDurationMs: 0,
      totalResponseTimeMs: 0,
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      endedAt: null
    };
    trialStartTimeRef.current = nowMs();
    roundDataRef.current = null;
    setSequence(initial);
    setInputIndex(0);
    setRetakeOffered(false);
    setIsRetestTrial(isRetake);
    setPhase("showing");
    setMessage(isRetake ? "Retest started. Watch the pattern." : "Watch the pattern.");
    showSequence(initial);
  }
  function showSequence(seq) {
    setPhase("showing");
    setInputIndex(0);
    const speed = speedForLength(seq.length);
    let t = 500;
    seq.forEach((id) => {
      timersRef.current.push(setTimeout(() => flash(id, speed.on), t));
      t += speed.on + speed.gap;
    });
    timersRef.current.push(
      setTimeout(() => {
        const roundT = nowMs();
        roundStartTimeRef.current = roundT;
        lastPressTimeRef.current = roundT;
        roundDataRef.current = {
          length: seq.length,
          completed: false,
          responseTimeMs: 0,
          presses: []
        };
        setPhase("input");
        setMessage(`Repeat the ${seq.length}-step pattern.`);
      }, t + 150)
    );
  }
  function finalizeTrial(score, endTime) {
    const t = trialDataRef.current;
    if (!t) return;
    t.score = score;
    t.totalResponseTimeMs = t.rounds.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0);
    t.trialDurationMs = trialStartTimeRef.current ? Math.round(endTime - trialStartTimeRef.current) : 0;
    t.endedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (t.isRetest) {
      retestDataRef.current = t;
    } else {
      completedTrialsRef.current.push(t);
    }
    completionTimeMsRef.current = endTime;
    trialDataRef.current = null;
  }
  function handlePress(id) {
    if (phase !== "input") return;
    const tNow = nowMs();
    const dtMs = Math.round(tNow - (lastPressTimeRef.current ?? tNow));
    lastPressTimeRef.current = tNow;
    flash(id, 180);
    const expected = sequence[inputIndex];
    const correct = id === expected;
    const round = roundDataRef.current;
    if (round) {
      round.presses.push({ id, expected, correct, dtMs, position: inputIndex });
    }
    if (!correct) {
      if (isPracticeTrial) {
        showWrongFeedback();
        setPhase("failed");
        setMessage("Incorrect \u2014 that's the wrong-press feedback. Practice complete!");
        timersRef.current.push(setTimeout(() => {
          setSandboxAttempts((n) => n + 1);
          setPhase("practice-end");
        }, 1500));
        return;
      }
      if (round) {
        round.completed = false;
        round.responseTimeMs = Math.round(tNow - roundStartTimeRef.current);
        trialDataRef.current && trialDataRef.current.rounds.push(round);
      }
      const score = Math.max(0, sequence.length - 1);
      finalizeTrial(score, tNow);
      showWrongFeedback();
      setPhase("failed");
      setMessage(`Incorrect. You correctly completed ${score} in the string.`);
      if (isRetestTrial) {
        timersRef.current.push(setTimeout(() => {
          setRetestScore(score);
          setIsRetestTrial(false);
          setPhase("complete");
          setMessage(`Retest complete. Retest value = ${score}.`);
        }, 1500));
        return;
      }
      const nextScores = [...scores, score];
      setScores(nextScores);
      if (trial < 3) {
        timersRef.current.push(
          setTimeout(() => {
            setTrial(trial + 1);
            setPhase("ready");
            setMessage(`Ready for Trial ${trial + 1}.`);
          }, 1500)
        );
      } else {
        timersRef.current.push(setTimeout(() => {
          setOriginalScores(nextScores);
          setPhase("complete");
          const offered = attemptNumber === 0 && isSignificantOutlier(nextScores);
          if (offered) {
            const retests = effectiveSetRef.current.retests;
            retestSeqIdRef.current = Math.floor(Math.random() * retests.length);
          }
          setRetakeOffered(offered);
          setMessage("Three trials complete.");
        }, 1500));
      }
      return;
    }
    const nextIndex = inputIndex + 1;
    if (nextIndex === sequence.length) {
      if (isPracticeTrial) {
        const sandboxFull = currentSequenceRef.current;
        if (sequence.length >= SANDBOX_CAP_LENGTH || !sandboxFull || sequence.length >= sandboxFull.length) {
          setMessage("Nice \u2014 practice complete!");
          timersRef.current.push(setTimeout(() => {
            setSandboxAttempts((n) => n + 1);
            setPhase("practice-end");
          }, 900));
          return;
        }
        const nextSandboxSeq = sandboxFull.slice(0, sequence.length + 1);
        setSequence(nextSandboxSeq);
        setInputIndex(0);
        setMessage("Correct. Next pattern is longer.");
        timersRef.current.push(setTimeout(() => showSequence(nextSandboxSeq), 650));
        return;
      }
      if (round) {
        round.completed = true;
        round.responseTimeMs = Math.round(tNow - roundStartTimeRef.current);
        trialDataRef.current && trialDataRef.current.rounds.push(round);
      }
      const fullLocked = currentSequenceRef.current;
      if (sequence.length >= fullLocked.length) {
        const score = sequence.length;
        finalizeTrial(score, tNow);
        if (isRetestTrial) {
          setRetestScore(score);
          setIsRetestTrial(false);
          setPhase("complete");
          setMessage(`Retest complete. Retest value = ${score}.`);
          return;
        }
        const nextScores = [...scores, score];
        setScores(nextScores);
        if (trial < 3) {
          timersRef.current.push(setTimeout(() => {
            setTrial(trial + 1);
            setPhase("ready");
            setMessage(`Ready for Trial ${trial + 1}.`);
          }, 1500));
        } else {
          setOriginalScores(nextScores);
          setPhase("complete");
          const offered = attemptNumber === 0 && isSignificantOutlier(nextScores);
          if (offered) {
            const retests = effectiveSetRef.current.retests;
            retestSeqIdRef.current = Math.floor(Math.random() * retests.length);
          }
          setRetakeOffered(offered);
          setMessage("Three trials complete.");
        }
        return;
      }
      const nextSeq = fullLocked.slice(0, sequence.length + 1);
      setSequence(nextSeq);
      setInputIndex(0);
      setMessage("Correct. Next pattern is longer.");
      timersRef.current.push(setTimeout(() => showSequence(nextSeq), 650));
    } else {
      setInputIndex(nextIndex);
    }
  }
  function acceptRetake() {
    setRetakeOffered(false);
    startTrial(true);
  }
  function declineRetake() {
    setRetakeOffered(false);
  }
  function resetAll() {
    clearTimers();
    completedRef.current = false;
    sessionIdRef.current = null;
    trialOrderRef.current = null;
    currentSeqIdRef.current = null;
    currentSequenceRef.current = null;
    retestSeqIdRef.current = null;
    sessionStartTimeRef.current = null;
    trialStartTimeRef.current = null;
    roundStartTimeRef.current = null;
    lastPressTimeRef.current = null;
    trialDataRef.current = null;
    roundDataRef.current = null;
    completedTrialsRef.current = [];
    retestDataRef.current = null;
    completionTimeMsRef.current = null;
    finalResultRef.current = null;
    csvSavedRef.current = false;
    setSaveStatus({ type: "idle" });
    setTrial(1);
    setPhase("prep");
    setSequence([]);
    setInputIndex(0);
    setActive(null);
    setScores([]);
    setRetakeOffered(false);
    setWrongFlash(false);
    setOriginalScores([]);
    setRetestScore(null);
    setIsRetestTrial(false);
    setIsPracticeTrial(false);
    setSandboxAttempts(0);
    setAttemptNumber(0);
    retakeOrderRef.current = null;
    usedRetakeIdsRef.current = /* @__PURE__ */ new Set();
    const bumped = lastCandidateRef.current ? suggestNextCandidateCode(lastCandidateRef.current) : "";
    setCandidateInput(bumped || candidate && candidate.id || "");
    setMessage("Press Start Trial to begin.");
  }
  const finalSummary = scores.length >= 3 ? {
    trials: scores.join(", "),
    best: Math.max(...scores),
    median: median(scores),
    mean: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
  } : null;
  const armed = phase === "input";
  const showResults = phase === "complete" && scores.length >= 3;
  const showSetup = phase === "setup";
  const showPrep = phase === "prep";
  const showIntro = phase === "intro";
  const showPracticeEnd = phase === "practice-end";
  if (showSetup) {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    return /* @__PURE__ */ jsxs("div", { className: "pfm-memora-root", children: [
      typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-exit", onClick: onExit, children: "Close" }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-version-chip", "aria-label": `Memora version ${MODULE_VERSION}`, children: [
        "v",
        MODULE_VERSION
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-card", children: [
        /* @__PURE__ */ jsxs("p", { className: "pfm-memora-eyebrow", children: [
          "Memora",
          /* @__PURE__ */ jsx("span", { className: "pfm-memora-tm", children: "\u2122" }),
          " \xB7 Field App \xB7 Setup \xB7 v",
          MODULE_VERSION
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "pfm-memora-title", children: "Choose Your Output Folder" }),
        /* @__PURE__ */ jsx("p", { className: "pfm-memora-subtitle", children: "Pick a folder once and the app will save every candidate's CSVs there automatically. The choice is sticky across browser sessions \u2014 next time you open the app, it'll remember and ask you to re-grant access in one click." }),
        /* @__PURE__ */ jsxs("ul", { className: "pfm-memora-setup-list", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "Common ledger" }),
            " (",
            /* @__PURE__ */ jsxs("code", { className: "pfm-memora-setup-code", children: [
              "memora_",
              today,
              ".csv"
            ] }),
            ") \u2014 one file per calendar day. Every candidate's session adds a row to it. Date and candidate ID are stored as columns inside each row so you can sort and filter by them later."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "Per-candidate detail" }),
            " (",
            /* @__PURE__ */ jsxs("code", { className: "pfm-memora-setup-code", children: [
              "memora_DC1001_",
              today,
              ".csv"
            ] }),
            ") \u2014 new file per candidate per session, with full per-trial and per-press detail."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-setup-actions", children: [
          folderName && /* @__PURE__ */ jsxs("button", { type: "button", className: "pfm-memora-btn-primary", onClick: confirmSetup, children: [
            "Continue with ",
            folderName
          ] }),
          hasFsApi() && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: chooseFolder, children: folderName ? "Pick a different folder\u2026" : "Pick folder" }),
          folderName && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: forgetFolder, children: "Forget saved folder" }),
          !folderName && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: confirmSetup, children: hasFsApi() ? "Continue without setting a folder" : "Continue (use default Downloads)" })
        ] }),
        folderNeedsPermission && /* @__PURE__ */ jsxs("p", { className: "pfm-memora-setup-note pfm-memora-setup-note-warn", children: [
          "\u26A0 Folder access needs to be re-granted. Click ",
          /* @__PURE__ */ jsx("b", { children: "Pick a different folder\u2026" }),
          " and choose the same folder to refresh permission, or ",
          /* @__PURE__ */ jsx("b", { children: "Forget saved folder" }),
          " and start over."
        ] }),
        !hasFsApi() && /* @__PURE__ */ jsx("p", { className: "pfm-memora-setup-note", children: "This browser doesn't support folder picking. CSVs will save to your default Downloads folder instead. (Chrome, Edge, and Brave support folder picking; Safari and Firefox don't yet.)" }),
        hasFsApi() && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-dedupe-header", children: "End-of-Day Maintenance" }),
          /* @__PURE__ */ jsxs("p", { className: "pfm-memora-dedupe-body", children: [
            "Re-saves can leave duplicate rows in the daily summary when the same session is saved more than once. At the end of the day, run a dedupe to remove those duplicates from ",
            /* @__PURE__ */ jsx("code", { className: "pfm-memora-setup-code", children: "memora_<date>.csv" }),
            ". Rows are grouped by ",
            /* @__PURE__ */ jsx("code", { className: "pfm-memora-setup-code", children: "session_id" }),
            "; the first occurrence is kept."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-row", children: [
            /* @__PURE__ */ jsx("label", { className: "pfm-memora-dedupe-label", children: "Date" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                className: "pfm-memora-dedupe-date",
                value: dedupeDateStr,
                onChange: (e) => {
                  setDedupeDateStr(e.target.value);
                  cancelDedupe();
                },
                disabled: dedupeStatus === "scanning" || dedupeStatus === "applying"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-memora-btn-secondary",
                onClick: scanDuplicates,
                disabled: !folderName || dedupeStatus === "scanning" || dedupeStatus === "applying",
                children: dedupeStatus === "scanning" ? "Scanning\u2026" : "Scan for duplicates"
              }
            )
          ] }),
          dedupeStatus === "no-duplicates" && dedupeResult && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-result", "data-state": "ok", children: [
            "\u2713 No duplicates in ",
            /* @__PURE__ */ jsx("code", { children: dedupeResult.filename }),
            " (",
            dedupeResult.totalRows,
            " row",
            dedupeResult.totalRows === 1 ? "" : "s",
            ")."
          ] }),
          dedupeStatus === "error" && dedupeResult && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-result", "data-state": "error", children: [
            "\u26A0 ",
            dedupeResult.errorMessage
          ] }),
          dedupeStatus === "done" && dedupeResult && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-result", "data-state": "ok", children: [
            "\u2713 Erased ",
            dedupeResult.duplicates.length,
            " duplicate",
            dedupeResult.duplicates.length === 1 ? "" : "s",
            " from ",
            /* @__PURE__ */ jsx("code", { children: dedupeResult.filename }),
            ". File now has ",
            dedupeResult.kept.length,
            " row",
            dedupeResult.kept.length === 1 ? "" : "s",
            "."
          ] }),
          dedupeStatus === "found" && dedupeResult && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-preview", children: [
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-preview-title", children: [
              "Found ",
              /* @__PURE__ */ jsx("b", { children: dedupeResult.duplicates.length }),
              " duplicate row",
              dedupeResult.duplicates.length === 1 ? "" : "s",
              " in ",
              /* @__PURE__ */ jsx("code", { children: dedupeResult.filename })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-preview-counts", children: [
              "Original ",
              /* @__PURE__ */ jsx("b", { children: dedupeResult.totalRows }),
              " rows  \u2192  after dedupe ",
              /* @__PURE__ */ jsx("b", { children: dedupeResult.kept.length }),
              " rows"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pfm-memora-dedupe-preview-list-header", children: "Rows that will be erased (first occurrence is kept):" }),
            /* @__PURE__ */ jsx("div", { className: "pfm-memora-dedupe-preview-list", children: dedupeResult.duplicates.map((d, i) => /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-preview-row", children: [
              /* @__PURE__ */ jsx("code", { className: "pfm-memora-dedupe-preview-id", children: d.candidateId || "\u2014" }),
              /* @__PURE__ */ jsx("code", { className: "pfm-memora-dedupe-preview-session", children: d.sessionId || "\u2014" }),
              /* @__PURE__ */ jsxs("span", { className: "pfm-memora-dedupe-preview-span", children: [
                "best span ",
                d.bestSpan || "\u2014"
              ] })
            ] }, i)) }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-dedupe-actions", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "pfm-memora-btn-primary",
                  onClick: applyDedupe,
                  disabled: dedupeStatus === "applying",
                  children: [
                    "Erase ",
                    dedupeResult.duplicates.length,
                    " duplicate",
                    dedupeResult.duplicates.length === 1 ? "" : "s"
                  ]
                }
              ),
              /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: cancelDedupe, children: "Cancel" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-bank-header", children: "Sequence Bank" }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-active", children: [
            "Active set:\xA0",
            /* @__PURE__ */ jsx("code", { className: "pfm-memora-bank-active-label", children: effectiveSet.setLabel }),
            effectiveSet.isBuiltIn ? /* @__PURE__ */ jsx("span", { className: "pfm-memora-bank-active-tag", children: "built-in" }) : /* @__PURE__ */ jsx("span", { className: "pfm-memora-bank-active-tag pfm-memora-bank-active-tag--custom", children: "custom" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "pfm-memora-bank-body", children: "The active set defines the three primary sequences, the three outlier-retest sequences, and the nine retake sequences used across every candidate this machine runs. Set ID is recorded on every row in the daily summary and per-press detail CSV so downstream analysis can join data to the sequences that produced it. Generate a fresh set, import a set produced on another machine, or export the currently active set to share with other workstations." }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-actions", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-memora-btn-secondary",
                onClick: generatePendingSet,
                disabled: bankBusy || !!pendingSet,
                children: "Generate new set"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-memora-btn-secondary",
                onClick: () => {
                  setBankImportText("");
                  setBankImportError(null);
                  setPendingSet(null);
                  setBankBusy(false);
                  document.getElementById("pfm-memora-bank-import-area")?.focus();
                },
                children: "Import set\u2026"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-memora-btn-secondary",
                onClick: exportActiveSet,
                children: "Export current set"
              }
            ),
            !effectiveSet.isBuiltIn && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-memora-btn-secondary",
                onClick: revertToBuiltInSet,
                children: "Revert to built-in"
              }
            )
          ] }),
          !pendingSet && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-import", children: [
            /* @__PURE__ */ jsx("label", { className: "pfm-memora-bank-import-label", children: "Paste set JSON to import" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "pfm-memora-bank-import-area",
                className: "pfm-memora-bank-import-area",
                value: bankImportText,
                onChange: (e) => setBankImportText(e.target.value),
                placeholder: '{ "schemaVersion": 1, "setId": "\u2026", "primaries": [...], "retests": [...], "retakes": [...] }',
                rows: 4,
                spellCheck: false
              }
            ),
            bankImportText && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-import-actions", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "pfm-memora-btn-secondary",
                  onClick: () => importPendingSetFromText(bankImportText),
                  children: "Validate & preview"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "pfm-memora-btn-secondary",
                  onClick: () => {
                    setBankImportText("");
                    setBankImportError(null);
                  },
                  children: "Clear"
                }
              )
            ] }),
            bankImportError && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-result", "data-state": "error", children: [
              "\u26A0 ",
              bankImportError
            ] })
          ] }),
          pendingSet && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-preview", children: [
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-preview-title", children: [
              "Pending set: ",
              /* @__PURE__ */ jsx("code", { children: pendingSet.setLabel })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-preview-rows", children: [
              /* @__PURE__ */ jsx("span", { className: "pfm-memora-bank-preview-label", children: "Set ID" }),
              /* @__PURE__ */ jsx("code", { className: "pfm-memora-bank-preview-value", children: pendingSet.setId }),
              /* @__PURE__ */ jsx("span", { className: "pfm-memora-bank-preview-label", children: "Created" }),
              /* @__PURE__ */ jsx("code", { className: "pfm-memora-bank-preview-value", children: pendingSet.createdAt || "\u2014" }),
              /* @__PURE__ */ jsx("span", { className: "pfm-memora-bank-preview-label", children: "Primaries" }),
              /* @__PURE__ */ jsxs("code", { className: "pfm-memora-bank-preview-value", children: [
                pendingSet.primaries.length,
                " sequences \xD7 ",
                pendingSet.primaries[0]?.length ?? "?",
                " steps"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "pfm-memora-bank-preview-label", children: "Retests" }),
              /* @__PURE__ */ jsxs("code", { className: "pfm-memora-bank-preview-value", children: [
                pendingSet.retests.length,
                " sequences \xD7 ",
                pendingSet.retests[0]?.length ?? "?",
                " steps"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "pfm-memora-bank-preview-label", children: "Retakes" }),
              /* @__PURE__ */ jsxs("code", { className: "pfm-memora-bank-preview-value", children: [
                pendingSet.retakes.length,
                " sequences \xD7 ",
                pendingSet.retakes[0]?.length ?? "?",
                " steps"
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-bank-preview-note", children: "Locking in this set replaces the active set on this machine. The previous set is overwritten in IndexedDB but is not deleted from any JSON file you exported earlier. To deploy across multiple machines, export this set after locking it in and import it on each other machine." }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-bank-actions", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "pfm-memora-btn-primary",
                  onClick: lockPendingSet,
                  disabled: bankBusy,
                  children: "Lock in this set"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "pfm-memora-btn-secondary",
                  onClick: cancelPendingSet,
                  children: "Cancel"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] });
  }
  if (showPrep) {
    return /* @__PURE__ */ jsxs("div", { className: "pfm-memora-root", children: [
      typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-exit", onClick: onExit, children: "Close" }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-version-chip", "aria-label": `Memora version ${MODULE_VERSION}`, children: [
        "v",
        MODULE_VERSION
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-card", children: [
        /* @__PURE__ */ jsxs("p", { className: "pfm-memora-eyebrow", children: [
          "Memora",
          /* @__PURE__ */ jsx("span", { className: "pfm-memora-tm", children: "\u2122" }),
          " \xB7 Working Memory Test \xB7 v",
          MODULE_VERSION
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "pfm-memora-title", children: "Confirm Candidate" }),
        /* @__PURE__ */ jsx("p", { className: "pfm-memora-subtitle", children: "Enter the candidate's identifier to begin. This ID labels the candidate's row in the common ledger and names the per-candidate detail CSV that's saved at the end of the session." }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-prep-row", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "pfm-memora-prep-input",
              placeholder: "e.g., DC1001",
              value: candidateInput,
              onChange: (e) => setCandidateInput(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") confirmCandidate();
              },
              autoFocus: true,
              spellCheck: false,
              autoComplete: "off",
              "aria-label": "Candidate ID"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "pfm-memora-btn-primary",
              onClick: confirmCandidate,
              disabled: !candidateInput.trim(),
              children: "Start Test"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-audio-test", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-audio-test-header", children: "Test Sound" }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-memora-audio-test-body", children: [
            /* @__PURE__ */ jsx("div", { className: "pfm-memora-audio-test-dots", "aria-hidden": "true", children: COLORS.map((c) => /* @__PURE__ */ jsx(
              "span",
              {
                className: "pfm-memora-audio-test-dot",
                style: { "--dot-base": c.base, "--dot-glow": c.glow },
                "data-active": audioTestActive === c.id ? "true" : "false"
              },
              c.id
            )) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-memora-btn-secondary",
                onClick: testSound,
                disabled: audioTestStatus === "playing" || audioTestStatus === "unavailable",
                children: audioTestStatus === "playing" ? "Playing\u2026" : audioTestStatus === "played" ? "Play again" : "Play test tones"
              }
            ),
            /* @__PURE__ */ jsxs(
              "span",
              {
                className: "pfm-memora-audio-test-status",
                "data-state": audioTestStatus === "played" ? "ok" : audioTestStatus === "unavailable" ? "error" : "idle",
                children: [
                  audioTestStatus === "idle" && "Confirm audio is working before starting.",
                  audioTestStatus === "playing" && "Playing four tones\u2026",
                  audioTestStatus === "played" && "\u2713 Audio working",
                  audioTestStatus === "unavailable" && "\u26A0 Audio unavailable \u2014 check your sound or use a different browser."
                ]
              }
            )
          ] })
        ] }),
        (() => {
          const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          const trimmed = candidateInput.trim();
          const placeholderId = !trimmed;
          const candLabel = trimmed || "<candidate>";
          const summaryName = summaryFilenameFor(dateStr);
          const detailName = detailFilenameFor(candLabel, dateStr);
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "pfm-memora-files-header", children: "Files that will be saved" }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-files-grid", children: [
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-file-card", children: [
                /* @__PURE__ */ jsx("div", { className: "pfm-memora-file-kind", children: "Common ledger" }),
                /* @__PURE__ */ jsx("code", { className: "pfm-memora-file-name", children: summaryName }),
                /* @__PURE__ */ jsx("div", { className: "pfm-memora-file-note", children: "One row appended for this session. Shared across every candidate run today." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pfm-memora-file-card", children: [
                /* @__PURE__ */ jsx("div", { className: "pfm-memora-file-kind", children: "Candidate detail" }),
                /* @__PURE__ */ jsx("code", { className: "pfm-memora-file-name", "data-placeholder": placeholderId ? "true" : "false", children: detailName }),
                /* @__PURE__ */ jsxs("div", { className: "pfm-memora-file-note", children: [
                  "Per-press detail for ",
                  trimmed ? /* @__PURE__ */ jsx("b", { children: trimmed }) : "this candidate",
                  " only \u2014 fills in as you type the ID."
                ] })
              ] })
            ] })
          ] });
        })(),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-prep-storage", children: [
          /* @__PURE__ */ jsx("span", { children: folderName ? /* @__PURE__ */ jsxs(Fragment, { children: [
            "Saving CSVs to: ",
            /* @__PURE__ */ jsx("b", { children: folderName })
          ] }) : hasFsApi() ? /* @__PURE__ */ jsx(Fragment, { children: "No save folder set \u2014 choose one before starting (optional; falls back to your default Downloads)." }) : /* @__PURE__ */ jsx(Fragment, { children: "CSVs will download to your default Downloads folder." }) }),
          hasFsApi() && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: chooseFolder, children: folderName ? "Change folder" : "Choose folder" })
        ] })
      ] })
    ] });
  }
  if (showIntro) {
    return /* @__PURE__ */ jsxs("div", { className: "pfm-memora-root", children: [
      typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-exit", onClick: onExit, children: "Close" }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-version-chip", "aria-label": `Memora version ${MODULE_VERSION}`, children: [
        "v",
        MODULE_VERSION
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-card", children: [
        /* @__PURE__ */ jsxs("p", { className: "pfm-memora-eyebrow", children: [
          "Memora",
          /* @__PURE__ */ jsx("span", { className: "pfm-memora-tm", children: "\u2122" }),
          " \xB7 How It Works \xB7 v",
          MODULE_VERSION
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "pfm-memora-title", children: "Practice Sandbox" }),
        /* @__PURE__ */ jsxs("p", { className: "pfm-memora-subtitle", children: [
          "You can run up to ",
          /* @__PURE__ */ jsx("b", { children: "two practice rounds" }),
          " before the real test begins. Each one uses a random pattern (not from the real test) so you can feel how it grows and see what happens if you press a wrong button. No data is recorded during practice."
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "pfm-memora-setup-list", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "Watch" }),
            " \u2014 the four colored buttons will light up one at a time in a sequence. Each light is paired with a tone."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "Repeat" }),
            " \u2014 when the pattern finishes, click the same buttons in the same order. Get it right and the next pattern adds one more step. Practice ends when you reach ",
            /* @__PURE__ */ jsx("b", { children: "6 correct steps" }),
            " or press a wrong button."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("b", { children: "Wrong-press feedback" }),
            " \u2014 the screen flashes red, you'll hear a low tone, and a banner will say ",
            /* @__PURE__ */ jsx("b", { children: "Incorrect" }),
            ". Try pressing a wrong button on purpose at least once so you know what it looks like."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-setup-actions", children: [
          /* @__PURE__ */ jsxs("button", { type: "button", className: "pfm-memora-btn-primary", onClick: startPractice, children: [
            "Start Practice ",
            sandboxAttempts > 0 ? `(round ${sandboxAttempts + 1} of ${MAX_SANDBOX_ATTEMPTS})` : ""
          ] }),
          sandboxAttempts === 0 && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: startFirstTrial, children: "Skip to Trial 1" })
        ] })
      ] })
    ] });
  }
  if (showPracticeEnd) {
    return /* @__PURE__ */ jsxs("div", { className: "pfm-memora-root", children: [
      typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-exit", onClick: onExit, children: "Close" }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-version-chip", "aria-label": `Memora version ${MODULE_VERSION}`, children: [
        "v",
        MODULE_VERSION
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-memora-card", children: [
        /* @__PURE__ */ jsxs("p", { className: "pfm-memora-eyebrow", children: [
          "Memora",
          /* @__PURE__ */ jsx("span", { className: "pfm-memora-tm", children: "\u2122" }),
          " \xB7 Practice Complete \xB7 v",
          MODULE_VERSION
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "pfm-memora-title", children: "Ready for the Real Test?" }),
        /* @__PURE__ */ jsx("p", { className: "pfm-memora-subtitle", children: sandboxAttempts < MAX_SANDBOX_ATTEMPTS ? /* @__PURE__ */ jsxs(Fragment, { children: [
          "You've completed ",
          /* @__PURE__ */ jsxs("b", { children: [
            sandboxAttempts,
            " of ",
            MAX_SANDBOX_ATTEMPTS
          ] }),
          " practice rounds. You can run one more or start the real test \u2014 three trials, patterns grow each successful round."
        ] }) : /* @__PURE__ */ jsx(Fragment, { children: "You've used both practice rounds \u2014 time for the real test. Three trials, patterns grow each successful round, same red flash and tone if you press wrong." }) }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-setup-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-primary", onClick: startFirstTrial, children: "Start Trial 1" }),
          sandboxAttempts < MAX_SANDBOX_ATTEMPTS && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: startPractice, children: "Another practice round" })
        ] })
      ] })
    ] });
  }
  if (showResults) {
    const sessionDurationMs = sessionStartTimeRef.current && completionTimeMsRef.current ? Math.round(completionTimeMsRef.current - sessionStartTimeRef.current) : 0;
    return /* @__PURE__ */ jsx(
      ResultsView,
      {
        trials: completedTrialsRef.current,
        retest: retestDataRef.current,
        retakeOffered,
        onRetake: acceptRetake,
        onSkipRetake: declineRetake,
        onReset: resetAll,
        onStartRetake: startRetake,
        onExit,
        sessionId: sessionIdRef.current,
        sessionDurationMs,
        scores,
        originalScores,
        folderName,
        folderNeedsPermission,
        hasFsApi: hasFsApi(),
        onChooseFolder: chooseFolder,
        onSaveCsvs: saveCsvs,
        onDownloadSummary: downloadSummaryOnly,
        onDownloadDetail: downloadDetailOnly,
        saveStatus
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { className: "pfm-memora-root", "data-wrong": wrongFlash ? "true" : "false", children: [
    typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-exit", onClick: onExit, children: "Close" }),
    /* @__PURE__ */ jsxs("div", { className: "pfm-memora-version-chip", "aria-label": `Memora version ${MODULE_VERSION}`, children: [
      "v",
      MODULE_VERSION
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pfm-memora-card", "data-shake": wrongFlash ? "true" : "false", children: /* @__PURE__ */ jsxs("div", { className: "pfm-memora-grid", children: [
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs("p", { className: "pfm-memora-eyebrow", children: [
          "Memora",
          /* @__PURE__ */ jsx("span", { className: "pfm-memora-tm", children: "\u2122" }),
          " \xB7 Working Memory Test \xB7 v",
          MODULE_VERSION
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "pfm-memora-title", children: "Working Memory Pattern Recognition" }),
        /* @__PURE__ */ jsx("p", { className: "pfm-memora-subtitle", children: "Four-channel audiovisual pattern profile. Sequences start at three steps and grow by one each round until a mistake is made." }),
        /* @__PURE__ */ jsx("div", { className: "pfm-memora-buttons", role: "group", "aria-label": "Pattern buttons", children: COLORS.map((c) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "pfm-memora-btn",
            style: { "--btn-base": c.base, "--btn-glow": c.glow },
            "data-active": active === c.id ? "true" : "false",
            "data-armed": armed ? "true" : "false",
            onClick: () => handlePress(c.id),
            disabled: !armed,
            "aria-label": c.label,
            children: c.label
          },
          c.id
        )) }),
        wrongFlash && /* @__PURE__ */ jsx("div", { className: "pfm-memora-error-banner", role: "alert", children: message })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "pfm-memora-aside", children: [
        /* @__PURE__ */ jsx("div", { className: "pfm-memora-panel", children: /* @__PURE__ */ jsxs("div", { className: "pfm-memora-row", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-label", children: "Status" }),
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-status-msg", "data-wrong": wrongFlash ? "true" : "false", children: message })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-label", children: "Trial" }),
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-trial-counter", children: isPracticeTrial ? "Practice" : `${Math.min(trial, 3)}/3` })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-stats", children: [
          /* @__PURE__ */ jsxs("div", { className: "pfm-memora-panel", children: [
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-label", children: "Pattern Length" }),
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-stat-value", children: sequence.length || 3 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-memora-panel", children: [
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-label", children: "Speed" }),
            /* @__PURE__ */ jsx("p", { className: "pfm-memora-stat-value-sm", children: currentSpeed.label })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-panel", children: [
          /* @__PURE__ */ jsx("p", { className: "pfm-memora-label", style: { marginBottom: 10 }, children: "Trial Results" }),
          /* @__PURE__ */ jsx("div", { className: "pfm-memora-trials", children: [0, 1, 2].map((i) => /* @__PURE__ */ jsxs("div", { className: "pfm-memora-trial", children: [
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-trial-num", children: [
              "Trial ",
              i + 1
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pfm-memora-trial-score", children: scores[i] ?? "\u2014" })
          ] }, i)) }),
          finalSummary && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-summary", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Original values:" }),
              " ",
              (originalScores.length ? originalScores : scores).join(", ")
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Best span:" }),
              " ",
              finalSummary.best
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Median span:" }),
              " ",
              finalSummary.median
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Mean span:" }),
              " ",
              finalSummary.mean
            ] }),
            retestScore !== null && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Retest value:" }),
              " ",
              retestScore
            ] })
          ] }),
          retakeOffered && /* @__PURE__ */ jsxs("div", { className: "pfm-memora-retest", children: [
            /* @__PURE__ */ jsx("p", { children: "One trial value differs meaningfully from the other two. A single retake can improve confidence in the pattern-span estimate." }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-memora-actions", children: [
              /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-primary", onClick: acceptRetake, children: "Run Retake" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: declineRetake, children: "Skip" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-memora-actions", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "pfm-memora-btn-primary",
              onClick: () => startTrial(false),
              disabled: phase === "showing" || phase === "input" || scores.length >= 3,
              children: scores.length === 0 ? "Start Trial" : `Start Trial ${Math.min(trial, 3)}`
            }
          ),
          /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-memora-btn-secondary", onClick: resetAll, children: "Reset" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "pfm-memora-foot", children: "Scoring rule: each trial score is the longest correctly reproduced pattern length before failure." })
      ] })
    ] }) })
  ] });
}
var memoraModuleManifest = {
  id: MODULE_ID,
  name: "Memora",
  fullName: `Memora\u2122 Working Memory Test v${MODULE_VERSION}`,
  version: MODULE_VERSION,
  description: "Working memory pattern recognition. A four-channel audiovisual sequence grows by one step each round and probes sequential working memory capacity under increasing load. Uses three locked primary sequences randomized across trials plus a separate three-sequence retest pool, with silent timing capture and an in-module results page. Conforms to the NEXUS BprModuleResult contract.",
  category: "Cognitive Assessment",
  brand: "PerformOnomics",
  brandColor: BRAND.gold,
  estimatedDuration: "3-5 min",
  Component: MemoraComponent,
  // NEXUS BPR contract identifiers (see github.com/tnekomoto/nexus-module-api).
  module_code: MODULE_CODE,
  bpr_domain: BPR_DOMAIN,
  outputSchema: {
    // Conforms to BprModuleResult v1.0 from BprSessionContract.js.
    module_code: "string  // 'MEMORA'",
    module_version: "string  // semver",
    bpr_domain: "string  // 'Working Memory'",
    completed_at: "string  // ISO 8601",
    summary_metrics: {
      max_span: "number  // longest correctly reproduced pattern",
      mean_reaction_ms: "number  // mean per-press response time, ms (BPR contract)",
      median_reaction_ms: "number  // median per-press response time, ms (BPR contract)",
      trials_total: "number  // primary trials + retest if used",
      retest_used: "boolean",
      outcome: "string  // 'complete'"
    },
    raw_output: {
      // All timing values below are SECONDS, rounded to one decimal place.
      sessionId: "string",
      sessionDurationSec: "number",
      meanReactionSec: "number  // seconds mirror of mean_reaction_ms",
      medianReactionSec: "number  // seconds mirror of median_reaction_ms",
      trialOrder: "number[]  // primary-pool sequence IDs by trial position",
      trials: "Trial[]   // see trial shape",
      retest: "Trial | null",
      bestSpan: "number",
      medianSpan: "number",
      meanSpan: "number",
      candidate_id: "string | null  // mirrored from props.candidate.id",
      session_id: "string | null  // mirrored from props.session.id"
    },
    _trialShape: {
      trialNumber: "number",
      sequenceId: "number  // index into LOCKED_SEQUENCES (primary) or LOCKED_RETEST_SEQUENCES (retest)",
      score: "number",
      trialDurationSec: "number  // seconds, one decimal",
      totalResponseTimeSec: "number  // seconds, one decimal",
      startedAt: "string",
      endedAt: "string",
      rounds: "Round[]"
    },
    _roundShape: {
      length: "number",
      completed: "boolean",
      responseTimeSec: "number  // seconds, one decimal",
      presses: "{ id, expected, correct, dtSec, position }[]  // dtSec in seconds, one decimal"
    }
  }
};
var MemoraModule_default = memoraModuleManifest;
export {
  MODULE_ID,
  MODULE_VERSION,
  MemoraComponent,
  MemoraModule_default as default,
  memoraModuleManifest
};
