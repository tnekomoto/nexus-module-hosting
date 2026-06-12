// PursuitModule.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var MODULE_ID = "pursuit-tracking";
var MODULE_VERSION = "2.4.1";
var MODULE_CODE = "PURSUIT";
var BPR_DOMAIN = "Pursuit Tracking";
var NORM_VERSION = "2.4.0";
var PACKAGE_SCHEMA_VERSION = "2.0.0";
var STYLE_ID = "pfm-pursuit-styles";
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
var PARAMETER_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  title: "Pursuit Tracking \u2014 Test Parameters",
  properties: {
    duration_sec: {
      type: "integer",
      enum: [180, 240, 300],
      default: 240,
      title: "Test length (seconds)",
      description: "Total active test time across all blocks.",
      "x-license-tunable": true,
      "x-renorms": false
    },
    include_calibration: {
      type: "boolean",
      default: true,
      title: "Include adaptive calibration",
      description: "Adaptive bullseye-radius staircase. Required for downstream blocks to use a per-candidate supported radius.",
      "x-license-tunable": false
    },
    include_predictive_baseline: {
      type: "boolean",
      default: true,
      title: "Include predictive baseline (triangle)",
      "x-license-tunable": false
    },
    include_reactive_baseline: {
      type: "boolean",
      default: true,
      title: "Include reactive baseline (sum of sines)",
      "x-license-tunable": false
    },
    include_asymmetry: {
      type: "boolean",
      default: true,
      title: "Include directional asymmetry probe (square, CW/CCW alternating)",
      "x-license-tunable": false
    },
    include_capacity: {
      type: "boolean",
      default: true,
      title: "Include capacity (frequency sweep)",
      "x-license-tunable": false
    },
    include_acquisition: {
      type: "boolean",
      default: true,
      title: "Include reactive acquisition",
      "x-license-tunable": false
    },
    include_dual_task: {
      type: "boolean",
      default: true,
      title: "Include dual-task block",
      "x-license-tunable": true
    },
    bullseye_radius_floor_px: {
      type: "integer",
      minimum: 18,
      maximum: 60,
      default: 18,
      title: "Bullseye floor (px) \u2014 staircase lower bound",
      description: "v2.4.0: lowered to 18 to give skilled trackers headroom below where v2.3 saturated.",
      "x-license-tunable": false,
      "x-renorms": true
    },
    bullseye_radius_ceiling_px: {
      type: "integer",
      minimum: 60,
      maximum: 140,
      default: 100,
      title: "Bullseye ceiling (px) \u2014 staircase upper bound",
      "x-license-tunable": false,
      "x-renorms": true
    },
    calibration_target_speed_px_s: {
      type: "number",
      minimum: 60,
      maximum: 240,
      default: 180,
      title: "Calibration target speed (px/s)",
      description: "v2.4.0: raised 140 \u2192 180 so skilled trackers find their threshold instead of saturating at the floor.",
      "x-license-tunable": false,
      "x-renorms": true
    },
    sum_of_sines_frequencies_hz: {
      type: "array",
      items: { type: "number" },
      default: [0.13, 0.21, 0.34],
      title: "Sum-of-sines frequencies (Hz) \u2014 must be incommensurate",
      "x-license-tunable": false,
      "x-renorms": true
    },
    capacity_frequency_range_hz: {
      type: "array",
      items: { type: "number" },
      default: [0.1, 0.5],
      title: "Capacity staircase frequency range (Hz) \u2014 [floor, ceiling]",
      description: "v2.4.0: switched from sweep to adaptive Levitt-style up-down staircase. Floor is the lowest test frequency; ceiling is the upper search limit (above which hardware-precision dominates over skill). bandwidth_hz converges on the candidate's 50%-TOT threshold and maps linearly to 0\u2013100.",
      "x-license-tunable": false,
      "x-renorms": true
    },
    secondary_cue_window_sec: {
      type: "number",
      minimum: 0.5,
      maximum: 1.5,
      default: 0.9,
      title: "Secondary-cue response window (seconds)",
      "x-license-tunable": false,
      "x-renorms": true
    },
    secondary_cue_min_interval_sec: {
      type: "number",
      minimum: 1,
      maximum: 4,
      default: 1.8,
      title: "Secondary-cue min interval (seconds)",
      "x-license-tunable": false
    },
    secondary_cue_max_interval_sec: {
      type: "number",
      minimum: 1.5,
      maximum: 6,
      default: 3.1,
      title: "Secondary-cue max interval (seconds)",
      "x-license-tunable": false
    },
    bank_version: {
      type: "string",
      default: "2.0.0",
      title: "Methodology bank version",
      description: "Bumping this invalidates prior norms.",
      "x-license-tunable": false,
      "x-renorms": true,
      "x-readonly-in-studio": true
    }
  },
  required: ["duration_sec", "bank_version"]
};
var DEFAULT_PROTOCOL = {
  duration_sec: 240,
  include_calibration: true,
  include_predictive_baseline: true,
  include_reactive_baseline: true,
  include_asymmetry: true,
  include_capacity: true,
  include_acquisition: true,
  include_dual_task: true,
  bullseye_radius_floor_px: 18,
  /* v2.4.0: was 28 */
  bullseye_radius_ceiling_px: 100,
  calibration_target_speed_px_s: 180,
  /* v2.4.0: was 140 */
  sum_of_sines_frequencies_hz: [0.13, 0.21, 0.34],
  capacity_frequency_range_hz: [0.1, 0.5],
  /* v2.4.0: was frequency_sweep_range_hz [0.10, 0.60]; staircase now */
  secondary_cue_window_sec: 0.9,
  secondary_cue_min_interval_sec: 1.8,
  secondary_cue_max_interval_sec: 3.1,
  bank_version: "2.0.0"
};
var TIER_BANDS = {
  norm_version: NORM_VERSION,
  bands: ["Developing", "Proficient", "Strong", "Exceptional"],
  cutoffs: {
    score: [35, 55, 75],
    steadiness_score: [40, 60, 80],
    smoothness_score: [35, 55, 75],
    capacity_score: [30, 50, 70],
    reacquire_score: [35, 55, 75],
    dual_task_reserve_score: [35, 55, 75]
  }
};
function tierFor(metricKey, value) {
  const cuts = TIER_BANDS.cutoffs[metricKey];
  if (!cuts || value == null || Number.isNaN(value)) return "\u2014";
  if (value >= cuts[2]) return TIER_BANDS.bands[3];
  if (value >= cuts[1]) return TIER_BANDS.bands[2];
  if (value >= cuts[0]) return TIER_BANDS.bands[1];
  return TIER_BANDS.bands[0];
}
function candidateTierLabel(internalTier) {
  if (internalTier === "Exceptional") return "Exceptional";
  if (internalTier === "Strong") return "Strong";
  if (internalTier === "Proficient") return "Solid";
  if (internalTier === "Developing") return "Building";
  return "\u2014";
}
function candidateTierCopy(internalTier, isComposite = false) {
  if (isComposite) {
    if (internalTier === "Exceptional") return "Outstanding overall performance.";
    if (internalTier === "Strong") return "Strong overall performance.";
    if (internalTier === "Proficient") return "A solid foundation across the board.";
    if (internalTier === "Developing") return "Pursuit improves with practice.";
    return "";
  }
  if (internalTier === "Exceptional") return "Top-tier control.";
  if (internalTier === "Strong") return "Strong, consistent tracking.";
  if (internalTier === "Proficient") return "A solid baseline to build on.";
  if (internalTier === "Developing") return "An area to grow with practice.";
  return "";
}
var MODULE_MANIFEST = {
  module_code: MODULE_CODE,
  module_version: MODULE_VERSION,
  bpr_domain: BPR_DOMAIN,
  package_schema_version: PACKAGE_SCHEMA_VERSION,
  norm_version: NORM_VERSION,
  description: "Continuous manual tracking of a moving target with a mouse cursor. Adaptive calibration + predictive/reactive baseline contrast + frequency-sweep capacity + reactive acquisition + dual-task pursuit.",
  required_hardware: ["mouse", "keyboard"],
  required_runtime: { min_host: "1.0.0" },
  recommended_duration_sec: 240,
  asset_size_class: "inline",
  has_custom_studio: false,
  parameter_schema: PARAMETER_SCHEMA,
  default_protocol: DEFAULT_PROTOCOL,
  tier_bands: TIER_BANDS,
  summary_metrics_keys: [
    { key: "outcome", type: "string", visibility: ["candidate", "client_admin", "pomx"] },
    { key: "score", type: "number", visibility: ["candidate", "client_admin", "pomx"], range: [0, 100] },
    { key: "accuracy_pct", type: "number", visibility: ["client_admin", "pomx"], range: [0, 100] },
    { key: "mean_reaction_ms", type: "number", visibility: ["client_admin", "pomx"] },
    { key: "trials_total", type: "integer", visibility: ["client_admin", "pomx"] },
    { key: "trials_passed", type: "integer", visibility: ["client_admin", "pomx"] },
    { key: "steadiness_score", type: "number", visibility: ["candidate", "client_admin", "pomx"], range: [0, 100] },
    { key: "smoothness_score", type: "number", visibility: ["candidate", "client_admin", "pomx"], range: [0, 100] },
    { key: "capacity_score", type: "number", visibility: ["candidate", "client_admin", "pomx"], range: [0, 100] },
    { key: "reacquire_score", type: "number", visibility: ["candidate", "client_admin", "pomx"], range: [0, 100] },
    { key: "dual_task_reserve_score", type: "number", visibility: ["candidate", "client_admin", "pomx"], range: [0, 100] },
    { key: "input_mode_final", type: "string", visibility: ["client_admin", "pomx"] },
    { key: "retest_eligible", type: "boolean", visibility: ["client_admin", "pomx"] },
    { key: "retest_used", type: "boolean", visibility: ["client_admin", "pomx"] }
  ]
};
var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
var lerp = (a, b, t) => a + (b - a) * t;
var rnd = (a, b) => a + Math.random() * (b - a);
var smoothstep = (x) => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};
function ratchetFromAggs({ meanJerk, reversalRate, microStopRate }) {
  const j = clamp((meanJerk || 0) / 22e3, 0, 1);
  const r = clamp((reversalRate || 0) * 1.8, 0, 1);
  const m = clamp((microStopRate || 0) * 1.4, 0, 1);
  return clamp(j * 0.45 + r + m * 0.5, 0, 1);
}
function buildBlocks(protocol) {
  const T = protocol.duration_sec;
  const scale = T / 240;
  const blocks = [];
  if (protocol.include_calibration) blocks.push({ kind: "calibration", id: "calibration", label: "Calibration", dur: 25 * scale });
  if (protocol.include_predictive_baseline) blocks.push({ kind: "predictive", id: "baseline-predictive", label: "Predictive baseline (triangle)", dur: 25 * scale });
  if (protocol.include_reactive_baseline) blocks.push({ kind: "reactive", id: "baseline-reactive", label: "Reactive baseline (sum of sines)", dur: 25 * scale });
  if (protocol.include_asymmetry) blocks.push({ kind: "asymmetry", id: "asymmetry", label: "Direction-asymmetry probe", dur: 20 * scale });
  if (protocol.include_capacity) blocks.push({ kind: "capacity", id: "capacity-frequency-sweep", label: "Capacity (frequency sweep)", dur: 50 * scale });
  if (protocol.include_acquisition) blocks.push({ kind: "acquisition", id: "reactive-acquisition", label: "Reactive acquisition", dur: 28 * scale });
  if (protocol.include_dual_task) blocks.push({ kind: "dual", id: "dual-task-pursuit", label: "Dual-task pursuit", dur: 55 * scale });
  return blocks;
}
function scorer(blockAggregates, params) {
  const get = (kind) => blockAggregates.find((b) => b.kind === kind) || null;
  const calRow = get("calibration");
  const predRow = get("predictive");
  const reactRow = get("reactive");
  const asymRow = get("asymmetry");
  const capRow = get("capacity");
  const acqRow = get("acquisition");
  const dualRow = get("dual");
  const baseRows = [predRow, reactRow].filter(Boolean);
  const baseN = baseRows.length || 1;
  const meanTOT = baseRows.reduce((s, r) => s + r.tot_pct, 0) / baseN;
  const meanNormRMS = baseRows.reduce((s, r) => s + r.normalized_rms, 0) / baseN;
  const meanRI = baseRows.reduce((s, r) => s + r.ratchet_index, 0) / baseN;
  const bandwidth_hz = capRow?.bandwidth_hz ?? null;
  const capRange = capRow?.frequency_range_hz ?? [0.1, 0.5];
  const capSpan = Math.max(0.01, capRange[1] - capRange[0]);
  const capacityScore = bandwidth_hz == null ? 50 : clamp((bandwidth_hz - capRange[0]) / capSpan * 100, 0, 100);
  const acqLagMs = acqRow?.acquisition_lag_ms ?? null;
  const dualTOT = dualRow?.tot_pct ?? meanTOT;
  const dualCost = Math.max(0, meanTOT - dualTOT);
  const dualSecAccuracy = dualRow && dualRow.secondary_total ? dualRow.secondary_hits / dualRow.secondary_total : null;
  const steadiness = clamp(100 - meanNormRMS * 80, 0, 100);
  const smoothness = clamp(100 - meanRI * 85, 0, 100);
  const reacquire = acqLagMs == null ? 70 : clamp(100 - acqLagMs / 6, 0, 100);
  const dualReserve = clamp(100 - dualCost * 2 + (dualSecAccuracy ?? 0.7) * 15, 0, 100);
  const composite = (steadiness + smoothness + capacityScore + reacquire + dualReserve) / 5;
  return {
    outcome: "complete",
    score: Math.round(composite * 10) / 10,
    accuracy_pct: Math.round(meanTOT * 10) / 10,
    mean_reaction_ms: acqLagMs == null ? null : Math.round(acqLagMs),
    trials_total: blockAggregates.length,
    trials_passed: blockAggregates.filter((b) => !b.flagged).length,
    steadiness_score: Math.round(steadiness * 10) / 10,
    smoothness_score: Math.round(smoothness * 10) / 10,
    capacity_score: Math.round(capacityScore * 10) / 10,
    reacquire_score: Math.round(reacquire * 10) / 10,
    dual_task_reserve_score: Math.round(dualReserve * 10) / 10,
    input_mode_final: params?.input_mode_final ?? "fallback_absolute",
    retest_eligible: !!params?.retest_eligible,
    retest_used: !!params?.retest_used
  };
}
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const css = `
    .pfm-pursuit-root {
      position: fixed; inset: 0; z-index: 1000;
      background: ${BRAND.bg};
      color: ${BRAND.text};
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0.01em;
      overflow: hidden;
      display: flex; flex-direction: column;
    }
    .pfm-pursuit-card {
      max-width: 720px; margin: 0 auto;
      background: ${BRAND.surface};
      border: 1px solid ${BRAND.border};
      border-radius: 16px;
      padding: 28px 32px;
      box-shadow: 0 24px 70px rgba(0,0,0,0.45);
    }
    .pfm-pursuit-card h1 {
      margin: 0 0 12px; font-size: 22px; font-weight: 700;
      color: ${BRAND.gold};
    }
    .pfm-pursuit-card h2 {
      margin: 0 0 10px; font-size: 18px; font-weight: 700;
      color: ${BRAND.gold};
    }
    .pfm-pursuit-card p {
      margin: 8px 0; line-height: 1.55; color: ${BRAND.text};
    }
    .pfm-pursuit-muted { color: ${BRAND.muted}; font-size: 13px; }
    .pfm-pursuit-warn  { color: ${BRAND.warn};  font-weight: 600; }
    .pfm-pursuit-error { color: ${BRAND.error}; font-weight: 600; }
    .pfm-pursuit-ok    { color: ${BRAND.ok};    font-weight: 600; }
    .pfm-pursuit-btn {
      display: inline-block; cursor: pointer;
      border: 0; border-radius: 10px;
      padding: 12px 20px;
      font-size: 15px; font-weight: 700; letter-spacing: 0.02em;
      background: ${BRAND.gold};
      color: ${BRAND.bg};
      transition: filter 0.12s ease;
    }
    .pfm-pursuit-btn:hover { filter: brightness(1.06); }
    .pfm-pursuit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .pfm-pursuit-btn-ghost {
      background: transparent;
      color: ${BRAND.gold};
      border: 1px solid ${BRAND.borderStrong};
    }
    .pfm-pursuit-stage-wrap {
      flex: 1; position: relative;
      display: grid; place-items: center;
    }
    .pfm-pursuit-canvas-frame {
      /* Wraps the canvas + all of its absolutely-positioned overlays
       * (instruction card, time HUD, block-label pill).  Inline-block
       * shrinks the wrapper to the canvas's CSS size so the overlay's
       * inset:0 references the canvas, not the surrounding stage area.
       * 2.3.1 bug fix: previously had line-height: 0 here as a defensive
       * baseline-gap fix, but the canvas already declares display: block
       * which eliminates the baseline gap on its own.  The line-height: 0
       * was propagating to the HUD's three rows and collapsing them. */
      position: relative;
      display: inline-block;
    }
    .pfm-pursuit-canvas {
      background: ${BRAND.surface2};
      border: 1px solid ${BRAND.border};
      border-radius: 16px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.45);
      cursor: crosshair;
      display: block;
    }
    .pfm-pursuit-pill {
      position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
      padding: 8px 14px; border-radius: 999px;
      background: ${BRAND.surface};
      border: 1px solid ${BRAND.border};
      color: ${BRAND.text}; font-size: 13px; font-weight: 600;
      line-height: 1.3;             /* explicit \u2014 don't inherit from parent */
      pointer-events: none;
    }
    .pfm-pursuit-overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center;
      justify-content: flex-start;       /* card pinned to top of canvas */
      padding: 24px 24px 0 24px;
      /* No backdrop dimmer \u2014 the bullseye sits at canvas center and the
       * candidate must SEE it to click on it.  Card is visually distinct
       * on its own (gold border, opaque surface), no dimmer needed.       */
      /* CRITICAL: overlay must NOT swallow clicks \u2014 the candidate clicks
       * THROUGH this layer onto the bullseye on the canvas underneath to
       * arm the block.  pointer-events: none cascades to descendant cards
       * and text since pointer-events inherits.                            */
      pointer-events: none;
    }
    .pfm-pursuit-overlay .pfm-pursuit-card {
      /* Slimmer card so it occupies less vertical real estate and never
       * sneaks down into the bullseye region. */
      padding: 16px 22px;
      max-width: 560px;
      /* Subtle gold glow distinguishes it from the canvas without dimming
       * the play field. */
      box-shadow: 0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px ${BRAND.borderStrong};
    }
    .pfm-pursuit-overlay .pfm-pursuit-card h2 { font-size: 16px; margin-bottom: 6px; }
    .pfm-pursuit-overlay .pfm-pursuit-card p  { font-size: 13px; margin: 4px 0; }
    .pfm-pursuit-hud {
      position: absolute; top: 18px; right: 22px;
      padding: 10px 14px; border-radius: 12px;
      background: ${BRAND.surface};
      border: 1px solid ${BRAND.border};
      color: ${BRAND.muted};
      font-size: 12px; font-variant-numeric: tabular-nums;
      line-height: 1.6;             /* explicit \u2014 was inheriting line-height:0 in v2.3.0 */
      pointer-events: none;
      min-width: 170px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .pfm-pursuit-hud > div { display: flex; justify-content: space-between; gap: 12px; }
    .pfm-pursuit-hud > div span:last-child { color: ${BRAND.text}; }
    .pfm-pursuit-result-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 14px; margin: 18px 0;
    }
    .pfm-pursuit-metric-card {
      background: ${BRAND.surface2};
      border: 1px solid ${BRAND.border};
      border-radius: 12px;
      padding: 14px 16px;
    }
    .pfm-pursuit-metric-card .label {
      color: ${BRAND.muted}; font-size: 12px;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .pfm-pursuit-metric-card .value {
      color: ${BRAND.gold}; font-size: 26px; font-weight: 700;
      margin: 4px 0;
    }
    .pfm-pursuit-metric-card .tier {
      color: ${BRAND.text}; font-size: 13px; font-weight: 600;
    }
    .pfm-pursuit-metric-card .copy {
      color: ${BRAND.muted}; font-size: 12px; line-height: 1.4;
      margin-top: 4px;
    }
    .pfm-pursuit-metric-card.tier-exceptional {
      border: 1px solid ${BRAND.gold};
      box-shadow: 0 0 0 1px ${BRAND.borderStrong}, 0 0 24px rgba(212,169,92,0.18);
    }
    .pfm-pursuit-metric-card.tier-strong {
      border: 1px solid ${BRAND.borderStrong};
    }
    .pfm-pursuit-metric-card.tier-developing .tier {
      color: ${BRAND.muted};   /* low tier label de-emphasized \u2014 never red, never bold */
      font-weight: 500;
    }
    .pfm-pursuit-banner {
      margin: 14px 0; padding: 12px 16px;
      border-radius: 10px;
      background: rgba(232, 184, 85, 0.10);
      border: 1px solid ${BRAND.warn};
      color: ${BRAND.warn};
      font-size: 13px;
    }
  `;
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.textContent = css;
  document.head.appendChild(tag);
}
function detectInitialFingerprint() {
  if (typeof window === "undefined") return {};
  return {
    user_agent: navigator?.userAgent ?? "",
    screen_w: window.screen?.width ?? null,
    screen_h: window.screen?.height ?? null,
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    pointer_lock_support: typeof document.body?.requestPointerLock === "function",
    measured_refresh_hz: null
  };
}
function measureRefreshHz(frames = 90) {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "function") return resolve(60);
    const samples = [];
    let prev = performance.now();
    let count = 0;
    function tick(now) {
      const dt = now - prev;
      prev = now;
      if (count > 0) samples.push(dt);
      count++;
      if (count > frames) {
        samples.sort((a, b) => a - b);
        const med = samples[Math.floor(samples.length / 2)];
        resolve(Math.round(1e3 / med));
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  });
}
function ConfirmPhase({ candidate, onConfirm, onExit }) {
  const name = [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") || candidate?.candidate_code || "(no candidate identity provided)";
  return /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-root", style: { padding: 40, justifyContent: "center" }, children: /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-card", children: [
    /* @__PURE__ */ jsx("h1", { children: "Pursuit Tracking" }),
    /* @__PURE__ */ jsx("p", { children: "You are about to take the Pursuit Tracking assessment.  Please confirm your identity." }),
    /* @__PURE__ */ jsx("p", { style: { fontSize: 20, color: BRAND.gold, marginTop: 18 }, children: /* @__PURE__ */ jsx("strong", { children: name }) }),
    /* @__PURE__ */ jsx("p", { className: "pfm-pursuit-muted", children: "If this is not you, exit and notify your administrator." }),
    /* @__PURE__ */ jsxs("div", { style: { marginTop: 24, display: "flex", gap: 10 }, children: [
      /* @__PURE__ */ jsx("button", { className: "pfm-pursuit-btn", onClick: onConfirm, children: "Yes, this is me \u2014 continue" }),
      onExit && /* @__PURE__ */ jsx("button", { className: "pfm-pursuit-btn pfm-pursuit-btn-ghost", onClick: onExit, children: "Exit" })
    ] })
  ] }) });
}
function HardwareCheckPhase({ onContinue }) {
  const [stage, setStage] = useState("measuring");
  const [print, setPrint] = useState(null);
  const [warnings, setWarn] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fp = detectInitialFingerprint();
      const hz = await measureRefreshHz(90);
      if (cancelled) return;
      fp.measured_refresh_hz = hz;
      const w = [];
      if (!fp.pointer_lock_support) w.push({
        code: "no_pointer_lock",
        detail: "Pointer-lock API is unavailable in this browser. Tracking will use absolute canvas coordinates as a fallback."
      });
      if (hz < 50) w.push({
        code: "low_refresh",
        detail: `Display refresh rate measured at ~${hz} Hz; 60 Hz or higher is recommended.`
      });
      setPrint(fp);
      setWarn(w);
      setStage("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-root", style: { padding: 40, justifyContent: "center" }, children: /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-card", children: [
    /* @__PURE__ */ jsx("h1", { children: "Hardware check" }),
    stage === "measuring" && /* @__PURE__ */ jsx("p", { children: "Measuring display and input device\u2026" }),
    stage === "ready" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { children: "Detected hardware:" }),
      /* @__PURE__ */ jsxs("ul", { style: { color: BRAND.muted, lineHeight: 1.7, paddingLeft: 18 }, children: [
        /* @__PURE__ */ jsxs("li", { children: [
          "Display refresh: ",
          /* @__PURE__ */ jsxs("span", { style: { color: BRAND.text }, children: [
            print.measured_refresh_hz,
            " Hz"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Pixel ratio: ",
          /* @__PURE__ */ jsx("span", { style: { color: BRAND.text }, children: print.device_pixel_ratio })
        ] }),
        /* @__PURE__ */ jsxs("li", { children: [
          "Pointer-lock support: ",
          /* @__PURE__ */ jsx("span", { style: { color: BRAND.text }, children: print.pointer_lock_support ? "yes" : "no" })
        ] })
      ] }),
      warnings.length === 0 ? /* @__PURE__ */ jsx("p", { className: "pfm-pursuit-ok", children: "Hardware looks good." }) : warnings.map((w) => /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-banner", children: [
        /* @__PURE__ */ jsx("strong", { children: "Notice:" }),
        " ",
        w.detail
      ] }, w.code)),
      /* @__PURE__ */ jsxs("p", { className: "pfm-pursuit-muted", style: { marginTop: 16 }, children: [
        "For best results: turn ",
        /* @__PURE__ */ jsx("strong", { children: "pointer acceleration off" }),
        " in your operating system, keep the cursor inside the test area, and avoid switching tabs once the test starts."
      ] }),
      /* @__PURE__ */ jsx("div", { style: { marginTop: 22 }, children: /* @__PURE__ */ jsx("button", { className: "pfm-pursuit-btn", onClick: () => onContinue(print, warnings), children: "Continue" }) })
    ] })
  ] }) });
}
function ResultPhase({ summary, retestEligible, onFinish }) {
  const cards = [
    { key: "score", label: "Overall", isComposite: true },
    { key: "steadiness_score", label: "Steadiness" },
    { key: "smoothness_score", label: "Smoothness" },
    { key: "capacity_score", label: "Capacity" },
    { key: "reacquire_score", label: "Reacquire speed" },
    { key: "dual_task_reserve_score", label: "Dual-task reserve" }
  ];
  return /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-root", style: { padding: 40, justifyContent: "center", overflowY: "auto" }, children: /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-card", style: { maxWidth: 760 }, children: [
    /* @__PURE__ */ jsx("h1", { children: "Your Pursuit results" }),
    /* @__PURE__ */ jsx("p", { className: "pfm-pursuit-muted", children: "Higher is better across all metrics.  Tier labels reflect your current performance." }),
    retestEligible && /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-banner", children: [
      /* @__PURE__ */ jsx("strong", { children: "Hardware variance detected." }),
      " Your administrator may offer a retake at no additional cost."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-result-grid", children: cards.map((c) => {
      const v = summary[c.key];
      const internalTier = tierFor(c.key, v);
      const candidateTier = candidateTierLabel(internalTier);
      const copy = candidateTierCopy(internalTier, !!c.isComposite);
      const tierClass = `tier-${internalTier.toLowerCase()}`;
      return /* @__PURE__ */ jsxs("div", { className: `pfm-pursuit-metric-card ${tierClass}`, children: [
        /* @__PURE__ */ jsx("div", { className: "label", children: c.label }),
        /* @__PURE__ */ jsx("div", { className: "value", children: v == null ? "\u2014" : v.toFixed(0) }),
        /* @__PURE__ */ jsx("div", { className: "tier", children: candidateTier }),
        copy && /* @__PURE__ */ jsx("div", { className: "copy", children: copy })
      ] }, c.key);
    }) }),
    /* @__PURE__ */ jsx("p", { className: "pfm-pursuit-muted", style: { marginTop: 14 }, children: "Thanks for completing Pursuit.  Tracking improves with practice \u2014 repeat sessions reflect your progress.  Please notify your administrator to review and record your results." }),
    /* @__PURE__ */ jsx("div", { style: { marginTop: 8 }, children: /* @__PURE__ */ jsx("button", { className: "pfm-pursuit-btn", onClick: onFinish, children: "Finish" }) })
  ] }) });
}
function BlockRunner({ protocol, onComplete, onHardwareFlag, initialFingerprint }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const W = 1200, H = 820, CX = W / 2, CY = H / 2, BOUND = 80, CORE = 14;
  const blocks = useMemo(() => buildBlocks(protocol), [protocol]);
  const cursorRef = useRef({ x: CX, y: CY, vx: 0, vy: 0, lastX: CX, lastY: CY, lastVx: 0, lastVy: 0 });
  const targetRef = useRef({ x: CX, y: CY, vx: 0, vy: 0, ax: 0, ay: 0, heading: 0 });
  const justLockedAtRef = useRef(0);
  const sampleBufRef = useRef([]);
  const blockAggsRef = useRef([]);
  const flagsRef = useRef([]);
  const inputModeRef = useRef("fallback_absolute");
  const lockedRef = useRef(false);
  const blockStartRef = useRef(0);
  const phaseRef = useRef("arming");
  const blockIndexRef = useRef(0);
  const countdownEndRef = useRef(0);
  const recoveryRef = useRef({ outsideAt: null, recoveries: [] });
  const acquisitionRef = useRef({ started: false, legEnd: 0, dirQueue: [], firstEntryTime: null, legStartTime: null, lagSamples: [], heading: 0 });
  const dualRef = useRef({ cueOn: false, cueWindowEnd: 0, nextCueAt: 0, hits: 0, misses: 0, falseAlarms: 0 });
  const lastClockRef = useRef(0);
  const activeTimeRef = useRef(0);
  const calibrationRef = useRef({
    currentRadius: 80,
    windowStart: 0,
    windowOnTarget: 0,
    windowSamples: 0,
    reversals: [],
    lastDirection: null,
    supportedRadius: null
    /* set on convergence; null until then    */
  });
  const dualPathRef = useRef({ phase: 0 });
  const capacityRef = useRef({
    desiredFreq: 0.22,
    /* staircase target — set by step rule  */
    currentFreq: 0.22,
    /* slewed toward desiredFreq over ~0.4s */
    phase: 0,
    /* accumulated phase (radians)          */
    windowStart: 0,
    windowOnTarget: 0,
    windowSamples: 0,
    reversals: [],
    lastDirection: null,
    floor: 0.1,
    ceiling: 0.5
  });
  const asymmetryRef = useRef({
    cwSumErr2: 0,
    cwCount: 0,
    ccwSumErr2: 0,
    ccwCount: 0,
    currentDir: "CW",
    pathU: 0
    /* current position on perimeter [0,1)
     * — tracked continuously so direction
     * changes don't teleport the target  */
  });
  const [hud, setHud] = useState({
    blockLabel: blocks[0]?.label ?? "",
    blockNum: 1,
    totalBlocks: blocks.length,
    timeLeft: protocol.duration_sec,
    inputMode: "fallback_absolute",
    countdown: null,
    onTargetPct: 0
  });
  const hudThrottle = useRef(0);
  const [overlay, setOverlay] = useState({
    visible: true,
    title: blocks[0]?.label ?? "Pursuit",
    body: ""
  });
  const armBlock = useCallback((i) => {
    blockIndexRef.current = i;
    const b = blocks[i];
    phaseRef.current = "arming";
    cursorRef.current = { x: CX, y: CY, vx: 0, vy: 0, lastX: CX, lastY: CY, lastVx: 0, lastVy: 0 };
    const initDemand = resolveDemand(b, 0);
    const initPos = initialTargetXY(b, initDemand);
    targetRef.current = { x: initPos.x, y: initPos.y, vx: 0, vy: 0, ax: 0, ay: 0, heading: 0 };
    sampleBufRef.current = [];
    recoveryRef.current = { outsideAt: null, recoveries: [] };
    acquisitionRef.current = { started: false, legEnd: 0, dirQueue: [], firstEntryTime: null, legStartTime: null, lagSamples: [], heading: 0 };
    dualRef.current = { cueOn: false, cueWindowEnd: 0, nextCueAt: 0, hits: 0, misses: 0, falseAlarms: 0 };
    calibrationRef.current.windowStart = 0;
    calibrationRef.current.windowOnTarget = 0;
    calibrationRef.current.windowSamples = 0;
    if (b.kind === "calibration") {
      calibrationRef.current.currentRadius = 60;
      calibrationRef.current.reversals = [];
      calibrationRef.current.lastDirection = null;
      calibrationRef.current.supportedRadius = null;
    }
    capacityRef.current = {
      desiredFreq: 0.22,
      currentFreq: 0.22,
      phase: 0,
      windowStart: 0,
      windowOnTarget: 0,
      windowSamples: 0,
      reversals: [],
      lastDirection: null,
      floor: protocol.capacity_frequency_range_hz[0],
      ceiling: protocol.capacity_frequency_range_hz[1]
    };
    asymmetryRef.current = { cwSumErr2: 0, cwCount: 0, ccwSumErr2: 0, ccwCount: 0, currentDir: "CW", pathU: 0 };
    dualPathRef.current = { phase: 0 };
    setOverlay({ visible: true, title: b.label, body: bodyForKind(b) });
    setHud((h) => ({ ...h, blockLabel: b.label, blockNum: i + 1, countdown: null }));
  }, [blocks]);
  function bodyForKind(b) {
    if (b.kind === "calibration") return "We'll find your supported tracking size before the main test.  The bullseye will get smaller as you track well, larger if you fall behind.  Place the cursor on the center and click to start.";
    if (b.kind === "predictive") return "Track the bullseye along its triangular path.  The path repeats \u2014 once you've learned it, you can anticipate where it's going next.  Place the cursor on the center and click to start.";
    if (b.kind === "reactive") return "The bullseye will move unpredictably \u2014 react as it goes.  Don't try to anticipate, just follow.  Place the cursor on the center and click to start.";
    if (b.kind === "asymmetry") return "Track the bullseye along its square path.  Every few seconds it will reverse direction \u2014 keep tracking it however it moves.  Place the cursor on the center and click to start.";
    if (b.kind === "capacity") return "The bullseye will speed up when you're tracking it well, and slow down when it gets away from you.  We're finding the speed at the edge of your ability.  Place the cursor on the center and click to start.";
    if (b.kind === "acquisition") return "When you reach the center, the bullseye will jump in a new direction.  Reach it as quickly as possible, then track until it jumps again.  Place the cursor on the center and click to start.";
    if (b.kind === "dual") return "Track the bullseye AND press the spacebar only when the bullseye changes \u2014 it will briefly grow larger, change color, and gain a black outline.  Place the cursor on the center and click to start.";
    return "Place the cursor on the center and click to start.";
  }
  function effectiveSupportedRadius() {
    return calibrationRef.current.supportedRadius ?? Math.round((protocol.bullseye_radius_floor_px + protocol.bullseye_radius_ceiling_px) / 2);
  }
  function resolveDemand(b, p) {
    const r = effectiveSupportedRadius();
    if (b.kind === "calibration") {
      return {
        bullseyeRadius: calibrationRef.current.currentRadius,
        targetSpeed: protocol.calibration_target_speed_px_s,
        ampX: 220,
        ampY: 160,
        rd: 0.2
      };
    }
    if (b.kind === "predictive") {
      return { bullseyeRadius: r * 0.8, targetSpeed: 150, ampX: 250, ampY: 180, rd: 0.18 };
    }
    if (b.kind === "reactive") {
      return { bullseyeRadius: r * 0.8, targetSpeed: 150, ampX: 200, ampY: 200, rd: 0.4 };
    }
    if (b.kind === "asymmetry") {
      return { bullseyeRadius: r, targetSpeed: 288, ampX: 180, ampY: 180, rd: 0.4 };
    }
    if (b.kind === "capacity") {
      const ref = capacityRef.current;
      return {
        bullseyeRadius: r,
        targetSpeed: 0,
        /* unused — capacity is phase-driven */
        ampX: 200,
        ampY: 200,
        rd: clamp((ref.currentFreq - ref.floor) / Math.max(0.01, ref.ceiling - ref.floor), 0, 1),
        currentFreq: ref.currentFreq
      };
    }
    if (b.kind === "acquisition") {
      return { bullseyeRadius: r, targetSpeed: 190, ampX: 300, ampY: 160, rd: 0.55 };
    }
    const q = smoothstep(p);
    const f = lerp(0.2, 0.4, q);
    return {
      bullseyeRadius: r,
      targetSpeed: 0,
      /* unused — phase-driven */
      ampX: 200,
      ampY: 200,
      currentFreq: f,
      rd: lerp(0.4, 0.85, q)
    };
  }
  function trianglePoint(u, dir, ampX, ampY) {
    let t = dir === "CW" ? u : 1 - u;
    t = (t % 1 + 1) % 1;
    const verts = [[0, -1], [0.95, 0.82], [-0.95, 0.82]];
    const n = verts.length;
    const seg = t * n;
    const i = Math.floor(seg) % n;
    const j = (i + 1) % n;
    const f = seg - i;
    const x = lerp(verts[i][0], verts[j][0], f);
    const y = lerp(verts[i][1], verts[j][1], f);
    return { x: CX + x * ampX, y: CY + y * ampY };
  }
  function squarePoint(u, dir, ampX, ampY) {
    let t = dir === "CW" ? u : 1 - u;
    t = (t % 1 + 1) % 1;
    const verts = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const n = verts.length;
    const seg = t * n;
    const i = Math.floor(seg) % n;
    const j = (i + 1) % n;
    const f = seg - i;
    const x = lerp(verts[i][0], verts[j][0], f);
    const y = lerp(verts[i][1], verts[j][1], f);
    return { x: CX + x * ampX, y: CY + y * ampY };
  }
  function initialTargetXY(b, demand) {
    if (b.kind === "calibration" || b.kind === "predictive") {
      return { x: CX, y: CY - demand.ampY };
    }
    if (b.kind === "asymmetry") {
      return { x: CX - demand.ampX, y: CY - demand.ampY };
    }
    return { x: CX, y: CY };
  }
  function nextBalancedDirection() {
    const aq = acquisitionRef.current;
    if (!aq.dirQueue.length) {
      aq.dirQueue = [
        0,
        Math.PI,
        Math.PI / 2,
        -Math.PI / 2,
        Math.PI / 4,
        3 * Math.PI / 4,
        -Math.PI / 4,
        -3 * Math.PI / 4
      ].sort(() => Math.random() - 0.5);
    }
    return aq.dirQueue.pop();
  }
  function sumOfSinesXY(t, freqs, ampX, ampY) {
    const f = freqs ?? [0.13, 0.21, 0.34];
    const fx = (Math.sin(2 * Math.PI * f[0] * t) + Math.sin(2 * Math.PI * f[1] * t) + Math.sin(2 * Math.PI * f[2] * t)) / 3;
    const fy = (Math.sin(2 * Math.PI * f[0] * t + Math.PI / 2) + Math.sin(2 * Math.PI * f[1] * t - Math.PI / 2) + Math.sin(2 * Math.PI * f[2] * t)) / 3;
    return { x: CX + fx * ampX, y: CY + fy * ampY };
  }
  function updateTarget(b, dt, p, demand) {
    const tg = targetRef.current;
    const t = activeTimeRef.current;
    if (b.kind === "calibration") {
      const tBlock = activeTimeRef.current - blockStartRef.current;
      const period = 2 * Math.PI * demand.ampX / demand.targetSpeed;
      const u = tBlock / period % 1;
      const angle = u * 2 * Math.PI - Math.PI / 2;
      const nx = CX + Math.cos(angle) * demand.ampX;
      const ny = CY + Math.sin(angle) * demand.ampY;
      tg.vx = (nx - tg.x) / Math.max(dt, 1e-3);
      tg.vy = (ny - tg.y) / Math.max(dt, 1e-3);
      tg.x = nx;
      tg.y = ny;
      return;
    }
    if (b.kind === "predictive") {
      const tBlock = activeTimeRef.current - blockStartRef.current;
      const perim = 5.5 * Math.max(demand.ampX, demand.ampY);
      const period = perim / demand.targetSpeed;
      const u = tBlock / period % 1;
      const pt = trianglePoint(u, "CW", demand.ampX, demand.ampY);
      tg.vx = (pt.x - tg.x) / Math.max(dt, 1e-3);
      tg.vy = (pt.y - tg.y) / Math.max(dt, 1e-3);
      tg.x = pt.x;
      tg.y = pt.y;
      return;
    }
    if (b.kind === "reactive") {
      const tBlock = activeTimeRef.current - blockStartRef.current;
      const pt = sumOfSinesXY(tBlock, protocol.sum_of_sines_frequencies_hz, demand.ampX, demand.ampY);
      tg.vx = (pt.x - tg.x) / Math.max(dt, 1e-3);
      tg.vy = (pt.y - tg.y) / Math.max(dt, 1e-3);
      tg.x = pt.x;
      tg.y = pt.y;
      return;
    }
    if (b.kind === "asymmetry") {
      const segLen = 5;
      const elapsed = activeTimeRef.current - blockStartRef.current;
      const segIdx = Math.floor(elapsed / segLen);
      const dir = segIdx % 2 === 0 ? "CW" : "CCW";
      asymmetryRef.current.currentDir = dir;
      const ref2 = asymmetryRef.current;
      const dirSign = dir === "CW" ? 1 : -1;
      ref2.pathU += dirSign * (dt / segLen);
      ref2.pathU = (ref2.pathU % 1 + 1) % 1;
      const pt = squarePoint(ref2.pathU, "CW", demand.ampX, demand.ampY);
      tg.vx = (pt.x - tg.x) / Math.max(dt, 1e-3);
      tg.vy = (pt.y - tg.y) / Math.max(dt, 1e-3);
      tg.x = pt.x;
      tg.y = pt.y;
      return;
    }
    if (b.kind === "capacity") {
      const ref2 = capacityRef.current;
      const slewRate = 1 / 0.4;
      ref2.currentFreq += (ref2.desiredFreq - ref2.currentFreq) * Math.min(1, dt * slewRate);
      ref2.phase += 2 * Math.PI * ref2.currentFreq * dt;
      const newX2 = CX + Math.sin(ref2.phase) * demand.ampX;
      const newY2 = CY + Math.sin(ref2.phase * 0.7) * demand.ampY;
      tg.vx = (newX2 - tg.x) / Math.max(dt, 1e-3);
      tg.vy = (newY2 - tg.y) / Math.max(dt, 1e-3);
      tg.x = newX2;
      tg.y = newY2;
      return;
    }
    if (b.kind === "acquisition") {
      const aq = acquisitionRef.current;
      const cur = cursorRef.current;
      const error = Math.hypot(cur.x - tg.x, cur.y - tg.y);
      if (!aq.started && error < CORE + 4) {
        aq.started = true;
        aq.heading = nextBalancedDirection();
        aq.legEnd = activeTimeRef.current + rnd(0.55, 0.95);
        aq.legStartTime = activeTimeRef.current;
        aq.firstEntryTime = null;
        tg.heading = aq.heading;
      }
      if (!aq.started) {
        tg.x = CX;
        tg.y = CY;
        tg.vx = tg.vy = 0;
        return;
      }
      if (aq.firstEntryTime == null && error <= demand.bullseyeRadius) {
        aq.firstEntryTime = activeTimeRef.current;
        aq.lagSamples.push((aq.firstEntryTime - aq.legStartTime) * 1e3);
      }
      if (activeTimeRef.current > aq.legEnd) {
        aq.heading = nextBalancedDirection();
        aq.legEnd = activeTimeRef.current + rnd(0.55, 0.95);
        aq.legStartTime = activeTimeRef.current;
        aq.firstEntryTime = null;
        tg.heading = aq.heading;
      }
      tg.vx = Math.cos(tg.heading) * demand.targetSpeed;
      tg.vy = Math.sin(tg.heading) * demand.targetSpeed;
      tg.x += tg.vx * dt;
      tg.y += tg.vy * dt;
      if (tg.x < BOUND || tg.x > W - BOUND) {
        tg.heading = Math.PI - tg.heading;
        tg.x = clamp(tg.x, BOUND, W - BOUND);
      }
      if (tg.y < BOUND || tg.y > H - BOUND) {
        tg.heading = -tg.heading;
        tg.y = clamp(tg.y, BOUND, H - BOUND);
      }
      return;
    }
    const ref = dualPathRef.current;
    ref.phase += 2 * Math.PI * demand.currentFreq * dt;
    const newX = CX + Math.sin(ref.phase) * demand.ampX;
    const newY = CY + Math.sin(ref.phase * 0.7) * demand.ampY;
    tg.vx = (newX - tg.x) / Math.max(dt, 1e-3);
    tg.vy = (newY - tg.y) / Math.max(dt, 1e-3);
    tg.x = newX;
    tg.y = newY;
  }
  function updateCalibrationStaircase() {
    const ref = calibrationRef.current;
    if (ref.supportedRadius != null) return;
    const c = cursorRef.current, tg = targetRef.current;
    const error = Math.hypot(c.x - tg.x, c.y - tg.y);
    const onTarget = error <= ref.currentRadius ? 1 : 0;
    if (ref.windowStart === 0) ref.windowStart = activeTimeRef.current;
    ref.windowOnTarget += onTarget;
    ref.windowSamples += 1;
    if (activeTimeRef.current - ref.windowStart >= 1.5 && ref.windowSamples > 25) {
      const tot = ref.windowOnTarget / ref.windowSamples;
      const post = ref.reversals.length > 0;
      const stepDown = post ? 4 : 15;
      const stepUp = post ? 6 : 18;
      let direction = null;
      if (tot > 0.7) {
        ref.currentRadius = Math.max(protocol.bullseye_radius_floor_px, ref.currentRadius - stepDown);
        direction = "down";
      } else if (tot < 0.5) {
        ref.currentRadius = Math.min(protocol.bullseye_radius_ceiling_px, ref.currentRadius + stepUp);
        direction = "up";
      }
      if (direction && ref.lastDirection && direction !== ref.lastDirection) {
        ref.reversals.push(ref.currentRadius);
      }
      if (direction) ref.lastDirection = direction;
      ref.windowStart = activeTimeRef.current;
      ref.windowOnTarget = 0;
      ref.windowSamples = 0;
      if (ref.reversals.length >= 3) {
        const last3 = ref.reversals.slice(-3);
        ref.supportedRadius = last3.reduce((s, v) => s + v, 0) / last3.length;
      }
    }
  }
  function updateCapacityStaircase(b, demand) {
    if (b.kind !== "capacity") return;
    const ref = capacityRef.current;
    const c = cursorRef.current, tg = targetRef.current;
    const error = Math.hypot(c.x - tg.x, c.y - tg.y);
    const onTarget = error <= demand.bullseyeRadius ? 1 : 0;
    if (ref.windowStart === 0) ref.windowStart = activeTimeRef.current;
    ref.windowOnTarget += onTarget;
    ref.windowSamples += 1;
    if (activeTimeRef.current - ref.windowStart >= 1.5 && ref.windowSamples > 25) {
      const tot = ref.windowOnTarget / ref.windowSamples;
      const post = ref.reversals.length > 0;
      const stepUp = post ? 0.015 : 0.04;
      const stepDown = post ? 0.02 : 0.05;
      let direction = null;
      if (tot >= 0.7) {
        ref.desiredFreq = Math.min(ref.ceiling, ref.desiredFreq + stepUp);
        direction = "up";
      } else if (tot < 0.5) {
        ref.desiredFreq = Math.max(ref.floor, ref.desiredFreq - stepDown);
        direction = "down";
      }
      if (direction && ref.lastDirection && direction !== ref.lastDirection) {
        ref.reversals.push(ref.desiredFreq);
      }
      if (direction) ref.lastDirection = direction;
      ref.windowStart = activeTimeRef.current;
      ref.windowOnTarget = 0;
      ref.windowSamples = 0;
    }
  }
  function updateAsymmetry(b) {
    if (b.kind !== "asymmetry") return;
    const ref = asymmetryRef.current;
    const c = cursorRef.current, tg = targetRef.current;
    const e2 = (c.x - tg.x) ** 2 + (c.y - tg.y) ** 2;
    if (ref.currentDir === "CW") {
      ref.cwSumErr2 += e2;
      ref.cwCount += 1;
    } else {
      ref.ccwSumErr2 += e2;
      ref.ccwCount += 1;
    }
  }
  function updateCursorKinematics(dt) {
    const c = cursorRef.current;
    c.vx = (c.x - c.lastX) / Math.max(dt, 1e-3);
    c.vy = (c.y - c.lastY) / Math.max(dt, 1e-3);
    c.ax = (c.vx - c.lastVx) / Math.max(dt, 1e-3);
    c.ay = (c.vy - c.lastVy) / Math.max(dt, 1e-3);
    c.lastX = c.x;
    c.lastY = c.y;
    c.lastVx = c.vx;
    c.lastVy = c.vy;
  }
  function updateSecondary(b, dt) {
    if (b.kind !== "dual") return;
    const d = dualRef.current;
    const t = activeTimeRef.current;
    if (!d.nextCueAt) d.nextCueAt = t + 1.6;
    if (!d.cueOn && t >= d.nextCueAt) {
      d.cueOn = true;
      d.cueWindowEnd = t + protocol.secondary_cue_window_sec;
      d.nextCueAt = t + rnd(protocol.secondary_cue_min_interval_sec, protocol.secondary_cue_max_interval_sec);
    }
    if (d.cueOn && t > d.cueWindowEnd) {
      d.misses++;
      d.cueOn = false;
    }
  }
  function recordSample(b, dt, demand) {
    const c = cursorRef.current;
    const tg = targetRef.current;
    const error = Math.hypot(c.x - tg.x, c.y - tg.y);
    const onTarget = error <= demand.bullseyeRadius;
    const t = activeTimeRef.current;
    if (!onTarget && recoveryRef.current.outsideAt == null) {
      recoveryRef.current.outsideAt = t;
    }
    if (onTarget && recoveryRef.current.outsideAt != null) {
      recoveryRef.current.recoveries.push((t - recoveryRef.current.outsideAt) * 1e3);
      recoveryRef.current.outsideAt = null;
    }
    const cSpeed = Math.hypot(c.vx, c.vy);
    const cAccel = Math.hypot(c.ax, c.ay);
    const buf = sampleBufRef.current;
    const prev = buf[buf.length - 1];
    const jerk = prev ? Math.abs(cAccel - prev.cAccel) / Math.max(dt, 1e-3) : 0;
    const reversal = prev ? Math.sign(c.vx) !== Math.sign(prev.cVx) && Math.abs(c.vx) > 25 && Math.abs(prev.cVx) > 25 || Math.sign(c.vy) !== Math.sign(prev.cVy) && Math.abs(c.vy) > 25 && Math.abs(prev.cVy) > 25 ? 1 : 0 : 0;
    const microStop = cSpeed < 18 && error > demand.bullseyeRadius * 0.55 ? 1 : 0;
    buf.push({
      cVx: c.vx,
      cVy: c.vy,
      cAccel,
      jerk,
      reversal,
      microStop,
      error,
      normError: error / demand.bullseyeRadius,
      onTarget: onTarget ? 1 : 0,
      bullseyeRadius: demand.bullseyeRadius,
      rd: demand.rd
    });
  }
  function reduceBlock(b) {
    const buf = sampleBufRef.current;
    if (!buf.length) return null;
    const n = buf.length;
    const sumErr2 = buf.reduce((s, r) => s + r.error * r.error, 0);
    const sumNE2 = buf.reduce((s, r) => s + r.normError * r.normError, 0);
    const tot = buf.reduce((s, r) => s + r.onTarget, 0) / n;
    const meanJerk = buf.reduce((s, r) => s + Math.min(r.jerk || 0, 5e4), 0) / n;
    const reversalRate = buf.reduce((s, r) => s + r.reversal, 0) / n;
    const microStopRate = buf.reduce((s, r) => s + r.microStop, 0) / n;
    const ri = ratchetFromAggs({ meanJerk, reversalRate, microStopRate });
    const recoveries = recoveryRef.current.recoveries;
    const meanRecoveryMs = recoveries.length ? recoveries.reduce((s, v) => s + v, 0) / recoveries.length : 0;
    const maxRD = buf.reduce((m, r) => Math.max(m, r.rd), 0);
    const acq = acquisitionRef.current;
    const acquisition_lag_ms = b.kind === "acquisition" && acq.lagSamples.length ? acq.lagSamples.reduce((s, v) => s + v, 0) / acq.lagSamples.length : null;
    const d = dualRef.current;
    const secTotal = d.hits + d.misses + d.falseAlarms;
    const calRef = calibrationRef.current;
    const capRef = capacityRef.current;
    const aRef = asymmetryRef.current;
    const cwRMS = aRef.cwCount ? Math.sqrt(aRef.cwSumErr2 / aRef.cwCount) : null;
    const ccwRMS = aRef.ccwCount ? Math.sqrt(aRef.ccwSumErr2 / aRef.ccwCount) : null;
    let bandwidthHz = null;
    if (b.kind === "capacity") {
      if (capRef.reversals.length >= 3) {
        const last3 = capRef.reversals.slice(-3);
        bandwidthHz = last3.reduce((s, v) => s + v, 0) / 3;
      } else if (capRef.reversals.length > 0) {
        bandwidthHz = capRef.reversals.reduce((s, v) => s + v, 0) / capRef.reversals.length;
      } else {
        bandwidthHz = capRef.desiredFreq;
      }
    }
    return {
      block_id: b.id,
      kind: b.kind,
      label: b.label,
      sample_count: n,
      rms_px: Math.sqrt(sumErr2 / n),
      normalized_rms: Math.sqrt(sumNE2 / n),
      tot_pct: tot * 100,
      ratchet_index: ri,
      mean_recovery_ms: meanRecoveryMs,
      max_rd: maxRD,
      acquisition_lag_ms,
      secondary_hits: d.hits,
      secondary_misses: d.misses,
      secondary_false_alarms: d.falseAlarms,
      secondary_total: secTotal,
      flagged: flagsRef.current.some((f) => f.block_id === b.id),
      /* v2 outputs (null when not applicable to this block kind):       */
      supported_radius_px: b.kind === "calibration" ? calRef.supportedRadius : null,
      calibration_reversals: b.kind === "calibration" ? calRef.reversals.slice() : null,
      bandwidth_hz: b.kind === "capacity" ? bandwidthHz : null,
      capacity_reversals: b.kind === "capacity" ? capRef.reversals.slice() : null,
      capacity_final_freq_hz: b.kind === "capacity" ? capRef.desiredFreq : null,
      frequency_range_hz: b.kind === "capacity" ? [capRef.floor, capRef.ceiling] : null,
      cw_rms_px: b.kind === "asymmetry" ? cwRMS : null,
      ccw_rms_px: b.kind === "asymmetry" ? ccwRMS : null,
      directional_asymmetry_px: b.kind === "asymmetry" && cwRMS != null && ccwRMS != null ? cwRMS - ccwRMS : null
    };
  }
  const frame = useCallback((now) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const dt = Math.min(0.05, (now - (lastClockRef.current || now)) / 1e3);
    lastClockRef.current = now;
    const b = blocks[blockIndexRef.current];
    if (phaseRef.current === "countdown") {
      const rem = Math.ceil((countdownEndRef.current - now) / 1e3);
      setHud((h) => h.countdown !== (rem > 0 ? rem : "Go") ? { ...h, countdown: rem > 0 ? rem : "Go" } : h);
      if (now >= countdownEndRef.current) {
        phaseRef.current = "running";
        blockStartRef.current = activeTimeRef.current;
        setOverlay({ visible: false, title: "", body: "" });
      }
      drawScene(ctx, b ? resolveDemand(b, 0) : null);
      rafRef.current = requestAnimationFrame(frame);
      return;
    }
    if (phaseRef.current !== "running") {
      drawScene(ctx, b ? resolveDemand(b, 0) : null);
      rafRef.current = requestAnimationFrame(frame);
      return;
    }
    activeTimeRef.current += dt;
    const elapsed = activeTimeRef.current - blockStartRef.current;
    const p = clamp(elapsed / b.dur, 0, 1);
    const demand = resolveDemand(b, p);
    updateTarget(b, dt, p, demand);
    updateCursorKinematics(dt);
    updateSecondary(b, dt);
    updateCalibrationStaircase();
    updateCapacityStaircase(b, demand);
    updateAsymmetry(b);
    recordSample(b, dt, demand);
    drawScene(ctx, demand);
    hudThrottle.current += dt;
    if (hudThrottle.current > 0.1) {
      hudThrottle.current = 0;
      const buf = sampleBufRef.current.slice(-180);
      const tot = buf.length ? buf.filter((r) => r.onTarget).length / buf.length : 0;
      setHud((h) => ({
        ...h,
        timeLeft: Math.max(0, protocol.duration_sec - activeTimeRef.current),
        onTargetPct: tot * 100,
        inputMode: inputModeRef.current
      }));
    }
    if (elapsed >= b.dur) {
      const agg = reduceBlock(b);
      if (agg) blockAggsRef.current.push(agg);
      sampleBufRef.current = [];
      if (blockIndexRef.current < blocks.length - 1) {
        armBlock(blockIndexRef.current + 1);
        phaseRef.current = "arming";
      } else {
        phaseRef.current = "done";
        cleanupListeners();
        cancelAnimationFrame(rafRef.current);
        onComplete({
          aggregates: blockAggsRef.current,
          flags: flagsRef.current,
          inputModeFinal: inputModeRef.current,
          fingerprint: { ...initialFingerprint },
          supportedRadiusPx: calibrationRef.current.supportedRadius,
          bandwidthHz: (() => {
            const cap = blockAggsRef.current.find((a) => a.kind === "capacity");
            return cap?.bandwidth_hz ?? null;
          })(),
          directionalAsymmetryPx: (() => {
            const a = asymmetryRef.current;
            const cw = a.cwCount ? Math.sqrt(a.cwSumErr2 / a.cwCount) : null;
            const ccw = a.ccwCount ? Math.sqrt(a.ccwSumErr2 / a.ccwCount) : null;
            return cw != null && ccw != null ? cw - ccw : null;
          })()
        });
        return;
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }, [blocks, protocol, armBlock, onComplete, initialFingerprint]);
  function drawScene(ctx, demand) {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(212,169,92,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(212,169,92,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(BOUND, BOUND, W - BOUND * 2, H - BOUND * 2);
    const tg = targetRef.current;
    const c = cursorRef.current;
    const r = demand?.bullseyeRadius ?? 60;
    ctx.beginPath();
    ctx.arc(tg.x, tg.y, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(212,169,92,0.075)";
    ctx.fill();
    ctx.strokeStyle = "rgba(212,169,92,0.32)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tg.x, tg.y, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(212,169,92,0.20)";
    ctx.stroke();
    const cueOn = dualRef.current.cueOn;
    const coreR = cueOn ? Math.round(CORE * 1.6) : CORE;
    ctx.beginPath();
    ctx.arc(tg.x, tg.y, coreR, 0, Math.PI * 2);
    ctx.fillStyle = cueOn ? "#22D3EE" : BRAND.gold;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 26;
    ctx.fill();
    ctx.shadowBlur = 0;
    if (cueOn) {
      ctx.beginPath();
      ctx.arc(tg.x, tg.y, coreR, 0, Math.PI * 2);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = BRAND.text;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(tg.x, tg.y);
    ctx.strokeStyle = "rgba(196, 69, 69, 0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const onCanvasPoint = useCallback((e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: clamp((e.clientX - r.left) * (W / r.width), 0, W),
      y: clamp((e.clientY - r.top) * (H / r.height), 0, H)
    };
  }, []);
  const tryPointerLock = useCallback(async () => {
    if (!canvasRef.current?.requestPointerLock) return false;
    try {
      const r = canvasRef.current.requestPointerLock();
      if (r && typeof r.then === "function") await r;
      return true;
    } catch {
      return false;
    }
  }, []);
  const onCanvasClick = useCallback(async (e) => {
    if (phaseRef.current !== "arming") return;
    const p = onCanvasPoint(e);
    cursorRef.current.x = p.x;
    cursorRef.current.y = p.y;
    cursorRef.current.lastX = p.x;
    cursorRef.current.lastY = p.y;
    if (!lockedRef.current) {
      const ok = await tryPointerLock();
      inputModeRef.current = ok ? "pointer_lock_relative" : "fallback_absolute";
      if (!ok) {
        flagsRef.current.push({
          code: "no_pointer_lock",
          block_id: blocks[blockIndexRef.current]?.id,
          t: activeTimeRef.current,
          detail: "Pointer-lock request denied or unavailable; using absolute fallback."
        });
        onHardwareFlag?.();
      }
    }
    setHud((h) => ({ ...h, inputMode: inputModeRef.current }));
    phaseRef.current = "countdown";
    countdownEndRef.current = performance.now() + 3200;
  }, [blocks, onCanvasPoint, tryPointerLock, onHardwareFlag]);
  const onMouseMove = useCallback((e) => {
    if (lockedRef.current) {
      if (performance.now() - justLockedAtRef.current < 120) return;
      cursorRef.current.x = clamp(cursorRef.current.x + e.movementX, 0, W);
      cursorRef.current.y = clamp(cursorRef.current.y + e.movementY, 0, H);
      return;
    }
    if (phaseRef.current === "arming") return;
    const p = onCanvasPoint(e);
    cursorRef.current.x = p.x;
    cursorRef.current.y = p.y;
  }, [onCanvasPoint]);
  const onKeyDown = useCallback((e) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    const b = blocks[blockIndexRef.current];
    if (!b || b.kind !== "dual" || phaseRef.current !== "running") return;
    const d = dualRef.current;
    if (d.cueOn && activeTimeRef.current <= d.cueWindowEnd) {
      d.hits++;
      d.cueOn = false;
    } else {
      d.falseAlarms++;
    }
  }, [blocks]);
  const onPointerLockChange = useCallback(() => {
    const wasLocked = lockedRef.current;
    lockedRef.current = document.pointerLockElement === canvasRef.current;
    if (lockedRef.current && !wasLocked) {
      justLockedAtRef.current = performance.now();
    }
    inputModeRef.current = lockedRef.current ? "pointer_lock_relative" : "fallback_absolute";
    setHud((h) => ({ ...h, inputMode: inputModeRef.current }));
  }, []);
  const onMouseLeave = useCallback(() => {
    if (phaseRef.current !== "running" || lockedRef.current) return;
    flagsRef.current.push({
      code: "cursor_left_canvas",
      block_id: blocks[blockIndexRef.current]?.id,
      t: activeTimeRef.current,
      detail: "Cursor exited the test arena while a scored block was running."
    });
    onHardwareFlag?.();
  }, [blocks, onHardwareFlag]);
  const onVisibility = useCallback(() => {
    if (document.visibilityState === "hidden" && phaseRef.current === "running") {
      flagsRef.current.push({
        code: "tab_blur",
        block_id: blocks[blockIndexRef.current]?.id,
        t: activeTimeRef.current,
        detail: "Tab/window lost focus during a scored block."
      });
      onHardwareFlag?.();
    }
  }, [blocks, onHardwareFlag]);
  const cleanupListeners = useCallback(() => {
    document.removeEventListener("pointerlockchange", onPointerLockChange);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("visibilitychange", onVisibility);
    if (document.pointerLockElement === canvasRef.current) {
      try {
        document.exitPointerLock();
      } catch {
      }
    }
  }, [onPointerLockChange, onKeyDown, onMouseMove, onVisibility]);
  useEffect(() => {
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("visibilitychange", onVisibility);
    armBlock(0);
    lastClockRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cleanupListeners();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);
  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${r}`;
  };
  return /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-root", children: /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-stage-wrap", children: /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-canvas-frame", children: [
    /* @__PURE__ */ jsx(
      "canvas",
      {
        ref: canvasRef,
        width: W,
        height: H,
        className: "pfm-pursuit-canvas",
        style: {
          width: "min(96vw, calc(100vw - 40px))",
          height: "min(86vh, 820px)",
          maxWidth: 1200,
          maxHeight: 820
        },
        onClick: onCanvasClick,
        onMouseMove,
        onMouseLeave
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-pill", children: hud.countdown != null ? typeof hud.countdown === "number" ? `Starting in ${hud.countdown}` : "Go" : `${hud.blockLabel} \u2022 ${hud.blockNum}/${hud.totalBlocks}` }),
    /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-hud", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Time left" }),
        /* @__PURE__ */ jsx("span", { children: fmtTime(hud.timeLeft) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "On-target" }),
        /* @__PURE__ */ jsxs("span", { children: [
          hud.onTargetPct.toFixed(0),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Input" }),
        /* @__PURE__ */ jsx("span", { children: hud.inputMode === "pointer_lock_relative" ? "locked" : "fallback" })
      ] })
    ] }),
    overlay.visible && /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-overlay", children: /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-card", style: { maxWidth: 640, textAlign: "center" }, children: [
      /* @__PURE__ */ jsx("h2", { children: overlay.title }),
      /* @__PURE__ */ jsx("p", { children: overlay.body }),
      /* @__PURE__ */ jsx("p", { className: "pfm-pursuit-muted", children: "Click on the bullseye to begin this block." })
    ] }) })
  ] }) }) });
}
function PursuitModule(props) {
  const {
    candidate,
    session,
    testPackage,
    license,
    organization,
    device,
    policy,
    onComplete,
    onExit
  } = props;
  const protocol = useMemo(() => {
    const fromPkg = testPackage?.parameters ?? testPackage ?? null;
    const fromPolicy = policy?.protocol ?? null;
    return { ...DEFAULT_PROTOCOL, ...fromPolicy || {}, ...fromPkg || {} };
  }, [testPackage, policy]);
  const [phase, setPhase] = useState("confirm");
  const [fingerprint, setFingerprint] = useState(null);
  const [hwWarnings, setHwWarnings] = useState([]);
  const [summaryMetrics, setSummary] = useState(null);
  const [retestEligible, setRetest] = useState(false);
  const flaggedAtRunRef = useRef(false);
  useEffect(() => {
    injectStyles();
  }, []);
  const handleHardwareFlag = useCallback(() => {
    flaggedAtRunRef.current = true;
  }, []);
  const handleRunComplete = useCallback((runResult) => {
    const eligible = flaggedAtRunRef.current || runResult.flags.some((f) => f.code !== "low_refresh");
    setRetest(eligible);
    const summary = scorer(runResult.aggregates, {
      input_mode_final: runResult.inputModeFinal,
      retest_eligible: eligible,
      retest_used: false
    });
    setSummary(summary);
    const predRow = runResult.aggregates.find((b) => b.kind === "predictive");
    const reactRow = runResult.aggregates.find((b) => b.kind === "reactive");
    const anticipationIndex = predRow && reactRow ? +(reactRow.normalized_rms - predRow.normalized_rms).toFixed(4) : null;
    const internalTiers = Object.fromEntries(
      Object.keys(TIER_BANDS.cutoffs).map((k) => [k, tierFor(k, summary[k])])
    );
    const result = {
      module_code: MODULE_CODE,
      module_version: MODULE_VERSION,
      bpr_domain: BPR_DOMAIN,
      completed_at: (/* @__PURE__ */ new Date()).toISOString(),
      summary_metrics: summary,
      raw_output: {
        protocol,
        norm_version: NORM_VERSION,
        package_schema_version: PACKAGE_SCHEMA_VERSION,
        runtime_environment: runResult.fingerprint,
        hardware_flags: runResult.flags,
        block_aggregates: runResult.aggregates,
        tier_bands: internalTiers,
        /* internal — analysts/admins */
        candidate_facing_tiers: Object.fromEntries(
          /* what the candidate saw     */
          Object.entries(internalTiers).map(([k, t]) => [k, candidateTierLabel(t)])
        ),
        supported_radius_px: runResult.supportedRadiusPx,
        bandwidth_hz: runResult.bandwidthHz,
        directional_asymmetry_px: runResult.directionalAsymmetryPx,
        anticipation_index: anticipationIndex,
        candidate_id: candidate?.id ?? candidate?.candidate_code ?? null,
        session_id: session?.id ?? session?.session_code ?? null,
        license_id: license?.id ?? null,
        organization_id: organization?.id ?? null,
        device_id: device?.id ?? null
      }
    };
    try {
      onComplete?.(result);
    } catch (e) {
      console.error("[PURSUIT] onComplete handler threw:", e);
    }
    setPhase("result");
  }, [protocol, candidate, session, license, organization, device, onComplete]);
  if (phase === "confirm") {
    return /* @__PURE__ */ jsx(
      ConfirmPhase,
      {
        candidate,
        onConfirm: () => setPhase("hardware"),
        onExit
      }
    );
  }
  if (phase === "hardware") {
    return /* @__PURE__ */ jsx(
      HardwareCheckPhase,
      {
        onContinue: (fp, warnings) => {
          setFingerprint(fp);
          setHwWarnings(warnings);
          setPhase("run");
        }
      }
    );
  }
  if (phase === "run") {
    return /* @__PURE__ */ jsx(
      BlockRunner,
      {
        protocol,
        initialFingerprint: fingerprint,
        onHardwareFlag: handleHardwareFlag,
        onComplete: handleRunComplete
      }
    );
  }
  if (phase === "result" && summaryMetrics) {
    return /* @__PURE__ */ jsx(
      ResultPhase,
      {
        summary: summaryMetrics,
        retestEligible,
        onFinish: () => onExit?.()
      }
    );
  }
  return /* @__PURE__ */ jsx("div", { className: "pfm-pursuit-root", style: { padding: 40 }, children: /* @__PURE__ */ jsxs("div", { className: "pfm-pursuit-card", children: [
    /* @__PURE__ */ jsx("h1", { children: "Pursuit" }),
    /* @__PURE__ */ jsx("p", { children: "Loading\u2026" })
  ] }) });
}
var PursuitModule_default = PursuitModule;
export {
  BPR_DOMAIN,
  MODULE_CODE,
  MODULE_ID,
  MODULE_MANIFEST,
  MODULE_VERSION,
  NORM_VERSION,
  PARAMETER_SCHEMA,
  TIER_BANDS,
  PursuitModule_default as default,
  scorer
};
