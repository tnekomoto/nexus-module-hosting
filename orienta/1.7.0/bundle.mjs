// ORIENTA_nexus.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var MODULE_ID = "orienta-spatial-orientation";
var MODULE_VERSION = "1.7.0";
var COMPASS_LOCKOUT_MS = 500;
var MODULE_CODE = "ORIENTA";
var BPR_DOMAIN = "Spatial Orientation";
var STYLE_ID = "pfm-orienta-styles";
var DEFAULT_PROTOCOL = {
  study_time_per_command_sec: 1.5,
  reversal_target: 6,
  level_cap: 18,
  bank_version: "1.0.0",
  max_trials: 30
};
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
  error: "#C44545",
  ok: "#4ADE80"
};
var DIRS = ["North", "East", "South", "West"];
var REL_OPTIONS = [
  { label: "Front", dx: 0, dy: -1, angle: 0 },
  { label: "Front-Right", dx: 1, dy: -1, angle: 45 },
  { label: "Right", dx: 1, dy: 0, angle: 90 },
  { label: "Back-Right", dx: 1, dy: 1, angle: 135 },
  { label: "Back", dx: 0, dy: 1, angle: 180 },
  { label: "Back-Left", dx: -1, dy: 1, angle: 225 },
  { label: "Left", dx: -1, dy: 0, angle: 270 },
  { label: "Front-Left", dx: -1, dy: -1, angle: 315 },
  { label: "Same Spot", dx: 0, dy: 0, angle: null }
];
var ANGLE_BY_LABEL = REL_OPTIONS.reduce((m, o) => {
  m[o.label] = o.angle;
  return m;
}, {});
var COMPASS_GRID = [
  "Front-Left",
  "Front",
  "Front-Right",
  "Left",
  "Same Spot",
  "Right",
  "Back-Left",
  "Back",
  "Back-Right"
];
function turnFacing(facing, turn) {
  const idx = DIRS.indexOf(facing);
  if (idx < 0) return "North";
  if (turn === "left") return DIRS[(idx + 3) % 4];
  if (turn === "right") return DIRS[(idx + 1) % 4];
  if (turn === "around") return DIRS[(idx + 2) % 4];
  return facing;
}
function stepDelta(facing, n) {
  if (facing === "North") return { x: 0, y: -n };
  if (facing === "East") return { x: n, y: 0 };
  if (facing === "South") return { x: 0, y: n };
  return { x: -n, y: 0 };
}
function relativeAnswer(pos, facing) {
  const vx = -pos.x;
  const vy = -pos.y;
  if (vx === 0 && vy === 0) return "Same Spot";
  let rx = vx, ry = vy;
  if (facing === "North") {
    rx = vx;
    ry = vy;
  } else if (facing === "East") {
    rx = vy;
    ry = -vx;
  } else if (facing === "South") {
    rx = -vx;
    ry = -vy;
  } else if (facing === "West") {
    rx = -vy;
    ry = vx;
  }
  const sx = Math.sign(rx);
  const sy = Math.sign(ry);
  const match = REL_OPTIONS.find((o) => o.dx === sx && o.dy === sy);
  return match ? match.label : "Same Spot";
}
function angularError(choiceLabel, correctLabel) {
  if (choiceLabel === correctLabel) return 0;
  const a = ANGLE_BY_LABEL[choiceLabel];
  const b = ANGLE_BY_LABEL[correctLabel];
  if (a == null || b == null) return null;
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}
function runDiagnostics() {
  const checks = [
    // Facing North — egocentric matches world.
    { pos: { x: 0, y: 1 }, facing: "North", expected: "Front" },
    { pos: { x: 0, y: -1 }, facing: "North", expected: "Back" },
    { pos: { x: 1, y: 0 }, facing: "North", expected: "Left" },
    { pos: { x: -1, y: 0 }, facing: "North", expected: "Right" },
    // Facing East — your left points north, your right points south.
    { pos: { x: 0, y: 1 }, facing: "East", expected: "Left" },
    { pos: { x: 0, y: -1 }, facing: "East", expected: "Right" },
    { pos: { x: 1, y: 0 }, facing: "East", expected: "Back" },
    { pos: { x: -1, y: 0 }, facing: "East", expected: "Front" },
    // Facing West — your left points south, your right points north.
    { pos: { x: 0, y: 1 }, facing: "West", expected: "Right" },
    { pos: { x: 0, y: -1 }, facing: "West", expected: "Left" },
    { pos: { x: 1, y: 0 }, facing: "West", expected: "Front" },
    { pos: { x: -1, y: 0 }, facing: "West", expected: "Back" },
    // Facing South — egocentric mirrors world.
    { pos: { x: 0, y: 1 }, facing: "South", expected: "Back" },
    { pos: { x: 0, y: -1 }, facing: "South", expected: "Front" },
    { pos: { x: 1, y: 0 }, facing: "South", expected: "Right" },
    { pos: { x: -1, y: 0 }, facing: "South", expected: "Left" }
  ];
  const failures = checks.filter((c) => relativeAnswer(c.pos, c.facing) !== c.expected);
  return { passed: failures.length === 0, failures, total: checks.length };
}
function mulberry32(seed) {
  let s = seed >>> 0;
  return function() {
    s = s + 1831565813 >>> 0;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function trialSeed(bankVersion, level, occurrence) {
  return fnv1a(`orienta|${bankVersion}|L${level}|N${occurrence}`);
}
function generateTrial(level, occurrence, bankVersion) {
  const rand = mulberry32(trialSeed(bankVersion, level, occurrence));
  const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
  let pos = { x: 0, y: 0 };
  let facing = "North";
  const commands = [];
  const steps = Math.min(4 + level, 18);
  const maxMove = Math.min(1 + Math.floor(level / 3), 5);
  const allowAround = level >= 6;
  for (let i = 0; i < steps; i += 1) {
    if (rand() < 0.45) {
      const n = randInt(1, maxMove);
      const d = stepDelta(facing, n);
      pos = { x: pos.x + d.x, y: pos.y + d.y };
      commands.push(`Move forward ${n}`);
    } else {
      const turns = allowAround ? ["left", "right", "around"] : ["left", "right"];
      const t = turns[randInt(0, turns.length - 1)];
      facing = turnFacing(facing, t);
      commands.push(t === "around" ? "Turn around" : `Turn ${t}`);
    }
  }
  if (pos.x === 0 && pos.y === 0) {
    const d = stepDelta(facing, 1);
    pos = { x: pos.x + d.x, y: pos.y + d.y };
    commands.push("Move forward 1");
  }
  const turnCount = commands.filter((c) => c.startsWith("Turn")).length;
  const aroundTurns = commands.filter((c) => c === "Turn around").length;
  const moveCount = commands.filter((c) => c.startsWith("Move forward")).length;
  const pathLength = commands.reduce((sum, c) => {
    if (c.startsWith("Move forward")) return sum + Number(c.split(" ").pop());
    return sum;
  }, 0);
  const manhattan = Math.abs(pos.x) + Math.abs(pos.y);
  return {
    level,
    occurrence,
    commands,
    finalPosition: pos,
    finalFacing: facing,
    answer: relativeAnswer(pos, facing),
    command_count: commands.length,
    turn_count: turnCount,
    around_turn_count: aroundTurns,
    move_count: moveCount,
    path_length: pathLength,
    manhattan_distance: manhattan
  };
}
function replayPath(commands) {
  let pos = { x: 0, y: 0 };
  let facing = "North";
  const points = [{ x: pos.x, y: pos.y, facing }];
  for (const cmd of commands) {
    if (cmd.startsWith("Move forward")) {
      const n = Number(cmd.split(" ").pop());
      const d = stepDelta(facing, n);
      pos = { x: pos.x + d.x, y: pos.y + d.y };
    } else if (cmd.includes("around")) {
      facing = turnFacing(facing, "around");
    } else if (cmd.includes("left")) {
      facing = turnFacing(facing, "left");
    } else if (cmd.includes("right")) {
      facing = turnFacing(facing, "right");
    }
    points.push({ x: pos.x, y: pos.y, facing });
  }
  return points;
}
function nextLevelAfter(currentLevel, correct, levelCap) {
  if (correct) return Math.min(levelCap, currentLevel + 1);
  return Math.max(1, currentLevel - 1);
}
function computeCapacity(reversals, reversalTarget) {
  if (!reversals.length) return null;
  const tail = reversals.slice(-Math.max(1, reversalTarget - 2));
  const levels = tail.map((r) => r.level);
  const sum = levels.reduce((a, b) => a + b, 0);
  const mean = sum / levels.length;
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  return {
    estimate: Math.round(mean * 10) / 10,
    ci_low: min,
    ci_high: max,
    ci_half_range: Math.round((max - min) / 2 * 10) / 10,
    reversals_used: levels.length
  };
}
function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}
function toSec(ms) {
  if (ms == null || isNaN(ms)) return null;
  return Math.round(ms / 100) / 10;
}
function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
function makeSessionId() {
  const rand = Math.random().toString(36).slice(2, 8);
  return `ori_${Date.now()}_${rand}`;
}
function formatDuration(ms) {
  if (ms == null || ms < 0 || isNaN(ms)) return "\u2014";
  const s = ms / 1e3;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = (s % 60).toFixed(1);
  return `${m}m ${r}s`;
}
var CSS = `
.pfm-orienta-root {
  position: relative;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: 28px 20px;
  background: radial-gradient(ellipse at top, #1a1610 0%, ${BRAND.bg} 65%);
  color: ${BRAND.text};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.pfm-orienta-root *, .pfm-orienta-root *::before, .pfm-orienta-root *::after { box-sizing: border-box; }

.pfm-orienta-card {
  max-width: 1080px;
  margin: 0 auto;
  background: linear-gradient(180deg, ${BRAND.surface} 0%, ${BRAND.surface2} 100%);
  border: 1px solid ${BRAND.border};
  border-radius: 22px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(212, 169, 92, 0.08);
  padding: 32px;
}

.pfm-orienta-eyebrow {
  font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;
  color: ${BRAND.gold}; font-weight: 600; margin: 0;
}
.pfm-orienta-title {
  font-size: 28px; font-weight: 700; line-height: 1.15; margin: 8px 0 10px;
  background: linear-gradient(135deg, ${BRAND.goldLight} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
.pfm-orienta-subtitle {
  color: ${BRAND.muted}; font-size: 14px; line-height: 1.55;
  margin: 0 0 18px; max-width: 56ch;
}
.pfm-orienta-tm { font-size: 0.6em; vertical-align: super; opacity: 0.8; }

.pfm-orienta-grid {
  display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 32px; align-items: start;
}
@media (max-width: 820px) {
  .pfm-orienta-grid { grid-template-columns: 1fr; gap: 22px; }
  .pfm-orienta-card { padding: 24px; }
}

.pfm-orienta-panel {
  background: rgba(11, 9, 5, 0.55);
  border: 1px solid ${BRAND.border};
  border-radius: 16px;
  padding: 16px 18px;
}
.pfm-orienta-label {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: ${BRAND.muted}; margin: 0 0 4px;
}
.pfm-orienta-stat-value {
  font-size: 26px; font-weight: 800; margin: 2px 0 0; color: ${BRAND.text};
  font-variant-numeric: tabular-nums;
}
.pfm-orienta-aside { display: flex; flex-direction: column; gap: 14px; }
.pfm-orienta-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.pfm-orienta-status {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.pfm-orienta-status-msg { font-size: 15px; font-weight: 600; margin: 0; color: ${BRAND.text}; }

.pfm-orienta-pill {
  display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  border: 1px solid ${BRAND.border}; color: ${BRAND.muted}; background: rgba(0,0,0,0.4);
}
.pfm-orienta-pill[data-tone="study"]    { color: ${BRAND.goldLight}; border-color: ${BRAND.borderStrong}; }
.pfm-orienta-pill[data-tone="answer"]   { color: #93C5FD; border-color: rgba(147, 197, 253, 0.4); }
.pfm-orienta-pill[data-tone="correct"]  { color: ${BRAND.ok}; border-color: rgba(74, 222, 128, 0.4); }
.pfm-orienta-pill[data-tone="wrong"]    { color: #FCA5A5; border-color: rgba(252, 165, 165, 0.4); }

/* --- Study phase --- */
.pfm-orienta-startfacing {
  font-size: 14px; line-height: 1.55; color: ${BRAND.text};
  margin: 0 0 14px;
}
.pfm-orienta-startfacing b { color: ${BRAND.goldLight}; }

.pfm-orienta-commands {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
}
@media (max-width: 540px) {
  .pfm-orienta-commands { grid-template-columns: 1fr; }
}
.pfm-orienta-command {
  background: rgba(0,0,0,0.45); border: 1px solid ${BRAND.border};
  border-radius: 12px; padding: 10px 14px;
  font-size: 14px; font-weight: 600; color: ${BRAND.text};
}
.pfm-orienta-command-num { color: ${BRAND.muted}; margin-right: 8px; font-weight: 500; }

.pfm-orienta-countdown {
  margin-top: 16px; padding: 14px 16px;
  border: 1px solid ${BRAND.border}; border-radius: 14px;
  background: rgba(0,0,0,0.4);
}
.pfm-orienta-countdown-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12.5px; color: ${BRAND.muted}; margin-bottom: 8px;
  letter-spacing: 0.16em; text-transform: uppercase;
}
.pfm-orienta-countdown-row b { color: ${BRAND.goldLight}; font-variant-numeric: tabular-nums; }
.pfm-orienta-countdown-bar {
  height: 8px; border-radius: 999px; overflow: hidden;
  background: rgba(255,255,255,0.07);
}
.pfm-orienta-countdown-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, ${BRAND.goldLight}, ${BRAND.gold});
  transition: width 100ms linear;
}
.pfm-orienta-countdown-fill[data-warn="true"] {
  background: linear-gradient(90deg, ${BRAND.warn}, #E26A3F);
}

/* --- Answer phase: 9-button compass --- */
.pfm-orienta-prompt {
  background: rgba(0,0,0,0.45); border: 1px solid ${BRAND.border};
  border-radius: 14px; padding: 14px 18px; margin-bottom: 16px;
}
.pfm-orienta-prompt h3 { margin: 0 0 4px; font-size: 16px; color: ${BRAND.text}; font-weight: 700; }
.pfm-orienta-prompt p  { margin: 0; font-size: 13px; color: ${BRAND.muted}; line-height: 1.5; }

.pfm-orienta-compass {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  max-width: 480px;
  transition: opacity 300ms ease;
}
/* v1.6.0 \u2014 compass lockout. Dimmed + click-blocked until armed. The
 * data-armed attribute defaults to "true" in legacy contexts (worked
 * example compass), so only the real-test compass renders dimmed when
 * the lockout is active. */
.pfm-orienta-compass[data-armed="false"] {
  opacity: 0.4;
  pointer-events: none;
}
.pfm-orienta-compass[data-armed="true"] {
  opacity: 1;
}
.pfm-orienta-compass-btn {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex; align-items: center; justify-content: center; text-align: center;
  border-radius: 14px;
  border: 1px solid ${BRAND.border};
  background: rgba(0,0,0,0.5);
  color: ${BRAND.text};
  font-family: inherit; font-size: 12.5px; font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 90ms ease, background 90ms ease, border-color 90ms ease;
  padding: 8px;
}
.pfm-orienta-compass-btn:hover:not(:disabled) {
  background: rgba(212, 169, 92, 0.10);
  border-color: ${BRAND.borderStrong};
}
.pfm-orienta-compass-btn:active:not(:disabled) { transform: scale(0.96); }
.pfm-orienta-compass-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.pfm-orienta-compass-btn[data-selected="true"] {
  background: linear-gradient(135deg, ${BRAND.goldLight} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);
  color: #1A1308; border-color: ${BRAND.gold};
}
.pfm-orienta-compass-btn[data-center="true"] {
  background: rgba(11, 9, 5, 0.7);
  border-style: dashed;
  color: ${BRAND.muted};
  font-size: 11px;
}
.pfm-orienta-compass-btn[data-center="true"][data-selected="true"] {
  background: linear-gradient(135deg, ${BRAND.goldLight} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);
  color: #1A1308; border-style: solid;
}

/* --- Buttons --- */
.pfm-orienta-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.pfm-orienta-btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 11px 22px; border-radius: 12px; border: none;
  font-family: inherit; font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
  cursor: pointer;
  background: linear-gradient(135deg, ${BRAND.goldLight} 0%, ${BRAND.gold} 50%, ${BRAND.goldDark} 100%);
  color: #1A1308;
  box-shadow: 0 6px 18px rgba(212, 169, 92, 0.28);
  transition: filter 100ms ease, transform 80ms ease;
}
.pfm-orienta-btn-primary:hover:not(:disabled) { filter: brightness(1.08); }
.pfm-orienta-btn-primary:active:not(:disabled) { transform: translateY(1px); }
.pfm-orienta-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

.pfm-orienta-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 11px 20px; border-radius: 12px;
  font-family: inherit; font-size: 14px; font-weight: 600;
  cursor: pointer; background: transparent; color: ${BRAND.gold};
  border: 1px solid ${BRAND.borderStrong};
  transition: background 100ms ease;
}
.pfm-orienta-btn-secondary:hover { background: rgba(212, 169, 92, 0.08); }

.pfm-orienta-exit {
  position: absolute; top: 18px; right: 22px;
  background: transparent; border: 1px solid ${BRAND.border};
  color: ${BRAND.muted}; border-radius: 999px;
  padding: 6px 14px; font-size: 12px; font-family: inherit; cursor: pointer;
}
.pfm-orienta-exit:hover { color: ${BRAND.gold}; border-color: ${BRAND.borderStrong}; }

.pfm-orienta-foot {
  font-size: 11.5px; line-height: 1.55; color: ${BRAND.muted};
  margin: 16px 0 0; max-width: 56ch;
}

/* --- Intro screen --- */
.pfm-orienta-intro-list {
  margin: 16px 0 0; padding: 0; list-style: none;
  display: flex; flex-direction: column; gap: 10px;
}
.pfm-orienta-intro-list li {
  background: rgba(0,0,0,0.4); border: 1px solid ${BRAND.border};
  border-radius: 12px; padding: 12px 16px;
  font-size: 13.5px; line-height: 1.55; color: ${BRAND.text};
}
.pfm-orienta-intro-list b { color: ${BRAND.goldLight}; }

/* --- Pre-test countdown (v1.3.0) --- */
.pfm-orienta-countdown-card {
  text-align: center;
  padding: 8px 4px 4px;
}
.pfm-orienta-bigcountdown {
  margin: 24px auto 18px;
  width: 180px; height: 180px;
  border-radius: 50%;
  border: 3px solid ${BRAND.borderStrong};
  background:
    radial-gradient(circle at center, rgba(212, 169, 92, 0.12) 0%, rgba(0,0,0,0) 70%);
  color: ${BRAND.goldLight};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 96px;
  font-weight: 800;
  line-height: 180px;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 24px rgba(242, 214, 128, 0.45);
  animation: pfm-orienta-pulse 1s ease-in-out infinite;
}
@keyframes pfm-orienta-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
.pfm-orienta-reminders {
  margin: 8px auto 0;
  padding: 0;
  list-style: none;
  text-align: left;
  max-width: 540px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pfm-orienta-reminders li {
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid ${BRAND.border};
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 14px;
  line-height: 1.55;
  color: ${BRAND.text};
}
.pfm-orienta-reminders b {
  color: ${BRAND.goldLight};
}

/* --- Confirm phase (identity gate) --- */
.pfm-orienta-confirm-card {
  text-align: center;
  padding: 8px 4px 4px;
}
.pfm-orienta-confirm-prompt {
  color: ${BRAND.muted};
  font-size: 14px;
  line-height: 1.55;
  margin: 14px 0 18px;
  max-width: 56ch;
  margin-left: auto;
  margin-right: auto;
}
.pfm-orienta-confirm-code {
  display: inline-block;
  margin: 6px 0 16px;
  padding: 18px 36px;
  border: 1px solid ${BRAND.borderStrong};
  border-radius: 16px;
  background: rgba(212, 169, 92, 0.06);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: ${BRAND.goldLight};
  font-variant-numeric: tabular-nums;
}
.pfm-orienta-confirm-code[data-missing="true"] {
  font-size: 16px;
  letter-spacing: 0.04em;
  color: ${BRAND.muted};
  font-style: italic;
  font-family: inherit;
}
.pfm-orienta-confirm-help {
  color: ${BRAND.muted};
  font-size: 12.5px;
  margin: 8px 0 22px;
}
.pfm-orienta-confirm-actions {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
}

/* --- Results --- */
.pfm-orienta-results-meta {
  display: flex; flex-wrap: wrap; gap: 18px;
  color: ${BRAND.muted}; font-size: 13px; margin: 4px 0 18px;
}
.pfm-orienta-results-meta b { color: ${BRAND.gold}; font-weight: 600; }

.pfm-orienta-summary-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0 22px;
}
@media (max-width: 720px) { .pfm-orienta-summary-row { grid-template-columns: repeat(2, 1fr); } }
.pfm-orienta-summary-stat {
  background: rgba(11,9,5,0.55); border: 1px solid ${BRAND.border};
  border-radius: 14px; padding: 16px 18px; text-align: center;
}
.pfm-orienta-summary-stat-label {
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: ${BRAND.muted};
}
.pfm-orienta-summary-stat-value {
  font-size: 28px; font-weight: 800; color: ${BRAND.text};
  margin-top: 6px; font-variant-numeric: tabular-nums;
}
.pfm-orienta-summary-stat-sub {
  font-size: 11px; color: ${BRAND.muted}; margin-top: 4px; letter-spacing: 0.04em;
}

.pfm-orienta-trial-card {
  background: rgba(11,9,5,0.6); border: 1px solid ${BRAND.border};
  border-radius: 14px; padding: 14px 16px; margin-top: 10px;
}
.pfm-orienta-trial-header {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 10px;
}
.pfm-orienta-trial-header h3 {
  margin: 0; font-size: 12.5px; letter-spacing: 0.16em; text-transform: uppercase;
  color: ${BRAND.gold}; font-weight: 700;
}
.pfm-orienta-trial-stats {
  display: flex; flex-wrap: wrap; gap: 12px; font-size: 12.5px; color: #C9BBA0;
}
.pfm-orienta-trial-stats b { color: ${BRAND.muted}; font-weight: 500; margin-right: 4px; }
.pfm-orienta-trial-tag { font-weight: 700; }
.pfm-orienta-trial-tag[data-correct="true"]  { color: ${BRAND.ok}; }
.pfm-orienta-trial-tag[data-correct="false"] { color: #FCA5A5; }
.pfm-orienta-trial-tag[data-reversal="true"] {
  display: inline-block; background: rgba(212, 169, 92, 0.18);
  border: 1px solid ${BRAND.borderStrong}; color: ${BRAND.goldLight};
  padding: 2px 8px; border-radius: 999px; font-size: 11px; letter-spacing: 0.1em;
}

.pfm-orienta-trial-detail {
  margin-top: 12px; padding-top: 12px;
  border-top: 1px solid rgba(212, 169, 92, 0.12);
  display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: start;
}
@media (max-width: 720px) { .pfm-orienta-trial-detail { grid-template-columns: 1fr; } }

.pfm-orienta-cmd-list {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 12.5px; color: ${BRAND.text};
}
.pfm-orienta-cmd-list span { color: ${BRAND.muted}; margin-right: 6px; }

.pfm-orienta-map-wrap {
  background: rgba(0,0,0,0.4); border: 1px solid ${BRAND.border};
  border-radius: 12px; padding: 8px;
}

.pfm-orienta-toggle {
  border: none; background: transparent; color: ${BRAND.gold};
  font: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer;
  letter-spacing: 0.12em; text-transform: uppercase;
}
.pfm-orienta-toggle:hover { color: ${BRAND.goldLight}; }

.pfm-orienta-error-banner {
  margin-top: 14px; padding: 14px 18px; border-radius: 12px;
  background: rgba(220, 38, 38, 0.18);
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #FECACA; font-size: 14px; font-weight: 600;
  text-align: center;
}

/* --- Worked example phase (pre-test walkthrough) --- */
.pfm-orienta-example-grid {
  display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;
}
@media (max-width: 820px) {
  .pfm-orienta-example-grid { grid-template-columns: 1fr; gap: 18px; }
}
.pfm-orienta-example-banner {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 12px; border-radius: 999px;
  background: rgba(212, 169, 92, 0.10); border: 1px solid ${BRAND.borderStrong};
  color: ${BRAND.goldLight}; font-size: 11px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 10px;
}
.pfm-orienta-example-cmds {
  /* v1.7.0 \u2014 match the real-test 2-column grid so candidates train on the
   * left\u2192right + top\u2192bottom reading pattern, not a single-column scroll. */
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  margin: 14px 0 18px;
}
@media (max-width: 540px) {
  .pfm-orienta-example-cmds { grid-template-columns: 1fr; }
}
.pfm-orienta-example-cmd {
  background: rgba(0,0,0,0.45); border: 1px solid ${BRAND.border};
  border-radius: 12px; padding: 10px 14px;
  font-size: 14px; font-weight: 600; color: ${BRAND.muted};
  display: flex; align-items: center; gap: 10px;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.pfm-orienta-example-cmd[data-state="done"] {
  color: ${BRAND.text};
}
.pfm-orienta-example-cmd[data-state="current"] {
  background: rgba(212, 169, 92, 0.10);
  border-color: ${BRAND.borderStrong};
  color: ${BRAND.goldLight};
}
.pfm-orienta-example-cmd-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  font-size: 11px; font-weight: 800;
  background: rgba(0,0,0,0.4); color: ${BRAND.muted};
  border: 1px solid ${BRAND.border};
}
.pfm-orienta-example-cmd[data-state="done"] .pfm-orienta-example-cmd-num {
  background: ${BRAND.gold}; color: #1A1308; border-color: ${BRAND.gold};
}
.pfm-orienta-example-cmd[data-state="current"] .pfm-orienta-example-cmd-num {
  background: ${BRAND.goldLight}; color: #1A1308; border-color: ${BRAND.goldLight};
}
.pfm-orienta-example-callout {
  margin-top: 16px; padding: 14px 16px; border-radius: 12px;
  background: rgba(232, 184, 85, 0.08);
  border: 1px solid rgba(232, 184, 85, 0.45);
  color: #F2DBA0; font-size: 13.5px; line-height: 1.55;
}
.pfm-orienta-example-callout b { color: ${BRAND.goldLight}; }
.pfm-orienta-example-callout-warn {
  background: rgba(220, 38, 38, 0.10);
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #FECACA;
}
.pfm-orienta-example-callout-warn b { color: #FCA5A5; }
.pfm-orienta-example-result {
  margin-top: 12px; padding: 12px 16px; border-radius: 12px;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; gap: 10px;
}
.pfm-orienta-example-result[data-correct="true"] {
  background: rgba(74, 222, 128, 0.10);
  border: 1px solid rgba(74, 222, 128, 0.40);
  color: ${BRAND.ok};
}
.pfm-orienta-example-result[data-correct="false"] {
  background: rgba(220, 38, 38, 0.10);
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #FCA5A5;
}
`;
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
function MiniMap({ commands }) {
  const points = useMemo(() => replayPath(commands || []), [commands]);
  if (!points.length) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs, -2);
  const maxX = Math.max(...xs, 2);
  const minY = Math.min(...ys, -2);
  const maxY = Math.max(...ys, 2);
  const w = 260, h = 220, pad = 26;
  const sx = (x) => pad + (x - minX) / Math.max(1, maxX - minX) * (w - pad * 2);
  const sy = (y) => pad + (y - minY) / Math.max(1, maxY - minY) * (h - pad * 2);
  const line = points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
  const end = points[points.length - 1];
  return /* @__PURE__ */ jsxs("svg", { width: w, height: h, style: { display: "block", borderRadius: 10, background: "rgba(0,0,0,0.35)" }, children: [
    /* @__PURE__ */ jsx(
      "polyline",
      {
        points: line,
        fill: "none",
        stroke: BRAND.goldLight,
        strokeWidth: "3",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    ),
    /* @__PURE__ */ jsx("circle", { cx: sx(0), cy: sy(0), r: "6", fill: BRAND.ok }),
    /* @__PURE__ */ jsx("text", { x: sx(0) + 9, y: sy(0) - 8, fontSize: "11", fill: BRAND.ok, children: "Start" }),
    /* @__PURE__ */ jsx("circle", { cx: sx(end.x), cy: sy(end.y), r: "6", fill: BRAND.error }),
    /* @__PURE__ */ jsx("text", { x: sx(end.x) + 9, y: sy(end.y) + 14, fontSize: "11", fill: "#F2A6A6", children: "You" })
  ] });
}
var EXAMPLE_TRIAL = {
  commands: [
    "Move forward 1",
    // (0,-1)  N
    "Turn right",
    // (0,-1)  E
    "Move forward 1",
    // (1,-1)  E
    "Turn left",
    // (1,-1)  N
    "Move forward 1",
    // (1,-2)  N
    "Turn right"
    // (1,-2)  E
  ],
  finalPosition: { x: 1, y: -2 },
  finalFacing: "East",
  answer: relativeAnswer({ x: 1, y: -2 }, "East")
  // → "Back-Right"
};
var TIMED_EXAMPLE_TRIAL = {
  commands: [
    "Move forward 1",
    // (0,-1)  N
    "Turn left",
    // (0,-1)  W
    "Move forward 1",
    // (-1,-1) W
    "Turn around",
    // (-1,-1) E
    "Move forward 1"
    // (0,-1)  E
  ],
  finalPosition: { x: 0, y: -1 },
  finalFacing: "East",
  answer: relativeAnswer({ x: 0, y: -1 }, "East")
  // → "Right"
};
function WorkedExampleMap({ commands, step, width = 320, height = 280 }) {
  const fullPoints = useMemo(() => replayPath(commands || []), [commands]);
  if (!fullPoints.length) return null;
  const xs = fullPoints.map((p) => p.x);
  const ys = fullPoints.map((p) => p.y);
  const minX = Math.min(...xs, -1);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, -1);
  const maxY = Math.max(...ys, 1);
  const pad = 36;
  const sx = (x) => pad + (x - minX) / Math.max(1, maxX - minX) * (width - pad * 2);
  const sy = (y) => pad + (y - minY) / Math.max(1, maxY - minY) * (height - pad * 2);
  const visible = fullPoints.slice(0, Math.max(1, step + 1));
  const visibleLine = visible.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
  const futureLine = fullPoints.slice(step).map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
  const here = visible[visible.length - 1];
  const FACE_DEG = { North: 0, East: 90, South: 180, West: 270 };
  const facingDeg = FACE_DEG[here.facing] ?? 0;
  const gridLines = [];
  for (let gx = Math.floor(minX); gx <= Math.ceil(maxX); gx++) {
    gridLines.push(/* @__PURE__ */ jsx(
      "line",
      {
        x1: sx(gx),
        y1: pad,
        x2: sx(gx),
        y2: height - pad,
        stroke: "rgba(212, 169, 92, 0.10)",
        strokeDasharray: "2 4"
      },
      `vx${gx}`
    ));
  }
  for (let gy = Math.floor(minY); gy <= Math.ceil(maxY); gy++) {
    gridLines.push(/* @__PURE__ */ jsx(
      "line",
      {
        x1: pad,
        y1: sy(gy),
        x2: width - pad,
        y2: sy(gy),
        stroke: "rgba(212, 169, 92, 0.10)",
        strokeDasharray: "2 4"
      },
      `hy${gy}`
    ));
  }
  return /* @__PURE__ */ jsxs("svg", { width, height, style: {
    display: "block",
    borderRadius: 12,
    background: "rgba(0,0,0,0.45)",
    border: `1px solid ${BRAND.border}`
  }, children: [
    gridLines,
    /* @__PURE__ */ jsxs("g", { transform: `translate(${width - 28}, ${pad - 4})`, children: [
      /* @__PURE__ */ jsx("text", { fontSize: "10", fill: BRAND.muted, textAnchor: "middle", y: "-2", children: "N" }),
      /* @__PURE__ */ jsx("line", { x1: "0", y1: "2", x2: "0", y2: "14", stroke: BRAND.muted, strokeWidth: "1.5" }),
      /* @__PURE__ */ jsx("polygon", { points: "0,0 -3,5 3,5", fill: BRAND.muted })
    ] }),
    step < fullPoints.length - 1 && /* @__PURE__ */ jsx(
      "polyline",
      {
        points: futureLine,
        fill: "none",
        stroke: BRAND.gold,
        strokeOpacity: "0.22",
        strokeWidth: "3",
        strokeDasharray: "4 5",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    ),
    /* @__PURE__ */ jsx(
      "polyline",
      {
        points: visibleLine,
        fill: "none",
        stroke: BRAND.goldLight,
        strokeWidth: "4",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    ),
    /* @__PURE__ */ jsx("circle", { cx: sx(0), cy: sy(0), r: "7", fill: BRAND.ok }),
    /* @__PURE__ */ jsx("text", { x: sx(0) + 11, y: sy(0) - 9, fontSize: "11", fill: BRAND.ok, fontWeight: "700", children: "Start" }),
    /* @__PURE__ */ jsxs("g", { transform: `translate(${sx(here.x)}, ${sy(here.y)}) rotate(${facingDeg})`, children: [
      /* @__PURE__ */ jsx("circle", { r: "11", fill: BRAND.surface, stroke: BRAND.gold, strokeWidth: "2" }),
      /* @__PURE__ */ jsx("polygon", { points: "0,-7 5,4 0,1 -5,4", fill: BRAND.gold })
    ] }),
    /* @__PURE__ */ jsxs("text", { x: sx(here.x) + 14, y: sy(here.y) + 16, fontSize: "11", fill: BRAND.text, fontWeight: "700", children: [
      "You \xB7 facing ",
      here.facing
    ] })
  ] });
}
function TrialResultCard({ record, index }) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-trial-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-trial-header", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        "Trial ",
        index + 1,
        " \xB7 L",
        record.level,
        record.is_reversal && /* @__PURE__ */ jsx("span", { className: "pfm-orienta-trial-tag", "data-reversal": "true", style: { marginLeft: 10 }, children: "REVERSAL" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-trial-stats", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Result" }),
          /* @__PURE__ */ jsx("span", { className: "pfm-orienta-trial-tag", "data-correct": record.correct ? "true" : "false", children: record.correct ? "\u2713 correct" : `\u2715 ${record.angular_error_deg ?? "\u2014"}\xB0 off` })
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Study" }),
          formatDuration(record.studyTimeMs),
          record.timed_out ? " \u23F1" : ""
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Decision" }),
          formatDuration(record.decisionTimeMs)
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-toggle", onClick: () => setOpen((v) => !v), children: open ? "Hide path" : "Show path" })
      ] })
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-trial-detail", children: [
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-cmd-list", children: [
        /* @__PURE__ */ jsxs("div", { style: { marginBottom: 8, fontSize: 12, color: BRAND.muted, letterSpacing: "0.12em", textTransform: "uppercase" }, children: [
          "Commands \xB7 final facing ",
          record.finalFacing
        ] }),
        record.commands.map((c, i) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { children: [
            i + 1,
            "."
          ] }),
          c
        ] }, i)),
        /* @__PURE__ */ jsxs("div", { style: { marginTop: 8, fontSize: 12, color: BRAND.muted }, children: [
          "Correct answer: ",
          /* @__PURE__ */ jsx("b", { style: { color: BRAND.text }, children: record.expectedAnswer }),
          !record.correct && /* @__PURE__ */ jsxs(Fragment, { children: [
            " \xB7 ",
            "You picked: ",
            /* @__PURE__ */ jsx("b", { style: { color: "#F2A6A6" }, children: record.choice })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pfm-orienta-map-wrap", children: /* @__PURE__ */ jsx(MiniMap, { commands: record.commands }) })
    ] })
  ] });
}
function ResultsView({
  trials,
  summary,
  candidateCode,
  sessionDurationMs,
  protocolUsed,
  onReset,
  onExit
}) {
  return /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-root", children: [
    typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-exit", onClick: onExit, children: "Close" }),
    /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-card", children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-eyebrow", children: [
        "Orienta",
        /* @__PURE__ */ jsx("span", { className: "pfm-orienta-tm", children: "\u2122" }),
        " \xB7 Results"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "pfm-orienta-title", children: "Spatial Orientation Capacity Profile" }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-results-meta", children: [
        candidateCode && /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Candidate:" }),
          " ",
          candidateCode
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Total time:" }),
          " ",
          formatDuration(sessionDurationMs)
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("b", { children: "Trials:" }),
          " ",
          trials.length
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-row", children: [
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-stat", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-label", children: "Spatial Capacity" }),
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-value", children: summary.spatial_capacity_level || "\u2014" }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-stat-sub", children: [
            "of ",
            protocolUsed.level_cap,
            " levels"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-stat", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-label", children: "Direction Precision" }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-stat-value", children: [
            summary.direction_precision_pct,
            "%"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-sub", children: "on-target alignment" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-stat", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-label", children: "Processing Speed" }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-stat-value", children: [
            summary.processing_speed_sec_per_step,
            "s"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-sub", children: "per step" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-summary-stat", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-label", children: "Consistency" }),
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-value", children: summary.consistency_pct == null ? "\u2014" : `${summary.consistency_pct}%` }),
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-summary-stat-sub", children: "capacity reliability" })
        ] })
      ] }),
      trials.map((t, i) => /* @__PURE__ */ jsx(TrialResultCard, { record: t, index: i }, i)),
      /* @__PURE__ */ jsx("div", { className: "pfm-orienta-actions", style: { marginTop: 20 }, children: /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-primary", onClick: onReset, children: "Run Again" }) }),
      /* @__PURE__ */ jsx("p", { className: "pfm-orienta-foot", children: "Your full result \u2014 including every trial, every timing, and the adaptive staircase detail \u2014 has been recorded for the assessment session and is available to your administrator on request." })
    ] })
  ] });
}
function OrientaComponent({ onComplete, onExit, candidate, session, protocol }) {
  const protocolUsed = useMemo(() => ({ ...DEFAULT_PROTOCOL, ...protocol || {} }), [protocol]);
  const [phase, setPhase] = useState("confirm");
  const [exampleStep, setExampleStep] = useState(0);
  const [exampleChoice, setExampleChoice] = useState(null);
  const [timedExampleChoice, setTimedExampleChoice] = useState(null);
  const [level, setLevel] = useState(1);
  const [trial, setTrial] = useState(null);
  const [trialNumber, setTrialNumber] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [studyMsRemaining, setStudyMsRemaining] = useState(0);
  const [studyMsTotal, setStudyMsTotal] = useState(0);
  const [compassArmed, setCompassArmed] = useState(false);
  const [preCountdownSec, setPreCountdownSec] = useState(0);
  const [countdownArmed, setCountdownArmed] = useState(false);
  const sessionIdRef = useRef(null);
  const sessionStartRef = useRef(null);
  const studyStartRef = useRef(null);
  const decisionStartRef = useRef(null);
  const tickHandleRef = useRef(null);
  const advanceHandleRef = useRef(null);
  const armCompassRef = useRef(null);
  const trialsRef = useRef([]);
  const reversalsRef = useRef([]);
  const directionRef = useRef(null);
  const occurrenceMapRef = useRef({});
  const completedRef = useRef(false);
  const sessionEndRef = useRef(null);
  const diagnostics = useMemo(() => runDiagnostics(), []);
  useEffect(() => {
    ensureStyles();
    return () => {
      if (tickHandleRef.current) clearInterval(tickHandleRef.current);
      if (advanceHandleRef.current) clearTimeout(advanceHandleRef.current);
      if (armCompassRef.current) clearTimeout(armCompassRef.current);
    };
  }, []);
  function clearTimers() {
    if (tickHandleRef.current) {
      clearInterval(tickHandleRef.current);
      tickHandleRef.current = null;
    }
    if (advanceHandleRef.current) {
      clearTimeout(advanceHandleRef.current);
      advanceHandleRef.current = null;
    }
    if (armCompassRef.current) {
      clearTimeout(armCompassRef.current);
      armCompassRef.current = null;
    }
  }
  function pickTrial(forLevel) {
    const occurrence = occurrenceMapRef.current[forLevel] || 0;
    occurrenceMapRef.current[forLevel] = occurrence + 1;
    return generateTrial(forLevel, occurrence, protocolUsed.bank_version);
  }
  function beginExample() {
    setExampleStep(0);
    setExampleChoice(null);
    setPhase("example_walk");
  }
  function exampleNextStep() {
    setExampleStep((s) => Math.min(s + 1, EXAMPLE_TRIAL.commands.length));
  }
  function exampleReplay() {
    setExampleStep(0);
  }
  function exampleAnswer() {
    setPhase("example_answer");
  }
  function exampleSubmit(label) {
    setExampleChoice(label);
    setPhase("example_review");
  }
  function beginTimedExample() {
    clearTimers();
    setTimedExampleChoice(null);
    setSelected(null);
    const cmdCount = TIMED_EXAMPLE_TRIAL.commands.length;
    const studyCapMs = Math.max(
      2e3,
      Math.round(protocolUsed.study_time_per_command_sec * 1e3 * cmdCount)
    );
    setStudyMsTotal(studyCapMs);
    setStudyMsRemaining(studyCapMs);
    setCompassArmed(false);
    studyStartRef.current = nowMs();
    setPhase("timed_example_study");
    tickHandleRef.current = setInterval(() => {
      const elapsed = nowMs() - studyStartRef.current;
      const remaining = Math.max(0, studyCapMs - elapsed);
      setStudyMsRemaining(remaining);
      if (remaining <= 0) {
        clearTimers();
        advanceTimedExampleToAnswer();
      }
    }, 100);
  }
  function advanceTimedExampleToAnswer() {
    clearTimers();
    setStudyMsRemaining(0);
    setCompassArmed(false);
    setPhase("timed_example_answer");
    if (armCompassRef.current) clearTimeout(armCompassRef.current);
    armCompassRef.current = setTimeout(() => {
      setCompassArmed(true);
    }, COMPASS_LOCKOUT_MS);
  }
  function submitTimedExample(label) {
    if (!compassArmed) return;
    setTimedExampleChoice(label);
    setPhase("timed_example_review");
  }
  const PRE_TEST_COUNTDOWN_SEC = 5;
  function startSession() {
    sessionIdRef.current = makeSessionId();
    sessionStartRef.current = nowMs();
    trialsRef.current = [];
    reversalsRef.current = [];
    directionRef.current = null;
    occurrenceMapRef.current = {};
    completedRef.current = false;
    sessionEndRef.current = null;
    setLevel(1);
    setTrialNumber(0);
    setPreCountdownSec(PRE_TEST_COUNTDOWN_SEC);
    setCountdownArmed(false);
    setPhase("pre_test_countdown");
  }
  function armCountdown() {
    setCountdownArmed(true);
  }
  useEffect(() => {
    if (phase !== "pre_test_countdown") return;
    if (!countdownArmed) return;
    if (preCountdownSec <= 0) {
      beginTrial(1);
      return;
    }
    const t = setTimeout(() => setPreCountdownSec((s) => s - 1), 1e3);
    return () => clearTimeout(t);
  }, [phase, preCountdownSec, countdownArmed]);
  function beginTrial(forLevel) {
    clearTimers();
    const t = pickTrial(forLevel);
    const studyCapMs = Math.max(2e3, Math.round(protocolUsed.study_time_per_command_sec * 1e3 * t.commands.length));
    setTrial(t);
    setSelected(null);
    setFeedback(null);
    setLevel(forLevel);
    setTrialNumber((n) => n + 1);
    setPhase("study");
    setStudyMsTotal(studyCapMs);
    setStudyMsRemaining(studyCapMs);
    studyStartRef.current = nowMs();
    tickHandleRef.current = setInterval(() => {
      const elapsed = nowMs() - studyStartRef.current;
      const remaining = Math.max(0, studyCapMs - elapsed);
      setStudyMsRemaining(remaining);
      if (remaining <= 0) {
        clearTimers();
        advanceToAnswer(true);
      }
    }, 100);
  }
  function advanceToAnswer(timedOut = false) {
    clearTimers();
    const studyEnd = nowMs();
    const studyMs = Math.round(studyEnd - studyStartRef.current);
    setStudyMsRemaining(0);
    setCompassArmed(false);
    setPhase("answer");
    trialDraftRef.current = {
      studyTimeMs: studyMs,
      timed_out: timedOut
    };
    if (armCompassRef.current) clearTimeout(armCompassRef.current);
    armCompassRef.current = setTimeout(() => {
      decisionStartRef.current = nowMs();
      setCompassArmed(true);
    }, COMPASS_LOCKOUT_MS);
  }
  const trialDraftRef = useRef(null);
  function submit(choice) {
    if (phase !== "answer") return;
    if (!compassArmed) return;
    const decisionEnd = nowMs();
    const decisionMs = Math.round(decisionEnd - (decisionStartRef.current ?? decisionEnd));
    const correct = choice === trial.answer;
    const angErr = angularError(choice, trial.answer);
    const newLevel = nextLevelAfter(level, correct, protocolUsed.level_cap);
    const newDirection = newLevel > level ? "up" : newLevel < level ? "down" : null;
    const prevDirection = directionRef.current;
    let isReversal = false;
    if (prevDirection && newDirection && newDirection !== prevDirection) {
      isReversal = true;
      reversalsRef.current.push({
        trialNumber,
        level,
        direction: newDirection
      });
    }
    if (newDirection) directionRef.current = newDirection;
    const draft = trialDraftRef.current || { studyTimeMs: 0, timed_out: false };
    const record = {
      trialNumber,
      level,
      occurrence: trial.occurrence,
      bank_version: protocolUsed.bank_version,
      commands: trial.commands,
      finalPosition: trial.finalPosition,
      finalFacing: trial.finalFacing,
      expectedAnswer: trial.answer,
      choice,
      correct,
      angular_error_deg: angErr,
      studyTimeMs: draft.studyTimeMs,
      decisionTimeMs: decisionMs,
      totalTrialMs: draft.studyTimeMs + decisionMs,
      timed_out: draft.timed_out,
      is_reversal: isReversal,
      command_count: trial.command_count,
      turn_count: trial.turn_count,
      around_turn_count: trial.around_turn_count,
      move_count: trial.move_count,
      path_length: trial.path_length,
      manhattan_distance: trial.manhattan_distance,
      startedAt: new Date(Date.now() - draft.studyTimeMs - decisionMs).toISOString(),
      endedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    trialsRef.current.push(record);
    trialDraftRef.current = null;
    setSelected(choice);
    setFeedback({ correct, angular_error: angErr });
    setPhase("feedback");
    const reversalsHit = reversalsRef.current.length >= protocolUsed.reversal_target;
    const trialsHit = trialsRef.current.length >= protocolUsed.max_trials;
    const ceilingPlateau = isCeilingPlateau(trialsRef.current, protocolUsed.level_cap);
    const shouldStop = reversalsHit || trialsHit || ceilingPlateau;
    advanceHandleRef.current = setTimeout(() => {
      if (shouldStop) {
        finalize({
          terminationReason: reversalsHit ? "reversal_target_met" : trialsHit ? "max_trials_reached" : "ceiling_plateau",
          ceilingHit: ceilingPlateau || reversalsHit && level >= protocolUsed.level_cap
        });
      } else {
        beginTrial(newLevel);
      }
    }, 900);
  }
  function isCeilingPlateau(trials, levelCap) {
    const tail = trials.slice(-5);
    if (tail.length < 5) return false;
    return tail.every((t) => t.level === levelCap && t.correct);
  }
  function finalize({ terminationReason, ceilingHit }) {
    if (completedRef.current) return;
    completedRef.current = true;
    sessionEndRef.current = nowMs();
    setPhase("done");
    const trials = trialsRef.current;
    const decisions = trials.map((t) => t.decisionTimeMs);
    const studies = trials.map((t) => t.studyTimeMs);
    const studyPerCmd = trials.map((t) => t.studyTimeMs / Math.max(1, t.command_count));
    const angErrs = trials.map((t) => t.angular_error_deg).filter((v) => v != null);
    const passed = trials.filter((t) => t.correct).length;
    const failed = trials.length - passed;
    const accPct = trials.length ? Math.round(passed / trials.length * 100) : 0;
    const meanDec = decisions.length ? Math.round(decisions.reduce((a, b) => a + b, 0) / decisions.length) : 0;
    const medDec = decisions.length ? Math.round(median(decisions)) : 0;
    const meanStudy = studies.length ? Math.round(studies.reduce((a, b) => a + b, 0) / studies.length) : 0;
    const meanStudyPerCmd = studyPerCmd.length ? Math.round(studyPerCmd.reduce((a, b) => a + b, 0) / studyPerCmd.length) : 0;
    const medianStudyPerCmd = studyPerCmd.length ? Math.round(median(studyPerCmd)) : 0;
    const meanAngErr = angErrs.length ? Math.round(angErrs.reduce((a, b) => a + b, 0) / angErrs.length) : 0;
    const oppositeErrors = trials.filter((t) => t.angular_error_deg === 180).length;
    const timeoutCount = trials.filter((t) => t.timed_out).length;
    const cap = computeCapacity(reversalsRef.current, protocolUsed.reversal_target);
    const accByAround = {};
    const accByFacing = {};
    for (const t of trials) {
      const k = String(t.around_turn_count);
      if (!accByAround[k]) accByAround[k] = { n: 0, c: 0 };
      accByAround[k].n += 1;
      if (t.correct) accByAround[k].c += 1;
      if (!accByFacing[t.finalFacing]) accByFacing[t.finalFacing] = { n: 0, c: 0 };
      accByFacing[t.finalFacing].n += 1;
      if (t.correct) accByFacing[t.finalFacing].c += 1;
    }
    const pctMap = (m) => {
      const out = {};
      for (const k in m) out[k] = { n: m[k].n, accuracy_pct: Math.round(m[k].c / m[k].n * 100) };
      return out;
    };
    const sessionDurationMs = sessionStartRef.current ? Math.round(sessionEndRef.current - sessionStartRef.current) : 0;
    const spatialCapacityLevel = cap ? cap.estimate : 0;
    const directionPrecisionPct = angErrs.length ? Math.round(100 - meanAngErr / 180 * 100) : 0;
    const totalStudyMs = studies.reduce((a, b) => a + b, 0);
    const totalDecisionMs = decisions.reduce((a, b) => a + b, 0);
    const totalCommands = trials.reduce((a, t) => a + (t.command_count || 0), 0);
    const processingSpeedSecPerStep = totalCommands ? Math.round((totalStudyMs + totalDecisionMs) / totalCommands / 100) / 10 : 0;
    const frameStabilityPct = trials.length ? Math.round(100 - oppositeErrors / trials.length * 100) : 100;
    const consistencyPct = cap ? Math.max(0, Math.round(100 - cap.ci_half_range * 20)) : null;
    const completedAtIso = (/* @__PURE__ */ new Date()).toISOString();
    const dateOnly = completedAtIso.slice(0, 10);
    const csvHeader = [
      "session_label",
      "module_code",
      "module_version",
      "completed_at",
      "candidate_code",
      "session_id",
      "spatial_capacity_level",
      "direction_precision_pct",
      "processing_speed_sec_per_step",
      "consistency_pct",
      "trials_total",
      "bank_version",
      "study_time_per_command_sec"
    ];
    const csvRow = [
      `SpatialOrientation_${dateOnly}`,
      MODULE_CODE,
      MODULE_VERSION,
      completedAtIso,
      candidate?.candidate_code ?? candidate?.id ?? "",
      session?.id ?? "",
      spatialCapacityLevel,
      directionPrecisionPct,
      processingSpeedSecPerStep,
      consistencyPct ?? "",
      trials.length,
      protocolUsed.bank_version,
      protocolUsed.study_time_per_command_sec
    ];
    const result = {
      module_code: MODULE_CODE,
      module_version: MODULE_VERSION,
      bpr_domain: BPR_DOMAIN,
      completed_at: completedAtIso,
      summary_metrics: {
        max_span: spatialCapacityLevel,
        accuracy_pct: accPct,
        mean_reaction_ms: meanDec,
        median_reaction_ms: medDec,
        trials_total: trials.length,
        trials_passed: passed,
        trials_failed: failed,
        // v1.2.0 — the four candidate-facing BPR numbers.
        spatial_capacity_level: spatialCapacityLevel,
        direction_precision_pct: directionPrecisionPct,
        processing_speed_sec_per_step: processingSpeedSecPerStep,
        // v1.4.0 — Consistency replaces Frame Stability as the displayed
        // 4th BPR number. Frame Stability still stamped for v1.3.x consumers.
        consistency_pct: consistencyPct,
        frame_stability_pct: frameStabilityPct,
        outcome: ceilingHit ? "complete" : terminationReason === "reversal_target_met" ? "complete" : "partial"
      },
      raw_output: {
        sessionId: sessionIdRef.current,
        sessionDurationSec: toSec(sessionDurationMs),
        // capacity confidence
        capacity_estimate: cap ? cap.estimate : null,
        capacity_ci_low: cap ? cap.ci_low : null,
        capacity_ci_high: cap ? cap.ci_high : null,
        capacity_ci_half_range: cap ? cap.ci_half_range : null,
        reversals: reversalsRef.current,
        reversal_count: reversalsRef.current.length,
        termination_reason: terminationReason,
        ceiling_hit: !!ceilingHit,
        // timing decomposition
        mean_decision_ms: meanDec,
        median_decision_ms: medDec,
        mean_decision_sec: toSec(meanDec),
        mean_study_ms: meanStudy,
        mean_study_sec: toSec(meanStudy),
        mean_study_ms_per_command: meanStudyPerCmd,
        median_study_ms_per_command: medianStudyPerCmd,
        timeout_trials_count: timeoutCount,
        // error topology
        mean_angular_error_deg: meanAngErr,
        opposite_errors_count: oppositeErrors,
        // load attribution
        accuracy_by_around_turn_count: pctMap(accByAround),
        accuracy_by_final_facing: pctMap(accByFacing),
        // per-trial atoms
        trials: trials.map((t) => ({
          trialNumber: t.trialNumber,
          level: t.level,
          occurrence: t.occurrence,
          commands: t.commands,
          finalPosition: t.finalPosition,
          finalFacing: t.finalFacing,
          expectedAnswer: t.expectedAnswer,
          choice: t.choice,
          correct: t.correct,
          angular_error_deg: t.angular_error_deg,
          studyTimeSec: toSec(t.studyTimeMs),
          decisionTimeSec: toSec(t.decisionTimeMs),
          totalTrialSec: toSec(t.totalTrialMs),
          timed_out: t.timed_out,
          is_reversal: t.is_reversal,
          command_count: t.command_count,
          turn_count: t.turn_count,
          around_turn_count: t.around_turn_count,
          move_count: t.move_count,
          path_length: t.path_length,
          manhattan_distance: t.manhattan_distance,
          startedAt: t.startedAt,
          endedAt: t.endedAt
        })),
        // candidate-facing BPR numbers (mirrored into raw_output for
        // downstream tooling that reads from raw_output instead of summary)
        spatial_capacity_level: spatialCapacityLevel,
        direction_precision_pct: directionPrecisionPct,
        processing_speed_sec_per_step: processingSpeedSecPerStep,
        consistency_pct: consistencyPct,
        frame_stability_pct: frameStabilityPct,
        // legacy
        // CSV row — NEXUS aggregates these across modules into one CSV.
        // Each module provides both header + row; NEXUS handles the file.
        csv_header: csvHeader,
        csv_row: csvRow,
        // provenance
        protocol: protocolUsed,
        diagnostics_passed: diagnostics.passed,
        candidate_id: candidate?.id ?? null,
        candidate_code: candidate?.candidate_code ?? null,
        session_id: session?.id ?? null
      }
    };
    if (typeof onComplete === "function") onComplete(result);
  }
  function reset() {
    clearTimers();
    completedRef.current = false;
    sessionIdRef.current = null;
    sessionStartRef.current = null;
    sessionEndRef.current = null;
    trialsRef.current = [];
    reversalsRef.current = [];
    directionRef.current = null;
    occurrenceMapRef.current = {};
    trialDraftRef.current = null;
    setPhase("intro");
    setTrial(null);
    setTrialNumber(0);
    setLevel(1);
    setSelected(null);
    setFeedback(null);
    setStudyMsRemaining(0);
    setStudyMsTotal(0);
    setExampleStep(0);
    setExampleChoice(null);
    setTimedExampleChoice(null);
    setCompassArmed(false);
  }
  if (phase === "done") {
    const trials = trialsRef.current;
    const cap = computeCapacity(reversalsRef.current, protocolUsed.reversal_target);
    const angErrs = trials.map((t) => t.angular_error_deg).filter((v) => v != null);
    const meanAngErr = angErrs.length ? Math.round(angErrs.reduce((a, b) => a + b, 0) / angErrs.length) : 0;
    const oppositeErrors = trials.filter((t) => t.angular_error_deg === 180).length;
    const totalStudyMs = trials.reduce((a, t) => a + (t.studyTimeMs || 0), 0);
    const totalDecisionMs = trials.reduce((a, t) => a + (t.decisionTimeMs || 0), 0);
    const totalCommands = trials.reduce((a, t) => a + (t.command_count || 0), 0);
    const spatialCapacityLevel = cap ? cap.estimate : 0;
    const directionPrecisionPct = angErrs.length ? Math.round(100 - meanAngErr / 180 * 100) : 0;
    const processingSpeedSecPerStep = totalCommands ? Math.round((totalStudyMs + totalDecisionMs) / totalCommands / 100) / 10 : 0;
    const consistencyPct = cap ? Math.max(0, Math.round(100 - cap.ci_half_range * 20)) : null;
    const sessionDurationMs = sessionStartRef.current && sessionEndRef.current ? Math.round(sessionEndRef.current - sessionStartRef.current) : 0;
    return /* @__PURE__ */ jsx(
      ResultsView,
      {
        trials,
        summary: {
          spatial_capacity_level: spatialCapacityLevel,
          direction_precision_pct: directionPrecisionPct,
          processing_speed_sec_per_step: processingSpeedSecPerStep,
          consistency_pct: consistencyPct
        },
        candidateCode: candidate?.candidate_code || null,
        sessionDurationMs,
        protocolUsed,
        onReset: reset,
        onExit
      }
    );
  }
  let pillTone = "study", pillText = "Study";
  if (phase === "answer") {
    pillTone = "answer";
    pillText = "Answer";
  }
  if (phase === "feedback") {
    pillTone = feedback?.correct ? "correct" : "wrong";
    pillText = feedback?.correct ? "Correct" : "Incorrect";
  }
  const studyPct = studyMsTotal ? studyMsRemaining / studyMsTotal * 100 : 0;
  const studyWarn = studyMsTotal && studyMsRemaining / studyMsTotal < 0.25;
  return /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-root", children: [
    typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-exit", onClick: onExit, children: "Close" }),
    /* @__PURE__ */ jsx("div", { className: "pfm-orienta-card", children: phase === "confirm" ? /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-confirm-card", children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-eyebrow", children: [
        "Orienta",
        /* @__PURE__ */ jsx("span", { className: "pfm-orienta-tm", children: "\u2122" }),
        " \xB7 Spatial Orientation Test"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "pfm-orienta-title", children: "Confirm your identity" }),
      /* @__PURE__ */ jsx("p", { className: "pfm-orienta-confirm-prompt", children: "You are about to take the Orienta Spatial Orientation assessment. Please confirm the candidate code below matches the one you were assigned." }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "pfm-orienta-confirm-code",
          "data-missing": candidate?.candidate_code ? "false" : "true",
          "aria-label": "Candidate code",
          children: candidate?.candidate_code || "(no candidate code provided)"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "pfm-orienta-confirm-help", children: "If this is not your code, exit and notify your administrator." }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-confirm-actions", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "pfm-orienta-btn-primary",
            onClick: () => setPhase("intro"),
            children: "Yes, this is me \u2014 continue"
          }
        ),
        typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-secondary", onClick: onExit, children: "Exit" })
      ] })
    ] }) : phase === "intro" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-eyebrow", children: [
        "Orienta",
        /* @__PURE__ */ jsx("span", { className: "pfm-orienta-tm", children: "\u2122" }),
        " \xB7 Spatial Orientation Test"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "pfm-orienta-title", children: "Egocentric Path Integration" }),
      /* @__PURE__ */ jsx("p", { className: "pfm-orienta-subtitle", children: "You will be given a list of movement commands \u2014 moves and turns \u2014 to follow mentally, starting from facing North. After each set, identify where the starting point is now relative to your imagined facing direction." }),
      /* @__PURE__ */ jsxs("ul", { className: "pfm-orienta-intro-list", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          "You will start each trial facing ",
          /* @__PURE__ */ jsx("b", { children: "North" }),
          ". ",
          /* @__PURE__ */ jsx("b", { children: "Use anything you want" }),
          " to keep track of where you are and which way you're facing \u2014 your hands, a pencil as a pointer, gestures, turning your body \u2014 all fine. Just ",
          /* @__PURE__ */ jsx("b", { children: "no drawing or writing" }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "You have a limited time to study the commands (",
          protocolUsed.study_time_per_command_sec.toFixed(1),
          " seconds per move). A countdown is shown."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "When the timer ends \u2014 or when you tap the ",
          /* @__PURE__ */ jsx("b", { children: "Answer" }),
          " button \u2014 you'll choose where the start is, relative to your final facing."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "The test adapts: correct answers raise difficulty, mistakes lower it. It ends after ",
          /* @__PURE__ */ jsxs("b", { children: [
            protocolUsed.reversal_target,
            " reversals"
          ] }),
          " or the difficulty ceiling."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Before the first trial we'll walk through a worked example with a visual map. The real trials will ",
          /* @__PURE__ */ jsx("b", { children: "not" }),
          " show the map."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-primary", onClick: beginExample, children: "See the example" }),
        typeof onExit === "function" && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-secondary", onClick: onExit, children: "Exit" })
      ] }),
      !diagnostics.passed && /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-error-banner", children: [
        "Direction-math diagnostics failed (",
        diagnostics.failures.length,
        "/",
        diagnostics.total,
        "). Do not use this build for licensed testing."
      ] })
    ] }) : phase === "example_walk" || phase === "example_answer" || phase === "example_review" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-eyebrow", children: [
        "Orienta",
        /* @__PURE__ */ jsx("span", { className: "pfm-orienta-tm", children: "\u2122" }),
        " \xB7 Worked Example"
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "pfm-orienta-title", style: { fontSize: 24 }, children: [
        phase === "example_walk" && "Walk through the example",
        phase === "example_answer" && "Now you try",
        phase === "example_review" && "Here's why"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "pfm-orienta-example-banner", children: [
        phase === "example_walk" && "Practice \u2014 visual aid shown",
        phase === "example_answer" && "Practice \u2014 answer the question",
        phase === "example_review" && "Practice \u2014 explanation"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-example-grid", children: [
        /* @__PURE__ */ jsxs("section", { children: [
          /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-startfacing", children: [
            "Imagine you start at ",
            /* @__PURE__ */ jsx("b", { children: "Start" }),
            " facing ",
            /* @__PURE__ */ jsx("b", { children: "North" }),
            ". Track your position and facing direction as the commands are applied."
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-example-cmds", children: EXAMPLE_TRIAL.commands.map((cmd, i) => {
            const isDone = i < exampleStep;
            const isCurrent = i === exampleStep - 1 && phase === "example_walk";
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: "pfm-orienta-example-cmd",
                "data-state": isCurrent ? "current" : isDone ? "done" : "pending",
                children: [
                  /* @__PURE__ */ jsx("span", { className: "pfm-orienta-example-cmd-num", children: i + 1 }),
                  /* @__PURE__ */ jsx("span", { children: cmd })
                ]
              },
              i
            );
          }) }),
          phase === "example_walk" && /* @__PURE__ */ jsx(Fragment, { children: exampleStep < EXAMPLE_TRIAL.commands.length ? /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-actions", children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-primary", onClick: exampleNextStep, children: exampleStep === 0 ? "Begin walkthrough \u2192" : "Next step \u2192" }),
            exampleStep > 0 && /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-secondary", onClick: exampleReplay, children: "Replay from start" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-example-callout", children: [
              "You've followed all the commands. You are now at the position shown on the map, facing ",
              /* @__PURE__ */ jsx("b", { children: EXAMPLE_TRIAL.finalFacing }),
              ". Where is the original ",
              /* @__PURE__ */ jsx("b", { children: "Start" }),
              " point relative to your ",
              /* @__PURE__ */ jsx("i", { children: "current facing" }),
              "?"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-actions", children: [
              /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-primary", onClick: exampleAnswer, children: "Answer the question" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-secondary", onClick: exampleReplay, children: "Replay" })
            ] })
          ] }) }),
          phase === "example_answer" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-prompt", children: [
              /* @__PURE__ */ jsx("h3", { children: "Where is the start point relative to you now?" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "You are facing ",
                /* @__PURE__ */ jsx("b", { children: EXAMPLE_TRIAL.finalFacing }),
                ". Pick the answer from your current imagined facing direction."
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pfm-orienta-compass", role: "group", "aria-label": "Direction options", children: COMPASS_GRID.map((label) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-orienta-compass-btn",
                "data-selected": exampleChoice === label ? "true" : "false",
                "data-center": label === "Same Spot" ? "true" : "false",
                onClick: () => exampleSubmit(label),
                children: label
              },
              label
            )) })
          ] }),
          phase === "example_review" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "pfm-orienta-example-result",
                "data-correct": exampleChoice === EXAMPLE_TRIAL.answer ? "true" : "false",
                children: exampleChoice === EXAMPLE_TRIAL.answer ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  "\u2713 Correct \u2014 you picked ",
                  /* @__PURE__ */ jsx("b", { children: exampleChoice }),
                  "."
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  "\u2715 You picked ",
                  /* @__PURE__ */ jsx("b", { children: exampleChoice }),
                  ". The correct answer was ",
                  /* @__PURE__ */ jsx("b", { children: EXAMPLE_TRIAL.answer }),
                  "."
                ] })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-example-callout", children: [
              "You ended up at position (",
              EXAMPLE_TRIAL.finalPosition.x,
              ",",
              " ",
              EXAMPLE_TRIAL.finalPosition.y,
              ") facing ",
              /* @__PURE__ */ jsx("b", { children: EXAMPLE_TRIAL.finalFacing }),
              ". The Start point is to your ",
              /* @__PURE__ */ jsx("b", { children: "back-and-right" }),
              ", so the answer is",
              " ",
              /* @__PURE__ */ jsx("b", { children: EXAMPLE_TRIAL.answer }),
              ". The map below shows your full path."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-example-callout pfm-orienta-example-callout-warn", children: [
              "\u26A0 ",
              /* @__PURE__ */ jsx("b", { children: "The real trials will not show this map." }),
              " Use anything you want to track your position and facing \u2014 hands, a pencil as a pointer, gestures, turning your body \u2014 all fine. Just ",
              /* @__PURE__ */ jsx("b", { children: "no drawing or writing" }),
              ". A countdown timer starts when each trial appears."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-example-callout", children: [
              "Next you'll do ",
              /* @__PURE__ */ jsx("b", { children: "one timed practice trial" }),
              " just like the real test \u2014 same timer, no map. It does not count toward your score."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-actions", children: [
              /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-primary", onClick: beginTimedExample, children: "Try a timed practice \u2192" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-secondary", onClick: beginExample, children: "Replay example" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("aside", { children: [
          /* @__PURE__ */ jsx(
            WorkedExampleMap,
            {
              commands: EXAMPLE_TRIAL.commands,
              step: phase === "example_walk" ? exampleStep : EXAMPLE_TRIAL.commands.length
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "pfm-orienta-foot", style: { marginTop: 10 }, children: "This map is a teaching aid. The chevron shows your facing direction. The green dot is the Start point." })
        ] })
      ] })
    ] }) : phase === "timed_example_study" || phase === "timed_example_answer" || phase === "timed_example_review" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-eyebrow", children: [
        "Orienta",
        /* @__PURE__ */ jsx("span", { className: "pfm-orienta-tm", children: "\u2122" }),
        " \xB7 Timed Practice"
      ] }),
      /* @__PURE__ */ jsxs("h1", { className: "pfm-orienta-title", style: { fontSize: 24 }, children: [
        phase === "timed_example_study" && "Timed practice \u2014 no map this time",
        phase === "timed_example_answer" && "Where is the start point?",
        phase === "timed_example_review" && (timedExampleChoice === TIMED_EXAMPLE_TRIAL.answer ? "Nice \u2014 you got it" : "Off \u2014 here's why")
      ] }),
      /* @__PURE__ */ jsx("p", { className: "pfm-orienta-subtitle", children: phase === "timed_example_study" ? "Same timer, same rules as the real test. This one doesn't count toward your score." : phase === "timed_example_answer" ? "You're facing East. Pick the direction the Start point is in from your current facing." : "The map below shows the path you just followed. The real test starts next." }),
      phase === "timed_example_study" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-startfacing", children: [
          "You are facing ",
          /* @__PURE__ */ jsx("b", { children: "North" }),
          ". Follow these commands mentally."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pfm-orienta-commands", children: TIMED_EXAMPLE_TRIAL.commands.map((cmd, i) => /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-command", children: [
          /* @__PURE__ */ jsxs("span", { className: "pfm-orienta-command-num", children: [
            i + 1,
            "."
          ] }),
          cmd
        ] }, i)) }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-countdown", children: [
          /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-countdown-row", children: [
            /* @__PURE__ */ jsx("span", { children: "Study time" }),
            /* @__PURE__ */ jsxs("b", { children: [
              (studyMsRemaining / 1e3).toFixed(1),
              "s"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-countdown-bar", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "pfm-orienta-countdown-fill",
              style: { width: `${studyMsTotal ? studyMsRemaining / studyMsTotal * 100 : 0}%` },
              "data-warn": studyMsTotal && studyMsRemaining / studyMsTotal < 0.25 ? "true" : "false"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pfm-orienta-actions", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "pfm-orienta-btn-primary",
            onClick: () => advanceTimedExampleToAnswer(),
            children: "I have it \u2014 Answer"
          }
        ) })
      ] }),
      phase === "timed_example_answer" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-prompt", children: [
          /* @__PURE__ */ jsx("h3", { children: "Where is the start point relative to you now?" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "You are facing ",
            /* @__PURE__ */ jsx("b", { children: TIMED_EXAMPLE_TRIAL.finalFacing }),
            ". Pick from your ",
            /* @__PURE__ */ jsx("i", { children: "current" }),
            " imagined facing direction."
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "pfm-orienta-compass",
            role: "group",
            "aria-label": "Direction options",
            "data-armed": compassArmed ? "true" : "false",
            children: COMPASS_GRID.map((label) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-orienta-compass-btn",
                "data-selected": timedExampleChoice === label ? "true" : "false",
                "data-center": label === "Same Spot" ? "true" : "false",
                disabled: !compassArmed,
                onClick: () => submitTimedExample(label),
                children: label
              },
              label
            ))
          }
        )
      ] }),
      phase === "timed_example_review" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "pfm-orienta-example-result",
            "data-correct": timedExampleChoice === TIMED_EXAMPLE_TRIAL.answer ? "true" : "false",
            children: timedExampleChoice === TIMED_EXAMPLE_TRIAL.answer ? /* @__PURE__ */ jsxs(Fragment, { children: [
              "\u2713 You picked ",
              /* @__PURE__ */ jsx("b", { children: timedExampleChoice }),
              ", which was correct."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              "\u2715 You picked ",
              /* @__PURE__ */ jsx("b", { children: timedExampleChoice }),
              ". The correct answer was ",
              /* @__PURE__ */ jsx("b", { children: TIMED_EXAMPLE_TRIAL.answer }),
              "."
            ] })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-example-callout", children: [
          "You ended at position (",
          TIMED_EXAMPLE_TRIAL.finalPosition.x,
          ",",
          " ",
          TIMED_EXAMPLE_TRIAL.finalPosition.y,
          ") facing ",
          /* @__PURE__ */ jsx("b", { children: TIMED_EXAMPLE_TRIAL.finalFacing }),
          ". The Start point is to your ",
          /* @__PURE__ */ jsx("b", { children: "right" }),
          ", so the answer is",
          " ",
          /* @__PURE__ */ jsx("b", { children: TIMED_EXAMPLE_TRIAL.answer }),
          "."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pfm-orienta-example-callout pfm-orienta-example-callout-warn", children: "\u26A0 The next trials count toward your score, and the map won't be shown." }),
        /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-primary", onClick: startSession, children: "Start the real test \u2192" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "pfm-orienta-btn-secondary", onClick: beginTimedExample, children: "Try the timed practice again" })
        ] })
      ] }),
      phase === "timed_example_review" && /* @__PURE__ */ jsxs("div", { style: { marginTop: 16 }, children: [
        /* @__PURE__ */ jsx(
          WorkedExampleMap,
          {
            commands: TIMED_EXAMPLE_TRIAL.commands,
            step: TIMED_EXAMPLE_TRIAL.commands.length
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "pfm-orienta-foot", style: { marginTop: 10 }, children: "Green dot is Start. The chevron shows your facing direction at the end." })
      ] })
    ] }) : phase === "pre_test_countdown" ? /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-countdown-card", children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-eyebrow", children: [
        "Orienta",
        /* @__PURE__ */ jsx("span", { className: "pfm-orienta-tm", children: "\u2122" }),
        " \xB7 Get Ready"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "pfm-orienta-title", style: { fontSize: 26 }, children: countdownArmed ? "The real test starts in\u2026" : "Before you start" }),
      /* @__PURE__ */ jsxs("ul", { className: "pfm-orienta-reminders", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("b", { children: "Remember \u2014 there is a TIME component." }),
          " Try to beat the timer on each trial. Faster correct answers reflect better processing speed."
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Click the ",
          /* @__PURE__ */ jsx("b", { children: '"I have it \u2014 Answer"' }),
          " button as soon as you think you have your orientation relative to the starting position. You don't need to wait for the full study time to run out."
        ] })
      ] }),
      countdownArmed ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "pfm-orienta-bigcountdown", "aria-live": "polite", children: preCountdownSec > 0 ? preCountdownSec : "GO" }),
        /* @__PURE__ */ jsx("p", { className: "pfm-orienta-foot", style: { textAlign: "center", marginTop: 8 }, children: "The first trial will appear automatically when the countdown ends." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "pfm-orienta-actions", style: { justifyContent: "center", marginTop: 22 }, children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "pfm-orienta-btn-primary",
          onClick: armCountdown,
          children: "Let's Go \u2192"
        }
      ) })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-eyebrow", children: [
        "Orienta",
        /* @__PURE__ */ jsx("span", { className: "pfm-orienta-tm", children: "\u2122" }),
        " \xB7 Trial ",
        trialNumber
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-grid", children: [
        /* @__PURE__ */ jsxs("section", { children: [
          phase === "study" && trial && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-startfacing", children: [
              "You are facing ",
              /* @__PURE__ */ jsx("b", { children: "North" }),
              ". Follow these commands mentally."
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pfm-orienta-commands", children: trial.commands.map((cmd, i) => /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-command", children: [
              /* @__PURE__ */ jsxs("span", { className: "pfm-orienta-command-num", children: [
                i + 1,
                "."
              ] }),
              cmd
            ] }, i)) }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-countdown", children: [
              /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-countdown-row", children: [
                /* @__PURE__ */ jsx("span", { children: "Study time" }),
                /* @__PURE__ */ jsxs("b", { children: [
                  (studyMsRemaining / 1e3).toFixed(1),
                  "s"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pfm-orienta-countdown-bar", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "pfm-orienta-countdown-fill",
                  style: { width: `${studyPct}%` },
                  "data-warn": studyWarn ? "true" : "false"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pfm-orienta-actions", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pfm-orienta-btn-primary",
                onClick: () => advanceToAnswer(false),
                children: "I have it \u2014 Answer"
              }
            ) })
          ] }),
          (phase === "answer" || phase === "feedback") && trial && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-prompt", children: [
              /* @__PURE__ */ jsx("h3", { children: "Where is the start point relative to you now?" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "Pick from your ",
                /* @__PURE__ */ jsx("i", { children: "current" }),
                " imagined facing direction."
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "pfm-orienta-compass",
                role: "group",
                "aria-label": "Direction options",
                "data-armed": compassArmed ? "true" : "false",
                children: COMPASS_GRID.map((label) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "pfm-orienta-compass-btn",
                    "data-selected": selected === label ? "true" : "false",
                    "data-center": label === "Same Spot" ? "true" : "false",
                    disabled: phase === "feedback" || !compassArmed,
                    onClick: () => submit(label),
                    children: label
                  },
                  label
                ))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("aside", { className: "pfm-orienta-aside", children: [
          /* @__PURE__ */ jsx("div", { className: "pfm-orienta-panel", children: /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-status", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "pfm-orienta-label", children: "Status" }),
              /* @__PURE__ */ jsx("p", { className: "pfm-orienta-status-msg", children: phase === "study" ? "Encode the path" : phase === "answer" ? compassArmed ? "Choose your answer" : "Get ready\u2026" : feedback?.correct ? "Advancing\u2026" : "Recalibrating\u2026" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "pfm-orienta-pill", "data-tone": pillTone, children: pillText })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-stats", children: [
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-panel", children: [
              /* @__PURE__ */ jsx("p", { className: "pfm-orienta-label", children: "Level" }),
              /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-stat-value", children: [
                "L",
                level
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-panel", children: [
              /* @__PURE__ */ jsx("p", { className: "pfm-orienta-label", children: "Reversals" }),
              /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-stat-value", children: [
                reversalsRef.current.length,
                "/",
                protocolUsed.reversal_target
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pfm-orienta-panel", children: [
            /* @__PURE__ */ jsx("p", { className: "pfm-orienta-label", style: { marginBottom: 6 }, children: "Trial" }),
            /* @__PURE__ */ jsxs("p", { className: "pfm-orienta-stat-value", style: { fontSize: 22 }, children: [
              trialNumber,
              " / ",
              protocolUsed.max_trials
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "pfm-orienta-foot", style: { margin: 0 }, children: "The path map is hidden during testing and revealed in the results." })
        ] })
      ] })
    ] }) })
  ] });
}
var orientaModuleManifest = {
  id: MODULE_ID,
  name: "Orienta",
  fullName: "Orienta\u2122 Spatial Orientation Test",
  version: MODULE_VERSION,
  description: "Egocentric path-integration probe of spatial orientation capacity. The candidate mentally tracks movement and rotation commands from a fixed starting facing, then identifies the relative direction of the start point. Difficulty adapts via a \xB11 transformed-staircase; capacity is the mean of the last reversal levels with a half-range CI. Trials are deterministic per bank_version, study time is license-locked, and the path map is hidden until the results page. Conforms to the NEXUS BprModuleResult contract.",
  category: "Cognitive Assessment",
  brand: "PerformOnomics",
  brandColor: BRAND.gold,
  estimatedDuration: "5-10 min",
  Component: OrientaComponent,
  module_code: MODULE_CODE,
  bpr_domain: BPR_DOMAIN,
  default_protocol: DEFAULT_PROTOCOL,
  outputSchema: {
    module_code: "string  // 'ORIENTA'",
    module_version: "string  // semver",
    bpr_domain: "string  // 'Spatial Orientation'",
    completed_at: "string  // ISO 8601",
    summary_metrics: {
      max_span: "number  // capacity estimate (mean of last reversals)",
      accuracy_pct: "number  // 0\u2013100",
      mean_reaction_ms: "number  // mean decision time, ms",
      median_reaction_ms: "number  // median decision time, ms",
      trials_total: "number",
      trials_passed: "number",
      trials_failed: "number",
      // v1.2.0 — the four candidate-facing BPR numbers.
      spatial_capacity_level: "number  // headline capacity, 0\u2013level_cap",
      direction_precision_pct: "number  // 0\u2013100, inverted angular error",
      processing_speed_sec_per_step: "number  // (study + decision) per command, sec",
      consistency_pct: "number | null  // 0\u2013100, capacity reliability (inverse of reversal CI). v1.4.0+",
      frame_stability_pct: "number  // 0\u2013100, 100 = no opposite-direction errors. Legacy from v1.2.0/v1.3.x; still emitted alongside consistency_pct for back-compat.",
      outcome: "string  // 'complete' | 'partial'"
    },
    raw_output: {
      sessionId: "string",
      sessionDurationSec: "number",
      capacity_estimate: "number",
      capacity_ci_low: "number",
      capacity_ci_high: "number",
      capacity_ci_half_range: "number",
      reversals: "{ trialNumber, level, direction }[]",
      reversal_count: "number",
      termination_reason: "'reversal_target_met' | 'max_trials_reached' | 'ceiling_plateau'",
      ceiling_hit: "boolean",
      mean_decision_ms: "number",
      median_decision_ms: "number",
      mean_study_ms_per_command: "number",
      median_study_ms_per_command: "number",
      timeout_trials_count: "number",
      mean_angular_error_deg: "number",
      opposite_errors_count: "number",
      accuracy_by_around_turn_count: "{ [count]: { n, accuracy_pct } }",
      accuracy_by_final_facing: "{ [N|E|S|W]: { n, accuracy_pct } }",
      trials: "Trial[]",
      // v1.2.0 — candidate-facing BPR numbers, mirrored here for downstream
      // tooling that reads from raw_output rather than summary_metrics.
      spatial_capacity_level: "number",
      direction_precision_pct: "number",
      processing_speed_sec_per_step: "number",
      consistency_pct: "number | null",
      frame_stability_pct: "number  // legacy",
      // v1.2.0 — self-describing CSV row. NEXUS aggregates one CSV across
      // all modules; each module emits its own header + row.
      csv_header: "string[]  // 13 column names",
      csv_row: "(string|number)[]  // values aligned to csv_header",
      protocol: "BprProtocol  // exact protocol used",
      diagnostics_passed: "boolean",
      candidate_id: "string | null",
      candidate_code: "string | null",
      session_id: "string | null"
    },
    _trialShape: {
      trialNumber: "number",
      level: "number",
      occurrence: "number",
      commands: "string[]",
      finalPosition: "{ x, y }",
      finalFacing: "'North' | 'East' | 'South' | 'West'",
      expectedAnswer: "string",
      choice: "string",
      correct: "boolean",
      angular_error_deg: "number | null  // 0, 45, 90, 135, 180; null if Same-Spot involved",
      studyTimeSec: "number",
      decisionTimeSec: "number",
      totalTrialSec: "number",
      timed_out: "boolean",
      is_reversal: "boolean",
      command_count: "number",
      turn_count: "number",
      around_turn_count: "number",
      move_count: "number",
      path_length: "number",
      manhattan_distance: "number",
      startedAt: "string",
      endedAt: "string"
    }
  }
};
var ORIENTA_nexus_default = OrientaComponent;
export {
  DEFAULT_PROTOCOL,
  MODULE_ID,
  MODULE_VERSION,
  OrientaComponent,
  ORIENTA_nexus_default as default,
  orientaModuleManifest
};
