/* "Today": picks one timeless entry by day of year, so the page is fresh every day with no updates.
   Entries rotate through a fixed list; textContent only (no innerHTML), so the page runs under require-trusted-types-for 'script'. */
(function () {
"use strict";
var ENTRIES = [["Two lists", "Write one task you did this week that an AI tool could draft, and one that only you should do. Put them side by side."], ["Explain it back", "Ask an AI tool to explain one term you have been nodding along to, in plain words. Then explain it back in your own."], ["Five-minute habit", "Pick one small habit and do it for five minutes. Tick it off. That is the whole step."], ["Your voice", "Re-read something you wrote with an AI tool's help. Change one sentence back into your own voice."], ["Teach one thing", "Tell someone one thing you learned this week, in two sentences."], ["Check one fact", "Check one fact an AI tool gave you against a source you trust."], ["Learn without a screen", "Spend five minutes on a skill with no screen: sketch, stretch, cook, read on paper."], ["Three improvements", "List three things you are getting better at. Next to each, write the evidence."], ["Unsubscribe once", "Unsubscribe from one thing that does not help you grow."], ["Ninety days from now", "Write one line: what do I want to be able to do ninety days from now?"], ["Hardest thing first", "Work on your hardest task for ten minutes before you check any messages."], ["A specific thanks", "Thank someone for something specific they taught you."], ["Walk with one question", "Take a short walk with one question in mind and no screen."], ["Win, lesson, next step", "Review your week: one win, one lesson, one next step."], ["How it works", "Read one short explainer about how a tool you already use actually works."], ["Rest is part of it", "Do nothing productive for ten minutes. Growth needs rest as much as effort."]];
var t = document.getElementById("today-t"), b = document.getElementById("today-b"), n = document.getElementById("today-n"), d = document.getElementById("today-date");
if (!t || !b || !ENTRIES.length) return;
var now = new Date();
var doy = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
var i = doy % ENTRIES.length;
t.textContent = ENTRIES[i][0];
b.textContent = ENTRIES[i][1];
if (n) n.textContent = "Entry " + (i + 1) + " of " + ENTRIES.length + ". A new one every day.";
if (d) { try { d.textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); } catch (e) { /* keep the default label */ } }
})();
