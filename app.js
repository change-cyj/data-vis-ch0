/* ============================================================
 *  第 6 章 · 页面布局 — 交互逻辑
 *  盒模型 / 定位 / Flex / Grid / 响应式
 * ============================================================ */
(function () {
  "use strict";

  const C = {
    primary: "#2b6659",
    primary2: "#3d8a78",
    accent: "#d4a45f",
    bg: "#0e1514",
    card: "#16201e",
    card2: "#1c2826",
    border: "#283330",
    text: "#e0ddd5",
    text2: "#9a958c",
    text3: "#6b6660",
    ok: "#6bbf6b",
    bad: "#e06b6b",
    ink2: "#cfcbc0",
    mono: "'JetBrains Mono', monospace",
  };

  // ============ 全局：进度条 + 导航 ============
  function initScrollNav() {
    const fill = document.getElementById("progressFill");
    const topbar = document.getElementById("topbar");
    const dots = document.querySelectorAll(".side-dots a");
    const navLinks = document.querySelectorAll(".nav-links a");
    const sections = document.querySelectorAll("[data-sec]");

    function update() {
      const sc = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? sc / max : 0;
      fill.style.width = (ratio * 100) + "%";
      topbar.classList.toggle("scrolled", sc > 60);

      let cur = "hero";
      sections.forEach((s) => {
        const top = s.getBoundingClientRect().top;
        if (top < 200) cur = s.dataset.sec;
      });
      dots.forEach((d) => d.classList.toggle("active", d.dataset.sec === cur));
      navLinks.forEach((n) => n.classList.toggle("active", n.dataset.sec === cur));
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    // 数字动画
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count);
      let cur = 0;
      const step = Math.max(1, Math.ceil(target / 30));
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(t); }
        el.textContent = cur;
      }, 30);
    });

    // Hero 标题 data-html
    document.querySelectorAll("[data-html]").forEach((el) => {
      el.innerHTML = el.dataset.html;
    });

    // Reveal 动画
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
  }

  // ============ 6.1 盒模型演示 ============
  function initBoxModel() {
    const viz = document.getElementById("bmViz");
    const readout = document.getElementById("bmReadout");
    const pSlider = document.getElementById("bmPadding");
    const bSlider = document.getElementById("bmBorder");
    const mSlider = document.getElementById("bmMargin");
    const pVal = document.getElementById("bmPaddingVal");
    const bVal = document.getElementById("bmBorderVal");
    const mVal = document.getElementById("bmMarginVal");
    const boxSizing = document.getElementById("bmBoxSizing");

    function update() {
      const p = parseInt(pSlider.value);
      const b = parseInt(bSlider.value);
      const m = parseInt(mSlider.value);
      const isBB = boxSizing.checked;
      pVal.textContent = p + "px";
      bVal.textContent = b + "px";
      mVal.textContent = m + "px";

      viz.innerHTML = `
        <div class="bm-margin" style="padding:${m}px;background:rgba(208,145,80,0.12);border:1px dashed rgba(208,145,80,0.5);border-radius:8px;">
          <div style="text-align:center;font-size:10px;color:rgba(208,145,80,0.8);font-family:${C.mono};margin-bottom:4px;">margin: ${m}px</div>
          <div class="bm-border" style="padding:0;border:${b}px solid ${C.primary2};border-radius:6px;">
            <div class="bm-padding" style="padding:${p}px;background:rgba(43,102,89,0.15);border:1px dashed rgba(61,138,120,0.5);border-radius:4px;">
              <div style="text-align:center;font-size:10px;color:rgba(61,138,120,0.8);font-family:${C.mono};margin-bottom:4px;">padding: ${p}px</div>
              <div class="bm-content" style="background:${C.primary};color:#fff;padding:16px;text-align:center;border-radius:4px;min-height:60px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;">
                <span style="font-size:13px;font-weight:600;">content</span>
                <span style="font-size:11px;font-family:${C.mono};opacity:0.8;">200px × 100px</span>
              </div>
            </div>
          </div>
        </div>`;

      const outerW = 200 + (isBB ? 0 : (p + b) * 2) + m * 2;
      const outerH = 100 + (isBB ? 0 : (p + b) * 2) + m * 2;
      const contentW = isBB ? (200 - (p + b) * 2) : 200;
      readout.innerHTML = `
        <div class="bm-readout-line"><code>box-sizing</code>: <b>${isBB ? "border-box" : "content-box"}</b></div>
        <div class="bm-readout-line"><code>content</code>: ${contentW} × ${100 - (isBB ? (p + b) * 2 : 0)}px</div>
        <div class="bm-readout-line"><code>padding+border</code>: ${(p + b) * 2}px (双倍: ${(p + b) * 2 * 2}px)</div>
        <div class="bm-readout-line"><code>margin</code>: ${m * 2}px (双倍: ${m * 2 * 2}px)</div>
        <div class="bm-readout-line" style="color:${C.accent}"><code>元素总占位</code>: ${outerW} × ${outerH}px</div>`;
    }

    [pSlider, bSlider, mSlider, boxSizing].forEach((el) => el.addEventListener("input", update));
    update();
  }

  // ============ 6.2 定位演示 ============
  function initPosition() {
    const target = document.getElementById("posTarget");
    const playground = document.getElementById("posPlayground");
    const track = document.getElementById("posTrack");
    const readout = document.getElementById("posReadout");
    const btns = document.querySelectorAll(".pos-btn");

    const descs = {
      static: { css: "position: static", desc: "默认值。按文档流排列，top/left/right/bottom 无效，z-index 无效。", color: C.text2 },
      relative: { css: "position: relative; top: 30px; left: 40px;", desc: "相对原位置偏移，但不脱离文档流。原位置仍保留，周围元素不移动。", color: C.ok },
      absolute: { css: "position: absolute; top: 10px; right: 10px;", desc: "脱离文档流。相对最近的定位祖先（此处为容器）定位。周围元素填补其位置。", color: C.accent },
      fixed: { css: "position: fixed; bottom: 10px; right: 10px;", desc: "脱离文档流。相对浏览器视口定位。页面滚动时位置不变。", color: C.bad },
      sticky: { css: "position: sticky; top: 0;", desc: "到达阈值前为 relative，超过后变为 fixed。需要先滚动才能看到效果。", color: C.primary2 },
    };

    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        btns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const pos = btn.dataset.pos;
        target.className = "pos-box pos-blue";
        target.style.cssText = "";

        if (pos === "static") {
          target.style.position = "static";
        } else if (pos === "relative") {
          target.style.position = "relative";
          target.style.top = "30px";
          target.style.left = "40px";
        } else if (pos === "absolute") {
          target.style.position = "absolute";
          target.style.top = "10px";
          target.style.right = "10px";
        } else if (pos === "fixed") {
          target.style.position = "fixed";
          target.style.bottom = "10px";
          target.style.right = "10px";
          target.style.zIndex = "500";
        } else if (pos === "sticky") {
          target.style.position = "sticky";
          target.style.top = "0";
          target.style.zIndex = "100";
        }

        const d = descs[pos];
        readout.innerHTML = `<div class="pos-readout-code" style="color:${d.color}">${d.css}</div><div class="pos-readout-desc">${d.desc}</div>`;
      });
    });

    // 初始
    btns[0].click();
  }

  // ============ 6.3 Flex 演示 ============
  function initFlex() {
    const playground = document.getElementById("fxPlayground");
    const dirSel = document.getElementById("fxDirection");
    const justifySel = document.getElementById("fxJustify");
    const alignSel = document.getElementById("fxAlign");
    const gapSlider = document.getElementById("fxGap");
    const gapVal = document.getElementById("fxGapVal");
    const countSlider = document.getElementById("fxCount");
    const countVal = document.getElementById("fxCountVal");
    const growCheck = document.getElementById("fxGrow");

    function update() {
      const dir = dirSel.value;
      const justify = justifySel.value;
      const align = alignSel.value;
      const gap = gapSlider.value;
      const count = parseInt(countSlider.value);
      const grow = growCheck.checked ? "1" : "0";

      gapVal.textContent = gap + "px";
      countVal.textContent = count;

      const colors = [C.primary, C.primary2, C.accent, "#7a5fa3", "#5f8aa3", "#a37a5f", "#5fa37a", "#a35f7a"];
      let items = "";
      for (let i = 0; i < count; i++) {
        const h = dir.startsWith("column") ? (40 + (i % 3) * 20) : "auto";
        const w = dir.startsWith("row") ? (60 + (i % 3) * 30) : "auto";
        items += `<div class="fx-item" style="background:${colors[i % colors.length]};height:${h}px;min-height:30px;width:${w};min-width:30px;flex-grow:${grow};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;border-radius:6px;font-size:13px;">${i + 1}</div>`;
      }

      playground.innerHTML = `<div class="fx-container" style="display:flex;flex-direction:${dir};justify-content:${justify};align-items:${align};gap:${gap}px;height:200px;background:${C.card2};border:1px solid ${C.border};border-radius:8px;padding:12px;overflow:auto;">${items}</div>`;
    }

    [dirSel, justifySel, alignSel, gapSlider, countSlider, growCheck].forEach((el) => el.addEventListener("input", update));
    update();
  }

  // ============ 6.4 Grid 演示 ============
  function initGrid() {
    const playground = document.getElementById("gdPlayground");
    const readout = document.getElementById("gdReadout");
    const colsSlider = document.getElementById("gdCols");
    const colsVal = document.getElementById("gdColsVal");
    const rowsSlider = document.getElementById("gdRows");
    const rowsVal = document.getElementById("gdRowsVal");
    const gapSlider = document.getElementById("gdGap");
    const gapVal = document.getElementById("gdGapVal");
    const unitSel = document.getElementById("gdUnit");
    const tplBtns = document.querySelectorAll(".gd-tpl");

    const templates = {
      custom: null,
      app: {
        areas: `"header header" "sidebar main" "footer footer"`,
        cols: "200px 1fr",
        rows: "60px 1fr 50px",
        items: [
          { name: "header", area: "header", color: C.primary, label: "Header" },
          { name: "sidebar", area: "sidebar", color: C.primary2, label: "Sidebar" },
          { name: "main", area: "main", color: C.card2, label: "Main" },
          { name: "footer", area: "footer", color: C.accent, label: "Footer" },
        ],
      },
      gallery: {
        cols: "repeat(4, 1fr)",
        rows: "repeat(2, 100px)",
        gap: "8px",
        items: Array.from({ length: 8 }, (_, i) => ({
          color: ["#2b6659", "#3d8a78", "#d4a45f", "#7a5fa3", "#5f8aa3", "#a37a5f", "#5fa37a", "#a35f7a"][i],
          label: `Img ${i + 1}`,
        })),
      },
      blog: {
        areas: `"nav nav" "side content" "side footer"`,
        cols: "160px 1fr",
        rows: "50px 1fr 40px",
        items: [
          { area: "nav", color: C.primary, label: "Nav" },
          { area: "side", color: C.primary2, label: "Sidebar" },
          { area: "content", color: C.card2, label: "Content" },
          { area: "footer", color: C.accent, label: "Footer" },
        ],
      },
    };

    let activeTpl = "custom";

    function applyTemplate(name) {
      const tpl = templates[name];
      if (!tpl) { updateCustom(); return; }

      let items = "";
      if (tpl.areas) {
        tpl.items.forEach((it) => {
          items += `<div style="grid-area:${it.area};background:${it.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;border-radius:6px;font-size:13px;">${it.label}</div>`;
        });
        playground.innerHTML = `<div style="display:grid;grid-template-areas:${tpl.areas};grid-template-columns:${tpl.cols};grid-template-rows:${tpl.rows};gap:8px;height:320px;background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:8px;">${items}</div>`;
      } else {
        const gap = tpl.gap || "12px";
        tpl.items.forEach((it) => {
          items += `<div style="background:${it.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;border-radius:6px;font-size:13px;">${it.label}</div>`;
        });
        playground.innerHTML = `<div style="display:grid;grid-template-columns:${tpl.cols};grid-template-rows:${tpl.rows};gap:${gap};height:280px;background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:8px;">${items}</div>`;
      }
      readout.innerHTML = `<code style="color:${C.accent}">${name === "app" ? "grid-template-areas" : "grid-template-columns"}: ${tpl.areas || tpl.cols}</code>`;
    }

    function updateCustom() {
      const cols = colsSlider.value;
      const rows = rowsSlider.value;
      const gap = gapSlider.value;
      const unit = unitSel.value;
      colsVal.textContent = cols;
      rowsVal.textContent = rows;
      gapVal.textContent = gap + "px";

      const colStr = `repeat(${cols}, ${unit})`;
      const rowStr = `repeat(${rows}, auto)`;
      const colors = [C.primary, C.primary2, C.accent, "#7a5fa3", "#5f8aa3", "#a37a5f", "#5fa37a", "#a35f7a", "#7a7a5f", "#5fa3a3", "#a35f5f", "#5f5fa3"];

      const total = cols * rows;
      let items = "";
      for (let i = 0; i < total; i++) {
        items += `<div style="background:${colors[i % colors.length]};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;border-radius:6px;font-size:13px;min-height:40px;">${i + 1}</div>`;
      }

      playground.innerHTML = `<div style="display:grid;grid-template-columns:${colStr};grid-template-rows:${rowStr};gap:${gap}px;min-height:200px;background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:8px;">${items}</div>`;
      readout.innerHTML = `<code style="color:${C.accent}">grid-template-columns: ${colStr}; gap: ${gap}px</code>`;
    }

    tplBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tplBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeTpl = btn.dataset.tpl;
        if (activeTpl === "custom") updateCustom();
        else applyTemplate(activeTpl);
      });
    });

    [colsSlider, rowsSlider, gapSlider, unitSel].forEach((el) => {
      el.addEventListener("input", () => {
        if (activeTpl === "custom") updateCustom();
      });
    });

    updateCustom();
  }

  // ============ 6.5 响应式演示 ============
  function initResponsive() {
    const preview = document.getElementById("rsPreview");
    const page = document.getElementById("rsPage");
    const label = document.getElementById("rsDeviceLabel");
    const btns = document.querySelectorAll(".rs-btn");

    const deviceNames = {
      "375": "iPhone SE · 375px",
      "768": "iPad · 768px",
      "1024": "iPad Pro · 1024px",
      "1440": "Desktop · 1440px",
    };

    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        btns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const w = parseInt(btn.dataset.w);
        preview.style.width = w + "px";
        label.textContent = deviceNames[btn.dataset.w] || `${w}px`;

        // 根据宽度调整内部布局
        if (w <= 375) {
          page.style.gridTemplateAreas = `"header" "main" "sidebar" "footer"`;
          page.style.gridTemplateColumns = "1fr";
          page.style.gridTemplateRows = "50px 1fr auto 40px";
          page.style.fontSize = "11px";
        } else if (w <= 768) {
          page.style.gridTemplateAreas = `"header" "main" "sidebar" "footer"`;
          page.style.gridTemplateColumns = "1fr";
          page.style.gridTemplateRows = "50px 1fr auto 40px";
          page.style.fontSize = "12px";
        } else if (w <= 1024) {
          page.style.gridTemplateAreas = `"header header" "sidebar main" "footer footer"`;
          page.style.gridTemplateColumns = "180px 1fr";
          page.style.gridTemplateRows = "50px 1fr 40px";
          page.style.fontSize = "13px";
        } else {
          page.style.gridTemplateAreas = `"header header" "sidebar main" "footer footer"`;
          page.style.gridTemplateColumns = "220px 1fr";
          page.style.gridTemplateRows = "60px 1fr 45px";
          page.style.fontSize = "14px";
        }

        // 卡片列数
        const main = page.querySelector(".rs-main");
        if (main) {
          const cards = main.querySelectorAll(".rs-card");
          if (w <= 375) {
            main.style.gridTemplateColumns = "1fr";
          } else if (w <= 768) {
            main.style.gridTemplateColumns = "repeat(2, 1fr)";
          } else {
            main.style.gridTemplateColumns = "repeat(3, 1fr)";
          }
        }
      });
    });

    // 默认选中 Desktop
    btns[3].click();
  }

  // ============ 知识闯关 ============
  function initQuiz() {
    const QUIZ = [
      {
        q: "相邻两个块级元素的 margin-top 和 margin-bottom 发生合并时，实际间距取值为？",
        opts: ["两者之和", "较大值", "较小值", "平均值"],
        a: 1,
        exp: "margin 合并规则：相邻兄弟元素的上下 margin 取较大值（非相加）。这是 CSS 规范行为，创建 BFC（如 display: flow-root）可消除合并。",
      },
      {
        q: "一个 absolute 定位的元素，其包含块是？",
        opts: ["浏览器视口", "最近的非 static 定位祖先", "body 元素", "html 根元素"],
        a: 1,
        exp: "absolute 的包含块是最近的 position 非 static 祖先。如果所有祖先都是 static，则回退到初始包含块（视口大小的矩形）。fixed 的包含块是视口，除非祖先有 transform/filter。",
      },
      {
        q: "Flex 子项内容过大导致溢出容器，最常见的修复方案是？",
        opts: ["给子项设 overflow: scroll", "给子项设 min-width: 0", "给容器设 overflow: hidden", "给子项设 width: 100%"],
        a: 1,
        exp: "Flex 子项默认 min-width: auto，不允许收缩到内容以下。设 min-width: 0 解除限制后，flex-shrink 才能生效。这是 Flex 布局中最常见的溢出 bug 根源。",
      },
      {
        q: "repeat(auto-fit, minmax(200px, 1fr)) 实现了什么效果？",
        opts: ["固定 3 列等宽布局", "根据容器宽度自动决定列数，无需媒体查询", "创建 200px 固定列", "无限列自动填充"],
        a: 1,
        exp: "auto-fit 让网格根据容器可用空间自动决定列数：容器够宽就多列，不够宽就少列，每列最小 200px、最大等分。这是 Grid 独有的无媒体查询响应式方案。",
      },
      {
        q: "容器查询 @container 与媒体查询 @media 的根本区别是？",
        opts: ["语法不同但效果相同", "@container 响应元素自身容器宽度，@media 响应浏览器视口宽度", "@container 只支持 min-width", "@media 性能更好"],
        a: 1,
        exp: "@media 根据视口宽度适配，组件在不同位置表现一致；@container 根据组件父容器宽度适配，同一组件在侧栏和主区可呈现不同布局。2023 年全浏览器支持，是响应式设计的范式转变。",
      },
    ];

    let idx = 0, score = 0, answered = false;
    const body = document.getElementById("quizBody");
    const progress = document.getElementById("quizProgress");
    const scoreEl = document.getElementById("quizScore");
    const nextBtn = document.getElementById("quizNext");
    const restartBtn = document.getElementById("quizRestart");

    function render() {
      const q = QUIZ[idx];
      answered = false;
      progress.textContent = `第 ${idx + 1} / ${QUIZ.length} 题`;
      nextBtn.style.display = "none";

      body.innerHTML = `
        <h3 class="quiz-q">${q.q}</h3>
        <div class="quiz-opts">
          ${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")}
        </div>
        <div class="quiz-exp" id="quizExp" style="display:none"></div>`;

      body.querySelectorAll(".quiz-opt").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (answered) return;
          answered = true;
          const i = parseInt(btn.dataset.i);
          const ok = i === q.a;
          if (ok) score++;
          scoreEl.textContent = score;

          body.querySelectorAll(".quiz-opt").forEach((b, j) => {
            b.classList.add(j === q.a ? "correct" : (j === i ? "wrong" : "dim"));
            b.style.pointerEvents = "none";
          });

          const exp = document.getElementById("quizExp");
          exp.style.display = "block";
          exp.innerHTML = `<div class="quiz-exp-icon">${ok ? "✅" : "❌"}</div><div class="quiz-exp-text">${q.exp}</div>`;

          if (idx < QUIZ.length - 1) {
            nextBtn.style.display = "inline-block";
          } else {
            restartBtn.style.display = "inline-block";
            progress.textContent = `完成！得分 ${score} / ${QUIZ.length}`;
          }
        });
      });
    }

    nextBtn.addEventListener("click", () => { idx++; render(); });
    restartBtn.addEventListener("click", () => { idx = 0; score = 0; scoreEl.textContent = 0; restartBtn.style.display = "none"; render(); });
    render();
  }

  // ============ 启动 ============
  document.addEventListener("DOMContentLoaded", () => {
    initScrollNav();
    initBoxModel();
    initPosition();
    initFlex();
    initGrid();
    initResponsive();
    initQuiz();
  });
})();
