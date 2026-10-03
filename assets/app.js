/* LiveGrow shared core: email-first sign-up (request-link API), optional profile, reserve/buy preview dialog. */
(function () {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function h(tag, attrs, kids) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] === true) e.setAttribute(k, ""); else if (attrs[k] !== false) e.setAttribute(k, attrs[k]); });
  (kids || []).forEach(function (c) { e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
var store = {
  get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked: the page still works */ } }
};
window.LG = { $: $, $$: $$, h: h, clear: clear, store: store };

/* ---------- sign-up ---------- */
var API = "https://acp9reat3l.execute-api.us-east-1.amazonaws.com/signal/request-link";
var SITE = "livegroweveryday.com";
var LANDING_RE = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%\/-]{0,199}$/;
var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
function payload(email, hp, profile) {
  var b = { email: email, hp: hp || "", site: SITE };
  if (LANDING_RE.test(location.pathname)) b.landing_path = location.pathname;
  try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (tz && tz.length <= 40) b.tz = tz; } catch (e) { /* no zone: the API falls back */ }
  var q = location.search;
  if (q && q.length <= 2048 && /[?&](utm_[a-z]+|ref)=/i.test(q)) b.query = q;
  if (profile) b.profile = profile;
  return b;
}
function post(body) {
  var ctl = window.AbortController ? new AbortController() : null, timer = ctl ? window.setTimeout(function () { ctl.abort(); }, 15000) : 0;
  return fetch(API, { method: "POST", mode: "cors", credentials: "omit", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { window.clearTimeout(timer); return { status: r.status, code: j && j.error }; }); },
          function () { window.clearTimeout(timer); return { status: 0, code: "network" }; });
}
function errText(res) {
  var s = res.status, c = res.code;
  if (s === 400 && c === "invalid_email") return "That email address doesn't look right. Check it for a typo?";
  if (s === 400 && c === "invalid_profile") return "We couldn't save that. Letters, spaces, hyphens and apostrophes work best in a name.";
  if (s === 400) return "Something in the form didn't go through. Please try again.";
  if (s === 415) return "Your browser sent the form in a format we can't read. Refresh the page and try again.";
  if (s === 429) return "Lots of sign-ups from your network just now. Wait a minute, then try again.";
  if (s === 403) return "Sign-up only works on our own site. Open livegroweveryday.com and try again.";
  if (s >= 500) return "Our sign-up desk hit a snag. Please try again in a moment.";
  return "We couldn't reach the sign-up desk. Check your connection and try again.";
}
function validEmail(v) { return v.length <= 254 && EMAIL_RE.test(v); }

$$(".js-join").forEach(function (form, n) {
  var em = $('input[type="email"]', form), hp = $('input[name="website"]', form), err = $(".js-err", form);
  var btn = $('button[type="submit"]', form), flow = $(".js-flow", form.parentNode), busy = false;
  em.addEventListener("blur", function () {
    var v = em.value.trim();
    if (v && !validEmail(v)) { err.textContent = "That email address doesn't look right yet."; em.setAttribute("aria-invalid", "true"); }
    else { err.textContent = ""; em.removeAttribute("aria-invalid"); }
  });
  em.addEventListener("input", function () { if (em.getAttribute("aria-invalid") && validEmail(em.value.trim())) { err.textContent = ""; em.removeAttribute("aria-invalid"); } });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var v = em.value.trim();
    if (!validEmail(v)) { err.textContent = "Please enter your email address, like name@example.com."; em.setAttribute("aria-invalid", "true"); em.focus(); return; }
    busy = true; btn.disabled = true; var label = btn.textContent; btn.textContent = "Sending…"; err.textContent = "";
    post(payload(v, hp ? hp.value : "")).then(function (res) {
      busy = false; btn.disabled = false; btn.textContent = label;
      if (res.status === 200) { form.hidden = true; stepProfile(flow, v, n); return; }
      err.textContent = errText(res);
      if (res.code === "invalid_email") { em.setAttribute("aria-invalid", "true"); em.focus(); }
    });
  });
});

function stepProfile(flow, email, n) {
  flow.hidden = false; clear(flow);
  var art = flow.getAttribute("data-art");
  var head = h("h3", { tabindex: "-1" }, ["You're in. Make it yours?"]);
  var name = h("input", { id: "nm" + n, name: "name", type: "text", autocomplete: "given-name", maxlength: "40" });
  var cad = [["daily", "One step a day"], ["weekly", "A weekly recap"]].map(function (c) {
    return h("label", { class: "chk" }, [h("input", { type: "radio", name: "cadence" + n, value: c[0] }), h("span", {}, [c[1]])]);
  });
  var perr = h("p", { class: "err", role: "alert" });
  var save = h("button", { class: "btn sm", type: "submit" }, ["Save my choices"]);
  var skip = h("button", { class: "notnow", type: "button" }, ["Not now"]);
  var f = h("form", { novalidate: true }, [
    h("div", { class: "f-grid" }, [
      h("div", {}, [h("label", { for: "nm" + n }, ["First name"]), name]),
      h("fieldset", { class: "seg-pick" }, [h("legend", { class: "f-l" }, ["How often"])].concat(cad))
    ]),
    perr,
    h("div", { class: "f-actions" }, [save, skip])
  ]);
  var lead = h("div", { class: "ok-wrap" }, []);
  if (art) lead.appendChild(h("img", { src: art, alt: "", height: "96", class: "ok-art" }));
  var txt = h("div", {}, [
    h("p", { class: "ok-line", role: "status" }, ["Check your inbox: we sent a link to confirm ", h("b", {}, [email]), "."]),
    head,
    h("p", { class: "s" }, ["All optional. Skip anything."])
  ]);
  lead.appendChild(txt);
  flow.appendChild(lead); flow.appendChild(f);
  head.focus();
  function done(saved) {
    clear(flow);
    var t = h("h3", { tabindex: "-1" }, [saved ? "Saved. Thank you." : "All set."]);
    flow.appendChild(t);
    flow.appendChild(h("p", { class: "s" }, ["Your welcome gift, a sample chapter of the AI-Era Defense Playbook, comes with your confirmation email. This is a Founders' Preview: we will write when there is something new to try, and you can unsubscribe in one click."]));
    t.focus();
  }
  skip.addEventListener("click", function () { done(false); });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var prof = {}, nm = name.value.trim(), c = f.querySelector('input[name="cadence' + n + '"]:checked');
    if (nm) prof.name = nm;
    if (c) prof.cadence = c.value;
    if (!Object.keys(prof).length) { done(false); return; }
    if (/[<>]/.test(nm)) { perr.textContent = "Please leave out < and > in your name."; return; }
    save.disabled = true; perr.textContent = "";
    post(payload(email, "", prof)).then(function (res) {
      save.disabled = false;
      if (res.status === 200) done(true); else perr.textContent = errText(res);
    });
  });
}

/* ---------- reserve / buy dialog (preview: no payment is taken) ---------- */
var TIERS = {
  pro:   { n: "Pro",   list: "$9.99/mo", found: "$7.99/mo", yr: "or $79/yr founding", save: "You save $2/mo, 20%.", dep: "$9.99",  get: ["A daily plan made for you", "Weekly reflection recap", "Your founding price, locked"] },
  max:   { n: "MAX",   list: "$19.99/mo", found: "$14.99/mo", yr: "or $149/yr founding", save: "You save $5/mo, $60/yr, 25%.", dep: "$29", get: ["Everything in Pro", "Monthly deep dives", "Every lane, every white paper"] },
  ultra: { n: "Ultra", list: "$99.99/mo", found: "$69.99/mo", yr: "or $699/yr founding", save: "You save $30/mo, $360/yr, 30%.", dep: "$99", get: ["Everything in MAX", "The 21-book library", "Training by job title"] }
};
var dlg = $("#co"), lastBtn = null;
if (dlg) {
  var open = function () { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); };
  var close = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); };
  var fill = function (list) { var g = clear($("#coGet")); list.forEach(function (x) { g.appendChild(h("li", {}, [x])); }); $("#coStatus").textContent = ""; };
  $$(".js-reserve").forEach(function (b) {
    b.addEventListener("click", function () {
      var T = TIERS[b.getAttribute("data-tier")]; lastBtn = b; fill(T.get);
      $("#co-h").textContent = "Reserve " + T.n;
      var pr = clear($("#coPrice"));
      pr.appendChild(document.createTextNode("Launch price " + T.list + " · founding ")); pr.appendChild(h("b", {}, [T.found]));
      pr.appendChild(document.createTextNode(", locked while you stay subscribed. ")); pr.appendChild(document.createTextNode(T.yr + "."));
      $("#coSave").textContent = T.save;
      $("#coPay").textContent = "Reserve for " + T.dep;
      $("#coRefund").textContent = "Refundable on request before launch only. This " + T.dep + " deposit reserves the founding price; it is not a subscription payment. All-in: no tax or fees added.";
      $("#coInsider").textContent = "Insiders get first access to new features, products and prices, sneak peeks by email, and notes from the build room.";
      open();
    });
  });
  $$(".js-buy").forEach(function (b) {
    b.addEventListener("click", function () {
      lastBtn = b; fill(["A 100-page PDF", "The audio version", "Delivered right away"]);
      $("#co-h").textContent = "Buy the AI-Era Defense Playbook";
      var pr = clear($("#coPrice")); pr.appendChild(h("b", {}, ["$49"])); pr.appendChild(document.createTextNode(", one-time purchase, all-in."));
      $("#coSave").textContent = "A finished product at its normal price. No discount.";
      $("#coPay").textContent = "Buy for $49";
      $("#coRefund").textContent = "A finished digital product, delivered right away. Read the refund terms before you pay.";
      $("#coInsider").textContent = "";
      open();
    });
  });
  $("#coPay").addEventListener("click", function () { $("#coStatus").textContent = "Preview build: Stripe's hosted checkout (test mode first) connects here. No payment was taken."; });
  $("#coClose").addEventListener("click", close);
  dlg.addEventListener("close", function () { if (lastBtn) lastBtn.focus(); });
}
})();


/* contender C: "plan your first week" sample, by minutes per day */
(function () {
"use strict";
var L = window.LG, $ = L.$, h = L.h, clear = L.clear;
var PACES = {
  5: ["5 minutes", ["Name the one thing you want to grow this season.", "Ask an AI assistant one question about it.", "Write down what surprised you.", "Do the smallest next step.", "Tell one person what you are working on.", "Rest day. Nothing to do. It counts.", "Look back: what felt easy this week?"]],
  15: ["15 minutes", ["Write what growing looks like, in three lines.", "Ask an AI assistant to explain it two ways. Keep the clearer one.", "Draft a tiny plan: three steps, no more.", "Do step one.", "Do step two, or repeat step one.", "Rest day, or a free freeze day if you missed one.", "Look back, then pick next week's focus."]],
  30: ["30 minutes", ["Write what you want from this season, and why.", "Use an AI assistant to map the skills involved.", "Choose one skill and read a short piece on it.", "Practise it for ten minutes, then note what you learned.", "Try it on something real from your week.", "Rest day, or a free freeze day.", "Look back, and set next week's step."]]
};
var fs = $("#paces"), out = $("#weekOut");
Object.keys(PACES).forEach(function (k) {
  var inp = h("input", { type: "radio", name: "pace", value: k, id: "pc" + k });
  inp.addEventListener("change", function () {
    var P = PACES[k]; clear(out);
    out.appendChild(h("div", { class: "wk-top" }, [h("img", { src: "assets/char_purple_globe-standing2.png", alt: "" }), h("div", {}, [h("h3", {}, ["A sample week at " + P[0] + " a day"]), h("p", { class: "small" }, ["A sample from our preview. Your real plan will be tuned to you, and every step is optional."])])]));
    var ol = h("ol", {});
    P[1].forEach(function (s, i) { ol.appendChild(h("li", {}, [h("b", {}, ["Day " + (i + 1)]), h("span", {}, [s])])); });
    out.appendChild(ol);
  });
  fs.appendChild(h("label", { for: "pc" + k }, [inp, h("span", {}, [P0(k)])]));
});
function P0(k) { return PACES[k][0] + " a day"; }
})();

/* winner: the sample "one small step" picker, with an opt-in habit count and a free freeze day */
(function () {
"use strict";
var L = window.LG, $ = L.$, h = L.h, clear = L.clear, store = L.store;
var AREAS = {
  work: ["Work", ["Write down the one thing that would make today a good day, and do it first.", "Ask your AI assistant to turn a messy to-do list into three ordered steps.", "Close one open loop: reply to the message you have been putting off."]],
  learning: ["Learning", ["Read one page on a topic you are curious about, then say it back in your own words.", "Ask an AI tool to explain one idea three ways, and keep the clearest.", "Note one question you want answered this week."]],
  home: ["Home", ["Set a ten-minute timer and tidy one small corner.", "Plan tomorrow's first hour tonight, in two lines.", "Pick one thing to put back where it belongs."]],
  people: ["People", ["Send a two-line message to someone you have been meaning to thank.", "Ask one person a question, then just listen to the answer.", "Put one catch-up on the calendar."]],
  making: ["Making", ["Spend ten minutes on something you make, just for you.", "Ask an AI tool for five odd starting points, and pick the strangest.", "Save one idea in a note, however rough."]]
};
var keys = Object.keys(AREAS), fs = $("#areas"), out = $("#stepOut"), trk = $("#tracker");
var optIn = $("#optStreak"), msg = $("#trkMsg"), done = $("#doneBtn"), clr = $("#clearBtn");
function dkey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function load() { try { return JSON.parse(store.get("lg_w_days") || "{}"); } catch (e) { return {}; } }
function streak(set) {
  var d = new Date(), n = 0, froze = -99, i, prev;
  if (!set[dkey(d)]) d.setDate(d.getDate() - 1);
  for (i = 0; i < 400; i++) {
    if (set[dkey(d)]) n++;
    else {
      prev = new Date(d); prev.setDate(prev.getDate() - 1);
      if (i - froze >= 7 && set[dkey(prev)]) froze = i; else break;
    }
    d.setDate(d.getDate() - 1);
  }
  return n;
}
function render() {
  var on = store.get("lg_w_on") === "1", set = load(), n = streak(set), today = !!set[dkey(new Date())];
  optIn.checked = on; done.hidden = !on; clr.hidden = !on;
  if (!on) { msg.textContent = "Off by default. It stays in your browser; we never see it. Habits are always your choice."; return; }
  done.textContent = today ? "Done for today. Nicely done." : "I did this step today";
  done.disabled = today;
  msg.textContent = (n === 0 ? "Your count starts with your first step." : n + (n === 1 ? " day" : " days") + " so far.") + " You get a free freeze day: one missed day in a week never breaks your count.";
}
keys.forEach(function (k, i) {
  var inp = h("input", { type: "radio", name: "area", value: k, id: "ar-" + k });
  inp.addEventListener("change", function () {
    var A = AREAS[k], day = Math.floor(Date.now() / 86400000), step = A[1][day % A[1].length];
    clear(out);
    out.appendChild(h("div", { class: "wk-top" }, [h("img", { src: "assets/char_purple_globe-standing2.png", alt: "" }), h("div", {}, [h("h3", {}, ["Today's sample step: " + A[0]]), h("p", {}, [step]), h("p", { class: "small" }, ["A sample from our preview. Your own steps will be tuned to you."])])]));
    trk.hidden = false; render();
  });
  fs.appendChild(h("label", { for: "ar-" + k }, [inp, h("span", {}, [AREAS[k][0]])]));
});
optIn.addEventListener("change", function () { store.set("lg_w_on", optIn.checked ? "1" : "0"); render(); });
done.addEventListener("click", function () { var s = load(); s[dkey(new Date())] = 1; store.set("lg_w_days", JSON.stringify(s)); render(); });
clr.addEventListener("click", function () { store.set("lg_w_days", "{}"); store.set("lg_w_on", "0"); render(); });
})();
