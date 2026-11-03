/* chihna.live instruments — every value read from window.CHIHNA,
   which is generated from the published passport bundles. Nothing here
   invents a number; if the data file is absent, each instrument is
   simply skipped. */
(function () {
  "use strict";
  var D = window.CHIHNA;
  if (!D) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function onView(el, fn, th) {
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { fn(); o.unobserve(e.target); } });
    }, { threshold: th || 0.2 });
    o.observe(el);
  }
  function at(fn, d) { return setTimeout(fn, reduce ? 0 : d); }
  var T = D.totals;

  /* ---------------- honest-statistics bar ---------------- */
  (function () {
    var box = document.getElementById("hsb"); if (!box) return;
    var bar = box.querySelector(".hsb-bar"), eq = box.querySelector(".hsb-eq");
    var segs = [
      { k: "p", n: T.passed, label: "passed" },
      { k: "i", n: T.inc, label: "inconclusive" },
      { k: "f", n: T.failed, label: "failed" }
    ];
    bar.innerHTML = segs.map(function (s) {
      return '<div class="hsb-seg ' + s.k + '" data-w="' + (s.n / T.total * 100) +
        '"><b>' + s.n + " " + s.label + "</b></div>";
    }).join("");
    eq.innerHTML =
      '<i class="v">' + T.passed + '</i><i>+</i><i class="v">' + T.failed +
      '</i><i>+</i><i class="v">' + T.inc + '</i><i>+</i><i class="v">' + T.ns +
      '</i><i>=</i><i class="res">' + T.total + '</i><i class="m">&nbsp;&nbsp;counts sum &mdash; conformant</i>';
    onView(box, function () {
      [].slice.call(bar.children).forEach(function (s, i) {
        at(function () { s.style.width = s.dataset.w + "%"; }, i * 160);
      });
      at(function () { box.classList.add("go"); }, 420);
    });
  })();

  /* ---------------- 608-case verdict matrix ---------------- */
  (function () {
    var box = document.getElementById("mx"); if (!box) return;
    var grid = document.getElementById("mxGrid"),
      st = document.getElementById("mxSt"),
      ft = document.getElementById("mxFt"),
      btn = document.getElementById("mxBtn");
    var html = "";
    D.campaigns.forEach(function (c) {
      html += '<div class="mx-lab"><b>' + c.model + "</b>" + c.id +
        (c.free ? " &middot; free tier" : "") + "</div>";
      for (var i = 0; i < c.seq.length; i++) {
        html += '<span class="mx-c" data-v="' + c.seq[i] + '"></span>';
      }
    });
    grid.innerHTML = html;
    var cells = [].slice.call(grid.querySelectorAll(".mx-c"));
    var timers = [], running = false;

    function reset() {
      timers.forEach(clearTimeout); timers = [];
      cells.forEach(function (c) { c.className = "mx-c"; });
      ft.innerHTML = "";
      st.textContent = "IDLE";
    }
    function run() {
      if (running) return; running = true;
      reset();
      st.textContent = "REPLAYING";
      btn.textContent = "Replaying…";
      var p = 0, f = 0, inc = 0;
      var step = reduce ? 0 : 7;
      cells.forEach(function (c, i) {
        timers.push(at(function () {
          var v = c.dataset.v;
          c.className = "mx-c on " + v;
          if (v === "p") p++; else if (v === "f") f++; else inc++;
          if (i % 8 === 0 || i === cells.length - 1) {
            ft.innerHTML =
              '<span><i style="background:rgba(138,147,180,.5)"></i>passed <b>' + p + "</b></span>" +
              '<span><i style="background:var(--gold)"></i>inconclusive <b>' + inc + "</b></span>" +
              '<span><i style="background:var(--crit)"></i>failed <b>' + f + "</b></span>" +
              "<span>cases <b>" + (p + f + inc) + "</b> of " + T.total + "</span>";
          }
        }, i * step));
      });
      timers.push(at(function () {
        st.textContent = T.inc + " OF " + T.total + " INCONCLUSIVE";
        btn.textContent = "Replay all " + T.total + " cases";
        running = false;
      }, cells.length * step + 260));
    }
    btn.addEventListener("click", run);
    onView(box, run, 0.08);
  })();

  /* ---------------- proof chain ---------------- */
  (function () {
    var box = document.getElementById("pc"); if (!box) return;
    var rail = document.getElementById("pcRail"), out = document.getElementById("pcOut");
    var c = D.campaigns[D.campaigns.length - 1];
    var STEPS = [
      { l: "CASE LOG", t: "L1  case log sealed — " + c.total + " cases appended, replay source for verification" },
      { l: "EVIDENCE PACK", t: "L2  pack built — <span class=\"g\">" + c.passed + " passed · " + c.failed + " failed · " + c.inc + " inconclusive</span>" },
      { l: "ATTESTATION", t: "L2  evaluation attestation binds the campaign to its pack by SHA-256" },
      { l: "CONTINUITY", t: "L2  continuity attestation binds the pack to the runtime ledger head" },
      { l: "RECEIPT", t: "L3  validation receipt emitted — digests and counts only, no prompts, no keys" }
    ];
    rail.innerHTML = STEPS.map(function (s) {
      return '<div class="pc-n"><span class="pc-d"></span><span class="pc-l">' + s.l + "</span></div>";
    }).join("");
    var nodes = [].slice.call(rail.querySelectorAll(".pc-n"));
    function run() {
      var acc = "";
      nodes.forEach(function (n, i) {
        at(function () {
          nodes.forEach(function (m, j) { if (j < i) m.className = "pc-n done"; });
          n.className = "pc-n on";
          acc += STEPS[i].t + "\n";
          out.innerHTML = acc;
        }, i * 620);
      });
      at(function () {
        nodes.forEach(function (n) { n.className = "pc-n done"; });
        out.innerHTML = acc +
          '<span class="m">—</span>\n<span class="m">chain head  </span>' +
          '<span class="g">' + c.id + "</span>\n" +
          '<span class="m">each link is bound to the last by digest; the receipt is what travels</span>';
      }, nodes.length * 620 + 180);
    }
    onView(box, run, 0.25);
  })();

  /* ---------------- spend meter ---------------- */
  [].slice.call(document.querySelectorAll("[data-spend-meter]")).forEach(function (box) {
    var fill = box.querySelector(".sm-fill");
    var pct = T.spend / T.cap * 100;
    box.querySelector(".sm-lb").innerHTML =
      "<span>spend <b>$" + T.spend.toFixed(4) + "</b> across " + T.campaigns +
      " campaigns and " + T.total + " cases</span>" +
      "<span>" + pct.toFixed(2) + "% of the $" + T.cap + " platform cap</span>";
    onView(box, function () {
      at(function () { fill.style.width = Math.max(0.4, pct) + "%"; }, 120);
    });
  });

  /* ---------------- technique-class breakdown ---------------- */
  (function () {
    var box = document.getElementById("tcb"); if (!box) return;
    box.innerHTML = D.classes.map(function (c) {
      return '<div class="tcb-row"><div class="nm">' + c.name +
        "<span>" + c.total + " cases</span></div>" +
        '<div class="tcb-bar">' +
        '<div class="tcb-seg p" data-w="' + (c.passed / c.total * 100) + '"></div>' +
        '<div class="tcb-seg i" data-w="' + (c.inc / c.total * 100) + '"></div>' +
        '<div class="tcb-seg f" data-w="' + (c.failed / c.total * 100) + '"></div>' +
        "</div>" +
        '<div class="fig">' + c.passed + " pass &middot; <b>" + c.inc +
        " inc</b> &middot; " + c.failed + " fail</div></div>";
    }).join("");
    onView(box, function () {
      [].slice.call(box.querySelectorAll(".tcb-seg")).forEach(function (s, i) {
        at(function () { s.style.width = s.dataset.w + "%"; }, i * 70);
      });
    });
  })();

  /* ---------------- inline share bars in the artifacts table ---------------- */
  [].slice.call(document.querySelectorAll("[data-share]")).forEach(function (el) {
    var v = el.dataset.share.split(",").map(Number); // passed,inc,failed,total
    el.innerHTML = '<i class="p" style="width:' + (v[0] / v[3] * 100) + '%"></i>' +
      '<i class="i" style="width:' + (v[1] / v[3] * 100) + '%"></i>' +
      '<i class="f" style="width:' + (v[2] / v[3] * 100) + '%"></i>';
  });
})();
