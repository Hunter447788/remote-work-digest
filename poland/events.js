/* Publisher-owned UI and anonymous click events. No query strings or form values are sent. */
(() => {
  "use strict";
  const script = document.currentScript;
  if (!script) return;
  const counter = script.dataset.counter || "";
  const base = new URL("./", script.src);
  const siteBase = new URL("../", base);
  const newsletter = script.dataset.newsletter || "";
  const kit = script.dataset.kit || "";
  const clean = url => { const u = new URL(url, location.href); return u.origin + u.pathname.replace(/\/$/, ""); };
  let excluded = navigator.doNotTrack === "1" || navigator.webdriver === true;
  try {
    if (new URLSearchParams(location.search).get("rwd_no_track") === "1") localStorage.setItem("rwd-no-track", "1");
    excluded ||= localStorage.getItem("rwd-no-track") === "1";
  } catch (_) { /* storage can be unavailable */ }
  const source = () => {
    const value = new URLSearchParams(location.search).get("utm_source") || "";
    if (/^(rss|email|newsletter)$/i.test(value)) return value.toLowerCase() === "rss" ? "rss" : "email";
    let host = "";
    try { host = new URL(document.referrer).hostname; } catch (_) { return "direct"; }
    if (/(^|\.)(google\.[a-z.]+|bing.com|duckduckgo.com)$/.test(host)) return "search";
    if (/(^|\.)(linkedin.com|reddit.com|facebook.com|x.com|twitter.com)$/.test(host)) return "social";
    return host === location.hostname ? "internal" : "other";
  };
  const count = event => {
    if (excluded || !/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(counter)) return;
    const url = counter + "?" + new URLSearchParams({ p: "rwd19-" + event, e: "1", r: source(), rnd: String(Date.now()) });
    try { void fetch(url, { mode: "no-cors", credentials: "omit", keepalive: true, referrerPolicy: "no-referrer" }).catch(() => {}); } catch (_) { /* navigation always works */ }
  };
  document.addEventListener("click", event => {
    const a = event.target.closest && event.target.closest("a[href]");
    if (!a) return;
    try {
      const destination = new URL(a.href);
      if (kit && clean(destination.href) === clean(kit)) count("kit-click");
      else if (newsletter && clean(destination.href) === clean(newsletter)) count("email-signup-open");
      else if (clean(destination.href) === clean(new URL("feed.xml", base).href)) count("rss-open");
      else if (destination.origin === "https://remoteok.com" && destination.pathname.startsWith("/remote-jobs/")) count("apply-click");
      else if (destination.origin === "https://remotive.com" && destination.pathname.startsWith("/remote-jobs/")) count("apply-click");
    } catch (_) { /* malformed links do not affect the page */ }
  }, true);
  const cards = [...document.querySelectorAll("[data-rwd-job]")];
  if (!cards.length) return;
  const search = document.querySelector("[data-rwd-search]");
  const buttons = [...document.querySelectorAll("[data-rwd-filter]")];
  const output = document.querySelector("[data-rwd-results]");
  let filter = "useful";
  const update = () => {
    const q = (search ? search.value : "").trim().toLocaleLowerCase("pl");
    let shown = 0;
    cards.forEach(card => {
      const status = card.dataset.rwdJob;
      const matches = filter === "all" || (filter === "useful" ? status !== "excluded" : status === filter);
      card.hidden = !(matches && card.textContent.toLocaleLowerCase("pl").includes(q));
      if (!card.hidden) shown++;
    });
    if (output) output.textContent = "Widoczne oferty: " + shown;
    buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.rwdFilter === filter)));
  };
  buttons.forEach(button => button.addEventListener("click", () => { filter = button.dataset.rwdFilter; update(); }));
  if (search) search.addEventListener("input", update);
  document.querySelectorAll("[data-rwd-enhance]").forEach(element => element.hidden = false);
  update();
})();
