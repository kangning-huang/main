/**
 * Google Scholar "Cited by" crawler — runs INSIDE a logged-in scholar.google.com tab.
 *
 * Google Scholar has no API and blocks datacenter IPs, so the crawl runs in Ken's own
 * Chrome session. Pages are fetched same-origin (cookies included), parsed with
 * DOMParser, and handed via postMessage to a relay tab on http://127.0.0.1:8765
 * (scripts/scholar-reach/receiver.py), which writes one JSON file per results page
 * to data/scholar-reach/raw/. A relay tab is used because Chrome's local-network
 * permission blocks a direct fetch from scholar.google.com to localhost.
 *
 * Usage (see docs/reach/SCHOLAR-DB.md):
 *   1. python3 scripts/scholar-reach/receiver.py data/scholar-reach/raw
 *   2. Open https://scholar.google.com/citations?user=s_domssAAAAJ&hl=en&pagesize=100
 *   3. Paste this file into DevTools console, then click the red OPEN RELAY button.
 *   4. Run gsStart(). Progress: __st. Pause: __st.stop = true. After a CAPTCHA, solve
 *      it in another Scholar tab, then set __st.resume = true.
 *
 * Throttle: 8–16 s between pages + 45 s every 25 pages. Scholar returns at most
 * 1000 results per query, so papers with >500 citations are sliced by year.
 * Progress is kept in localStorage ("gsCrawl"); re-running skips finished slices.
 */
(() => {
  const RELAY = "http://127.0.0.1:8765";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  window.gsParse = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const captcha =
      !!doc.querySelector('#gs_captcha_ccl, #captcha-form, form[action*="sorry"]') ||
      /unusual traffic|not a robot/i.test(doc.body?.innerText || "");
    const total = doc.querySelector("#gs_ab_md")?.textContent.trim() || "";
    const results = [...doc.querySelectorAll("#gs_res_ccl_mid .gs_r.gs_or.gs_scl")].map((it) => {
      const rt = it.querySelector(".gs_rt");
      const a = rt?.querySelector("a");
      const ga = it.querySelector(".gs_a");
      const fl = [...it.querySelectorAll(".gs_fl a, .gs_flb a")];
      const cb = fl.find((x) => /cites=/.test(x.getAttribute("href") || ""));
      const ver = fl.find((x) => /cluster=/.test(x.getAttribute("href") || ""));
      const ft = [...it.querySelectorAll(".gs_ggs a, .gs_or_ggsm a")].find((x) => /^https?:/.test(x.href));
      return {
        cid: it.getAttribute("data-cid") || "",
        type: [...(rt?.querySelectorAll(".gs_ct1, .gs_ctc, .gs_ctu") || [])].map((x) => x.textContent.trim()).join(" "),
        title: (a?.textContent || rt?.textContent.replace(/^\s*(\[[^\]]+\]\s*)+/, "") || "").trim(),
        url: a?.href || "",
        byline: ga?.textContent.trim() || "",
        authorIds: [...(ga?.querySelectorAll('a[href*="user="]') || [])].map((x) => ({
          name: x.textContent.trim(),
          id: (x.getAttribute("href").match(/user=([^&]+)/) || [])[1],
        })),
        citedBy: cb ? +(cb.textContent.match(/\d+/) || [0])[0] : 0,
        citesId: cb ? (cb.getAttribute("href").match(/cites=([\d,]+)/) || [])[1] : "",
        versions: ver ? +(ver.textContent.match(/\d+/) || [0])[0] : 0,
        clusterId: ver ? (ver.getAttribute("href").match(/cluster=(\d+)/) || [])[1] : "",
        fullText: ft?.href || "",
        fullTextLabel: it.querySelector(".gs_ctg2")?.textContent || "",
        snippet: it.querySelector(".gs_rs")?.textContent.trim() || "",
      };
    });
    return { captcha, total, results };
  };

  // ── Relay plumbing ──
  window.__acks = {};
  window.addEventListener("message", (e) => {
    if (e.origin !== RELAY) return;
    if (e.data.relayReady) window.__relayReady = true;
    if (e.data.ack) window.__acks[e.data.ack] = e.data;
  });
  const b = document.createElement("button");
  b.textContent = "OPEN RELAY";
  b.style.cssText = "position:fixed;top:10px;left:10px;z-index:99999;padding:20px 40px;font-size:24px;background:#c00;color:#fff";
  b.onclick = () => {
    window.__relay = window.open(RELAY + "/relay", "gsrelay");
    b.remove();
  };
  document.body.appendChild(b);

  window.gsPost = (body) =>
    new Promise((res, rej) => {
      const id = "m" + Math.random().toString(36).slice(2);
      window.__relay.postMessage({ id, body }, RELAY);
      const t0 = Date.now();
      const iv = setInterval(() => {
        const a = window.__acks[id];
        if (a) {
          clearInterval(iv);
          delete window.__acks[id];
          a.err ? rej(a.err) : res(a.ok);
        } else if (Date.now() - t0 > 15000) {
          clearInterval(iv);
          rej("relay timeout");
        }
      }, 100);
    });

  // ── Crawl ──
  window.gsStart = async () => {
    const papers = [...document.querySelectorAll("#gsc_a_b .gsc_a_tr")]
      .map((r) => {
        const a = r.querySelector(".gsc_a_c a");
        const t = r.querySelector(".gsc_a_at");
        return {
          title: t?.textContent.trim(),
          citationLink: t?.getAttribute("href"),
          byline: [...r.querySelectorAll(".gs_gray")].map((x) => x.textContent).join(" | "),
          count: +(a?.textContent.trim() || 0),
          citesId: (a?.href || "").match(/cites=([\d,]+)/)?.[1] || "",
          year: +r.querySelector(".gsc_a_y")?.textContent || null,
        };
      })
      .filter((r) => r.count > 0 && r.citesId);
    const jobs = [];
    for (const p of papers) {
      if (p.count > 500) for (let y = Math.max(2000, p.year - 1); y <= new Date().getFullYear(); y++) jobs.push({ p, y });
      else jobs.push({ p, y: null });
    }
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("gsCrawl") || "{}"); } catch {}
    const st = (window.__st = Object.assign({ done: {}, pages: 0, results: 0 }, saved, { status: "running", stop: false }));
    const save = () => {
      try { localStorage.setItem("gsCrawl", JSON.stringify({ done: st.done, pages: st.pages, results: st.results })); } catch {}
    };
    await gsPost({ kind: "papers", name: "_papers", papers, scrapedAt: new Date().toISOString(), profile: "s_domssAAAAJ" });

    for (const job of jobs) {
      const key = job.p.citesId.split(",")[0] + "_" + (job.y ?? "all");
      if (st.done[key]) continue;
      for (let start = st.done[key + "_next"] || 0; start < 1000; start += 20) {
        if (st.stop) { st.status = "stopped"; return; }
        const name = key + "_s" + String(start).padStart(4, "0");
        const url =
          `https://scholar.google.com/scholar?hl=en&num=20&cites=${job.p.citesId}&scipsc=&start=${start}` +
          (job.y ? `&as_ylo=${job.y}&as_yhi=${job.y}` : "");
        let p, status;
        for (;;) {
          try {
            const r = await fetch(url, { credentials: "include" });
            status = r.status;
            p = gsParse(await r.text());
            if (/sorry|captcha/i.test(r.url)) p.captcha = true;
          } catch (e) {
            status = "ERR " + e;
            p = { captcha: true, results: [] };
          }
          if (!p.captcha && status === 200) break;
          st.status = "paused-captcha";
          await gsPost({ kind: "PAUSED", name: "_status", msg: `captcha/blocked status=${status} at ${name}`, url }).catch(() => {});
          while (!st.resume) await sleep(5000);
          st.resume = false;
          st.status = "running";
          await gsPost({ kind: "RESUMED", name: "_status", msg: name }).catch(() => {});
        }
        await gsPost({
          kind: "page", name, url,
          paper: { title: job.p.title, citesId: job.p.citesId, year: job.p.year, count: job.p.count },
          sliceYear: job.y, start, fetchedAt: new Date().toISOString(), total: p.total, results: p.results,
        });
        st.pages++;
        st.results += p.results.length;
        st.done[key + "_next"] = start + 20;
        save();
        await sleep(8000 + Math.random() * 8000 + (st.pages % 25 === 0 ? 45000 : 0));
        if (p.results.length < 20) break;
      }
      st.done[key] = true;
      save();
    }
    st.status = "finished";
    await gsPost({ kind: "FINISHED", name: "_status", msg: `pages=${st.pages} results=${st.results}` });
  };
})();
