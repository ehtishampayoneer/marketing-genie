'use client';
import React, { useState, useRef, useEffect } from "react";

/* ============================================================
   MARKETING GENIE — Phase 1 interface
   Left: the genie you talk to (near-black, atmospheric)
   Right: your live business cockpit (paper-white, data)
   Monochrome: black / grey / white. One light source = the genie's glow.
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root{
  --ink:#0b0b0d; --ink-2:#141417; --ink-3:#1c1c21; --ink-4:#26262d;
  --line-d:rgba(255,255,255,.09); --line-d2:rgba(255,255,255,.16);
  --on-d:#f3f3f1; --on-d-2:#a9a9b0; --on-d-3:#6e6e76;
  --paper:#f6f6f4; --card:#ffffff; --paper-3:#edede9;
  --ink-on-p:#131316; --graphite:#5f5f66; --graphite-2:#94949b;
  --hair:#e4e4df; --hair-2:#d7d7d1;
  --display:'Fraunces',Georgia,serif; --ui:'Inter',system-ui,sans-serif; --mono:'JetBrains Mono',monospace;
}
*{box-sizing:border-box}
.mg-root{font-family:var(--ui);height:100vh;width:100%;display:flex;flex-direction:column;background:var(--ink);color:var(--on-d);overflow:hidden;-webkit-font-smoothing:antialiased}

/* ---- top brand bar ---- */
.mg-top{height:52px;flex:0 0 52px;display:flex;align-items:center;justify-content:space-between;
  padding:0 18px;background:var(--ink);border-bottom:1px solid var(--line-d);z-index:5}
.mg-brand{display:flex;align-items:center;gap:10px}
.mg-wordmark{font-family:var(--display);font-weight:600;font-size:16px;letter-spacing:.2px;color:var(--on-d)}
.mg-wordmark em{font-style:italic;color:var(--on-d-2);font-weight:400}
.mg-stamp{font-family:var(--mono);font-size:10.5px;color:var(--on-d-3);letter-spacing:.5px;text-transform:uppercase}
.mg-mobtabs{display:none;gap:4px}
.mg-mobtab{font-family:var(--mono);font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--on-d-3);
  background:none;border:1px solid var(--line-d);padding:6px 12px;border-radius:7px;cursor:pointer}
.mg-mobtab[data-on="1"]{color:var(--ink);background:var(--on-d);border-color:var(--on-d)}

/* ---- main split ---- */
.mg-main{flex:1;display:flex;min-height:0}
.mg-chat{flex:0 0 39%;max-width:560px;display:flex;flex-direction:column;background:var(--ink);
  border-right:1px solid var(--line-d);min-height:0;position:relative}
.mg-work{flex:1;display:flex;flex-direction:column;background:var(--paper);color:var(--ink-on-p);min-height:0}

/* ---- chat header (who you're talking to) ---- */
.mg-chead{flex:0 0 auto;padding:18px 20px 16px;border-bottom:1px solid var(--line-d);display:flex;gap:13px;align-items:center}
.mg-who{display:flex;flex-direction:column;gap:3px}
.mg-who-name{font-family:var(--display);font-size:18px;font-weight:600;line-height:1}
.mg-who-role{font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:var(--on-d-3)}
.mg-status{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--on-d-2);margin-top:2px}
.mg-dot{width:6px;height:6px;border-radius:50%;background:var(--on-d);box-shadow:0 0 8px rgba(255,255,255,.8)}
.mg-dot.think{animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ---- chat scroll ---- */
.mg-scroll{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px;min-height:0}
.mg-scroll::-webkit-scrollbar{width:7px}
.mg-scroll::-webkit-scrollbar-thumb{background:var(--ink-4);border-radius:4px}
.mg-msg{display:flex;gap:11px;max-width:100%;animation:rise .35s ease both}
@keyframes rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.mg-msg.user{flex-direction:row-reverse}
.mg-bub{padding:11px 14px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap}
.mg-msg.genie .mg-bub{background:var(--ink-3);border:1px solid var(--line-d);border-top-left-radius:4px;color:var(--on-d)}
.mg-msg.user .mg-bub{background:var(--on-d);color:var(--ink);border-top-right-radius:4px;font-weight:450}
.mg-av{flex:0 0 30px;height:30px;margin-top:1px}
.mg-uav{flex:0 0 30px;height:30px;border-radius:50%;background:var(--ink-3);border:1px solid var(--line-d2);
  display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;color:var(--on-d-2)}

/* ---- chat input ---- */
.mg-input{flex:0 0 auto;padding:14px 16px 16px;border-top:1px solid var(--line-d);background:var(--ink)}
.mg-ibox{display:flex;align-items:flex-end;gap:9px;background:var(--ink-2);border:1px solid var(--line-d2);
  border-radius:14px;padding:8px 8px 8px 14px;transition:border-color .2s}
.mg-ibox:focus-within{border-color:rgba(255,255,255,.4)}
.mg-ta{flex:1;background:none;border:none;outline:none;color:var(--on-d);font-family:var(--ui);font-size:14px;
  resize:none;max-height:120px;line-height:1.45;padding:5px 0}
.mg-ta::placeholder{color:var(--on-d-3)}
.mg-send{flex:0 0 34px;height:34px;border-radius:10px;border:none;background:var(--on-d);color:var(--ink);
  cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .12s,opacity .2s}
.mg-send:hover{transform:translateY(-1px)}
.mg-send:disabled{opacity:.35;cursor:not-allowed;transform:none}
.mg-hint{font-family:var(--mono);font-size:10px;color:var(--on-d-3);text-align:center;margin-top:9px;letter-spacing:.3px}

/* ---- workspace tabs ---- */
.mg-tabs{flex:0 0 auto;display:flex;align-items:center;gap:2px;padding:0 16px;height:50px;
  background:var(--card);border-bottom:1px solid var(--hair);overflow-x:auto}
.mg-tab{font-family:var(--mono);font-size:11.5px;letter-spacing:.5px;text-transform:uppercase;
  color:var(--graphite-2);background:none;border:none;padding:8px 13px;border-radius:8px;cursor:pointer;
  white-space:nowrap;position:relative;transition:color .15s,background .15s}
.mg-tab:hover:not(:disabled){color:var(--ink-on-p);background:var(--paper)}
.mg-tab[data-on="1"]{color:var(--ink-on-p);font-weight:600}
.mg-tab[data-on="1"]::after{content:"";position:absolute;left:13px;right:13px;bottom:-1px;height:2px;background:var(--ink-on-p)}
.mg-tab:disabled{color:var(--hair-2);cursor:not-allowed}
.mg-tab .tdot{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--ink-on-p);margin-left:7px;vertical-align:middle}

/* ---- workspace body ---- */
.mg-body{flex:1;overflow-y:auto;padding:24px;min-height:0}
.mg-body::-webkit-scrollbar{width:9px}
.mg-body::-webkit-scrollbar-thumb{background:var(--hair-2);border-radius:5px}

/* empty / waiting */
.mg-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px;color:var(--graphite)}
.mg-empty h2{font-family:var(--display);font-weight:500;font-size:23px;color:var(--ink-on-p);margin:0}
.mg-empty p{font-size:14px;max-width:340px;line-height:1.55;margin:0}
.mg-xray{font-family:var(--mono);font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--graphite-2);
  border:1px dashed var(--hair-2);padding:7px 13px;border-radius:20px}

/* section heading */
.mg-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--graphite-2);margin:0 0 14px}
.mg-h{font-family:var(--display);font-size:20px;font-weight:500;color:var(--ink-on-p);margin:0 0 3px}

/* metric cards */
.mg-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.mg-card{background:var(--card);border:1px solid var(--hair);border-radius:14px;padding:15px 16px}
.mg-card .lbl{font-family:var(--mono);font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--graphite-2);margin-bottom:8px}
.mg-card .val{font-family:var(--mono);font-size:25px;font-weight:600;color:var(--ink-on-p);line-height:1;letter-spacing:-.5px}
.mg-card .sub{font-size:11px;color:var(--graphite);margin-top:6px}

/* diagnosis banner */
.mg-diag{background:var(--ink);color:var(--on-d);border-radius:16px;padding:20px 22px;margin-bottom:22px;position:relative;overflow:hidden}
.mg-diag .tag{font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--on-d-3);margin-bottom:10px}
.mg-diag .bn{font-family:var(--display);font-size:21px;font-weight:500;line-height:1.25;margin:0 0 8px;max-width:80%}
.mg-diag .bd{font-size:13.5px;color:var(--on-d-2);line-height:1.55;max-width:88%}
.mg-diag .mode{display:inline-flex;align-items:center;gap:7px;margin-top:14px;font-family:var(--mono);font-size:10.5px;
  letter-spacing:.5px;text-transform:uppercase;color:var(--ink);background:var(--on-d);padding:5px 11px;border-radius:20px}

/* chart */
.mg-panel{background:var(--card);border:1px solid var(--hair);border-radius:16px;padding:20px;margin-bottom:22px}
.mg-prow{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.mg-ranges{display:flex;gap:3px}
.mg-range{font-family:var(--mono);font-size:10.5px;letter-spacing:.4px;color:var(--graphite-2);background:none;border:1px solid var(--hair);
  padding:4px 9px;border-radius:7px;cursor:pointer;text-transform:uppercase}
.mg-range[data-on="1"]{color:var(--card);background:var(--ink-on-p);border-color:var(--ink-on-p)}
.mg-range:disabled{opacity:.4;cursor:not-allowed}
.mg-chartwrap{position:relative;margin-top:8px}
.mg-tip{position:absolute;transform:translate(-50%,-115%);background:var(--ink);color:var(--on-d);border-radius:9px;
  padding:8px 11px;font-size:11.5px;line-height:1.4;max-width:190px;pointer-events:none;z-index:3;box-shadow:0 6px 24px rgba(0,0,0,.25)}
.mg-tip .tt{font-family:var(--mono);font-size:9.5px;letter-spacing:.5px;text-transform:uppercase;color:var(--on-d-3);margin-bottom:3px}

/* approval tray */
.mg-tray{background:var(--card);border:1px solid var(--hair);border-radius:16px;overflow:hidden}
.mg-tray-h{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--hair)}
.mg-tray-h .t{font-family:var(--display);font-size:17px;font-weight:500}
.mg-count{font-family:var(--mono);font-size:11px;color:var(--card);background:var(--ink-on-p);border-radius:20px;padding:3px 9px}
.mg-q{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid var(--paper-3)}
.mg-q:last-child{border-bottom:none}
.mg-q .pill{font-family:var(--mono);font-size:9.5px;letter-spacing:.5px;text-transform:uppercase;color:var(--graphite);
  border:1px solid var(--hair-2);border-radius:6px;padding:4px 7px;flex:0 0 auto;min-width:62px;text-align:center}
.mg-q .qt{flex:1;font-size:13.5px;color:var(--ink-on-p);line-height:1.4}
.mg-q .qt small{display:block;color:var(--graphite);font-size:11.5px;margin-top:2px}
.mg-risk{font-family:var(--mono);font-size:9px;letter-spacing:.5px;text-transform:uppercase;padding:3px 7px;border-radius:5px;flex:0 0 auto}
.mg-risk.low{background:var(--paper-3);color:var(--graphite)}
.mg-risk.high{background:var(--ink-on-p);color:var(--card)}
.mg-acts{display:flex;gap:6px;flex:0 0 auto}
.mg-b{font-family:var(--ui);font-size:12px;border-radius:8px;padding:7px 12px;cursor:pointer;border:1px solid var(--hair-2);background:var(--card);color:var(--ink-on-p);transition:all .12s}
.mg-b:hover{border-color:var(--graphite)}
.mg-b.go{background:var(--ink-on-p);color:var(--card);border-color:var(--ink-on-p);font-weight:500}
.mg-b.go:hover{opacity:.85}
.mg-done{font-family:var(--mono);font-size:11px;color:var(--graphite-2);letter-spacing:.5px}
.mg-stat-done{font-family:var(--mono);font-size:11px;letter-spacing:.5px;color:var(--card);background:var(--ink-on-p);padding:4px 9px;border-radius:20px;flex:0 0 auto}
.mg-feed-t{font-family:var(--mono);font-size:10.5px;color:var(--graphite-2);flex:0 0 auto;min-width:48px}

/* live tour */
.mg-tour-start{background:var(--card);border:1px solid var(--hair);border-radius:16px;padding:24px}
.mg-tour-start p{font-size:14px;line-height:1.6;color:var(--ink-on-p);margin:0 0 16px;max-width:520px}
.mg-tour-err{margin-top:14px;background:var(--ink-on-p);color:var(--card);font-size:12.5px;padding:10px 14px;border-radius:10px;line-height:1.5}
.mg-browser{background:var(--ink-3);border:1px solid var(--hair);border-radius:14px;overflow:hidden;height:540px}
.mg-iframe{width:100%;height:100%;border:none;display:block;background:#fff}
.mg-readbar{display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap}
.mg-readinput{flex:1;min-width:200px;font-family:var(--mono);font-size:12.5px;padding:9px 12px;border:1px solid var(--hair-2);border-radius:10px;background:var(--card);color:var(--ink-on-p);outline:none}
.mg-readinput:focus{border-color:var(--graphite)}
.mg-notes-h{display:flex;align-items:center;gap:10px;font-family:var(--display);font-size:17px;font-weight:500;margin:26px 0 12px;color:var(--ink-on-p)}
.mg-note-empty{font-size:13px;color:var(--graphite);line-height:1.55;background:var(--card);border:1px dashed var(--hair-2);border-radius:12px;padding:16px 18px}
.mg-notes{display:flex;flex-direction:column;gap:10px}
.mg-note{background:var(--card);border:1px solid var(--hair);border-radius:12px;padding:14px 16px;animation:fade .4s ease both}
.mg-note.pending{opacity:.6}
.mg-note-t{font-family:var(--display);font-size:15px;font-weight:500;color:var(--ink-on-p);margin-bottom:3px}
.mg-note-u{font-family:var(--mono);font-size:10.5px;color:var(--graphite-2);margin-bottom:8px;word-break:break-all}
.mg-note-b{font-size:13px;line-height:1.55;color:var(--graphite);white-space:pre-wrap}

/* pillar page */
.mg-pillar{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mg-pblock{background:var(--card);border:1px solid var(--hair);border-radius:14px;padding:18px 20px}
.mg-pblock.full{grid-column:1/-1}
.mg-pblock .ph{font-family:var(--mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--graphite-2);margin-bottom:11px}
.mg-pblock p{font-size:13.5px;line-height:1.6;color:var(--ink-on-p);margin:0}
.mg-pblock .why{color:var(--graphite);font-size:12.5px;margin-top:8px}
.mg-li{display:flex;gap:10px;font-size:13px;color:var(--ink-on-p);padding:7px 0;border-bottom:1px solid var(--paper-3);line-height:1.4}
.mg-li:last-child{border:none}
.mg-li .k{font-family:var(--mono);font-size:11px;color:var(--graphite-2);flex:0 0 auto}
.mg-dial{display:flex;gap:0;border:1px solid var(--hair-2);border-radius:9px;overflow:hidden;width:fit-content;margin-top:4px}
.mg-dseg{font-family:var(--mono);font-size:11px;letter-spacing:.4px;padding:7px 13px;cursor:pointer;background:var(--card);color:var(--graphite);border:none;border-right:1px solid var(--hair-2)}
.mg-dseg:last-child{border-right:none}
.mg-dseg[data-on="1"]{background:var(--ink-on-p);color:var(--card)}

/* unlit pillar */
.mg-unlit{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:40px;color:var(--graphite)}
.mg-unlit .ic{opacity:.4}
.mg-unlit h3{font-family:var(--display);font-weight:500;font-size:19px;color:var(--ink-on-p);margin:0}
.mg-unlit p{font-size:13.5px;max-width:330px;line-height:1.55;margin:0}

.mg-fadein{animation:fade .5s ease both}
@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* genie mascot */
.genie-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center}
.genie-glow{position:absolute;inset:-30%;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.28),rgba(255,255,255,0) 65%);filter:blur(2px);z-index:0}
.genie-svg{position:relative;z-index:1;animation:float 4.5s ease-in-out infinite}
.genie-svg.think{animation:float 1.6s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.genie-eye{animation:blink 5.2s infinite}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}

@media (max-width:860px){
  .mg-main{flex-direction:column}
  .mg-chat{flex:1;max-width:none;border-right:none;display:var(--show-chat,flex)}
  .mg-work{display:var(--show-work,none)}
  .mg-mobtabs{display:flex}
  .mg-cards{grid-template-columns:repeat(2,1fr)}
  .mg-pillar{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
  .genie-svg,.genie-svg.think,.genie-eye,.mg-msg,.mg-fadein{animation:none!important}
}
`;

/* ---------- the genie mascot (original, monochrome) ---------- */
function Genie({ size = 30, thinking = false }) {
  return (
    <span className="genie-wrap" style={{ width: size, height: size }} aria-hidden="true">
      <span className="genie-glow" />
      <svg className={"genie-svg" + (thinking ? " think" : "")} width={size} height={size}
        viewBox="0 0 64 64" fill="none">
        {/* lamp base */}
        <ellipse cx="32" cy="58" rx="13" ry="3.4" fill="rgba(255,255,255,.18)" />
        <path d="M24 56c0-3 3.6-5 8-5s8 2 8 5" stroke="#f3f3f1" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <path d="M40 53.5c3.6-.4 6-1.4 6-2.6" stroke="#f3f3f1" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        {/* wisp from lamp */}
        <path d="M32 51c-2-4 1-6 0-10" stroke="rgba(255,255,255,.45)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {/* body */}
        <path d="M32 22c8.5 0 13 6.5 13 14 0 4.6-2.4 8-6 9.4-2 0-2.6 1.2-2.6 2.6H27.6c0-1.4-.6-2.6-2.6-2.6-3.6-1.4-6-4.8-6-9.4 0-7.5 4.5-14 13-14Z"
          fill="#f3f3f1"/>
        {/* navy coat */}
        <path d="M19.6 36.4C21.6 43 26 47.6 32 47.6s10.4-4.6 12.4-11.2c-3.5 2.2-7.5 3.3-12.4 3.3s-8.9-1.1-12.4-3.3Z" fill="#27468f"/>
        {/* lapels */}
        <path d="M32 39.4 26.8 35.2 30.6 41.2Z" fill="#1b2f63"/>
        <path d="M32 39.4 37.2 35.2 33.4 41.2Z" fill="#1b2f63"/>
        {/* shirt v */}
        <path d="M30.5 40 32 44 33.5 40 32 41.1Z" fill="#f3f3f1"/>
        {/* tie */}
        <path d="M32 40.3 30.85 42.3 32 46 33.15 42.3Z" fill="#1b2f63"/>
        {/* head */}
        <circle cx="32" cy="20" r="10" fill="#f3f3f1"/>
        {/* topknot */}
        <circle cx="32" cy="8.5" r="2.4" fill="#f3f3f1"/>
        <path d="M32 11v2.5" stroke="#f3f3f1" strokeWidth="2" strokeLinecap="round"/>
        {/* face — dot eyes */}
        <g fill="#15151a">
          <circle className="genie-eye" cx="28.4" cy="20" r="1.7" style={{transformOrigin:"28.4px 20px"}}/>
          <circle className="genie-eye" cx="35.6" cy="20" r="1.7" style={{transformOrigin:"35.6px 20px"}}/>
        </g>
        <path d="M29 24.4c1.8 1.5 4.2 1.5 6 0" stroke="#15151a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    </span>
  );
}

/* ---------- sample fallback (if model JSON missing) ---------- */
const FALLBACK = {
  ready: true, product: "your product", bottleneck: "message",
  bottleneckLine: "People are arriving but not converting — the page isn't making the value land in the first 5 seconds.",
  mode: "growth",
  pillars: { social: true, blog: true, email: true, ads: true, outreach: false },
  pillarPlans: {
    social: "Launch sequence + 3 posts/week showing the product in action, posted to your connected accounts.",
    blog: "Target the 4 keywords your buyers actually search; publish 1 SEO piece/week.",
    email: "Warm-start a sending inbox now; reach 50 hand-matched contacts on a 3-day cadence once warm.",
    ads: "Hold until the page converts — then small Meta video tests, kill losers in 48h."
  },
  metrics: { visitors: 4200, signups: 38, customers: 6, revenue: 294 },
  chart: [3, 2, 4, 3, 6, 5, 9, 14, 11, 17, 15, 22],
  queue: [
    { pillar: "social", title: "Launch post for Product Hunt + X thread", sub: "Goes live Tue 8:00 AM", risk: "low" },
    { pillar: "blog", title: "SEO article: \"AR product visualization for stores\"", sub: "Draft ready to review", risk: "low" },
    { pillar: "email", title: "Start warming sending inbox", sub: "Runs quietly for ~2 weeks", risk: "low" }
  ]
};

const RANGES = ["1H", "24H", "WEEK", "MONTH", "YEAR"];
const XLAB = ["", "", "", "", "", "", "", "", "", "", "", ""];
const CAUSES = {
  7: { t: "Launch went live", d: "Product Hunt + X thread posted by the genie — 9 signups this hour." },
  9: { t: "SEO piece indexed", d: "Your first article started ranking — organic visitors climbing." },
  11: { t: "Outreach replies", d: "3 store owners replied to the email batch; 2 moved to closing." }
};

const SYSTEM = `You are Genie, the Marketing Genie — an AI growth operator for people who built a software/AI product but can't get users. You are warm, sharp, and concise. Cute but professional.

Your job in this chat: run a short intake conversation, then deliver a diagnosis.

RULES:
- Ask ONE question at a time. Never dump a list of questions. Keep each message to 1-3 short sentences.
- First, if you don't have it, ask for their product link. Then ask, one at a time: when they launched / any users or sales yet, what it costs, who the customer is, and their main goal.
- Be honest always. Never promise "perfect" analytics or guaranteed results. You find what's blocking growth and run the engine; you can't make a bad product wanted.
- After you have enough (roughly: product + stage + customer + goal), give a SHORT diagnosis message (2-3 sentences naming the single biggest bottleneck), then on a NEW LINE output a fenced block exactly like:
\`\`\`genie-state
{"ready":true,"product":"NAME","bottleneck":"traffic|message|activation|money","bottleneckLine":"one sentence, evidence-style","mode":"cold-start|growth|scale","pillars":{"social":true,"blog":true,"email":true,"ads":false,"outreach":false},"pillarPlans":{"social":"...","blog":"...","email":"...","ads":"...","outreach":"..."},"metrics":{"visitors":1234,"signups":42,"customers":5,"revenue":245},"chart":[3,2,4,3,6,5,9,14,11,17,15,22],"queue":[{"pillar":"social","title":"...","sub":"...","risk":"low"},{"pillar":"blog","title":"...","sub":"...","risk":"low"}]}
\`\`\`
- Light up pillars (true) only where the channel fits the business model. For B2B, favor email + ads + social. For consumer apps, favor social + ads + blog and set email:false. Give a one-line plan ONLY for lit pillars (others can be "").
- Estimate plausible metrics/chart from what they told you (small numbers for new products). Keep the JSON compact and valid. Output the JSON block only once, when ready.
- Before ready, just keep the conversation going — no JSON.`;

export default function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi — I'm Genie, your growth operator. Paste your product's link and tell me what it does, and I'll find exactly what's keeping users away.\n\nWhat are you working on?" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState(null);     // diagnosis/workspace state
  const [tab, setTab] = useState("overview");
  const [range, setRange] = useState("24H");
  const [tip, setTip] = useState(null);
  const [queue, setQueue] = useState([]);
  const [dials, setDials] = useState({});
  const [mobile, setMobile] = useState("chat"); // chat | work
  const [feed, setFeed] = useState([]);          // live "what the genie did" log
  const [live, setLive] = useState(null);        // growing metrics + chart after approvals
  const [profile, setProfile] = useState(null);  // session memory of the toured product
  const [tour, setTour] = useState({ active: false, viewerUrl: "", sessionId: "", reading: false, error: "" });
  const [notes, setNotes] = useState([]);        // genie's notes: one card per room read
  const [tourUrl, setTourUrl] = useState("");    // URL the user wants to read in the tour
  const [sharedUrl, setSharedUrl] = useState(false); // has the user given a product link yet?
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const rootStyle = {
    "--show-chat": mobile === "chat" ? "flex" : "none",
    "--show-work": mobile === "work" ? "flex" : "none"
  };

  function applyState(s) {
    setState(s);
    setQueue((s.queue || []).map((q, i) => ({ ...q, id: "q" + i + "_" + Date.now(), status: "pending" })));
    const d = {};
    Object.keys(s.pillars || {}).forEach(k => { if (s.pillars[k]) d[k] = "approve"; });
    setDials(d);
    setLive({
      metrics: { ...(s.metrics || { visitors: 0, signups: 0, customers: 0, revenue: 0 }) },
      chart: (s.chart || []).slice()
    });
    // Session memory: a living profile of the product the genie just toured.
    setProfile({
      product: s.product || "your product",
      bottleneck: s.bottleneck,
      mode: s.mode,
      pillars: s.pillars,
      plans: s.pillarPlans || {},
      learnedAt: new Date().toLocaleTimeString()
    });
    setFeed([{ t: timeNow(), text: "X-ray complete — diagnosed " + (s.product || "your product") + ". Cockpit live." }]);
    setTab("overview");
  }

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Approve a queued action: it "runs", logs to the feed, and nudges the metrics up.
  function approveItem(id) {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: "working" } : q));
    const item = queue.find(q => q.id === id);
    if (!item) return;
    setFeed(f => [{ t: timeNow(), text: "Working on: " + item.title }, ...f]);
    setTimeout(() => {
      setQueue(prev => prev.map(q => q.id === id ? { ...q, status: "done" } : q));
      setFeed(f => [{ t: timeNow(), text: "Done: " + item.title + " — live now." }, ...f]);
      // Each shipped action nudges the funnel (simulated for the demo).
      setLive(L => {
        if (!L) return L;
        const bump = item.pillar === "ads" ? 90 : item.pillar === "social" ? 60 : item.pillar === "blog" ? 40 : 30;
        const sUp = Math.max(1, Math.round(bump / 12));
        const chart = L.chart.slice();
        chart.push((chart[chart.length - 1] || 0) + sUp);
        if (chart.length > 12) chart.shift();
        return {
          metrics: {
            visitors: (L.metrics.visitors || 0) + bump,
            signups: (L.metrics.signups || 0) + sUp,
            customers: (L.metrics.customers || 0) + (Math.random() < 0.5 ? 1 : 0),
            revenue: (L.metrics.revenue || 0) + (Math.random() < 0.5 ? 9 : 0)
          },
          chart
        };
      });
    }, 1400);
  }

  function editItem(id) {
    const item = queue.find(q => q.id === id);
    setQueue(prev => prev.filter(q => q.id !== id));
    if (item) setInput("Edit this " + item.pillar + " action: \"" + item.title + "\" — ");
    if (taRef.current) taRef.current.focus();
  }

  // ---- LIVE TOUR (Steel co-browser) ----
  async function startTour() {
    setTour(t => ({ ...t, active: true, error: "", reading: true }));
    setTab("tour");
    if (window.innerWidth <= 860) setMobile("work");
    try {
      const r = await fetch("/api/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" })
      });
      const d = await r.json();
      if (d.error || !d.viewerUrl) {
        setTour(t => ({ ...t, reading: false, error: d.message || "Couldn't open the live browser. Add STEEL_API_KEY in Vercel." }));
        return;
      }
      setTour({ active: true, viewerUrl: d.sessionViewerUrl || d.viewerUrl, sessionId: d.sessionId, reading: false, error: "" });
      setMessages(prev => [...prev, { role: "assistant", content: "The live browser is open on the right. Type your product's URL in its address bar and load your storefront — then hit \"Genie, read this page\" and I'll take notes. We'll walk through it room by room." }]);
    } catch (e) {
      setTour(t => ({ ...t, reading: false, error: "Couldn't reach the browser service." }));
    }
  }

  // Read whatever page is loaded in the tour, add a note card, and let the genie react.
  async function readRoom() {
    const url = tourUrl.trim();
    if (!url) {
      setMessages(prev => [...prev, { role: "assistant", content: "Paste the URL that's currently open in the browser into the little box, then hit read — that tells me which page to look at." }]);
      return;
    }
    setTour(t => ({ ...t, reading: true }));
    setNotes(n => [...n, { url, title: "Reading…", body: "", pending: true }]);
    try {
      const r = await fetch("/api/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", url })
      });
      const d = await r.json();
      const body = (d.content || "").trim();
      setNotes(n => {
        const copy = n.slice();
        copy[copy.length - 1] = {
          url,
          title: d.title || roomLabel(url),
          body: body ? body.slice(0, 400) : "(couldn't read this page — try the public URL, or describe it to me)",
          pending: false
        };
        return copy;
      });
      // Hand the page to the genie so it reacts and guides the next room.
      const note = "I just read this page during our tour:\nURL: " + url + "\nContent:\n" + (body.slice(0, 3500) || "(empty)") +
        "\n\nReact with one specific observation, then tell me which room to open next.";
      setTour(t => ({ ...t, reading: false }));
      sendSilent(note);
    } catch (e) {
      setTour(t => ({ ...t, reading: false }));
      setNotes(n => { const c = n.slice(); c[c.length - 1] = { url, title: roomLabel(url), body: "(read failed)", pending: false }; return c; });
    }
  }

  function roomLabel(url) {
    const u = url.toLowerCase();
    if (/product|item|listing/.test(u)) return "Product page";
    if (/categor|collection|shop|browse|store/.test(u)) return "Storefront / category";
    if (/seller|admin|dashboard|account/.test(u)) return "Backend / seller";
    if (/price|plan/.test(u)) return "Pricing";
    return "Page";
  }

  async function endTour() {
    if (tour.sessionId) {
      fetch("/api/browser", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "stop", sessionId: tour.sessionId }) }).catch(() => {});
    }
    setTour({ active: false, viewerUrl: "", sessionId: "", reading: false, error: "" });
    sendSilent("That's the whole tour — here are all the rooms I noted: " + notes.map(n => n.title).join(", ") + ". Now give me your confident full read: what the product is, its strongest asset to build on, its biggest leak to fix, then run the diagnosis.");
    setTab("overview");
  }

  // Send a message to the genie WITHOUT showing it as a user bubble (system-style nudge).
  async function sendSilent(text) {
    const next = [...messages, { role: "user", content: text }];
    setBusy(true);
    try {
      const res = await fetch("/api/genie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          memory: profile ? "Remembered profile: " + JSON.stringify(profile) : ""
        })
      });
      if (!res.body) { setBusy(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "", started = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const shown = acc.split("```genie-state")[0].replace(/```\s*$/, "").trimEnd();
        if (!started) { started = true; setBusy(false); setMessages(prev => [...prev, { role: "assistant", content: shown }]); }
        else setMessages(prev => { const c = prev.slice(); c[c.length - 1] = { role: "assistant", content: shown }; return c; });
      }
      let parsed = null;
      const m = acc.match(/```genie-state\s*([\s\S]*?)```/);
      if (m) { try { parsed = JSON.parse(m[1].trim()); } catch (e) {} }
      let finalTxt = acc.replace(/```genie-state[\s\S]*?```/, "").trim();
      setMessages(prev => { const c = prev.slice(); if (c.length && c[c.length - 1].role === "assistant") c[c.length - 1] = { role: "assistant", content: finalTxt }; return c; });
      if (parsed && parsed.ready) setTimeout(() => applyState(parsed), 400);
    } catch (e) { setBusy(false); }
    finally { setBusy(false); }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    if (/https?:\/\/[^\s)]+/.test(text)) setSharedUrl(true);
    setBusy(true);
    try {
      const res = await fetch("/api/genie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          memory: profile
            ? "You have already toured and diagnosed this product earlier in this session. Remembered profile: " +
              JSON.stringify(profile) +
              ". Use this; don't re-run the whole tour unless they share a new product."
            : ""
        })
      });

      if (!res.body) {
        const fallback = (await res.text()) || "I hit a snag reaching my brain just now.";
        setMessages(prev => [...prev, { role: "assistant", content: fallback }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let started = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const shown = acc.split("```genie-state")[0].replace(/```\s*$/, "").trimEnd();
        if (!started) {
          started = true;
          setBusy(false);
          setMessages(prev => [...prev, { role: "assistant", content: shown }]);
        } else {
          setMessages(prev => {
            const copy = prev.slice();
            copy[copy.length - 1] = { role: "assistant", content: shown };
            return copy;
          });
        }
      }

      // finalize: pull out the genie-state block, clean the visible text
      let parsed = null;
      const m = acc.match(/```genie-state\s*([\s\S]*?)```/);
      if (m) { try { parsed = JSON.parse(m[1].trim()); } catch (e) { parsed = null; } }
      let finalTxt = acc.replace(/```genie-state[\s\S]*?```/, "").trim();
      if (!finalTxt) finalTxt = "Here's what I'm seeing — check the cockpit on the right.";
      setMessages(prev => {
        const copy = prev.slice();
        if (copy.length && copy[copy.length - 1].role === "assistant") {
          copy[copy.length - 1] = { role: "assistant", content: finalTxt };
        } else {
          copy.push({ role: "assistant", content: finalTxt });
        }
        return copy;
      });
      if (parsed && parsed.ready) {
        setTimeout(() => { applyState(parsed); if (window.innerWidth <= 860) setMobile("work"); }, 450);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "I hit a snag reaching my brain just now. Try that again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }
  function grow(e) {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    setInput(e.target.value);
  }

  const PILLARS = [
    { id: "overview", label: "Overview", always: true },
    { id: "tour", label: "Live Tour", always: true },
    { id: "social", label: "Social" },
    { id: "blog", label: "Blog/SEO" },
    { id: "email", label: "Email" },
    { id: "ads", label: "Ads" },
    { id: "outreach", label: "Outreach" }
  ];

  return (
    <div className="mg-root" style={rootStyle}>
      <style>{CSS}</style>

      {/* top bar */}
      <div className="mg-top">
        <div className="mg-brand">
          <Genie size={26} />
          <span className="mg-wordmark">Marketing&nbsp;<em>Genie</em></span>
        </div>
        <div className="mg-mobtabs">
          <button className="mg-mobtab" data-on={mobile === "chat" ? "1" : "0"} onClick={() => setMobile("chat")}>Genie</button>
          <button className="mg-mobtab" data-on={mobile === "work" ? "1" : "0"} onClick={() => setMobile("work")}>Cockpit</button>
        </div>
        <span className="mg-stamp">Phase 1 · build v1</span>
      </div>

      <div className="mg-main">
        {/* ---------------- CHAT ---------------- */}
        <div className="mg-chat">
          <div className="mg-chead">
            <Genie size={42} thinking={busy} />
            <div className="mg-who">
              <span className="mg-who-name">Genie</span>
              <span className="mg-who-role">Your growth operator</span>
              <span className="mg-status">
                <span className={"mg-dot" + (busy ? " think" : "")} />
                {busy ? "Thinking…" : "Online · ready to work"}
              </span>
            </div>
          </div>

          <div className="mg-scroll" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={"mg-msg " + (m.role === "user" ? "user" : "genie")}>
                {m.role === "user"
                  ? <span className="mg-uav">you</span>
                  : <span className="mg-av"><Genie size={30} /></span>}
                <div className="mg-bub">{m.content}</div>
              </div>
            ))}
            {busy && (
              <div className="mg-msg genie">
                <span className="mg-av"><Genie size={30} thinking /></span>
                <div className="mg-bub" style={{ color: "var(--on-d-3)" }}>Genie is thinking…</div>
              </div>
            )}
          </div>

          <div className="mg-input">
            <div className="mg-ibox">
              <textarea ref={taRef} className="mg-ta" rows={1} value={input}
                placeholder="Tell the genie about your product…"
                onChange={grow} onKeyDown={onKey} aria-label="Message the genie" />
              <button className="mg-send" onClick={send} disabled={busy || !input.trim()} aria-label="Send">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mg-hint">The genie can update its plan, or tell you when you're wrong — and why.</div>
          </div>
        </div>

        {/* ---------------- WORKSPACE ---------------- */}
        <div className="mg-work">
          <div className="mg-tabs">
            {PILLARS.map(p => {
              const lit = p.always || (state && state.pillars && state.pillars[p.id]);
              let disabled = !p.always && !state;
              if (p.id === "tour") disabled = !sharedUrl;   // tour unlocks after a link is shared
              return (
                <button key={p.id} className="mg-tab" data-on={tab === p.id ? "1" : "0"}
                  disabled={disabled} onClick={() => setTab(p.id)}
                  title={p.id === "tour" && !sharedUrl ? "Share your product link in the chat first" : ""}>
                  {p.label}{lit && !p.always && <span className="tdot" />}
                </button>
              );
            })}
          </div>

          <div className="mg-body">
            {!state && tab !== "tour" && (
              <div className="mg-empty">
                <Genie size={64} />
                <div className="mg-xray">X-Ray · standing by</div>
                <h2>Your cockpit lights up here</h2>
                <p>Share your product link in the chat. Then the genie can walk you through it live — the <strong>Live Tour</strong> tab unlocks, and you tour each page together while it takes notes.</p>
              </div>
            )}

            {tab === "tour" && (
              <div className="mg-fadein">
                <div className="mg-eyebrow" style={{ marginBottom: 4 }}>Guided X-ray</div>
                <div className="mg-h" style={{ marginBottom: 14, fontSize: 23 }}>Live tour — walk me through your product</div>

                {!sharedUrl && !tour.active && (
                  <div className="mg-tour-start">
                    <p>Share your product link with the genie in the chat first. Once it knows what it's looking at, the live browser opens here and I'll walk through it with you, room by room.</p>
                    <button className="mg-b" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => { if (taRef.current) taRef.current.focus(); if (window.innerWidth <= 860) setMobile("chat"); }}>Go to chat →</button>
                  </div>
                )}

                {sharedUrl && !tour.active && (
                  <div className="mg-tour-start">
                    <p>Ready when you are. I'll open a real browser right here — load <b>{sharedUrl}</b>, click through it room by room, and I'll read each page and take notes, then give you the full read.</p>
                    <button className="mg-b go" style={{ padding: "10px 18px", fontSize: 13 }} onClick={startTour}>Open the live browser →</button>
                    {tour.error && <div className="mg-tour-err">{tour.error}</div>}
                  </div>
                )}

                {tour.active && (
                  <>
                    {tour.reading && !tour.viewerUrl && <div className="mg-tour-err" style={{ background: "var(--paper-3)", color: "var(--graphite)" }}>Opening a live browser…</div>}
                    {tour.error && <div className="mg-tour-err">{tour.error}</div>}
                    {tour.viewerUrl && (
                      <>
                        <div className="mg-browser">
                          <iframe title="Live tour" src={tour.viewerUrl} className="mg-iframe" allow="clipboard-read; clipboard-write" />
                        </div>
                        <div className="mg-readbar">
                          <input className="mg-readinput" placeholder="Paste the URL that's open above, then →" value={tourUrl} onChange={e => setTourUrl(e.target.value)} />
                          <button className="mg-b go" disabled={tour.reading} onClick={readRoom}>{tour.reading ? "Reading…" : "Genie, read this page"}</button>
                          <button className="mg-b" onClick={endTour}>Finish tour</button>
                        </div>
                      </>
                    )}

                    {/* Genie's Notes */}
                    <div className="mg-notes-h">Genie's notes <span className="mg-count">{notes.length}</span></div>
                    {notes.length === 0 && <div className="mg-note-empty">As you open each page and I read it, my notes appear here — building the full picture of your product.</div>}
                    <div className="mg-notes">
                      {notes.map((n, i) => (
                        <div className={"mg-note" + (n.pending ? " pending" : "")} key={i}>
                          <div className="mg-note-t">{n.title}</div>
                          <div className="mg-note-u">{n.url}</div>
                          <div className="mg-note-b">{n.body}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {state && tab === "overview" && (
              <div className="mg-fadein">
                {/* diagnosis */}
                <div className="mg-diag">
                  <div className="tag">Diagnosis · the one bottleneck</div>
                  <h3 className="bn">
                    {state.bottleneck === "traffic" && "Nobody knows it exists yet."}
                    {state.bottleneck === "message" && "People arrive — and don't get it."}
                    {state.bottleneck === "activation" && "They sign up, then vanish."}
                    {state.bottleneck === "money" && "They use it, but won't pay."}
                  </h3>
                  <div className="bd">{state.bottleneckLine}</div>
                  <span className="mode">
                    {state.mode === "cold-start" && "Cold-Start mode"}
                    {state.mode === "growth" && "Growth mode"}
                    {state.mode === "scale" && "Scale mode"}
                  </span>
                </div>

                {/* metrics */}
                <div className="mg-cards">
                  {[
                    ["Visitors", (live || state).metrics?.visitors, "this period"],
                    ["Signups", (live || state).metrics?.signups, "from visitors"],
                    ["Paying", (live || state).metrics?.customers, "subscribers"],
                    ["Revenue", (live || state).metrics?.revenue != null ? "$" + (live || state).metrics.revenue : "—", "recurring"]
                  ].map(([l, v, s]) => (
                    <div className="mg-card" key={l}>
                      <div className="lbl">{l}</div>
                      <div className="val">{v ?? "—"}</div>
                      <div className="sub">{s}</div>
                    </div>
                  ))}
                </div>

                {/* chart */}
                <div className="mg-panel">
                  <div className="mg-prow">
                    <div>
                      <div className="mg-eyebrow" style={{ margin: 0 }}>Live growth</div>
                      <div className="mg-h">Signups over time</div>
                    </div>
                    <div className="mg-ranges">
                      {RANGES.map(r => {
                        const off = r === "MONTH" || r === "YEAR";
                        return (
                          <button key={r} className="mg-range" data-on={range === r ? "1" : "0"}
                            disabled={off} title={off ? "Unlocks once you have that much history" : ""}
                            onClick={() => setRange(r)}>{r}</button>
                        );
                      })}
                    </div>
                  </div>
                  <Chart data={(live && live.chart && live.chart.length ? live.chart : state.chart) || FALLBACK.chart} tip={tip} setTip={setTip} />
                  <div className="mg-hint" style={{ color: "var(--graphite-2)", textAlign: "left", marginTop: 12 }}>
                    Tap a point to see what the genie did to cause it.
                  </div>
                </div>

                {/* approval tray */}
                <div className="mg-tray">
                  <div className="mg-tray-h">
                    <span className="t">Needs your approval</span>
                    <span className="mg-count">{queue.filter(q => q.status === "pending").length}</span>
                  </div>
                  {queue.length === 0 && (
                    <div className="mg-q"><span className="mg-done">All clear — the genie is working. New moves land here for your sign-off.</span></div>
                  )}
                  {queue.map((q) => (
                    <div className="mg-q" key={q.id}>
                      <span className="pill">{q.pillar}</span>
                      <div className="qt">{q.title}{q.sub && <small>{q.sub}</small>}</div>
                      {q.status === "pending" && (
                        <>
                          <span className={"mg-risk " + (q.risk === "high" ? "high" : "low")}>{q.risk === "high" ? "approve" : "low risk"}</span>
                          <div className="mg-acts">
                            <button className="mg-b" onClick={() => editItem(q.id)}>Edit</button>
                            <button className="mg-b go" onClick={() => approveItem(q.id)}>Approve</button>
                          </div>
                        </>
                      )}
                      {q.status === "working" && <span className="mg-done" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="mg-dot think" style={{ background: "var(--ink-on-p)", boxShadow: "none" }} />Working…</span>}
                      {q.status === "done" && <span className="mg-stat-done">✓ Live</span>}
                    </div>
                  ))}
                </div>

                {/* live activity feed */}
                <div className="mg-tray" style={{ marginTop: 22 }}>
                  <div className="mg-tray-h">
                    <span className="t">What the genie is doing</span>
                    <span className="mg-count">{feed.length}</span>
                  </div>
                  {feed.length === 0 && (
                    <div className="mg-q"><span className="mg-done">Approve a move above and watch it happen here.</span></div>
                  )}
                  {feed.map((f, i) => (
                    <div className="mg-q" key={i}>
                      <span className="mg-feed-t">{f.t}</span>
                      <div className="qt" style={{ fontSize: 13 }}>{f.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state && tab !== "overview" && tab !== "tour" && (
              <PillarView id={tab} state={state} dials={dials} setDials={setDials} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- pillar detail ---------- */
function PillarView({ id, state, dials, setDials }) {
  const lit = state.pillars && state.pillars[id];
  const label = { social: "Social", blog: "Blog / SEO", email: "Email", ads: "Ads", outreach: "Outreach" }[id];

  if (!lit) {
    return (
      <div className="mg-unlit mg-fadein">
        <div className="ic"><Genie size={52} /></div>
        <h3>{label} isn't the right channel for you — yet</h3>
        <p>The genie turned this off on purpose. For your business model and stage, your budget works harder elsewhere. It'll light up the moment that changes.</p>
      </div>
    );
  }

  const plan = (state.pillarPlans && state.pillarPlans[id]) || FALLBACK.pillarPlans[id] || "Plan being prepared.";
  const work = {
    social: [["Queued", "Launch post + X thread"], ["Scheduled", "3 posts this week"], ["Published", "—"]],
    blog: [["Drafting", "1 SEO article"], ["Targeting", "4 buyer keywords"], ["Published", "—"]],
    email: [["Warming", "sending inbox (~2 wks)"], ["Matched", "50 contacts found"], ["Sent", "0 — waiting on warmup"]],
    ads: [["Status", "On hold"], ["Reason", "Fix the page first"], ["Spend cap", "set, not active"]],
    outreach: [["Pipeline", "contacted → replied"], ["Cadence", "1 touch / 3 days"], ["Closing", "—"]]
  }[id] || [];
  const results = {
    social: [["Reach", "—"], ["Clicks", "—"], ["Signups", "—"]],
    blog: [["Impressions", "—"], ["Organic visits", "—"]],
    email: [["Replies", "—"], ["Positive", "—"]],
    ads: [["Spend", "$0"], ["CPA", "—"]],
    outreach: [["Replies", "—"], ["Deals", "—"]]
  }[id] || [];
  const cur = dials[id] || "approve";

  return (
    <div className="mg-fadein">
      <div className="mg-eyebrow" style={{ marginBottom: 4 }}>Pillar</div>
      <div className="mg-h" style={{ marginBottom: 18, fontSize: 24 }}>{label}</div>
      <div className="mg-pillar">
        <div className="mg-pblock full">
          <div className="ph">The plan · why this pillar</div>
          <p>{plan}</p>
          <p className="why">Lit because it fits how your product reaches buyers — the genie can explain the reasoning in chat anytime.</p>
        </div>
        <div className="mg-pblock">
          <div className="ph">The work</div>
          {work.map(([k, v]) => <div className="mg-li" key={k}><span className="k">{k}</span><span>{v}</span></div>)}
        </div>
        <div className="mg-pblock">
          <div className="ph">The results</div>
          {results.map(([k, v]) => <div className="mg-li" key={k}><span className="k">{k}</span><span>{v}</span></div>)}
          <div className="ph" style={{ marginTop: 16 }}>Autonomy</div>
          <div className="mg-dial">
            {["draft", "approve", "auto"].map(d => (
              <button key={d} className="mg-dseg" data-on={cur === d ? "1" : "0"}
                onClick={() => setDials(p => ({ ...p, [id]: d }))}>{d}</button>
            ))}
          </div>
          <p className="why" style={{ marginTop: 9 }}>
            {cur === "draft" && "Genie drafts only — nothing goes out."}
            {cur === "approve" && "Genie prepares everything; you approve before it ships."}
            {cur === "auto" && "Genie runs this on its own. Earned, not default."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- custom monochrome chart ---------- */
function Chart({ data, tip, setTip }) {
  const W = 640, H = 180, pad = 8;
  const max = Math.max(...data, 1);
  const step = (W - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${(W - pad).toFixed(1)} ${H - pad} L${pad} ${H - pad} Z`;

  return (
    <div className="mg-chartwrap">
      {tip && (
        <div className="mg-tip" style={{ left: tip.x, top: tip.y }}>
          <div className="tt">{tip.t}</div>{tip.d}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="180" style={{ display: "block" }}
        onMouseLeave={() => setTip(null)}>
        <defs>
          <linearGradient id="mgFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(19,19,22,.10)" />
            <stop offset="100%" stopColor="rgba(19,19,22,0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#mgFill)" />
        <path d={line} fill="none" stroke="#131316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "mgdraw 1.1s ease forwards" }} />
        <style>{`@keyframes mgdraw{to{stroke-dashoffset:0}}`}</style>
        {pts.map((p, i) => {
          const cause = CAUSES[i];
          return (
            <g key={i}>
              <circle cx={p[0]} cy={p[1]} r={cause ? 4 : 2.5}
                fill={cause ? "#131316" : "#fff"} stroke="#131316" strokeWidth={cause ? 0 : 1.4}
                style={{ cursor: cause ? "pointer" : "default" }}
                onClick={() => cause && setTip({ x: (p[0] / W) * 100 + "%", y: p[1] - 6, t: cause.t, d: cause.d })} />
              {cause && <circle cx={p[0]} cy={p[1]} r="8" fill="rgba(19,19,22,.08)" />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
