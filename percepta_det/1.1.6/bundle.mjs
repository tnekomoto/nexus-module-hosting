// nexus-modules/PERCEPTA_DET_nexus.jsx
import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import { buildBprResult, validateBprResult } from "nexus-module-api";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var MODULE_CODE = "PERCEPTA_DET";
var MODULE_VERSION = "1.1.6";
var BPR_DOMAIN = "Visual Detection";
var TRIAL_TIME_LIMIT_MS = 6e4;
var WRONG_CLICK_PENALTY_MS = 5e3;
var MAX_WRONG_GUESSES = 3;
var GRAY_CSS = "rgb(128,128,128)";
var TIMING_CONFIGS = {
  slow: { originalMs: 500, grayMs: 100 },
  quick: { originalMs: 240, grayMs: 80 }
};
var CONFIDENCE_PERCENT = { Low: 33, Medium: 66, High: 100 };
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function isInsideHotspot(xPct, yPct, hotspot) {
  if (!hotspot) return false;
  if (hotspot.type === "rect") {
    return xPct >= hotspot.x && xPct <= hotspot.x + hotspot.width && yPct >= hotspot.y && yPct <= hotspot.y + hotspot.height;
  }
  const pts = hotspot.points;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if (yi > yPct !== yj > yPct && xPct < (xj - xi) * (yPct - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function generateSessionId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `sess_${Date.now()}_${Array.from(bytes, (b) => chars[b % chars.length]).join("")}`;
}
function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function calculateDerivedData(attempts, trialSummaries, formalTrialCount) {
  const formalSummaries = trialSummaries.filter((t) => t.phase === "formal");
  const formalAttempts = attempts.filter((a) => a.phase === "formal" && !a.wasGuided);
  const correctSummaries = formalSummaries.filter((t) => t.correct);
  const totalAttempts = formalAttempts.length;
  const incorrectAttempts = formalAttempts.filter((a) => !a.correct).length;
  const highConfErr = formalAttempts.filter((a) => !a.correct && a.confidenceLabel === "High").length;
  const trialIds = [...new Set(formalAttempts.map((a) => a.trialId))];
  const firstClickTimes = [];
  for (const tid of trialIds) {
    const ta = formalAttempts.filter((a) => a.trialId === tid).sort((a, b) => a.attemptNumber - b.attemptNumber);
    if (ta.length) firstClickTimes.push(ta[0].reactionTimeSeconds);
  }
  const metrics = {
    formalTrialCount,
    completedFormalTrials: formalSummaries.length,
    correctTrials: correctSummaries.length,
    missedTrials: formalSummaries.filter((t) => !t.correct).length,
    timeouts: formalSummaries.filter((t) => t.endReason === "timeout").length,
    maxGuessFailures: formalSummaries.filter((t) => t.endReason === "max_guesses").length,
    totalAttempts,
    incorrectAttempts,
    averageCorrectTimeSeconds: avg(correctSummaries.filter((t) => t.responseTimeSeconds != null).map((t) => t.responseTimeSeconds)),
    averageFirstClickTimeSeconds: avg(firstClickTimes),
    averageConfidencePercent: avg(formalAttempts.map((a) => a.confidencePercent)) ?? 0,
    highConfidenceErrors: highConfErr
  };
  const correctRate = formalTrialCount > 0 ? metrics.correctTrials / formalTrialCount : 0;
  const avgCorrectTimeRatio = (metrics.averageCorrectTimeSeconds ?? 60) / 60;
  const detectionScore = clamp(correctRate * 70 + (1 - avgCorrectTimeRatio) * 30, 0, 100);
  const maxPossibleAttempts = formalTrialCount * MAX_WRONG_GUESSES;
  const earlyClickScore = metrics.averageFirstClickTimeSeconds != null ? clamp((1 - metrics.averageFirstClickTimeSeconds / 60) * 100, 0, 100) / 100 : 0;
  const guessFreqScore = maxPossibleAttempts > 0 ? Math.min(1, totalAttempts / maxPossibleAttempts) : 0;
  const wrongGuessScore = totalAttempts > 0 ? incorrectAttempts / totalAttempts : 0;
  const riskScore = clamp(earlyClickScore * 45 + guessFreqScore * 30 + wrongGuessScore * 25, 0, 100);
  let penaltyScore;
  const afterPenalty = formalAttempts.filter((a) => a.wasAfterPenalty && a.timeSincePreviousAttemptSec != null);
  if (afterPenalty.length > 0) {
    const avgDelay = avg(afterPenalty.map((a) => a.timeSincePreviousAttemptSec));
    const normalizedDelay = Math.min(1, Math.max(0, (avgDelay - 5) / 15));
    const wrongAfter = afterPenalty.filter((a) => !a.correct).length;
    const repeatPenalty = 1 - wrongAfter / afterPenalty.length * 0.5;
    penaltyScore = clamp(normalizedDelay * 100 * repeatPenalty, 0, 100);
  } else {
    penaltyScore = clamp((1 - incorrectAttempts / Math.max(1, totalAttempts)) * 100, 0, 100);
  }
  let calibrationScore;
  if (formalAttempts.length > 0) {
    const calibErrors = formalAttempts.map((a) => Math.abs(a.confidencePercent / 100 - (a.correct ? 1 : 0)));
    calibrationScore = clamp((1 - (avg(calibErrors) ?? 0)) * 100, 0, 100);
  } else {
    calibrationScore = 0;
  }
  return {
    metrics,
    scores: {
      detectionPerformanceScore: detectionScore,
      riskGuessingTendencyScore: riskScore,
      penaltySensitivityScore: penaltyScore,
      confidenceCalibrationScore: calibrationScore
    },
    profile: {
      performanceCategory: detectionScore >= 80 ? "High performer" : detectionScore >= 60 ? "Moderate performer" : "Low performer",
      riskCategory: riskScore >= 66 ? "Risk-tolerant / guess-prone" : riskScore >= 31 ? "Balanced" : "Conservative / cautious",
      penaltyResponseCategory: penaltyScore >= 66 ? "Penalty-sensitive" : penaltyScore >= 31 ? "Moderate penalty sensitivity" : "Penalty-insensitive",
      confidenceCategory: calibrationScore >= 80 ? "Well calibrated" : highConfErr >= 2 ? "Overconfident under uncertainty" : "Poorly calibrated / uncertain"
    }
  };
}
function makeInitialState(pkg) {
  return {
    phase: "confirm",
    currentPhase: pkg.practiceTrials.length > 0 ? "practice" : "formal",
    currentTrialIndex: 0,
    guessCount: 0,
    totalPenaltyMs: 0,
    pendingClick: null,
    attempts: [],
    trialSummaries: [],
    failedReason: null
  };
}
function trialsForPhase(state, pkg) {
  return state.currentPhase === "practice" ? pkg.practiceTrials : pkg.formalTrials;
}
function currentTrial(state, pkg) {
  return trialsForPhase(state, pkg)[state.currentTrialIndex] ?? null;
}
function trialNumber(state, pkg) {
  const pc = pkg.practiceTrials.length;
  return state.currentPhase === "practice" ? state.currentTrialIndex + 1 : pc + state.currentTrialIndex + 1;
}
function recordAttempt(state, pkg, click, correct, confidenceLabel) {
  const trial = currentTrial(state, pkg);
  const confidencePercent = CONFIDENCE_PERCENT[confidenceLabel];
  const wasAfterPenalty = state.guessCount > 0;
  const prev = state.attempts.filter((a) => a.trialId === trial.id);
  const last = prev.length > 0 ? prev[prev.length - 1] : null;
  const timeSincePreviousAttemptSec = last != null ? Math.max(0, click.reactionTimeSec - last.reactionTimeSeconds) : void 0;
  return {
    trialId: trial.id,
    trialLabel: trial.label,
    trialNumber: trialNumber(state, pkg),
    phase: state.currentPhase,
    attemptNumber: state.guessCount + 1,
    clickXPercent: click.x,
    clickYPercent: click.y,
    correct,
    confidenceLabel,
    confidencePercent,
    reactionTimeSeconds: click.reactionTimeSec,
    penaltySecondsApplied: correct ? 0 : WRONG_CLICK_PENALTY_MS / 1e3,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    timeSincePreviousAttemptSec,
    wasAfterPenalty
  };
}
function recordTrialSummary(state, pkg, correct, responseTimeSec, endReason, attemptsRecorded) {
  const trial = currentTrial(state, pkg);
  return {
    trialId: trial.id,
    trialLabel: trial.label,
    trialNumber: trialNumber(state, pkg),
    phase: state.currentPhase,
    correct,
    responseTimeSeconds: responseTimeSec,
    totalErrors: state.guessCount,
    totalPenaltySeconds: state.totalPenaltyMs / 1e3,
    timeLimitReached: endReason === "timeout",
    maxGuessesReached: endReason === "max_guesses",
    endReason,
    attemptsRecorded
  };
}
function advanceToNextTrial(state, pkg) {
  const trials = trialsForPhase(state, pkg);
  const nextIndex = state.currentTrialIndex + 1;
  const reset = { guessCount: 0, totalPenaltyMs: 0, pendingClick: null, failedReason: null };
  if (nextIndex < trials.length) {
    return { ...state, ...reset, phase: "trial_prep", currentTrialIndex: nextIndex };
  }
  if (state.currentPhase === "practice" && pkg.formalTrials.length > 0) {
    return { ...state, ...reset, phase: "instructions", currentPhase: "formal", currentTrialIndex: 0 };
  }
  return { ...state, phase: "results" };
}
function reducer(state, action) {
  const pkg = action.pkg;
  switch (action.type) {
    case "CONFIRM_CANDIDATE":
      return { ...state, phase: "instructions" };
    case "INSTRUCTIONS_DONE":
      return {
        ...state,
        phase: "trial_prep",
        currentTrialIndex: 0,
        guessCount: 0,
        totalPenaltyMs: 0,
        pendingClick: null,
        failedReason: null
      };
    case "START_TRIAL":
      return {
        ...state,
        phase: "flickering",
        guessCount: 0,
        totalPenaltyMs: 0,
        pendingClick: null,
        failedReason: null
      };
    case "CLICK_IMAGE":
      return { ...state, phase: "confidence_prompt", pendingClick: action.payload };
    case "SUBMIT_CONFIDENCE": {
      const { pendingClick } = state;
      if (!pendingClick) return state;
      const trial = currentTrial(state, pkg);
      if (!trial?.hotspot) return state;
      const correct = isInsideHotspot(pendingClick.x, pendingClick.y, trial.hotspot);
      const attempt = recordAttempt(state, pkg, pendingClick, correct, action.payload);
      if (correct) {
        const netResponseTime = Math.min(
          TRIAL_TIME_LIMIT_MS / 1e3,
          pendingClick.reactionTimeSec - state.totalPenaltyMs / 1e3
        );
        const summary = recordTrialSummary(state, pkg, true, netResponseTime, "success", state.guessCount + 1);
        return {
          ...state,
          phase: "correct_feedback",
          attempts: [...state.attempts, attempt],
          trialSummaries: [...state.trialSummaries, summary],
          pendingClick: null
        };
      }
      const newGuessCount = state.guessCount + 1;
      const newPenaltyMs = state.totalPenaltyMs + WRONG_CLICK_PENALTY_MS;
      if (newGuessCount >= MAX_WRONG_GUESSES) {
        const summary = recordTrialSummary(
          { ...state, guessCount: newGuessCount, totalPenaltyMs: newPenaltyMs },
          pkg,
          false,
          null,
          "max_guesses",
          newGuessCount
        );
        return {
          ...state,
          phase: "failed_feedback",
          failedReason: "max_guesses",
          guessCount: newGuessCount,
          totalPenaltyMs: newPenaltyMs,
          attempts: [...state.attempts, attempt],
          trialSummaries: [...state.trialSummaries, summary],
          pendingClick: null
        };
      }
      return {
        ...state,
        phase: "penalty",
        guessCount: newGuessCount,
        totalPenaltyMs: newPenaltyMs,
        attempts: [...state.attempts, attempt],
        pendingClick: null
      };
    }
    case "PENALTY_COMPLETE":
      return { ...state, phase: "flickering" };
    case "TIMEOUT": {
      const summary = recordTrialSummary(state, pkg, false, null, "timeout", state.guessCount);
      return {
        ...state,
        phase: "timeout_reveal",
        failedReason: "timeout",
        timeRemainingMs: 0,
        trialSummaries: [...state.trialSummaries, summary]
      };
    }
    case "GUIDED_CLICK": {
      const trial = currentTrial(state, pkg);
      if (!trial) return advanceToNextTrial(state, pkg);
      const attempt = {
        testId: pkg.testId,
        candidateId: state.candidateId,
        sessionId: state.sessionId,
        trialId: trial.id,
        trialLabel: trial.label,
        trialNumber: trialNumber(state, pkg),
        phase: state.currentPhase,
        attemptNumber: state.guessCount + 1,
        clickXPercent: action.payload.x,
        clickYPercent: action.payload.y,
        correct: true,
        confidenceLabel: "Low",
        confidencePercent: 0,
        reactionTimeSeconds: action.payload.reactionTimeSec,
        penaltySecondsApplied: 0,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        wasAfterPenalty: false,
        wasGuided: true
      };
      return advanceToNextTrial({ ...state, attempts: [...state.attempts, attempt] }, pkg);
    }
    case "NEXT_TRIAL":
      return advanceToNextTrial(state, pkg);
    default:
      return state;
  }
}
function useFlicker(timingMode, active) {
  const [frame, setFrame] = useState("gray");
  const ref = useRef({ active: false, timeout: null, internal: "base" });
  useEffect(() => {
    ref.current.active = active;
  });
  useEffect(() => {
    const next = { base: "gray1", gray1: "altered", altered: "gray2", gray2: "base" };
    const toDisplay = (f) => f === "gray1" || f === "gray2" ? "gray" : f;
    const dur = (f) => {
      const t = TIMING_CONFIGS[timingMode] ?? TIMING_CONFIGS.slow;
      return f === "gray1" || f === "gray2" ? t.grayMs : t.originalMs;
    };
    if (!active) {
      if (ref.current.timeout) clearTimeout(ref.current.timeout);
      setFrame("gray");
      ref.current.internal = "base";
      return;
    }
    const schedule = () => {
      const cur = ref.current.internal;
      setFrame(toDisplay(cur));
      ref.current.timeout = setTimeout(() => {
        if (!ref.current.active) return;
        ref.current.internal = next[cur];
        schedule();
      }, dur(cur));
    };
    ref.current.internal = "base";
    schedule();
    return () => {
      if (ref.current.timeout) clearTimeout(ref.current.timeout);
    };
  }, [active, timingMode]);
  return frame;
}
function useTrialTimer(active, onTimeout, trialKey) {
  const [remaining, setRemaining] = useState(TRIAL_TIME_LIMIT_MS);
  const remainingRef = useRef(TRIAL_TIME_LIMIT_MS);
  const prevKeyRef = useRef(trialKey);
  const firedRef = useRef(false);
  const intervalRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  });
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (prevKeyRef.current !== trialKey) {
      prevKeyRef.current = trialKey;
      remainingRef.current = TRIAL_TIME_LIMIT_MS;
      firedRef.current = false;
      setRemaining(TRIAL_TIME_LIMIT_MS);
    }
    if (!active) return;
    intervalRef.current = setInterval(() => {
      remainingRef.current = Math.max(0, remainingRef.current - 100);
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onTimeoutRef.current();
      }
    }, 100);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, trialKey]);
  return remaining;
}
function usePenaltyTimer(active, durationMs, onDone) {
  const [remaining, setRemaining] = useState(durationMs);
  const remainingRef = useRef(durationMs);
  const onDoneRef = useRef(onDone);
  const intervalRef = useRef(null);
  const firedRef = useRef(false);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!active) {
      remainingRef.current = durationMs;
      firedRef.current = false;
      setRemaining(durationMs);
      return;
    }
    remainingRef.current = durationMs;
    firedRef.current = false;
    setRemaining(durationMs);
    intervalRef.current = setInterval(() => {
      remainingRef.current = Math.max(0, remainingRef.current - 100);
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(intervalRef.current);
        onDoneRef.current();
      }
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, durationMs]);
  return remaining;
}
function FlickerCanvas({ trial, frame, timeRemaining, guessCount, showHotspot, clickable, isPractice, showTimer, onClickPercent, trialStartTs }) {
  const containerRef = useRef(null);
  const handleClick = useCallback((e) => {
    if (!clickable) return;
    const r = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 100;
    const y = (e.clientY - r.top) / r.height * 100;
    onClickPercent(x, y, (performance.now() - trialStartTs.current) / 1e3);
  }, [clickable, onClickPercent, trialStartTs]);
  const src = frame === "base" ? trial.baseImageDataUrl ?? "" : frame === "altered" ? trial.alteredImageDataUrl ?? "" : null;
  const remainingSec = Math.ceil(timeRemaining / 1e3);
  const timerWarning = remainingSec <= 10;
  const imgWidth = "min(100vw, calc((100dvh - 3rem) * 1.75))";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex flex-col min-h-full w-full items-center justify-center",
      style: { backgroundColor: GRAY_CSS },
      children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: imgWidth,
          height: "3rem",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: "0.75rem",
          visibility: showTimer ? "visible" : "hidden"
        }, children: /* @__PURE__ */ jsx(
          "div",
          {
            className: `select-none rounded-2xl px-4 py-1.5 font-mono font-black tabular-nums shadow-xl leading-none
                         ${timerWarning ? "bg-red-600 text-white ring-2 ring-red-400/60" : "bg-black/60 text-white"}`,
            style: { fontSize: "clamp(1.25rem,3.5vw,2.25rem)", backdropFilter: "blur(6px)", textShadow: "0 2px 8px rgba(0,0,0,0.6)" },
            children: remainingSec
          }
        ) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: containerRef,
            onClick: handleClick,
            style: {
              position: "relative",
              aspectRatio: "7 / 4",
              width: imgWidth,
              backgroundColor: GRAY_CSS,
              cursor: clickable ? "crosshair" : "default",
              userSelect: "none",
              flexShrink: 0
            },
            children: [
              isPractice && clickable && /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-10", children: /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-[#C9A84C]/90 px-4 py-1 text-sm font-bold text-[#0D0D0D] shadow animate-pulse whitespace-nowrap", children: "\u{1F446} Click on the change" }) }),
              src ? /* @__PURE__ */ jsx(
                "img",
                {
                  src,
                  alt: "",
                  draggable: false,
                  style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
                }
              ) : null,
              guessCount > 0 && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute top-3 right-3 z-10 flex gap-1.5 items-center rounded-2xl bg-orange-500/90 px-4 py-2 shadow-xl",
                  style: { backdropFilter: "blur(6px)" },
                  children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx("span", { className: `inline-block w-3 h-3 rounded-full ${i < guessCount ? "bg-white" : "bg-white/25"}` }, i))
                }
              ),
              showHotspot && trial.hotspot && /* @__PURE__ */ jsx(HotspotOverlay, { hotspot: trial.hotspot })
            ]
          }
        )
      ]
    }
  );
}
function HotspotOverlay({ hotspot }) {
  if (hotspot.type === "rect") {
    return /* @__PURE__ */ jsx(
      "svg",
      {
        viewBox: "0 0 100 100",
        preserveAspectRatio: "none",
        className: "pointer-events-none absolute inset-0 h-full w-full",
        children: /* @__PURE__ */ jsx(
          "rect",
          {
            x: hotspot.x,
            y: hotspot.y,
            width: hotspot.width,
            height: hotspot.height,
            fill: "rgba(250,204,21,0.3)",
            stroke: "#facc15",
            strokeWidth: "0.5"
          }
        )
      }
    );
  }
  const pts = hotspot.points.map((p) => `${p.x},${p.y}`).join(" ");
  return /* @__PURE__ */ jsx(
    "svg",
    {
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
      className: "pointer-events-none absolute inset-0 h-full w-full",
      children: /* @__PURE__ */ jsx("polygon", { points: pts, fill: "rgba(250,204,21,0.3)", stroke: "#facc15", strokeWidth: "0.6" })
    }
  );
}
var CONFIDENCE_LEVELS = [
  { label: "Low", desc: "Not very sure", color: "border-gray-300 hover:border-gray-400 hover:bg-gray-50" },
  { label: "Medium", desc: "Reasonably confident", color: "border-blue-300 hover:border-blue-400 hover:bg-blue-50" },
  { label: "High", desc: "Very confident", color: "border-green-400 hover:border-green-500 hover:bg-green-50" }
];
function ConfidenceModal({ onSelect }) {
  return /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xs rounded-2xl bg-white p-8 shadow-2xl text-center", children: [
    /* @__PURE__ */ jsx("h3", { className: "mb-1 text-xl font-bold text-gray-800", children: "How confident are you?" }),
    /* @__PURE__ */ jsx("p", { className: "mb-6 text-sm text-gray-500", children: "Rate your certainty about this click" }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3", children: CONFIDENCE_LEVELS.map(({ label, desc, color }) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => onSelect(label),
        className: `w-full rounded-xl border-2 py-3.5 transition-colors active:scale-95 ${color}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: "block text-lg font-bold text-gray-800", children: label }),
          /* @__PURE__ */ jsx("span", { className: "block text-xs text-gray-500 mt-0.5", children: desc })
        ]
      },
      label
    )) })
  ] }) });
}
function CorrectOverlay({ onNext }) {
  return /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-black/50", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-8 w-full max-w-sm rounded-2xl bg-green-500 px-8 py-6 text-center shadow-2xl", children: /* @__PURE__ */ jsx("p", { className: "text-4xl font-black text-white", children: "\u2713 Correct!" }) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onNext,
        className: "rounded-2xl bg-white px-12 py-4 text-xl font-bold text-gray-800 shadow-xl hover:bg-gray-50 active:scale-95 transition-all",
        children: "Next \u2192"
      }
    )
  ] });
}
function PenaltyOverlay({ penaltyRemaining, guessCount }) {
  return /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-black/60", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl bg-gray-800 border border-gray-700 px-8 py-6 text-center shadow-2xl", children: [
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-white", children: "\u25CE Keep Looking" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-gray-300", children: [
      "Attempt ",
      guessCount,
      " of 3 \u2014 resuming in ",
      Math.ceil(penaltyRemaining / 1e3),
      "s"
    ] })
  ] }) });
}
function TimeoutRevealBanner() {
  return /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center pb-4 px-4", children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex items-center gap-3 rounded-2xl px-6 py-3 shadow-2xl animate-pulse",
      style: {
        background: "linear-gradient(135deg,rgba(201,168,76,0.95),rgba(232,201,110,0.95))",
        backdropFilter: "blur(8px)",
        border: "2px solid rgba(255,255,255,0.3)"
      },
      children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xl", children: "\u{1F446}" }),
        /* @__PURE__ */ jsx("span", { className: "font-bold text-[#0D0D0D] text-sm leading-snug", children: "The change is highlighted \u2014 click on it to continue" })
      ]
    }
  ) });
}
function FailedOverlay({ reason, onNext }) {
  return /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center bg-black/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 w-full max-w-sm rounded-2xl bg-gray-800 px-8 py-6 text-center shadow-2xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-white", children: reason === "max_guesses" ? "\u25CE All Options Explored" : "\u23F1 Time Expired" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-300", children: "The change is highlighted below." })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onNext,
        className: "rounded-2xl bg-white px-12 py-4 text-xl font-bold text-gray-800 shadow-xl hover:bg-gray-50 active:scale-95 transition-all",
        children: "Next \u2192"
      }
    )
  ] });
}
function CandidateConfirm({ candidateName, candidateCode, testName, onConfirm }) {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-full flex-col items-center justify-center bg-[#0D0D0D] px-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-[#C9A84C]/30 bg-[#111111] p-8 text-center shadow-2xl", children: [
    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-[#C9A84C]" }) }),
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-[#C9A84C]", children: "Percepta Detect" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-lg font-bold text-white", children: testName }),
    /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-gray-500", children: "Visual Change Detection Assessment" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-xl border border-gray-700 bg-[#0D0D0D] px-4 py-4 space-y-3", children: [
      candidateCode && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-gray-600 mb-0.5", children: "Candidate Number" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-[#C9A84C] tracking-wide font-mono", children: candidateCode })
      ] }),
      candidateName && candidateName !== candidateCode && /* @__PURE__ */ jsxs("div", { className: candidateCode ? "border-t border-gray-800 pt-3" : "", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-gray-600 mb-0.5", children: "Name" }),
        /* @__PURE__ */ jsx("p", { className: "text-base font-semibold text-white", children: candidateName })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onConfirm,
        className: "mt-6 w-full rounded-xl py-3 text-base font-bold text-[#0D0D0D] transition-all active:scale-95",
        style: { background: "linear-gradient(135deg,#C9A84C,#E8C96E)" },
        children: "Confirm & Begin \u2192"
      }
    ),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-[10px] text-gray-600", children: "If your information is incorrect, contact your test administrator." }),
    /* @__PURE__ */ jsxs("p", { className: "mt-2 text-[9px] text-gray-700 font-mono tracking-wider", children: [
      MODULE_CODE,
      " \xB7 v",
      MODULE_VERSION
    ] })
  ] }) });
}
function Instructions({ phase, onReady }) {
  const isPractice = phase === "practice";
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-full flex-col items-center justify-center gap-6 bg-[#0D0D0D] px-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg rounded-2xl border border-[#C9A84C]/30 bg-[#111111] p-8 shadow-2xl", children: [
    /* @__PURE__ */ jsx("p", { className: "mb-1 text-xs font-bold uppercase tracking-widest text-[#C9A84C]", children: isPractice ? "Practice Phase" : "Formal Test" }),
    /* @__PURE__ */ jsx("h2", { className: "mb-5 text-2xl font-bold text-white", children: isPractice ? "How It Works" : "Test Begins Now" }),
    /* @__PURE__ */ jsx("div", { className: "mb-6 space-y-3 text-sm text-gray-300 leading-relaxed", children: isPractice ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "Two versions of an image will alternate rapidly with a brief gray screen between them.",
        /* @__PURE__ */ jsx("strong", { className: "text-white", children: " One small region changes" }),
        " between the two versions."
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Watch carefully. When you spot the change,",
        /* @__PURE__ */ jsx("strong", { className: "text-[#C9A84C]", children: " click directly on it" }),
        "."
      ] }),
      /* @__PURE__ */ jsx("p", { children: "You will then be asked how confident you are. Feedback follows immediately." }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-gray-700 bg-[#0D0D0D] px-4 py-3 mt-4 space-y-1.5 text-xs text-gray-400", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-[#C9A84C] font-semibold", children: "\u23F1 60 seconds" }),
          " per trial"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-[#C9A84C] font-semibold", children: "\u2717 3 attempts" }),
          " before the answer is revealed"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-[#C9A84C] font-semibold", children: "5-second penalty" }),
          " for each wrong click"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-[#C9A84C] font-semibold", children: "\u{1F446} If time expires" }),
          " the change will be highlighted \u2014 click on it to move to the next trial"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 italic", children: "Practice trials do not count toward your score." })
      ] })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "Practice is complete. You are now starting the ",
        /* @__PURE__ */ jsx("strong", { className: "text-white", children: "formal test" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        "Same rules apply \u2014 spot the change and ",
        /* @__PURE__ */ jsx("strong", { className: "text-[#C9A84C]", children: "click on it" }),
        " as quickly and accurately as possible."
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-4 py-3 mt-4 text-xs text-[#C9A84C]", children: "Your responses are now being recorded." })
    ] }) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onReady,
        className: "w-full rounded-lg py-3 text-base font-bold text-[#0D0D0D] transition-all",
        style: { background: "linear-gradient(135deg,#C9A84C,#E8C96E)" },
        children: isPractice ? "Start Practice \u2192" : "Start Test \u2192"
      }
    )
  ] }) });
}
function TrialPrep({ trialLabel, displayNumber, totalTrials, phase, onStart }) {
  const isP = phase === "practice";
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-full flex-col items-center justify-center gap-6 bg-[#0D0D0D]", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center select-none", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-[#C9A84C]", children: isP ? "Practice" : "Formal Test" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-4xl font-bold text-white", children: [
        isP ? "Practice" : "Trial",
        " ",
        displayNumber,
        /* @__PURE__ */ jsxs("span", { className: "text-xl font-normal text-gray-500", children: [
          " / ",
          totalTrials
        ] })
      ] }),
      trialLabel && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: trialLabel })
    ] }),
    isP && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-6 py-3 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-[#C9A84C]", children: "\u{1F446} When you see the change \u2014 click on it" }),
      /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-gray-500", children: "Practice trials do not affect your score" })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onStart,
        className: "rounded-2xl px-20 py-6 text-2xl font-bold text-[#0D0D0D] shadow-2xl active:scale-95 transition-all select-none",
        style: { background: "linear-gradient(135deg,#C9A84C,#E8C96E)" },
        children: "Start Trial"
      }
    )
  ] });
}
var CSV_HEADERS = [
  "testId",
  "testName",
  "timingMode",
  "candidateId",
  "completedAt",
  "correctTrials",
  "formalTrialCount",
  "accuracyPct",
  "averageCorrectTimeSeconds",
  "averageFirstClickTimeSeconds",
  "averageConfidencePercent",
  "highConfidenceErrors",
  "totalAttempts",
  "incorrectAttempts",
  "detectionPerformanceScore",
  "riskGuessingTendencyScore",
  "penaltySensitivityScore",
  "confidenceCalibrationScore",
  "performanceCategory",
  "riskCategory",
  "penaltyResponseCategory",
  "confidenceCategory"
];
function csvEsc(v) {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}
function buildCandidateRow(pkg, candidateId, metrics, scores, profile) {
  const formalCount = pkg.formalTrials.length;
  return {
    testId: pkg.testId,
    testName: pkg.testName ?? "",
    timingMode: pkg.timingMode ?? "",
    candidateId,
    completedAt: (/* @__PURE__ */ new Date()).toISOString(),
    correctTrials: metrics.correctTrials,
    formalTrialCount: formalCount,
    accuracyPct: formalCount > 0 ? Math.round(metrics.correctTrials / formalCount * 100) : 0,
    averageCorrectTimeSeconds: metrics.averageCorrectTimeSeconds != null ? metrics.averageCorrectTimeSeconds.toFixed(2) : "",
    averageFirstClickTimeSeconds: metrics.averageFirstClickTimeSeconds != null ? metrics.averageFirstClickTimeSeconds.toFixed(2) : "",
    averageConfidencePercent: metrics.averageConfidencePercent.toFixed(1),
    highConfidenceErrors: metrics.highConfidenceErrors,
    totalAttempts: metrics.totalAttempts,
    incorrectAttempts: metrics.incorrectAttempts,
    detectionPerformanceScore: scores.detectionPerformanceScore.toFixed(1),
    riskGuessingTendencyScore: scores.riskGuessingTendencyScore.toFixed(1),
    penaltySensitivityScore: scores.penaltySensitivityScore.toFixed(1),
    confidenceCalibrationScore: scores.confidenceCalibrationScore.toFixed(1),
    performanceCategory: profile.performanceCategory,
    riskCategory: profile.riskCategory,
    penaltyResponseCategory: profile.penaltyResponseCategory,
    confidenceCategory: profile.confidenceCategory
  };
}
function appendAndDownloadCsv(testId, row) {
  const storageKey = `PERCEPTA_DET_csv_${testId}`;
  let rows = [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) rows = JSON.parse(stored);
  } catch (_) {
  }
  rows.push(row);
  try {
    localStorage.setItem(storageKey, JSON.stringify(rows));
  } catch (_) {
  }
  const csv = [
    CSV_HEADERS.join(","),
    ...rows.map((r) => CSV_HEADERS.map((h) => csvEsc(r[h])).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${testId}_candidates.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function TrialRow({ trial, rank }) {
  const found = trial.correct;
  const timeout = trial.endReason === "timeout";
  const statusColor = found ? "bg-emerald-900/40 text-emerald-400 border-emerald-800/60" : timeout ? "bg-blue-900/20 text-blue-400 border-blue-800/30" : "bg-amber-900/20 text-amber-400 border-amber-800/30";
  const statusLabel = found ? "Detected" : timeout ? "Time Expired" : "Explored";
  const statusIcon = found ? "\u2713" : timeout ? "\u23F1" : "\u25CE";
  const time = trial.responseTimeSeconds != null ? `${trial.responseTimeSeconds.toFixed(1)}s` : "\u2014";
  const misses = trial.totalErrors;
  const delay = trial.totalPenaltySeconds > 0 ? `${trial.totalPenaltySeconds.toFixed(0)}s` : null;
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }, children: [
    /* @__PURE__ */ jsx("span", { style: { width: "1.25rem", textAlign: "right", fontSize: "0.75rem", color: "#4b5563", fontFamily: "monospace", flexShrink: 0 }, children: rank }),
    /* @__PURE__ */ jsxs("span", { style: {
      flexShrink: 0,
      borderRadius: "0.375rem",
      border: "1px solid",
      padding: "0.125rem 0.5rem",
      fontSize: "0.75rem",
      fontWeight: "700",
      width: "7rem",
      textAlign: "center",
      ...found ? { background: "rgba(6,78,59,0.4)", color: "#34d399", borderColor: "rgba(6,78,59,0.6)" } : timeout ? { background: "rgba(30,58,138,0.2)", color: "#60a5fa", borderColor: "rgba(30,58,138,0.3)" } : { background: "rgba(120,53,15,0.2)", color: "#fbbf24", borderColor: "rgba(120,53,15,0.3)" }
    }, children: [
      statusIcon,
      " ",
      statusLabel
    ] }),
    /* @__PURE__ */ jsx("span", { style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "0.875rem",
      color: "#d1d5db"
    }, children: trial.trialLabel }),
    /* @__PURE__ */ jsx("span", { style: {
      flexShrink: 0,
      width: "3.5rem",
      textAlign: "right",
      fontFamily: "monospace",
      fontSize: "0.875rem",
      fontWeight: "600",
      color: found ? "#C9A84C" : "#4b5563"
    }, children: time }),
    /* @__PURE__ */ jsx("span", { style: {
      flexShrink: 0,
      width: "4.5rem",
      textAlign: "right",
      fontSize: "0.75rem",
      color: misses > 0 ? "#f59e0b" : "#374151"
    }, children: misses > 0 ? `${misses} miss${misses > 1 ? "es" : ""}` : "\u2014" }),
    /* @__PURE__ */ jsx("span", { style: {
      flexShrink: 0,
      width: "3rem",
      textAlign: "right",
      fontSize: "0.75rem",
      fontFamily: "monospace",
      color: delay ? "rgba(245,158,11,0.7)" : "#374151"
    }, children: delay ?? "0s" })
  ] });
}
function perfLabel(cat) {
  if (cat === "High performer") return "Strong Detector";
  if (cat === "Moderate performer") return "Developing Eye";
  return "Learning to Detect";
}
function riskLabel(cat) {
  if (cat === "Conservative / cautious") return "Precision-Focused";
  if (cat === "Balanced") return "Balanced Approach";
  return "High Initiative";
}
function penLabel(cat) {
  if (cat === "Penalty-sensitive") return "Highly Focused";
  if (cat === "Moderate penalty sensitivity") return "Steady Resilience";
  return "Unshakeable";
}
function calLabel(cat) {
  if (cat === "Well calibrated") return "Well Calibrated";
  if (cat === "Overconfident under uncertainty") return "Decisive Under Pressure";
  return "Growing in Confidence";
}
function ResultsScreen({ scores, metrics, profile, trialSummaries, candidateName, testName, onSubmit, onDownloadCsv }) {
  const formal = trialSummaries.filter((t) => t.phase === "formal");
  const perfectCount = formal.filter((t) => t.correct && t.totalErrors === 0).length;
  const accuracyPct = formal.length ? Math.round(metrics.correctTrials / formal.length * 100) : 0;
  const totalMissed = formal.reduce((s, t) => s + t.totalErrors, 0);
  const {
    detectionPerformanceScore: det,
    riskGuessingTendencyScore: risk,
    penaltySensitivityScore: pen,
    confidenceCalibrationScore: cal
  } = scores;
  const r = 38, circ = 2 * Math.PI * r, pctDet = Math.round(det);
  const dash = pctDet / 100 * circ;
  return /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-[#0D0D0D] p-4", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-lg space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-gray-500 mb-0.5", children: "Assessment Complete" }),
      /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-white", children: testName }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400 mt-0.5", children: [
        "Visual Change Detection \xB7 ",
        candidateName
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[#C9A84C]/20 bg-[#111111] p-4 flex items-center gap-5", children: [
      /* @__PURE__ */ jsxs("svg", { width: "96", height: "96", viewBox: "0 0 96 96", style: { flexShrink: 0 }, children: [
        /* @__PURE__ */ jsx("circle", { cx: "48", cy: "48", r, fill: "none", stroke: "#1f2937", strokeWidth: "8" }),
        /* @__PURE__ */ jsx(
          "circle",
          {
            cx: "48",
            cy: "48",
            r,
            fill: "none",
            stroke: "#C9A84C",
            strokeWidth: "8",
            strokeDasharray: `${dash} ${circ}`,
            strokeLinecap: "round",
            transform: "rotate(-90 48 48)"
          }
        ),
        /* @__PURE__ */ jsx(
          "text",
          {
            x: "48",
            y: "44",
            textAnchor: "middle",
            dominantBaseline: "middle",
            fill: "white",
            fontSize: "20",
            fontWeight: "800",
            fontFamily: "monospace",
            children: pctDet
          }
        ),
        /* @__PURE__ */ jsx(
          "text",
          {
            x: "48",
            y: "62",
            textAnchor: "middle",
            dominantBaseline: "middle",
            fill: "#9ca3af",
            fontSize: "9",
            fontFamily: "sans-serif",
            letterSpacing: "1",
            children: "SCORE"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-gray-500 mb-1", children: "Detection Performance" }),
        /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-white leading-tight", children: perfLabel(profile.performanceCategory) }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-400 mt-1", children: [
          "Detected ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-[#C9A84C]", children: metrics.correctTrials }),
          " of",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: formal.length }),
          " changes",
          " ",
          /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
            "(",
            accuracyPct,
            "%)"
          ] })
        ] }),
        perfectCount > 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-emerald-400 mt-1", children: [
          "\u2726 ",
          perfectCount,
          " flawless detection",
          perfectCount > 1 ? "s" : "",
          " \u2014 first try, no guesses"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: [
      { label: "Avg Time", value: metrics.averageCorrectTimeSeconds != null ? `${metrics.averageCorrectTimeSeconds.toFixed(1)}s` : "\u2014", sub: "correct trials" },
      { label: "First Click", value: metrics.averageFirstClickTimeSeconds != null ? `${metrics.averageFirstClickTimeSeconds.toFixed(1)}s` : "\u2014", sub: "avg speed" },
      { label: "Missed Clicks", value: String(totalMissed), sub: `${metrics.incorrectAttempts} wrong` },
      { label: "Confidence", value: `${metrics.averageConfidencePercent.toFixed(0)}%`, sub: "avg rating" }
    ].map(({ label, value, sub }) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl p-2.5 text-center border border-gray-800 bg-[#111111]", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wide text-gray-500", children: label }),
      /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-lg font-bold text-white", children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-600", children: sub })
    ] }, label)) }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-gray-800 bg-[#111111] overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-2.5 border-b border-gray-800 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-white", children: "Trial Breakdown" }),
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-gray-600 uppercase tracking-widest", children: [
          "Formal \xB7 ",
          formal.length,
          " trials"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divide-y divide-gray-800/60", children: formal.map((t, i) => /* @__PURE__ */ jsx(TrialRow, { trial: t, rank: i + 1 }, t.trialId)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-[#C9A84C]/30 bg-[#111111] p-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-3", children: "Behavioral Profile" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2.5", children: [
        { label: "Detection Performance", score: det, desc: perfLabel(profile.performanceCategory) },
        { label: "Decision Style", score: 100 - risk, desc: riskLabel(profile.riskCategory) },
        { label: "Recovery Focus", score: pen, desc: penLabel(profile.penaltyResponseCategory) },
        { label: "Confidence Alignment", score: cal, desc: calLabel(profile.confidenceCategory) }
      ].map(({ label, score, desc }) => {
        const pct = Math.round(Math.max(0, Math.min(100, score)));
        const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-sky-500";
        return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-[#0D0D0D] border border-gray-800 p-2.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-400", children: label }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-white", children: pct })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-gray-700 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: `h-full rounded-full ${color}`, style: { width: `${pct}%` } }) }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-[10px] text-gray-500 leading-tight", children: desc })
        ] }, label);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: "0.75rem" }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onDownloadCsv,
          className: "flex-1 rounded-2xl py-4 text-base font-bold text-[#0D0D0D] shadow-xl transition-all active:scale-95",
          style: { background: "linear-gradient(135deg,#C9A84C,#E8C96E)" },
          children: "\u2193 Download CSV"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onSubmit,
          className: "flex-1 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-all active:scale-95",
          style: { background: "#1f2937", border: "1px solid #374151" },
          children: "Submit to NEXUS \u2192"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-gray-700 pb-4", children: "PerformOnomics \xB7 Precision Insights. Optimal Performance." })
  ] }) });
}
function PerceptaDet({ onComplete, onExit, candidate, session, testPackage }) {
  const pkg = testPackage;
  if (!pkg || !pkg.formalTrials || pkg.formalTrials.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex min-h-full flex-col items-center justify-center gap-4 bg-[#0D0D0D] p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-amber-500/30 bg-[#111] p-8 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-amber-400", children: "No Test Package Assigned" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: "A test package must be assigned to this module before it can be run. Contact your NEXUS administrator." }),
      onExit && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onExit,
          className: "mt-6 rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors",
          children: "Exit"
        }
      )
    ] }) });
  }
  const [state, dispatchRaw] = useReducer(reducer, pkg, makeInitialState);
  const trialStartTs = useRef(performance.now());
  const dispatch = useCallback((action) => {
    dispatchRaw({ ...action, pkg });
  }, [pkg]);
  const flickerActive = state.phase === "flickering";
  const timerActive = state.phase === "flickering" || state.phase === "penalty" || state.phase === "confidence_prompt";
  const frame = useFlicker(pkg.timingMode ?? "slow", flickerActive);
  const trialKey = `${state.currentPhase}_${state.currentTrialIndex}`;
  const handleTimeout = useCallback(() => dispatch({ type: "TIMEOUT" }), []);
  const timeRemaining = useTrialTimer(timerActive, handleTimeout, trialKey);
  const handlePenaltyDone = useCallback(() => dispatch({ type: "PENALTY_COMPLETE" }), []);
  const penaltyRemaining = usePenaltyTimer(state.phase === "penalty", WRONG_CLICK_PENALTY_MS, handlePenaltyDone);
  const trials = state.currentPhase === "practice" ? pkg.practiceTrials : pkg.formalTrials;
  const trial = trials[state.currentTrialIndex] ?? null;
  const candidateName = candidate ? `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim() || candidate.candidate_code : "Candidate";
  const handleSubmit = useCallback(() => {
    const { metrics, scores, profile } = calculateDerivedData(
      state.attempts,
      state.trialSummaries,
      pkg.formalTrials.length
    );
    const candidateId = (candidate?.candidate_code ?? `${candidate?.first_name ?? ""}${candidate?.last_name ?? ""}`.trim()) || "unknown";
    const row = buildCandidateRow(pkg, candidateId, metrics, scores, profile);
    try {
      appendAndDownloadCsv(pkg.testId, row);
    } catch (e) {
      console.warn("[PERCEPTA_DET] CSV export error:", e);
    }
    const result = buildBprResult({
      module_code: MODULE_CODE,
      module_version: MODULE_VERSION,
      bpr_domain: BPR_DOMAIN,
      summary_metrics: {
        score: Math.round(scores.detectionPerformanceScore),
        accuracy_pct: pkg.formalTrials.length > 0 ? metrics.correctTrials / pkg.formalTrials.length * 100 : 0,
        mean_reaction_ms: metrics.averageCorrectTimeSeconds != null ? Math.round(metrics.averageCorrectTimeSeconds * 1e3) : void 0,
        trials_total: metrics.formalTrialCount,
        trials_passed: metrics.correctTrials,
        trials_failed: metrics.missedTrials,
        outcome: "complete"
      },
      raw_output: {
        derivedScores: scores,
        derivedMetrics: metrics,
        profile,
        trialSummaries: state.trialSummaries,
        attempts: state.attempts,
        testId: pkg.testId,
        timingMode: pkg.timingMode,
        sessionId: candidate?.candidate_code ?? generateSessionId()
      }
    });
    try {
      validateBprResult(result);
    } catch (e) {
      console.warn("[PERCEPTA_DET] BprResult validation warning:", e);
    }
    onComplete(result);
  }, [state, onComplete, candidate, pkg]);
  const ExitBtn = onExit ? /* @__PURE__ */ jsx(
    "button",
    {
      onClick: onExit,
      className: "absolute top-4 right-4 z-50 rounded-lg border border-gray-700 bg-[#111] px-3 py-1.5\n                 text-xs font-semibold text-gray-400 hover:border-gray-500 hover:text-white transition-colors",
      children: "Exit"
    }
  ) : null;
  if (state.phase === "confirm") {
    return /* @__PURE__ */ jsxs("div", { className: "relative min-h-full bg-[#0D0D0D]", children: [
      ExitBtn,
      /* @__PURE__ */ jsx(
        CandidateConfirm,
        {
          candidateName,
          candidateCode: candidate?.candidate_code ?? null,
          testName: pkg.testName,
          onConfirm: () => dispatch({ type: "CONFIRM_CANDIDATE" })
        }
      )
    ] });
  }
  if (state.phase === "instructions") {
    return /* @__PURE__ */ jsxs("div", { className: "relative min-h-full bg-[#0D0D0D]", children: [
      ExitBtn,
      /* @__PURE__ */ jsx(Instructions, { phase: state.currentPhase, onReady: () => dispatch({ type: "INSTRUCTIONS_DONE" }) })
    ] });
  }
  if (state.phase === "trial_prep") {
    return /* @__PURE__ */ jsx("div", { className: "relative min-h-full bg-[#0D0D0D]", children: /* @__PURE__ */ jsx(
      TrialPrep,
      {
        trialLabel: trial?.label ?? "",
        displayNumber: state.currentTrialIndex + 1,
        totalTrials: trials.length,
        phase: state.currentPhase,
        onStart: () => {
          trialStartTs.current = performance.now();
          dispatch({ type: "START_TRIAL" });
        }
      }
    ) });
  }
  if (state.phase === "results") {
    const { metrics, scores, profile } = calculateDerivedData(
      state.attempts,
      state.trialSummaries,
      pkg.formalTrials.length
    );
    const candidateId = (candidate?.candidate_code ?? `${candidate?.first_name ?? ""}${candidate?.last_name ?? ""}`.trim()) || "unknown";
    const handleDownloadCsv = () => {
      const row = buildCandidateRow(pkg, candidateId, metrics, scores, profile);
      try {
        appendAndDownloadCsv(pkg.testId, row);
      } catch (e) {
        console.warn("[PERCEPTA_DET] CSV download error:", e);
      }
    };
    return /* @__PURE__ */ jsx("div", { className: "relative h-full bg-[#0D0D0D]", children: /* @__PURE__ */ jsx(
      ResultsScreen,
      {
        scores,
        metrics,
        profile,
        trialSummaries: state.trialSummaries,
        candidateName,
        testName: pkg.testName,
        onDownloadCsv: handleDownloadCsv,
        onSubmit: handleSubmit
      }
    ) });
  }
  if (!trial) return null;
  const isTimeoutReveal = state.phase === "timeout_reveal";
  const showHotspot = state.phase === "correct_feedback" || state.phase === "failed_feedback" || isTimeoutReveal;
  const clickable = state.phase === "flickering" || isTimeoutReveal;
  const showTimer = !isTimeoutReveal;
  const displayFrame = isTimeoutReveal ? "altered" : state.phase === "correct_feedback" || state.phase === "failed_feedback" ? "base" : frame;
  const handleCanvasClick = (x, y, reactionTimeSec) => {
    if (isTimeoutReveal) {
      if (!trial.hotspot || !isInsideHotspot(x, y, trial.hotspot)) return;
      dispatch({ type: "GUIDED_CLICK", payload: { x, y, reactionTimeSec } });
    } else {
      dispatch({ type: "CLICK_IMAGE", payload: { x, y, reactionTimeSec } });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-full w-full bg-[#0D0D0D]", children: [
    /* @__PURE__ */ jsx(
      FlickerCanvas,
      {
        trial,
        frame: displayFrame,
        timeRemaining,
        guessCount: state.guessCount,
        showHotspot,
        clickable,
        isPractice: state.currentPhase === "practice",
        showTimer,
        onClickPercent: handleCanvasClick,
        trialStartTs
      }
    ),
    state.phase === "confidence_prompt" && /* @__PURE__ */ jsx(ConfidenceModal, { onSelect: (label) => dispatch({ type: "SUBMIT_CONFIDENCE", payload: label }) }),
    state.phase === "penalty" && /* @__PURE__ */ jsx(PenaltyOverlay, { penaltyRemaining, guessCount: state.guessCount }),
    state.phase === "correct_feedback" && /* @__PURE__ */ jsx(CorrectOverlay, { onNext: () => dispatch({ type: "NEXT_TRIAL" }) }),
    state.phase === "failed_feedback" && /* @__PURE__ */ jsx(FailedOverlay, { reason: state.failedReason ?? "max_guesses", onNext: () => dispatch({ type: "NEXT_TRIAL" }) }),
    isTimeoutReveal && /* @__PURE__ */ jsx(TimeoutRevealBanner, {})
  ] });
}
export {
  PerceptaDet as default
};
