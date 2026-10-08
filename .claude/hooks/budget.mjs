#!/usr/bin/env node
// Budget hook for the game experiment. See CLAUDE.md for how the orchestrator uses it.
//
//   (no option)  Claude Code Stop hook: estimates the spend, saves checkpoints, and keeps the
//                round loop going by blocking the stop with a status message for the orchestrator.
//   --start      arms the loop and prints the status for the next round
//   --status     prints the status without changing anything
//   --pause      disarms the loop
//
// Files under harness/:
//   budget.json          settings you may edit: limit_usd, checkpoints_usd, correction, stall_limit, ...
//   spend.json           the latest estimate, broken down by agent and model
//   spend-log.csv        one row per finished turn: the data for the money-vs-quality curve
//   .budget-state.json   the hook's memory. Commit it; don't edit it.
//   budget-hook.log      decisions and errors, for debugging
//
// Requires Node 18+. No dependencies.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PROJECT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const harness = (...p) => path.join(PROJECT, 'harness', ...p);

const DEFAULTS = {
  limit_usd: 100,                    // the experiment ends once the estimate reaches this
  checkpoints_usd: [10, 20, 50, 100], // a copy of the game is saved when the estimate crosses each value
  correction: 1,                     // multiply the estimate, if it drifts from the credit balance on claude.ai
  stall_limit: 3,                    // pause after this many turns in a row without a newly evaluated round
  plateau_rounds: 2,                 // the planner is due after this many rounds without a new best Total...
  replan_cooldown: 2,                // ...but no sooner than this many rounds after its previous run
};

// USD per million tokens (Claude API pricing, October 2026). The Opus 5.5 and Haiku 5.5 rates
// reproduce Claude Code's own cost records to the cent. w5/w1 are 5-minute and 1-hour cache writes.
const PRICES = [
  ['claude-opus-5-5', { in: 4, out: 20, w5: 5, w1: 8, r: 0.2 }],
  ['claude-sonnet-5-5', { in: 2, out: 10, w5: 2.5, w1: 4, r: 0.1 }],
  ['claude-haiku-5-5', { in: 0.1, out: 0.5, w5: 0.125, w1: 0.2, r: 0.01 },
    { in: 0.5, out: 2.5, w5: 0.625, w1: 1, r: 0.05 }], // second row: prompts over 100K tokens
  ['claude-haiku-4-5', { in: 1, out: 5, w5: 1.25, w1: 2, r: 0.1 }],
];
const HAIKU_TIER_TOKENS = 100_000;
const WEB_SEARCH_USD = 0.01;

const MODE = process.argv[2] || 'stop';

main().catch((err) => {
  log(`ERROR ${err && err.stack ? err.stack : err}`);
  if (MODE === 'stop') {
    // Fail safe: without a working budget check, let the session stop instead of looping on.
    out({ systemMessage: `Budget hook failed, so the loop stopped: ${String(err && err.message || err).slice(0, 300)}. Details: harness/budget-hook.log` });
  } else {
    console.error(`Budget hook failed: ${err && err.message || err}`);
    process.exitCode = 1;
  }
});

async function main() {
  const cfg = { ...DEFAULTS, ...readJson(harness('budget.json'), {}) };
  const state = loadState();
  if (MODE === '--status') return print(statusText('status', cfg, state, gather(cfg, state)));
  if (MODE === '--start') return start(cfg, state);
  if (MODE === '--pause') {
    state.phase = 'idle';
    saveState(state);
    return print('Budget hook: the loop is paused. Run `node .claude/hooks/budget.mjs --start` to continue.');
  }
  if (MODE !== 'stop') throw new Error(`unknown option ${MODE}`);
  const raw = await readStdin();
  return onStop(cfg, state, raw ? JSON.parse(raw) : {});
}

// ---------- modes ----------

function start(cfg, state) {
  const spend = totalSpend(state, cfg);
  if (spend >= cfg.limit_usd) {
    state.phase = 'done';
    saveState(state);
    return print(`Budget hook: the experiment is over: ${usd(spend)} of ${usd(cfg.limit_usd)} is spent. To go on, raise limit_usd in harness/budget.json.`);
  }
  if (exists(harness('STOP'))) {
    return print(`Budget hook: the loop can't start while harness/STOP exists. It says: ${firstLine(harness('STOP'))}\nThe person needs to remove harness/STOP first.`);
  }
  if (!exists(harness('budget.json'))) writeJson(harness('budget.json'), DEFAULTS);
  if (!state.started_at) state.started_at = Date.now();
  if (state.spec_versions == null) state.spec_versions = countSpecVersions();
  state.phase = 'running';
  state.stalls = 0;
  const g = gather(cfg, state);
  state.current_round = g.nextRound;
  state.last_scored_round = g.lastRound;
  saveState(state);
  log(`start: next round ${g.nextRound}, spend ${usd(spend)}`);
  return print(statusText('start', cfg, state, g));
}

async function onStop(cfg, state, input) {
  if (state.phase !== 'running' && state.phase !== 'finishing') return; // the loop isn't armed
  if (!input.transcript_path || !input.session_id) throw new Error('the Stop hook input has no transcript_path or session_id');

  await sleep(1500); // the transcript is written asynchronously; give the last lines a moment

  // 1. Spend.
  const sess = sessionSpend(input.transcript_path, input.session_id, state.started_at || 0);
  const prev = state.sessions[input.session_id];
  if (!prev || sess.usd >= prev.usd) state.sessions[input.session_id] = { ...sess, updated: new Date().toISOString() };
  const spend = totalSpend(state, cfg);

  if (exists(harness('STOP'))) {
    state.phase = 'idle';
    saveState(state);
    writeJson(harness('spend.json'), spendReport(state, cfg, spend, gather(cfg, state)));
    log(`stop: harness/STOP exists, loop stopped at ${usd(spend)}`);
    return out({ systemMessage: `Experiment loop stopped at ${usd(spend)}: harness/STOP exists. It says: ${firstLine(harness('STOP'))}` });
  }

  // 2. Did the planner run during the round that just ended?
  const specVersions = countSpecVersions();
  if (specVersions > (state.spec_versions || 0)) {
    state.last_replan_round = state.current_round || 1;
    state.spec_versions = specVersions;
  }

  // 3. Round bookkeeping.
  const g = gather(cfg, state);
  const progress = g.lastRound > (state.last_scored_round || 0);
  state.stalls = progress ? 0 : (state.stalls || 0) + 1;
  state.last_scored_round = Math.max(state.last_scored_round || 0, g.lastRound);

  // 4. Checkpoints.
  const due = cfg.checkpoints_usd.filter((t) => spend >= t && !state.checkpoints_done.includes(t));
  if (spend >= cfg.limit_usd && !state.checkpoints_done.some((t) => t >= cfg.limit_usd) && !due.some((t) => t >= cfg.limit_usd)) {
    due.push(cfg.limit_usd); // always keep a copy of the final game
  }
  due.sort((a, b) => a - b);
  const saved = due.length ? saveCheckpoints(due, spend, g, state) : [];
  for (const c of saved) state.checkpoints_done.push(c.threshold);

  const warnings = sessionWarnings(sess, input);
  writeJson(harness('spend.json'), spendReport(state, cfg, spend, g));
  appendCsv(g, spend, state.phase);

  // 5. Decide.
  if (state.phase === 'finishing') {
    state.phase = 'done';
    saveState(state);
    log(`stop: finished at ${usd(spend)}`);
    return out({ systemMessage: `Experiment finished: ${usd(spend)} spent, ${g.lastRound} rounds evaluated. Checkpoints are in checkpoints/.` });
  }
  if (spend >= cfg.limit_usd) {
    state.phase = 'finishing';
    saveState(state);
    log(`stop: budget reached at ${usd(spend)}`);
    return out({
      decision: 'block',
      reason: finalText(cfg, spend, g, saved),
      systemMessage: `Budget reached: ${usd(spend)} of ${usd(cfg.limit_usd)}. The orchestrator is wrapping up.${warnings}`,
    });
  }
  if (state.stalls >= cfg.stall_limit) {
    state.phase = 'idle';
    saveState(state);
    log(`stop: paused after ${state.stalls} turns without a new evaluated round`);
    return out({ systemMessage: `Experiment loop paused: ${state.stalls} turns in a row ended without a newly evaluated round. Check harness/rounds.md, then ask Claude to continue the experiment.${warnings}` });
  }
  state.current_round = g.nextRound;
  saveState(state);
  const ctx = progress ? 'round-done' : 'unfinished';
  log(`stop: ${ctx}, next round ${g.nextRound}, spend ${usd(spend)}, planner ${g.planner.due ? g.planner.mode : 'no'}`);
  const checkpointNote = saved.length ? ` · saved ${saved.map((c) => c.dir).join(', ')}` : '';
  return out({
    decision: 'block',
    reason: statusText(ctx, cfg, state, g, spend, saved),
    systemMessage: `${progress ? `Round ${pad(g.lastRound)} done` : `Round ${pad(g.nextRound)} unfinished`} · ${usd(spend)} of ${usd(cfg.limit_usd)} · next: round ${pad(g.nextRound)}${g.planner.due && !g.generatorDone ? ` with the planner (${g.planner.mode})` : ''}${checkpointNote}${warnings}`,
  });
}

// ---------- what the orchestrator reads ----------

function statusText(ctx, cfg, state, g, spend = totalSpend(state, cfg), saved = []) {
  const lines = [];
  if (ctx === 'round-done') lines.push(`Budget hook: round ${pad(g.lastRound)} is complete (${g.lastRow.verdict || 'no verdict'} · Total ${g.lastRow.total}).`);
  else if (ctx === 'unfinished') lines.push(`Budget hook: round ${pad(g.nextRound)} has no evaluation in harness/scores.md yet, so it is unfinished.`);
  else if (ctx === 'start') lines.push(`Budget hook: the loop is running.${g.lastRound ? ` The last evaluated round is ${pad(g.lastRound)}.` : ''}`);
  else lines.push(`Budget hook: status (the loop is ${state.phase || 'idle'}).`);
  lines.push(`Spend so far: ${usd(spend)} of ${usd(cfg.limit_usd)} (estimate).`);
  if (ctx === 'status' && spend >= cfg.limit_usd) {
    lines.push(`The experiment is over: the budget is spent after ${g.lastRound} evaluated rounds. To go on, raise limit_usd in harness/budget.json.`);
    return lines.join('\n');
  }
  for (const c of saved) lines.push(`Checkpoint saved: ${c.dir} at ${usd(spend)}${c.build === 'ok' ? '' : ` (no game build: ${c.build})`}.`);
  if (exists(harness('STOP'))) lines.push(`harness/STOP exists, so the loop won't run. It says: ${firstLine(harness('STOP'))}`);
  lines.push(`Next round: ${pad(g.nextRound)}.`);
  if (g.generatorDone) lines.push(`The generator has already done round ${pad(g.nextRound)} (harness/progress.md has its entry): only the evaluator is left.`);
  else lines.push(g.planner.due ? `Planner: due before the generator. Mode: ${g.planner.mode}. Reason: ${g.planner.reason}.` : 'Planner: not due this round.');
  if (g.backlogExists) lines.push(`Backlog: ${g.backlog.todo} todo · ${g.backlog.blocked} blocked · ${g.backlog.review} in review.`);
  lines.push(`Message for the agents: "Round ${pad(g.nextRound)}. Spend so far: ${usd(spend)}."`);
  return lines.join('\n');
}

function finalText(cfg, spend, g, saved) {
  const lines = [`Budget hook: the budget is spent: ${usd(spend)} of ${usd(cfg.limit_usd)} (estimate).`];
  for (const c of saved) lines.push(`Checkpoint saved: ${c.dir}${c.build === 'ok' ? '' : ` (no game build: ${c.build})`}.`);
  lines.push(`Rounds evaluated: ${g.lastRound}. The experiment is over: there are no further rounds.`);
  return lines.join('\n');
}

// ---------- repository state ----------

function gather(cfg, state) {
  const scores = readScores();
  const lastRow = scores.length ? scores[scores.length - 1] : null;
  const lastRound = scores.reduce((m, r) => Math.max(m, r.round), 0);
  let best = -Infinity;
  let sinceBest = 0;
  for (const r of scores) {
    if (r.total > best) { best = r.total; sinceBest = 0; } else sinceBest += 1;
  }
  const nextRound = lastRound + 1;
  const backlogExists = exists(harness('backlog.md'));
  const backlog = readBacklog();
  const specExists = exists(harness('spec.md'));
  const progressText = readText(harness('progress.md'));
  const generatorDone = new RegExp(`^##\\s*Round\\s+0*${nextRound}\\b`, 'mi').test(progressText);

  let planner = { due: false };
  if (!specExists) {
    planner = { due: true, mode: 'START', reason: "harness/spec.md doesn't exist yet" };
  } else if (!backlogExists || backlog.todo === 0) {
    planner = { due: true, mode: 'EXPAND', reason: `empty queue (0 todo items, ${backlog.blocked} blocked)` };
  } else if (sinceBest >= cfg.plateau_rounds && nextRound - (state.last_replan_round || 0) >= cfg.replan_cooldown) {
    planner = { due: true, mode: 'EXPAND', reason: `plateau (no new best Total for ${sinceBest} rounds)` };
  }
  return { scores, lastRow, lastRound, nextRound, sinceBest, best: Number.isFinite(best) ? best : null, backlog, backlogExists, specExists, generatorDone, planner };
}

function readScores() {
  const text = readText(harness('scores.md'));
  let header = null;
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (!header) {
      if (cells.some((c) => /^round$/i.test(c))) header = cells.map((c) => c.toLowerCase());
      continue;
    }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const get = (name) => cells[header.indexOf(name)];
    const round = parseInt(get('round'), 10);
    if (!Number.isFinite(round)) continue;
    let total = parseFloat(get('total'));
    if (!Number.isFinite(total)) {
      total = ['playability', 'depth', 'style', 'feel'].map((k) => parseFloat(get(k))).filter(Number.isFinite).reduce((a, b) => a + b, 0);
    }
    rows.push({ round, total, verdict: get('verdict') || '', line: line.trim() });
  }
  return rows;
}

function readBacklog() {
  const counts = { todo: 0, doing: 0, review: 0, blocked: 0, done: 0, dropped: 0 };
  for (const line of readText(harness('backlog.md')).split('\n')) {
    if (!/^###\s+B-\d+/.test(line)) continue;
    const head = line.split(/\s+[—–]\s+/)[0]; // the part before the title
    const m = head.match(/\b(todo|doing|review|blocked|done|dropped)\b/i);
    if (m) counts[m[1].toLowerCase()] += 1;
  }
  return counts;
}

function countSpecVersions() {
  try {
    return fs.readdirSync(harness('spec-history')).filter((f) => /^spec-v\d+\.md$/.test(f)).length;
  } catch { return 0; }
}

// ---------- spend ----------

function messageCost(model, u) {
  const entry = PRICES.find(([prefix]) => model.startsWith(prefix));
  const [, base, over] = entry || PRICES[0]; // unknown models are priced like Opus 5.5, and flagged
  const created = u.cache_creation_input_tokens || 0;
  const cc = u.cache_creation || {};
  let w5 = cc.ephemeral_5m_input_tokens || 0;
  let w1 = cc.ephemeral_1h_input_tokens || 0;
  if (w5 + w1 < created) w1 += created - w5 - w1; // no split recorded: assume the pricier 1-hour writes
  const input = u.input_tokens || 0;
  const read = u.cache_read_input_tokens || 0;
  const output = u.output_tokens || 0;
  const p = over && input + read + w5 + w1 > HAIKU_TIER_TOKENS ? over : base;
  const searches = (u.server_tool_use && u.server_tool_use.web_search_requests) || 0;
  return {
    usd: (input * p.in + output * p.out + w5 * p.w5 + w1 * p.w1 + read * p.r) / 1e6 + searches * WEB_SEARCH_USD,
    known: Boolean(entry),
  };
}

// One pass over a transcript: priced API responses (one per message id; Claude Code writes a line
// per content block, all carrying the same usage) and Claude Code's own cost records.
function parseTranscript(file) {
  const text = readText(file);
  const byId = new Map();
  const costStates = [];
  let lastTs = NaN;
  for (const line of text.split('\n')) {
    if (!line) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const ts = e.timestamp ? Date.parse(e.timestamp) : NaN;
    if (Number.isFinite(ts)) lastTs = ts;
    if (e.type === 'cost-state' && typeof e.totalCostUSD === 'number') {
      costStates.push({ total: e.totalCostUSD, start: e.startTime, end: lastTs });
      continue;
    }
    if (e.type !== 'assistant') continue;
    const m = e.message;
    if (!m || !m.usage || !m.id || !m.model || m.model === '<synthetic>') continue;
    const prev = byId.get(m.id);
    if (!prev || (m.usage.output_tokens || 0) > (prev.usage.output_tokens || 0)) {
      byId.set(m.id, { model: m.model, usage: m.usage, ts: prev ? prev.ts : (Number.isFinite(ts) ? ts : lastTs) });
    }
  }
  const messages = [];
  const unknown = new Set();
  for (const { model, usage, ts } of byId.values()) {
    const c = messageCost(model, usage);
    if (!c.known) unknown.add(model);
    messages.push([Number.isFinite(ts) ? ts : null, c.usd, model]);
  }
  return { messages, costStates, unknown: [...unknown] };
}

// Spend of one session since the experiment started: the main conversation, every subagent,
// and the background calls (summaries, classifiers, compaction) that only Claude Code's cost
// record knows about.
function sessionSpend(transcriptPath, sessionId, startedAt) {
  const cacheFile = path.join(os.tmpdir(), `budget-hook-cache-${sessionId}.json`);
  const cache = readJson(cacheFile, {});
  const files = [{ file: transcriptPath, agent: 'orchestrator', main: true }];
  const subDir = path.join(transcriptPath.replace(/\.jsonl$/, ''), 'subagents');
  for (const f of safeReaddir(subDir)) {
    if (!f.endsWith('.jsonl')) continue;
    const meta = readJson(path.join(subDir, f.replace(/\.jsonl$/, '.meta.json')), {});
    files.push({ file: path.join(subDir, f), agent: meta.agentType || 'subagent' });
  }

  const all = [];
  const unknown = new Set();
  let costStates = [];
  let mainModel = null;
  for (const { file, agent, main } of files) {
    let parsed;
    const st = statOf(file);
    const hit = cache[file];
    if (!main && st && hit && hit.size === st.size && hit.mtimeMs === st.mtimeMs) parsed = hit.parsed;
    else {
      parsed = parseTranscript(file);
      if (!main && st) cache[file] = { size: st.size, mtimeMs: st.mtimeMs, parsed };
    }
    if (main) {
      costStates = parsed.costStates;
      const last = parsed.messages[parsed.messages.length - 1];
      mainModel = last ? last[2] : null;
    }
    parsed.unknown.forEach((m) => unknown.add(m));
    for (const [ts, cost, model] of parsed.messages) all.push({ ts, cost, model, agent });
  }
  writeJson(cacheFile, cache);

  const counted = all.filter((m) => m.ts === null || m.ts >= startedAt);
  const byAgent = {};
  const byModel = {};
  for (const m of counted) {
    byAgent[m.agent] = (byAgent[m.agent] || 0) + m.cost;
    byModel[m.model] = (byModel[m.model] || 0) + m.cost;
  }
  let parsedUsd = counted.reduce((s, m) => s + m.cost, 0);

  // Background calls: the gap between Claude Code's last cost record and what the transcripts
  // show for the same period, counted for the part of that period after the experiment started.
  let background = 0;
  let capped = false;
  const cs = costStates[costStates.length - 1];
  if (cs && Number.isFinite(cs.end)) {
    const lo = Number.isFinite(cs.start) ? cs.start : 0;
    const inWindow = (from) => all.filter((m) => m.ts !== null && m.ts >= from && m.ts <= cs.end).reduce((s, m) => s + m.cost, 0);
    const whole = inWindow(lo);
    const gap = cs.total - whole;
    if (gap > 0 && whole > 0) {
      const share = inWindow(Math.max(lo, startedAt)) / whole;
      const limited = Math.min(gap, 0.5 * whole);
      capped = limited < gap;
      background = limited * share;
    }
  }
  if (background > 0) {
    byAgent.background = background;
    byModel.background = background;
  }
  return {
    usd: parsedUsd + background,
    by_agent: roundAll(byAgent),
    by_model: roundAll(byModel),
    main_model: mainModel,
    unknown_models: [...unknown],
    background_capped: capped,
  };
}

function totalSpend(state, cfg) {
  const raw = Object.values(state.sessions || {}).reduce((s, x) => s + (x.usd || 0), 0);
  return raw * (cfg.correction || 1);
}

function sessionWarnings(sess, input) {
  const w = [];
  if (sess.main_model && /^claude-(opus|fable|mythos)/.test(sess.main_model)) {
    w.push(`the main session runs on ${sess.main_model}; the orchestrator only routes work, so /model claude-sonnet-5-5 is cheaper`);
  }
  if (input.permission_mode === 'default' || input.permission_mode === 'plan') {
    w.push(`the permission mode is "${input.permission_mode}", so unattended rounds will stop at permission prompts; use auto mode`);
  }
  if (sess.unknown_models.length) w.push(`no price for ${sess.unknown_models.join(', ')}; priced like Opus 5.5`);
  if (sess.background_capped) w.push('the background-cost estimate hit its cap; compare the spend with the credit balance on claude.ai');
  return w.length ? ` · Warning: ${w.join('; ')}.` : '';
}

function spendReport(state, cfg, spend, g) {
  const byAgent = {};
  const byModel = {};
  for (const s of Object.values(state.sessions)) {
    for (const [k, v] of Object.entries(s.by_agent || {})) byAgent[k] = (byAgent[k] || 0) + v;
    for (const [k, v] of Object.entries(s.by_model || {})) byModel[k] = (byModel[k] || 0) + v;
  }
  return {
    spend_usd: round2(spend),
    limit_usd: cfg.limit_usd,
    correction: cfg.correction,
    rounds_evaluated: g.lastRound,
    best_total: g.best,
    checkpoints_saved: state.checkpoints_done,
    by_agent_usd: roundAll(byAgent),
    by_model_usd: roundAll(byModel),
    note: 'Estimate at API list prices from the session transcripts plus Claude Code\'s own cost records; by_agent and by_model are before the correction factor.',
    updated: new Date().toISOString(),
  };
}

// ---------- checkpoints ----------

function saveCheckpoints(thresholds, spend, g, state) {
  const build = buildGame();
  const commit = git(['rev-parse', '--short', 'HEAD']) || 'unknown';
  const saved = [];
  for (const t of thresholds) {
    const name = String(t).padStart(3, '0');
    const dir = path.join(PROJECT, 'checkpoints', name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    if (build.ok) fs.cpSync(path.join(PROJECT, 'game', 'dist'), path.join(dir, 'game'), { recursive: true });
    if (g.lastRound) {
      const report = harness('evals', `round-${pad(g.lastRound)}.md`);
      const shots = harness('evals', `round-${pad(g.lastRound)}`);
      if (exists(report)) copyInto(report, path.join(dir, 'eval'));
      if (exists(shots)) fs.cpSync(shots, path.join(dir, 'eval', path.basename(shots)), { recursive: true });
    }
    for (const f of ['scores.md', 'spec.md', 'rounds.md']) {
      if (exists(harness(f))) copyInto(harness(f), dir);
    }
    const agents = Object.entries(spendReport(state, { correction: 1 }, spend, g).by_agent_usd)
      .map(([k, v]) => `${k} ${usd(v)}`).join(' · ');
    fs.writeFileSync(path.join(dir, 'CHECKPOINT.md'), [
      `# Checkpoint ${usd(t, 0)}`,
      '',
      `- Spend: ${usd(spend)} (estimate)`,
      `- Last evaluated round: ${g.lastRound ? pad(g.lastRound) : 'none'}`,
      `- Commit: ${commit}`,
      `- Saved: ${new Date().toISOString()}`,
      `- Game build: ${build.ok ? 'ok — `game/` is a playable copy; serve it with any static server' : build.note}`,
      `- Spend by agent: ${agents || 'n/a'}`,
      '',
      '## Scores at this point',
      '',
      g.lastRow ? g.lastRow.line : 'No round has been evaluated yet.',
      '',
    ].join('\n'));
    saved.push({ threshold: t, dir: `checkpoints/${name}`, build: build.ok ? 'ok' : build.note });
    log(`checkpoint ${name}: spend ${usd(spend)}, round ${g.lastRound}, build ${build.ok ? 'ok' : build.note}`);
  }
  return saved;
}

function buildGame() {
  const game = path.join(PROJECT, 'game');
  if (!exists(path.join(game, 'package.json'))) return { ok: false, note: 'there is no game/package.json yet' };
  const npm = (args) => spawnSync('npm', args, { cwd: game, encoding: 'utf8', timeout: 300_000, shell: process.platform === 'win32' });
  if (!exists(path.join(game, 'node_modules'))) {
    const r = npm([exists(path.join(game, 'package-lock.json')) ? 'ci' : 'install']);
    if (r.status !== 0) return { ok: false, note: `npm install failed: ${tail(r.stderr || r.stdout)}` };
  }
  const r = npm(['run', 'build']);
  if (r.status !== 0) return { ok: false, note: `npm run build failed: ${tail(r.stderr || r.stdout)}` };
  if (!exists(path.join(game, 'dist', 'index.html'))) return { ok: false, note: 'the build produced no game/dist/index.html' };
  return { ok: true, note: 'ok' };
}

// ---------- state and files ----------

function loadState() {
  const s = readJson(harness('.budget-state.json'), {});
  return {
    version: 1,
    phase: 'idle',
    started_at: null,
    sessions: {},
    checkpoints_done: [],
    current_round: 1,
    last_scored_round: 0,
    last_replan_round: 0,
    spec_versions: null,
    stalls: 0,
    ...s,
  };
}

function saveState(state) {
  state.updated = new Date().toISOString();
  writeJson(harness('.budget-state.json'), state);
}

function appendCsv(g, spend, phase) {
  const file = harness('spend-log.csv');
  if (!exists(file)) fs.writeFileSync(file, 'time_utc,last_round,total,verdict,spend_usd,phase\n');
  const r = g.lastRow;
  fs.appendFileSync(file, [new Date().toISOString(), g.lastRound, r ? r.total : '', r ? `"${r.verdict.replace(/"/g, '')}"` : '', round2(spend), phase].join(',') + '\n');
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}
function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}
function exists(p) { return fs.existsSync(p); }
function statOf(p) { try { return fs.statSync(p); } catch { return null; } }
function safeReaddir(dir) { try { return fs.readdirSync(dir); } catch { return []; } }
function copyInto(file, dir) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(file, path.join(dir, path.basename(file)));
}
function firstLine(file) { return (readText(file).split('\n').find((l) => l.trim()) || '(empty)').trim().slice(0, 200); }
function git(args) {
  const r = spawnSync('git', args, { cwd: PROJECT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}
function log(msg) {
  try {
    fs.mkdirSync(harness(), { recursive: true });
    fs.appendFileSync(harness('budget-hook.log'), `${new Date().toISOString()} ${msg}\n`);
  } catch { /* logging must never break the hook */ }
}

// ---------- small helpers ----------

function pad(n) { return String(n).padStart(2, '0'); }
function round2(x) { return Math.round(x * 100) / 100; }
function roundAll(o) { return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10000) / 10000])); }
function usd(x, digits = 2) { return `$${Number(x).toFixed(digits)}`; }
function tail(s) { return String(s || '').trim().split('\n').slice(-3).join(' | ').slice(0, 300); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function print(text) { process.stdout.write(text + '\n'); }
function out(obj) { process.stdout.write(JSON.stringify(obj)); }
function readStdin() {
  if (process.stdin.isTTY) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data.trim()));
    process.stdin.on('error', reject);
  });
}
