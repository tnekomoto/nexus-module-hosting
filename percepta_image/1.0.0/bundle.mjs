// percepta-image/src/PerceptaImage.jsx
import { useEffect, useMemo, useRef, useState } from "react";

// percepta-image/BprSessionContract.js
function buildBprResult({ module_code, module_version, bpr_domain, summary_metrics, raw_output }) {
  if (!module_code) throw new Error("[BPR] module_code is required");
  if (!module_version) throw new Error("[BPR] module_version is required");
  if (!bpr_domain) throw new Error("[BPR] bpr_domain is required");
  if (!summary_metrics) throw new Error("[BPR] summary_metrics is required");
  return {
    module_code,
    module_version,
    bpr_domain,
    summary_metrics,
    raw_output: raw_output ?? {},
    completed_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function validateBprResult(result) {
  const required = ["module_code", "module_version", "bpr_domain", "summary_metrics", "completed_at"];
  for (const key of required) {
    if (result[key] === void 0 || result[key] === null) {
      throw new Error(`[BPR] Missing required field: ${key}`);
    }
  }
  if (typeof result.summary_metrics !== "object") {
    throw new Error("[BPR] summary_metrics must be an object");
  }
  return true;
}

// percepta-image/src/PerceptaImage.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var BATTERY = typeof window !== "undefined" && window.__SAMPLE_BATTERY || null;
var MODULE_CODE = "PERCEPTA_IMAGE";
var MODULE_VERSION = "1.0.0";
var BPR_DOMAIN = "PerceptaImage";
var DEFAULT_SCORING = {
  caseInsensitive: true,
  trimWhitespace: true,
  stripNonAlpha: true,
  fuzzy: {
    method: "damerau-levenshtein",
    maxEditDistance: 2,
    maxNormalizedDistance: 0.2,
    phonetic: "metaphone",
    phoneticAcceptsIfDistance: 1
  }
};
function normalize(s, spec) {
  let out = s ?? "";
  if (spec.trimWhitespace ?? true) out = out.trim();
  if (spec.caseInsensitive ?? true) out = out.toLowerCase();
  if (spec.stripNonAlpha ?? true) out = out.replace(/[^a-z]/g, "");
  return out;
}
function damerauLevenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}
function metaphone(input) {
  if (!input) return "";
  let s = input.toUpperCase().replace(/[^A-Z]/g, "");
  if (!s) return "";
  if (/^(AE|GN|KN|PN|WR)/.test(s)) s = s.slice(1);
  if (s[0] === "X") s = "S" + s.slice(1);
  if (/^WH/.test(s)) s = "W" + s.slice(2);
  const isVowel = (ch) => "AEIOU".includes(ch);
  let r = "";
  for (let i = 0; i < s.length && r.length < 6; i++) {
    const c = s[i], next = s[i + 1] || "", next2 = s[i + 2] || "", prev = s[i - 1] || "";
    if (c === prev && c !== "C") continue;
    if (isVowel(c)) {
      if (i === 0) r += c;
      continue;
    }
    switch (c) {
      case "B":
        if (!(i === s.length - 1 && prev === "M")) r += "B";
        break;
      case "C":
        if (next === "H") {
          r += "X";
          i++;
        } else if (next === "I" && next2 === "A") r += "X";
        else if ("IEY".includes(next)) r += "S";
        else r += "K";
        break;
      case "D":
        if (next === "G" && "IEY".includes(next2)) {
          r += "J";
          i++;
        } else r += "T";
        break;
      case "F":
        r += "F";
        break;
      case "G":
        if (next === "H") {
          if (i + 2 >= s.length || !isVowel(next2)) {
          } else r += "K";
          i++;
        } else if (next === "N") {
        } else if ("IEY".includes(next)) r += "J";
        else r += "K";
        break;
      case "H":
        if (i === 0 || isVowel(prev)) {
          if (isVowel(next)) r += "H";
        }
        break;
      case "J":
        r += "J";
        break;
      case "K":
        if (prev !== "C") r += "K";
        break;
      case "L":
        r += "L";
        break;
      case "M":
        r += "M";
        break;
      case "N":
        r += "N";
        break;
      case "P":
        if (next === "H") {
          r += "F";
          i++;
        } else r += "P";
        break;
      case "Q":
        r += "K";
        break;
      case "R":
        r += "R";
        break;
      case "S":
        if (next === "H") {
          r += "X";
          i++;
        } else if (next === "I" && "OA".includes(next2)) r += "X";
        else r += "S";
        break;
      case "T":
        if (next === "H") {
          r += "0";
          i++;
        } else if (next === "I" && "OA".includes(next2)) r += "X";
        else r += "T";
        break;
      case "V":
        r += "F";
        break;
      case "W":
      case "Y":
        if (isVowel(next)) r += c;
        break;
      case "X":
        r += "KS";
        break;
      case "Z":
        r += "S";
        break;
      default:
        break;
    }
  }
  return r.slice(0, 6);
}
function scoreAnswer(given, canonical, alternates = [], spec = DEFAULT_SCORING) {
  const fuzzySpec = { ...DEFAULT_SCORING.fuzzy, ...spec.fuzzy ?? {} };
  const merged = { ...DEFAULT_SCORING, ...spec, fuzzy: fuzzySpec };
  const g = normalize(given, merged);
  const c = normalize(canonical, merged);
  if (!g) return { state: "incorrect", reason: null, editDistance: c.length, matched: canonical };
  if (g === c) return { state: "correct", reason: "exact", editDistance: 0, matched: canonical };
  for (const alt of alternates) {
    const a = normalize(alt, merged);
    if (a && g === a) return { state: "correct", reason: "alternate", editDistance: 0, matched: alt };
  }
  const dist = damerauLevenshtein(g, c);
  const norm = dist / Math.max(c.length, g.length, 1);
  if (dist <= (fuzzySpec.maxEditDistance ?? 2) && norm <= (fuzzySpec.maxNormalizedDistance ?? 0.2)) {
    return { state: "needs_review", reason: "fuzzy", editDistance: dist, matched: canonical };
  }
  if (fuzzySpec.phonetic === "metaphone" && c.length >= 5) {
    const mg = metaphone(g), mc = metaphone(c);
    if (mg && mc) {
      const md = damerauLevenshtein(mg, mc);
      if (md <= (fuzzySpec.phoneticAcceptsIfDistance ?? 1)) {
        return { state: "needs_review", reason: "phonetic", editDistance: dist, matched: canonical };
      }
    }
  }
  return { state: "incorrect", reason: null, editDistance: dist, matched: canonical };
}
function fmtClock(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.max(0, secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function answerKeyEntryFor(battery, order) {
  const ak = battery.answerKey?.find((e) => e.order === order);
  if (ak) return ak;
  const item = battery.items.find((i) => i.order === order);
  const canonical = (item?.originalName || "").replace(/^\d+[_-]+/, "").replace(/\.[^.]+$/, "").trim().toLowerCase();
  return { order, canonical, alternates: [] };
}
function PerceptaImage({ onComplete, onExit, candidate, session }) {
  const battery = BATTERY || (typeof window !== "undefined" ? window.__SAMPLE_BATTERY : null);
  const [phase, setPhase] = useState("confirm");
  const initialCandId = candidate?.candidate_code || candidate?.id || "";
  const initialCandName = [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ");
  const [confirmedId, setConfirmedId] = useState(initialCandId);
  const [confirmedName, setConfirmedName] = useState(initialCandName);
  const [answers, setAnswers] = useState({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(battery?.timing?.totalSeconds ?? 180);
  const startedAtRef = useRef(null);
  const itemEntryAtRef = useRef(null);
  const inputRef = useRef(null);
  const [verdicts, setVerdicts] = useState({});
  const [reviewIdx, setReviewIdx] = useState(0);
  if (!battery) return /* @__PURE__ */ jsx(NoBatteryScreen, { onExit });
  const items = useMemo(() => [...battery.items].sort((a, b) => a.order - b.order), [battery]);
  const total = items.length;
  const totalSeconds = battery.timing?.totalSeconds ?? 180;
  const warnAt = battery.timing?.warnAtSeconds ?? 20;
  const scoringSpec = battery.scoring ?? DEFAULT_SCORING;
  const activeItem = items[activeIdx];
  const activeAnswer = answers[activeItem?.order] ?? { text: "", viewed: false, viewCount: 0 };
  const reviewItems = useMemo(
    () => items.filter((it) => verdicts[it.order]?.finalState === "needs_review"),
    [items, verdicts]
  );
  const currentReviewItem = reviewItems[reviewIdx];
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setPhase("time-up");
          return 0;
        }
        return t - 1;
      });
    }, 1e3);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => {
    if (phase === "running" && startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
  }, [phase]);
  useEffect(() => {
    if (phase !== "running" || !activeItem) return;
    itemEntryAtRef.current = Date.now();
    setAnswers((prev) => {
      const cur = prev[activeItem.order] ?? { text: "", viewed: false, viewCount: 0 };
      return {
        ...prev,
        [activeItem.order]: { ...cur, viewed: true, viewCount: (cur.viewCount ?? 0) + 1 }
      };
    });
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [activeIdx, phase]);
  useEffect(() => {
    if (phase !== "running") return;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      let next = null;
      if (e.key === "ArrowLeft") next = activeIdx - 1;
      else if (e.key === "ArrowRight") next = activeIdx + 1;
      else if (e.key === "ArrowUp") next = activeIdx - 10;
      else if (e.key === "ArrowDown") next = activeIdx + 10;
      if (next == null) return;
      e.preventDefault();
      const clamped = Math.max(0, Math.min(total - 1, next));
      if (clamped !== activeIdx) setActiveIdx(clamped);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, activeIdx, total]);
  function cellStateRunning(order) {
    const a = answers[order];
    if (!a) return "unseen";
    if (!a.text) return "looked";
    return "answered";
  }
  function cellStateGraded(order) {
    const v = verdicts[order];
    if (!v) return "unseen";
    return v.finalState;
  }
  function onAnswerChange(text) {
    if (phase !== "running") return;
    const order = activeItem.order;
    setAnswers((prev) => {
      const cur = prev[order] ?? { text: "", viewed: true, viewCount: 1 };
      const rt_ms = cur.rt_ms != null ? cur.rt_ms : itemEntryAtRef.current ? Date.now() - itemEntryAtRef.current : null;
      return { ...prev, [order]: { ...cur, text, rt_ms: text ? rt_ms : cur.rt_ms } };
    });
  }
  function gotoIdx(i) {
    if (phase !== "running") return;
    if (i < 0 || i >= total) return;
    setActiveIdx(i);
  }
  function startTest() {
    setPhase("countdown");
    setActiveIdx(0);
  }
  function onCountdownDone() {
    startedAtRef.current = Date.now();
    setPhase("running");
  }
  function gradeNow() {
    const v = {};
    for (const it of items) {
      const a = answers[it.order];
      const text = (a?.text ?? "").trim();
      if (!text) {
        v[it.order] = { state: "skipped", reason: null, editDistance: null, matched: null, finalState: "skipped" };
        continue;
      }
      const key = answerKeyEntryFor(battery, it.order);
      const verdict = scoreAnswer(text, key.canonical, key.alternates, scoringSpec);
      v[it.order] = { ...verdict, finalState: verdict.state };
    }
    setVerdicts(v);
    setReviewIdx(0);
    setPhase("graded");
  }
  const adminPassword = battery.adminReviewPassword || "";
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState("");
  function startReview() {
    if (adminPassword && !adminAuthed) {
      setPhase("admin-gate");
      return;
    }
    setPhase("admin-review");
    setReviewIdx(0);
  }
  function tryAdminAuth() {
    if (adminPwInput === adminPassword) {
      setAdminAuthed(true);
      setAdminPwError("");
      setPhase("admin-review");
      setReviewIdx(0);
    } else {
      setAdminPwError("Incorrect password.");
    }
  }
  function adminMark(orderForItem, mark) {
    setVerdicts((prev) => {
      const next = {
        ...prev,
        [orderForItem]: { ...prev[orderForItem], finalState: mark, adminAdjudicated: true, adminMark: mark }
      };
      const stillPending = items.filter((it) => next[it.order]?.finalState === "needs_review");
      if (stillPending.length === 0) {
        setReviewIdx(0);
      } else {
        const after = stillPending.find((it) => it.order > orderForItem) ?? stillPending[0];
        const newIdx = stillPending.findIndex((it) => it.order === after.order);
        setReviewIdx(newIdx >= 0 ? newIdx : 0);
      }
      return next;
    });
  }
  function finalizeWithoutReview() {
    setPhase("final");
  }
  function submitToNexus() {
    const completedAt = Date.now();
    const startedAt = startedAtRef.current ?? completedAt;
    const responses = items.map((it) => {
      const a = answers[it.order] ?? {};
      const v = verdicts[it.order] ?? {};
      const text = (a.text ?? "").trim();
      return {
        order: it.order,
        originalName: it.originalName,
        difficulty: it.difficulty,
        answer: text,
        verdictState: v.finalState ?? "skipped",
        verdictReason: v.reason ?? null,
        editDistance: v.editDistance ?? null,
        adminAdjudicated: v.adminAdjudicated ?? false,
        adminMark: v.adminMark ?? null,
        rt_ms: a.rt_ms ?? null,
        viewCount: a.viewCount ?? 0
      };
    });
    const trials_total = responses.length;
    const trials_passed = responses.filter((r) => r.verdictState === "correct").length;
    const trials_failed = responses.filter((r) => r.verdictState === "incorrect").length;
    const trials_skipped = responses.filter((r) => r.verdictState === "skipped").length;
    const trials_review_pending = responses.filter((r) => r.verdictState === "needs_review").length;
    const accuracy_pct = Math.round(trials_passed / trials_total * 100);
    const rts = responses.map((r) => r.rt_ms).filter((x) => typeof x === "number");
    const mean_reaction_ms = rts.length ? Math.round(rts.reduce((s, x) => s + x, 0) / rts.length) : 0;
    const median_reaction_ms = rts.length ? [...rts].sort((a, b) => a - b)[Math.floor(rts.length / 2)] : 0;
    const result = buildBprResult({
      module_code: MODULE_CODE,
      module_version: MODULE_VERSION,
      bpr_domain: BPR_DOMAIN,
      summary_metrics: {
        score: accuracy_pct,
        accuracy_pct,
        trials_total,
        trials_passed,
        trials_failed,
        mean_reaction_ms,
        median_reaction_ms,
        outcome: trials_passed >= Math.ceil(trials_total / 2) ? "pass" : "fail"
      },
      raw_output: {
        bundle_id: battery.bundleId,
        test_number: battery.testNumber,
        test_label: battery.testLabel,
        confirmed_candidate_id: confirmedId,
        confirmed_candidate_name: confirmedName || null,
        nexus_candidate_id: candidate?.id ?? null,
        nexus_candidate_code: candidate?.candidate_code ?? null,
        session_id: session?.id ?? null,
        started_at: new Date(startedAt).toISOString(),
        completed_at: new Date(completedAt).toISOString(),
        timing_total_seconds: totalSeconds,
        time_used_seconds: Math.min(totalSeconds, Math.round((completedAt - startedAt) / 1e3)),
        trials_skipped,
        trials_review_pending,
        responses,
        scoring_spec: scoringSpec
      }
    });
    try {
      validateBprResult(result);
    } catch (e) {
      console.error("[PerceptaImage] validation failed", e);
    }
    onComplete(result);
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-brand-black text-brand-cream flex flex-col", children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        battery,
        confirmedId,
        confirmedName,
        phase,
        timeLeft,
        warnAt
      }
    ),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 px-6 py-5 max-w-[1200px] w-full mx-auto", children: [
      phase === "confirm" && /* @__PURE__ */ jsx(
        ConfirmCandidate,
        {
          id: confirmedId,
          setId: setConfirmedId,
          name: confirmedName,
          setName: setConfirmedName,
          candidate,
          session,
          onContinue: () => setPhase("instructions"),
          onExit
        }
      ),
      phase === "instructions" && /* @__PURE__ */ jsx(
        Instructions,
        {
          battery,
          confirmedId,
          confirmedName,
          totalSeconds,
          onBegin: startTest,
          onBack: () => setPhase("confirm"),
          onExit
        }
      ),
      phase === "countdown" && /* @__PURE__ */ jsx(Countdown, { onDone: onCountdownDone }),
      (phase === "running" || phase === "time-up" || phase === "graded") && /* @__PURE__ */ jsx(
        TestArea,
        {
          phase,
          items,
          total,
          activeIdx,
          setActiveIdx: gotoIdx,
          activeItem,
          activeAnswer,
          inputRef,
          onAnswerChange,
          cellState: phase === "running" ? cellStateRunning : cellStateGraded,
          answers,
          verdicts,
          onSubmitEarly: () => setPhase("time-up"),
          onGrade: gradeNow,
          onStartReview: startReview,
          onFinalize: finalizeWithoutReview,
          onExit,
          reviewItemsCount: reviewItems.length
        }
      ),
      phase === "admin-gate" && /* @__PURE__ */ jsx(
        AdminGate,
        {
          value: adminPwInput,
          setValue: setAdminPwInput,
          error: adminPwError,
          onSubmit: tryAdminAuth,
          onCancel: () => {
            setAdminPwError("");
            setPhase("graded");
          }
        }
      ),
      phase === "admin-review" && /* @__PURE__ */ jsx(
        AdminReview,
        {
          items,
          reviewItems,
          reviewIdx,
          current: currentReviewItem,
          answers,
          verdicts,
          onMark: adminMark,
          onSkip: () => setReviewIdx((i) => Math.min(i + 1, reviewItems.length - 1)),
          onPrev: () => setReviewIdx((i) => Math.max(i - 1, 0)),
          onFinish: () => setPhase("final"),
          answerKeyFor: (o) => answerKeyEntryFor(battery, o)
        }
      ),
      phase === "final" && /* @__PURE__ */ jsx(
        FinalTally,
        {
          items,
          verdicts,
          answers,
          confirmedId,
          confirmedName,
          battery,
          onSubmit: submitToNexus,
          onExit,
          answerKeyFor: (o) => answerKeyEntryFor(battery, o)
        }
      )
    ] })
  ] });
}
function Header({ battery, confirmedId, confirmedName, phase, timeLeft, warnAt }) {
  return /* @__PURE__ */ jsxs("header", { className: "px-6 py-3 border-b border-brand-gold/30 bg-brand-black/95 backdrop-blur flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold tracking-[0.25em] uppercase text-brand-gold", children: "PerformOnomics LLC" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-base font-bold text-brand-cream tracking-wide", children: [
        "PerceptaImage\u2122 \u2014 Image Identification \xB7 Test #",
        battery.testNumber
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
      (confirmedId || confirmedName) && phase !== "confirm" && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-brand-muted", children: "Candidate" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-mono text-brand-cream", children: [
          confirmedId,
          confirmedName ? ` \xB7 ${confirmedName}` : ""
        ] })
      ] }),
      phase === "running" && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-brand-muted", children: "Time left" }),
        /* @__PURE__ */ jsx("div", { className: `text-2xl font-mono font-bold tabular-nums ${timeLeft <= warnAt ? "text-brand-hard animate-pulse" : "text-brand-gold"}`, children: fmtClock(timeLeft) })
      ] }),
      phase === "time-up" && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-brand-muted", children: "Time" }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-mono font-bold tabular-nums text-brand-hard", children: "0:00" })
      ] })
    ] })
  ] });
}
function ConfirmCandidate({ id, setId, name, setName, candidate, session, onContinue, onExit }) {
  const canContinue = id.trim().length > 0;
  return /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto py-10 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-brand-gold", children: "Confirm candidate" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-brand-muted mt-1", children: "The result of this test will be saved against the candidate ID below. Verify it matches the person about to take the test." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-brand-gold/30 bg-brand-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "block text-[11px] font-bold uppercase tracking-widest text-brand-gold", children: "Candidate ID (required)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: id,
            onChange: (e) => setId(e.target.value),
            placeholder: "e.g. PWI-LIC-001-C0042",
            autoFocus: true,
            className: "w-full mt-1 px-3 py-2 rounded bg-brand-surface border border-brand-gold/30 text-brand-cream font-mono focus:outline-none focus:border-brand-gold"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "block text-[11px] font-bold uppercase tracking-widest text-brand-muted", children: "Name (optional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: "Jane Doe",
            className: "w-full mt-1 px-3 py-2 rounded bg-brand-surface border border-brand-gold/20 text-brand-cream focus:outline-none focus:border-brand-gold"
          }
        )
      ] }),
      (candidate?.id || session?.id) && /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-brand-dim", children: [
        "NEXUS context \u2014 Candidate: ",
        /* @__PURE__ */ jsx("span", { className: "text-brand-cream", children: candidate?.candidate_code || candidate?.id || "\u2014" }),
        " \xB7 Session: ",
        /* @__PURE__ */ jsx("span", { className: "text-brand-cream", children: session?.session_code || session?.id || "\u2014" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onContinue,
          disabled: !canContinue,
          className: "px-6 py-3 rounded-md bg-brand-gold text-black text-base font-semibold hover:bg-brand-gold-light disabled:opacity-40 disabled:cursor-not-allowed",
          children: "Confirm and continue \u2192"
        }
      ),
      onExit && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onExit,
          className: "px-4 py-3 rounded-md bg-brand-raised text-brand-cream text-sm hover:bg-[#2e2e2e]",
          children: "Exit"
        }
      )
    ] })
  ] });
}
function Instructions({ battery, confirmedId, confirmedName, totalSeconds, onBegin, onBack, onExit }) {
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto py-8 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-brand-gold", children: "PerceptaImage\u2122 \u2014 Image Identification" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-brand-muted mt-1", children: [
        "Test #",
        battery.testNumber,
        " \u2014 ",
        battery.testLabel
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-brand-gold/30 bg-brand-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-widest text-brand-gold", children: "Instructions" }),
      /* @__PURE__ */ jsxs("ul", { className: "text-sm text-brand-cream list-disc pl-5 space-y-1.5", children: [
        /* @__PURE__ */ jsxs("li", { children: [
          "You have ",
          /* @__PURE__ */ jsxs("strong", { children: [
            Math.round(totalSeconds / 60),
            " minute",
            Math.round(totalSeconds / 60) === 1 ? "" : "s"
          ] }),
          " to complete this task."
        ] }),
        /* @__PURE__ */ jsx("li", { children: "Your goal is to identify and name as many objects as possible within the allotted time." }),
        /* @__PURE__ */ jsxs("li", { children: [
          "This task measures ",
          /* @__PURE__ */ jsx("strong", { children: "Perceptual Integration Capacity (PIC)" }),
          " \u2014 the ability to quickly and accurately recognize and organize visual information, even when images vary in form."
        ] }),
        /* @__PURE__ */ jsx("li", { children: "Some images may appear simplified or slightly altered, but all depicted objects are recognizable." }),
        /* @__PURE__ */ jsx("li", { children: "Some items are intentionally more challenging than others." }),
        /* @__PURE__ */ jsx("li", { children: "Approach this task like an Easter egg hunt: identify the easier items first, then return to the more difficult ones." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-brand-surface border border-brand-gold/15 p-3 text-xs text-brand-cream space-y-1", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsxs("strong", { children: [
            battery.items.length,
            " pictures total"
          ] }),
          " \u2014 write each object's name in the answer box, then press Enter (or click an image) to move on."
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-brand-dim", children: [
          "Keyboard: ",
          /* @__PURE__ */ jsx("strong", { children: "Enter" }),
          " = next \xB7 ",
          /* @__PURE__ */ jsx("strong", { children: "\u2190 / \u2192" }),
          " = previous / next \xB7 ",
          /* @__PURE__ */ jsx("strong", { children: "\u2191 / \u2193" }),
          " = jump one row \xB7 type your answer."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-brand-surface border border-brand-gold/15 p-3 text-xs", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { className: "text-brand-muted", children: "Test will be saved against: " }),
      /* @__PURE__ */ jsxs("span", { className: "text-brand-cream font-mono", children: [
        confirmedId,
        confirmedName ? ` \xB7 ${confirmedName}` : ""
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: onBegin, className: "px-6 py-3 rounded-md bg-brand-gold text-black text-base font-semibold hover:bg-brand-gold-light", children: "Begin test (timer starts)" }),
      /* @__PURE__ */ jsx("button", { onClick: onBack, className: "px-4 py-3 rounded-md bg-brand-raised text-brand-cream text-sm hover:bg-[#2e2e2e]", children: "\u2190 Back" }),
      onExit && /* @__PURE__ */ jsx("button", { onClick: onExit, className: "px-4 py-3 rounded-md bg-brand-raised text-brand-cream text-sm hover:bg-[#2e2e2e]", children: "Exit" })
    ] })
  ] });
}
function TestArea({
  phase,
  items,
  total,
  activeIdx,
  setActiveIdx,
  activeItem,
  activeAnswer,
  inputRef,
  onAnswerChange,
  cellState,
  answers,
  verdicts,
  onSubmitEarly,
  onGrade,
  onStartReview,
  onFinalize,
  onExit,
  reviewItemsCount
}) {
  const locked = phase !== "running";
  const answeredCount = Object.values(answers).filter((a) => a.text).length;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    phase === "time-up" && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border-2 border-brand-hard/60 bg-brand-hard/10 px-4 py-3 text-center space-y-2", children: [
      /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-brand-hard", children: "\u23F0 Time's up" }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-brand-cream", children: [
        "You answered ",
        /* @__PURE__ */ jsx("strong", { children: answeredCount }),
        " of ",
        /* @__PURE__ */ jsx("strong", { children: total }),
        " items. Click ",
        /* @__PURE__ */ jsx("strong", { children: "Grade" }),
        " to score the test."
      ] })
    ] }),
    phase === "graded" && /* @__PURE__ */ jsx(
      GradedBanner,
      {
        verdicts,
        total,
        reviewItemsCount,
        onStartReview,
        onFinalize
      }
    ),
    /* @__PURE__ */ jsx(
      Cell,
      {
        item: activeItem,
        answer: activeAnswer,
        verdict: verdicts[activeItem?.order],
        phase,
        onAnswerChange,
        inputRef,
        total,
        activeIdx,
        onPrev: () => setActiveIdx(activeIdx - 1),
        onNext: () => setActiveIdx(activeIdx + 1)
      }
    ),
    /* @__PURE__ */ jsx(JumpGrid, { items, activeIdx, setActiveIdx, cellState, locked, phase }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-brand-muted", children: [
        phase === "running" && /* @__PURE__ */ jsxs(Fragment, { children: [
          "Answered: ",
          /* @__PURE__ */ jsx("span", { className: "text-brand-cream", children: answeredCount }),
          " / ",
          total
        ] }),
        phase === "time-up" && /* @__PURE__ */ jsxs(Fragment, { children: [
          "Time expired \xB7 ",
          answeredCount,
          " answered, ",
          total - answeredCount,
          " blank"
        ] }),
        phase === "graded" && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("span", { className: "text-brand-easy", children: [
            Object.values(verdicts).filter((v) => v.finalState === "correct").length,
            " correct"
          ] }),
          " \xB7 ",
          /* @__PURE__ */ jsxs("span", { className: "text-brand-hard", children: [
            Object.values(verdicts).filter((v) => v.finalState === "incorrect").length,
            " wrong"
          ] }),
          " \xB7 ",
          /* @__PURE__ */ jsxs("span", { className: "text-brand-medium", children: [
            Object.values(verdicts).filter((v) => v.finalState === "needs_review").length,
            " need review"
          ] }),
          " \xB7 ",
          /* @__PURE__ */ jsxs("span", { className: "text-brand-dim", children: [
            Object.values(verdicts).filter((v) => v.finalState === "skipped").length,
            " blank"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        phase === "running" && /* @__PURE__ */ jsx("button", { onClick: onSubmitEarly, className: "px-3 py-2 rounded-md bg-brand-raised text-brand-cream text-xs hover:bg-[#2e2e2e]", title: "End the test early and grade now", children: "I'm done \u2014 stop timer" }),
        phase === "time-up" && /* @__PURE__ */ jsx("button", { onClick: onGrade, className: "px-5 py-2 rounded-md bg-brand-gold text-black text-sm font-semibold hover:bg-brand-gold-light", children: "Grade test \u2192" }),
        onExit && phase === "running" && /* @__PURE__ */ jsx("button", { onClick: onExit, className: "px-3 py-2 rounded-md bg-brand-raised text-brand-cream text-xs hover:bg-[#2e2e2e]", children: "Exit without submitting" })
      ] })
    ] })
  ] });
}
function GradedBanner({ verdicts, total, reviewItemsCount, onStartReview, onFinalize }) {
  const correct = Object.values(verdicts).filter((v) => v.finalState === "correct").length;
  const wrong = Object.values(verdicts).filter((v) => v.finalState === "incorrect").length;
  const blank = Object.values(verdicts).filter((v) => v.finalState === "skipped").length;
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-brand-gold/40 bg-brand-card p-4 space-y-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-sm font-bold uppercase tracking-widest text-brand-gold", children: "Test graded" }),
    /* @__PURE__ */ jsxs("div", { className: "text-sm text-brand-cream", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-brand-easy", children: [
        "\u2713 ",
        correct,
        " correct"
      ] }),
      " \xB7",
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-brand-hard", children: [
        "\u2717 ",
        wrong,
        " incorrect"
      ] }),
      " \xB7",
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-brand-medium", children: [
        "? ",
        reviewItemsCount,
        " need admin review"
      ] }),
      " \xB7",
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-brand-dim", children: [
        "\u2014 ",
        blank,
        " blank"
      ] })
    ] }),
    reviewItemsCount > 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-brand-medium/10 border border-brand-medium/40 p-3 text-xs text-brand-medium", children: [
      /* @__PURE__ */ jsx("strong", { children: reviewItemsCount }),
      " answer",
      reviewItemsCount === 1 ? "" : "s",
      " need a client admin's call. The candidate's response is close to the canonical answer (typo, alternate spelling). Pass the test to your admin to finalize."
    ] }) : /* @__PURE__ */ jsx("div", { className: "text-xs text-brand-dim", children: "No fuzzy matches \u2014 final tally is ready." }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: reviewItemsCount > 0 ? /* @__PURE__ */ jsx("button", { onClick: onStartReview, className: "px-4 py-2 rounded-md bg-brand-gold text-black text-sm font-semibold hover:bg-brand-gold-light", children: "Begin admin review \u2192" }) : /* @__PURE__ */ jsx("button", { onClick: onFinalize, className: "px-4 py-2 rounded-md bg-brand-gold text-black text-sm font-semibold hover:bg-brand-gold-light", children: "Finalize tally \u2192" }) })
  ] });
}
function Cell({ item, answer, verdict, phase, onAnswerChange, inputRef, total, activeIdx, onPrev, onNext }) {
  if (!item) return null;
  const showVerdict = phase !== "running" && verdict;
  const borderClass = !showVerdict ? (
    // While running: orange border once an answer is typed; yellow outline
    // while just being viewed (matches the cell color in the jump grid).
    answer.text ? "border-brand-orange" : answer.viewed ? "border-brand-medium" : "border-brand-medium/40"
  ) : verdict.finalState === "correct" ? "border-brand-easy" : verdict.finalState === "incorrect" ? "border-brand-hard" : verdict.finalState === "needs_review" ? "border-brand-medium" : "border-brand-medium";
  return /* @__PURE__ */ jsxs("div", { className: `rounded-2xl border-2 ${borderClass} bg-[#f4f1ec] p-6`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "text-[10pt] font-bold tracking-widest text-[#1a1a1a]", children: [
          "ITEM ",
          String(item.order).padStart(2, "0"),
          " \xB7 ",
          activeIdx + 1,
          " of ",
          total
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-[8pt] text-[#666]", children: [
          "Difficulty: ",
          item.difficulty.toUpperCase()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: onPrev, disabled: activeIdx === 0, className: "px-3 py-1.5 rounded bg-white border border-[#aaa] text-xs font-semibold disabled:opacity-30", children: "\u2190 Prev" }),
        /* @__PURE__ */ jsx("button", { onClick: onNext, disabled: activeIdx === total - 1, className: "px-3 py-1.5 rounded bg-white border border-[#aaa] text-xs font-semibold disabled:opacity-30", children: "Next \u2192" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center bg-white rounded p-4 min-h-[2in] mb-4 border border-[#ddd]", children: item.pngDataUrl ? /* @__PURE__ */ jsx("img", { src: item.pngDataUrl, alt: `Item ${item.order}`, style: { maxWidth: "100%", maxHeight: "1.6in", objectFit: "contain" } }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-[#999]", children: "No image" }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-[9pt] font-bold uppercase tracking-widest text-[#666]", children: "Your answer" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: inputRef,
          type: "text",
          value: answer.text ?? "",
          onChange: (e) => onAnswerChange(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onNext();
            } else if (e.key === "ArrowRight" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onNext();
            } else if (e.key === "ArrowLeft" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onPrev();
            }
          },
          disabled: phase !== "running",
          placeholder: "Type what you see\u2026",
          autoComplete: "off",
          autoCorrect: "off",
          spellCheck: false,
          className: "w-full text-2xl font-bold tracking-wider text-center bg-white border-b-2 border-[#1a1a1a] py-3 px-4 focus:outline-none focus:border-[#c8a84b] text-[#1a1a1a]"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-[10px] text-[#666] text-center", children: "Enter = next item \xB7 \u2190 / \u2192 = previous / next \xB7 \u2191 / \u2193 = jump one row" })
    ] })
  ] });
}
function JumpGrid({ items, activeIdx, setActiveIdx, cellState, locked, phase }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-brand-card border border-brand-gold/20 p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: "Test items" }),
      /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-brand-dim", children: [
        phase === "running" && "click to jump \xB7 \u2190 \u2192 \u2191 \u2193 navigate \xB7 type to answer \xB7 Enter = next",
        phase === "time-up" && "answers locked \u2014 time has expired",
        phase === "graded" && "graded \u2014 green = correct \xB7 red = wrong \xB7 yellow outline = blank \xB7 solid yellow = needs review"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-10 gap-2", children: items.map((q, i) => {
      const st = cellState(q.order);
      const isActive = i === activeIdx;
      let cls;
      if (phase === "running" || phase === "time-up") {
        cls = st === "answered" ? "bg-brand-orange text-black border-2 border-brand-orange" : st === "looked" ? "bg-brand-raised text-brand-cream border-2 border-brand-medium/50" : "bg-brand-raised text-brand-muted border-2 border-transparent";
      } else {
        cls = st === "correct" ? "bg-brand-easy text-black border-2 border-brand-easy" : st === "incorrect" ? "bg-brand-hard text-white border-2 border-brand-hard" : st === "needs_review" ? "bg-brand-medium text-black border-2 border-brand-medium" : st === "skipped" ? "bg-brand-raised text-brand-muted border-2 border-brand-medium/50" : "bg-brand-raised text-brand-muted border-2 border-transparent";
      }
      return /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveIdx(q.order - 1),
          disabled: locked,
          title: `${q.numberedName} \u2014 ${st}`,
          className: [
            "h-9 rounded text-xs font-mono tabular-nums flex items-center justify-center transition-colors",
            cls,
            // Bright YELLOW ring around the currently-selected cell, larger
            // offset so it pops even when the cell itself is orange/green/red.
            isActive ? "ring-4 ring-brand-medium ring-offset-2 ring-offset-brand-card" : "",
            locked ? "cursor-default" : "cursor-pointer hover:opacity-90"
          ].join(" "),
          children: String(q.order).padStart(2, "0")
        },
        q.order
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-3 text-[10px] text-brand-dim flex-wrap", children: [
      phase === "running" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-raised", border: "", label: "unseen" }),
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-raised", border: "border-2 border-brand-medium/50", label: "looked, no answer" }),
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-orange", border: "", label: "answered (graded later)" }),
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-raised", border: "ring-2 ring-brand-medium", label: "selected (active)" })
      ] }),
      (phase === "time-up" || phase === "graded") && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-easy", border: "", label: "correct" }),
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-hard", border: "", label: "incorrect" }),
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-medium", border: "", label: "needs admin review" }),
        /* @__PURE__ */ jsx(Legend, { swatch: "bg-brand-raised", border: "border-2 border-brand-medium/50", label: "skipped / blank" })
      ] })
    ] })
  ] });
}
function Legend({ swatch, border, label }) {
  return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: `inline-block w-3 h-3 rounded ${swatch} ${border}` }),
    /* @__PURE__ */ jsx("span", { children: label })
  ] });
}
function AdminReview({ items, reviewItems, reviewIdx, current, answers, verdicts, onMark, onSkip, onPrev, onFinish, answerKeyFor }) {
  const stillPending = items.filter((it) => verdicts[it.order]?.finalState === "needs_review").length;
  const adjudicated = reviewItems.length - stillPending;
  const allDone = stillPending === 0;
  if (reviewItems.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto py-8 text-center space-y-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-brand-muted", children: "No items pending review." }),
      /* @__PURE__ */ jsx("button", { onClick: onFinish, className: "px-4 py-2 rounded-md bg-brand-gold text-black text-sm font-semibold hover:bg-brand-gold-light", children: "Finalize tally \u2192" })
    ] });
  }
  if (!current || allDone) {
    return /* @__PURE__ */ jsxs("div", { className: "max-w-xl mx-auto py-8 text-center space-y-4", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-brand-easy font-semibold", children: [
        "\u2713 All ",
        reviewItems.length,
        " flagged answer",
        reviewItems.length === 1 ? " has" : "s have",
        " been ruled."
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onFinish, className: "px-5 py-3 rounded-md bg-brand-gold text-black text-sm font-semibold hover:bg-brand-gold-light", children: "Finalize tally \u2192" })
    ] });
  }
  const a = answers[current.order];
  const v = verdicts[current.order];
  const key = answerKeyFor(current.order);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 max-w-4xl mx-auto py-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-brand-gold/40 bg-brand-card p-4 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-bold uppercase tracking-widest text-brand-gold", children: "Admin review" }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-brand-muted", children: [
            "Adjudicated ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-cream", children: adjudicated }),
            " of ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-cream", children: reviewItems.length }),
            " \xB7 ",
            /* @__PURE__ */ jsxs("span", { className: "text-brand-medium", children: [
              stillPending,
              " remaining"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] text-brand-dim", children: "Finalize is locked until every flagged item is ruled." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-1 rounded bg-brand-surface overflow-hidden", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "h-full bg-brand-gold transition-all",
          style: { width: `${Math.round(adjudicated / reviewItems.length * 100)}%` }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-brand-card border border-brand-gold/20 p-4 space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: "Original image" }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded p-3 flex items-center justify-center min-h-[1.4in]", children: current.sourcePngDataUrl ? /* @__PURE__ */ jsx("img", { src: current.sourcePngDataUrl, alt: "Original", style: { maxWidth: "100%", maxHeight: "1.2in", objectFit: "contain" } }) : /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold tracking-wider text-[#1a1a1a]", children: key.canonical }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-brand-card border border-brand-gold/20 p-4 space-y-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: "As candidate saw it" }),
        /* @__PURE__ */ jsx("div", { className: "bg-white rounded p-3 flex items-center justify-center min-h-[1.4in]", children: current.pngDataUrl ? /* @__PURE__ */ jsx("img", { src: current.pngDataUrl, alt: "Concealed", style: { maxWidth: "100%", maxHeight: "1.2in", objectFit: "contain" } }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-[#999]", children: "No image" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-brand-card border border-brand-gold/30 p-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: "Candidate's answer" }),
          /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold tracking-wider text-brand-cream", children: a?.text || /* @__PURE__ */ jsx("span", { className: "text-brand-dim italic", children: "(blank)" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: "Canonical (correct)" }),
          /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold tracking-wider text-brand-easy", children: key.canonical })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: "Match type" }),
          /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-brand-medium uppercase", children: v?.reason ?? "\u2014" }),
          typeof v?.editDistance === "number" && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-brand-dim", children: [
            v.editDistance,
            " character edit",
            v.editDistance === 1 ? "" : "s"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => onMark(current.order, "correct"), className: "flex-1 px-5 py-3 rounded-md bg-brand-easy text-black font-bold hover:bg-brand-easy/90", children: "\u2713 Mark correct" }),
        /* @__PURE__ */ jsx("button", { onClick: () => onMark(current.order, "incorrect"), className: "flex-1 px-5 py-3 rounded-md bg-brand-hard text-white font-bold hover:bg-brand-hard/90", children: "\u2717 Mark incorrect" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("button", { onClick: onPrev, disabled: reviewIdx === 0, className: "px-3 py-1.5 rounded-md bg-brand-raised text-brand-cream text-xs disabled:opacity-30 hover:bg-[#2e2e2e]", children: "\u2190 Previous" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-brand-dim italic", children: "Each flagged item must be marked correct or incorrect." })
      ] })
    ] })
  ] });
}
function FinalTally({ items, verdicts, answers, confirmedId, confirmedName, battery, onSubmit, onExit, answerKeyFor }) {
  const correct = Object.values(verdicts).filter((v) => v.finalState === "correct").length;
  const wrong = Object.values(verdicts).filter((v) => v.finalState === "incorrect").length;
  const review = Object.values(verdicts).filter((v) => v.finalState === "needs_review").length;
  const blank = Object.values(verdicts).filter((v) => v.finalState === "skipped").length;
  const total = items.length;
  const pct = Math.round(correct / total * 100);
  const missedItems = items.filter((it) => {
    const fs = verdicts[it.order]?.finalState;
    return fs === "incorrect" || fs === "skipped";
  });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto py-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-brand-gold", children: "Final tally" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-brand-muted mt-1", children: [
        "Test #",
        battery.testNumber,
        " \u2014 saved against ",
        /* @__PURE__ */ jsx("span", { className: "font-mono text-brand-cream", children: confirmedId }),
        confirmedName ? /* @__PURE__ */ jsxs(Fragment, { children: [
          " \xB7 ",
          confirmedName
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border-2 border-brand-gold/40 bg-brand-card p-6 text-center space-y-2", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: "Score" }),
      /* @__PURE__ */ jsxs("div", { className: "text-6xl font-bold text-brand-gold tabular-nums", children: [
        correct,
        " / ",
        total
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-brand-cream", children: [
        pct,
        "% correct"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2 text-center", children: [
      /* @__PURE__ */ jsx(Stat, { label: "Correct", value: correct, color: "text-brand-easy" }),
      /* @__PURE__ */ jsx(Stat, { label: "Incorrect", value: wrong, color: "text-brand-hard" }),
      /* @__PURE__ */ jsx(Stat, { label: "Pending review", value: review, color: "text-brand-medium" }),
      /* @__PURE__ */ jsx(Stat, { label: "Blank", value: blank, color: "text-brand-dim" })
    ] }),
    review > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-brand-medium/10 border border-brand-medium/40 p-3 text-xs text-brand-medium", children: [
      "\u26A0 ",
      review,
      " item",
      review === 1 ? "" : "s",
      " still flagged for review. They will be saved as ",
      /* @__PURE__ */ jsx("code", { children: "needs_review" }),
      " in the candidate's record. Run admin review to finalize them."
    ] }),
    missedItems.length > 0 && /* @__PURE__ */ jsx(
      CandidateMissedReview,
      {
        missedItems,
        answers,
        verdicts,
        answerKeyFor
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: onSubmit, className: "px-5 py-3 rounded-md bg-brand-gold text-black text-base font-semibold hover:bg-brand-gold-light", children: "Save to candidate sheet (NEXUS) \u2192" }),
      onExit && /* @__PURE__ */ jsx("button", { onClick: onExit, className: "px-4 py-3 rounded-md bg-brand-raised text-brand-cream text-sm hover:bg-[#2e2e2e]", children: "Exit" })
    ] })
  ] });
}
function CandidateMissedReview({ missedItems, answers, verdicts, answerKeyFor }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-brand-gold/30 bg-brand-card p-4 space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-bold uppercase tracking-widest text-brand-gold", children: "Review your missed answers" }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-brand-muted mt-0.5", children: "Here's what each obscured word actually was, and what you guessed. This is for your reference only \u2014 answers are locked." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: missedItems.map((it) => {
      const a = answers[it.order];
      const v = verdicts[it.order];
      const key = answerKeyFor(it.order);
      const wasBlank = v?.finalState === "skipped";
      return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-brand-surface border border-brand-gold/15 p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-[11px] uppercase tracking-widest text-brand-muted", children: [
            "Item ",
            String(it.order).padStart(2, "0"),
            " \xB7 ",
            it.difficulty
          ] }),
          /* @__PURE__ */ jsx("div", { className: `text-[10px] font-bold uppercase tracking-widest ${wasBlank ? "text-brand-dim" : "text-brand-hard"}`, children: wasBlank ? "Blank" : "Incorrect" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-brand-muted", children: "Actual image" }),
            /* @__PURE__ */ jsx("div", { className: "bg-white rounded p-2 flex items-center justify-center min-h-[1.1in]", children: it.sourcePngDataUrl ? /* @__PURE__ */ jsx("img", { src: it.sourcePngDataUrl, alt: "Actual", style: { maxWidth: "100%", maxHeight: "1in", objectFit: "contain" } }) : /* @__PURE__ */ jsx("span", { className: "text-xl font-bold tracking-wider text-[#1a1a1a]", children: key.canonical }) }),
            /* @__PURE__ */ jsx("div", { className: "text-center text-xs text-brand-easy font-bold", children: key.canonical })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-brand-muted", children: "As you saw it" }),
            /* @__PURE__ */ jsx("div", { className: "bg-white rounded p-2 flex items-center justify-center min-h-[1.1in]", children: it.pngDataUrl ? /* @__PURE__ */ jsx("img", { src: it.pngDataUrl, alt: "Concealed", style: { maxWidth: "100%", maxHeight: "1in", objectFit: "contain" } }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-[#999]", children: "No image" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-brand-muted", children: "Your answer" }),
            /* @__PURE__ */ jsx("div", { className: "bg-brand-card border border-brand-hard/40 rounded p-2 flex items-center justify-center min-h-[1.1in]", children: a?.text ? /* @__PURE__ */ jsx("span", { className: "text-xl font-bold tracking-wider text-brand-cream", children: a.text }) : /* @__PURE__ */ jsx("span", { className: "text-sm text-brand-dim italic", children: "(left blank)" }) }),
            typeof v?.editDistance === "number" && a?.text && /* @__PURE__ */ jsxs("div", { className: "text-center text-[10px] text-brand-dim", children: [
              v.editDistance,
              " character edit",
              v.editDistance === 1 ? "" : "s",
              " from correct"
            ] })
          ] })
        ] })
      ] }, it.order);
    }) })
  ] });
}
function Stat({ label, value, color }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-brand-card border border-brand-gold/20 p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-brand-muted", children: label }),
    /* @__PURE__ */ jsx("div", { className: `text-2xl font-bold tabular-nums ${color}`, children: value })
  ] });
}
function AdminGate({ value, setValue, error, onSubmit, onCancel }) {
  return /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto py-10 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-brand-gold", children: "Client admin password" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-brand-muted mt-1", children: "Some answers need a client admin's call. Enter your admin password to open the review panel and rule on each flagged item." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-brand-gold/30 bg-brand-card p-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "block text-[11px] font-bold uppercase tracking-widest text-brand-gold", children: "Password" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            value,
            onChange: (e) => setValue(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") onSubmit();
            },
            autoFocus: true,
            className: "w-full mt-1 px-3 py-2 rounded bg-brand-surface border border-brand-gold/30 text-brand-cream font-mono focus:outline-none focus:border-brand-gold"
          }
        )
      ] }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-brand-hard/40 bg-brand-hard/10 px-3 py-2 text-xs text-brand-hard", children: error })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: onSubmit, className: "px-5 py-3 rounded-md bg-brand-gold text-black text-base font-semibold hover:bg-brand-gold-light", children: "Unlock review \u2192" }),
      /* @__PURE__ */ jsx("button", { onClick: onCancel, className: "px-4 py-3 rounded-md bg-brand-raised text-brand-cream text-sm hover:bg-[#2e2e2e]", children: "\u2190 Back" })
    ] })
  ] });
}
function Countdown({ onDone }) {
  const [n, setN] = useState(3);
  const [showBegin, setShowBegin] = useState(false);
  useEffect(() => {
    if (showBegin) {
      const t2 = setTimeout(onDone, 600);
      return () => clearTimeout(t2);
    }
    if (n === 0) {
      setShowBegin(true);
      return;
    }
    const t = setTimeout(() => setN((x) => x - 1), 800);
    return () => clearTimeout(t);
  }, [n, showBegin, onDone]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-[60vh] flex flex-col items-center justify-center text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-[0.3em] text-brand-muted mb-6", children: "Get ready" }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: [
          "tabular-nums font-bold transition-all duration-300",
          showBegin ? "text-[96px] text-brand-easy" : "text-[180px] text-brand-gold"
        ].join(" "),
        style: { animation: "perceptaPop 0.4s ease-out" },
        children: showBegin ? "Begin!" : n
      },
      showBegin ? "begin" : `n-${n}`
    ),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-brand-dim mt-8", children: showBegin ? "Timer starts now\u2026" : "Test starts in" }),
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes perceptaPop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      ` })
  ] });
}
function NoBatteryScreen({ onExit }) {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-brand-black text-brand-cream flex items-center justify-center p-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center space-y-3", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-brand-gold", children: "PerceptaImage\u2122" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-brand-muted", children: "No test battery is loaded." }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-brand-dim", children: [
      `In production, the battery is baked into this module by PerceptaImage Studio's "Export as NEXUS module" tool. In the dev harness, set`,
      /* @__PURE__ */ jsx("code", { className: "text-brand-gold mx-1", children: "window.__SAMPLE_BATTERY" }),
      "before mounting the component."
    ] }),
    onExit && /* @__PURE__ */ jsx("button", { onClick: onExit, className: "mt-4 px-3 py-2 rounded-md bg-brand-raised text-brand-cream text-xs hover:bg-[#2e2e2e]", children: "Exit" })
  ] }) });
}
export {
  PerceptaImage as default
};
