/* ============================================================
   第 1 章 数据 · 主逻辑
   - 滚动进度条 / 导航高亮 / reveal 动画
   - 1.1 CSV 加载 + 表格 + 三张图
   - 1.2 DIKW 金字塔交互
   - 1.3 Stevens 卡片 + Mackinlay 通道排序
   - 1.4 数据变换函数交互演示
   - 1.5 Data-Join 三态演示
   ============================================================ */
(function () {
  "use strict";

  // 配色：与 CSS 浅色暖调一致（深墨绿 + 琥珀金）
  const C = {
    bg: "#fffdf8", bg2: "#ebe6d8", bg3: "#e3ddca",
    ink: "#1a1a16", ink2: "#5a5852", ink3: "#8a887e", ink4: "#b0aea2",
    primary: "#0f2419", primary2: "#1a3a2e", primary3: "#2d5a45",
    accent: "#d4a04c", accent2: "#b8842f", accentSoft: "#e8c891",
    ok: "#2e7d52", warn: "#c77d3c", bad: "#b5483a",
    line: "#d9d2c0",
    serif: '"Fraunces", "Noto Serif SC", "SimSun", serif',
    mono: '"JetBrains Mono", "Cascadia Code", "Consolas", monospace',
  };

  /* ===========================================================
     0. 滚动进度条 + 导航高亮 + reveal 动画
     =========================================================== */
  const progressFill = document.getElementById("progressFill");
  const navLinks = document.querySelectorAll("#navLinks a");
  const sideDots = document.querySelectorAll("#sideDots a");
  const sections = document.querySelectorAll("[data-sec]");

  function onScroll() {
    const sc = document.documentElement.scrollTop || document.body.scrollTop;
    const max = (document.documentElement.scrollHeight - window.innerHeight);
    progressFill.style.width = (max > 0 ? (sc / max * 100) : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // IntersectionObserver：导航高亮 + reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && e.target.dataset.sec) {
        const id = e.target.dataset.sec;
        navLinks.forEach((a) => a.classList.toggle("active", a.dataset.sec === id));
        sideDots.forEach((a) => a.classList.toggle("active", a.dataset.sec === id));
      }
      if (e.isIntersecting && e.target.classList.contains("reveal")) {
        e.target.classList.add("visible");
      }
    });
  }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
  sections.forEach((s) => io.observe(s));
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // 平滑滚动锚点
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      const t = document.getElementById(id);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  });

  /* ===========================================================
     1.1 数据加载与类型转换
     =========================================================== */
  // ⭐ 关键点 ① 字段映射
  const COLUMN_MAP = { "序号":"id","姓名":"name","性别":"gender","生日":"birthday","年龄":"age","班级":"class" };
  // ⭐ 关键点 ② 类型转换
  function transformRow(d) {
    return {
      id: +d["序号"], name: d["姓名"].trim(), gender: d["性别"].trim(),
      birthday: d["生日"].trim(), birthdayDate: new Date(d["生日"].trim()),
      age: +d["年龄"], class: d["班级"].trim(),
    };
  }

  let studentData = null;

  async function loadData() {
    const sl = document.getElementById("status-line");
    const st = sl.querySelector(".status-text");
    const btn = document.getElementById("btn-reload");
    sl.className = "status-line loading";
    st.textContent = "⏳ 加载 newstudent.csv...";
    btn.disabled = true;
    try {
      // ⭐ 关键点 ③ 一行完成加载+转换
      const data = await d3.csv("newstudent.csv", transformRow);
      studentData = data;
      sl.className = "status-line ok";
      st.textContent = "✓ 共 " + data.length + " 条";
      renderVerify(data);
      renderTable(data);
      renderBarChart(data);
      renderPieChart(data);
      renderHistogram(data);
    } catch (err) {
      sl.className = "status-line";
      st.textContent = "✗ 加载失败：" + err.message;
    } finally { btn.disabled = false; }
  }
  document.getElementById("btn-reload").addEventListener("click", loadData);

  function renderVerify(d) {
    const box = document.getElementById("verify-box");
    box.style.display = "block";
    document.getElementById("verify-content").innerHTML =
      '<div><code>typeof data[0].age</code> → <b style="color:var(--ok)">' + typeof d[0].age + "</b></div>" +
      '<div><code>data[0].birthdayDate instanceof Date</code> → <b style="color:var(--ok)">' + (d[0].birthdayDate instanceof Date) + "</b></div>" +
      '<div><code>data[0].age + 1</code> → <b style="color:var(--ok)">' + (d[0].age + 1) + "</b>（Number 可计算）</div>";
  }

  function renderTable(d) {
    document.getElementById("table-count").textContent = "共 " + d.length + " 条";
    const tbody = document.querySelector("#data-table tbody");
    tbody.innerHTML = d.slice(0, 10).map((r) =>
      "<tr><td>" + r.id + "</td><td>" + r.name + "</td><td>" + r.gender +
      "</td><td>" + r.birthday + "</td><td>" + r.age + "</td><td>" + r.class + "</td></tr>"
    ).join("");
  }

  // 图例工具
  function legend(sel, items) {
    const lg = sel.append("div").style("display","flex").style("flex-wrap","wrap").style("gap","14px")
      .style("margin-top","10px").style("font-size","12px").style("color", C.ink2).style("font-family", C.mono);
    items.forEach((it) => {
      const r = lg.append("div").style("display","flex").style("align-items","center").style("gap","6px");
      r.append("span").style("width","10px").style("height","10px").style("border-radius","3px").style("background", it.c);
      r.append("span").text(it.t);
    });
  }

  // 班级柱状图
  function renderBarChart(data) {
    const el = d3.select("#chart-bar"); el.selectAll("*").remove();
    const rolled = d3.rollups(data, v => v.length, d => d.class)
      .map(([k,v]) => ({class:k, count:v})).sort((a,b)=>d3.ascending(a.class,b.class));
    const m = {t:14,r:20,b:44,l:46}, w = Math.min(el.node().clientWidth,720)-m.l-m.r, h=290-m.t-m.b;
    const svg = el.append("svg").attr("viewBox",`0 0 ${w+m.l+m.r} ${h+m.t+m.b}`).append("g").attr("transform",`translate(${m.l},${m.t})`);
    const x = d3.scaleBand().domain(rolled.map(d=>d.class)).range([0,w]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(rolled,d=>d.count)*1.15]).range([h,0]).nice();
    svg.append("g").attr("class","viz-axis").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8));
    svg.append("g").attr("class","viz-axis").call(d3.axisLeft(y).ticks(5).tickSize(-w)).call(g=>g.select(".domain").remove())
      .selectAll("line").style("stroke-dasharray","2 3");
    svg.selectAll(".bar").data(rolled).join("rect")
      .attr("x",d=>x(d.class)).attr("y",h).attr("width",x.bandwidth()).attr("height",0).attr("rx",4)
      .attr("fill", C.primary).transition().duration(700).delay((_,i)=>i*80)
      .attr("y",d=>y(d.count)).attr("height",d=>h-y(d.count));
    svg.selectAll(".lbl").data(rolled).join("text").attr("text-anchor","middle")
      .attr("x",d=>x(d.class)+x.bandwidth()/2).attr("y",d=>y(d.count)-6).style("opacity",0).style("fill",C.ink).style("font-size","12px").style("font-family",C.mono)
      .text(d=>d.count).transition().delay((_,i)=>i*80+400).duration(400).style("opacity",1);
    legend(el, [{c:C.primary, t:"学生人数"}]);
  }

  // 性别环形图
  function renderPieChart(data) {
    const el = d3.select("#chart-pie"); el.selectAll("*").remove();
    const rolled = d3.rollups(data, v=>v.length, d=>d.gender).map(([k,v])=>({gender:k,count:v}));
    const cMap = {"男":C.primary,"女":C.accent};
    const w = Math.min(el.node().clientWidth,360), h=290, r = Math.min(w,h)/2-12;
    const svg = el.append("svg").attr("viewBox",`0 0 ${w} ${h}`).append("g").attr("transform",`translate(${w/2},${h/2})`);
    const pie = d3.pie().value(d=>d.count).sort(null);
    const arc = d3.arc().innerRadius(r*0.55).outerRadius(r).padAngle(0.03);
    const la = d3.arc().innerRadius(r*0.72).outerRadius(r*0.72);
    const arcs = svg.selectAll(".arc").data(pie(rolled)).join("path").attr("class","arc")
      .attr("fill",d=>cMap[d.data.gender]||C.accent).attr("d",arc).each(function(d){this._c=d;});
    arcs.transition().duration(700).attrTween("d",function(){
      const i = d3.interpolate({startAngle:0,endAngle:0}, this._c);
      return t => arc(i(t));
    });
    svg.append("text").attr("text-anchor","middle").attr("dy","-0.1em").style("font-size","28px").style("font-family",C.serif).style("fill",C.ink).text(d3.sum(rolled,d=>d.count));
    svg.append("text").attr("text-anchor","middle").attr("dy","1.4em").style("font-size","11px").style("fill",C.ink3).style("font-family",C.mono).text("总人数");
    svg.selectAll(".pl").data(pie(rolled)).join("text").attr("text-anchor","middle").attr("transform",d=>`translate(${la.centroid(d)})`)
      .style("fill","#fffdf8").style("font-size","12px").style("font-weight","600").text(d=>d.data.gender+" "+d.data.count);
    legend(el, rolled.map(d=>({c:cMap[d.gender], t:`${d.gender}：${d.count}人（${(d.count/d3.sum(rolled,x=>x.count)*100).toFixed(1)}%）`})));
  }

  // 年龄直方图
  function renderHistogram(data) {
    const el = d3.select("#chart-hist"); el.selectAll("*").remove();
    const ages = data.map(d=>d.age);
    const bins = d3.bin().domain([16,19]).thresholds([16.5,17,17.5,18,18.5])(ages);
    const m = {t:14,r:16,b:40,l:42}, w = Math.min(el.node().clientWidth,360)-m.l-m.r, h=290-m.t-m.b;
    const svg = el.append("svg").attr("viewBox",`0 0 ${w+m.l+m.r} ${h+m.t+m.b}`).append("g").attr("transform",`translate(${m.l},${m.t})`);
    const x = d3.scaleLinear().domain([16.5,19]).range([0,w]);
    const y = d3.scaleLinear().domain([0, d3.max(bins,d=>d.length)*1.2]).range([h,0]).nice();
    svg.append("g").attr("class","viz-axis").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".1f")).tickSize(0).tickPadding(8));
    svg.append("g").attr("class","viz-axis").call(d3.axisLeft(y).ticks(4).tickSize(-w)).call(g=>g.select(".domain").remove()).selectAll("line").style("stroke-dasharray","2 3");
    svg.selectAll(".bar").data(bins).join("rect")
      .attr("x",d=>x(d.x0)).attr("y",h).attr("width",d=>Math.max(0,x(d.x1)-x(d.x0)-2)).attr("height",0).attr("rx",3).attr("fill",C.accent2)
      .transition().duration(700).delay((_,i)=>i*90).attr("y",d=>y(d.length)).attr("height",d=>h-y(d.length));
    svg.selectAll(".hl").data(bins).join("text").attr("text-anchor","middle")
      .attr("x",d=>x(d.x0)+(x(d.x1)-x(d.x0))/2).attr("y",d=>y(d.length)-6).style("opacity",0).style("fill",C.ink).style("font-size","12px").style("font-family",C.mono)
      .text(d=>d.length>0?d.length:"").transition().delay((_,i)=>i*90+400).duration(400).style("opacity",1);
    legend(el, [{c:C.accent2, t:"年龄区间人数"}]);
  }

  /* ===========================================================
     1.2 DIKW 金字塔交互
     =========================================================== */
  const DIKW = [
    { tier:"wisdom", name:"智慧", en:"Wisdom", color:C.accent2,
      def:"运用知识做出明智判断和战略决策",
      q:"为什么 / 应该怎么做",
      eg:"根据生源数据制定招生策略",
      viz:"难以可视化（需决策模型）" },
    { tier:"knowledge", name:"知识", en:"Knowledge", color:C.bad,
      def:"对信息的进一步提炼和理解",
      q:"如何",
      eg:"新生年龄分布规律、性别比例趋势",
      viz:"少数场景可达（需统计辅助）" },
    { tier:"information", name:"信息", en:"Information", color:C.primary3,
      def:"经过处理、组织、赋予上下文的数据",
      q:"谁 / 什么 / 何时 / 何地",
      eg:"软件1班有20人，平均年龄18岁",
      viz:"✅ 可视化的主要目标" },
    { tier:"data", name:"数据", en:"Data", color:C.primary,
      def:"原始、离散的观察结果",
      q:"—",
      eg:"序号1,张明,男,2007-08-15,18,软件1班",
      viz:"原始 CSV / 表格" },
  ];

  function renderDIKW() {
    const el = document.getElementById("dikwViz");
    const W = 320, H = 240, cx = W/2;
    const top = 16, bot = 144;
    const layerH = (bot-top)/4;
    const svg = d3.select(el).append("svg").attr("viewBox",`0 0 ${W} ${H+24}`);

    DIKW.forEach((d, i) => {
      const yT = top + i*layerH, yB = top + (i+1)*layerH - 3;
      // 梯形宽度递增（顶→底）—— 加宽以保证文字完整覆盖
      const ratio = (i+1)/4;
      const tw = 70 + ratio*48, bw = 70 + (ratio+0.25)*48;
      const g = svg.append("g").attr("class","dikw-layer").attr("data-tier", d.tier)
        .style("cursor","pointer");
      g.append("path")
        .attr("d", `M ${cx-tw/2} ${yT} L ${cx+tw/2} ${yT} L ${cx+bw/2} ${yB} L ${cx-bw/2} ${yB} Z`)
        .attr("fill", d.color).attr("stroke", C.bg).attr("stroke-width", 2)
        .style("filter", "brightness(1)");
      g.append("text").attr("x", cx).attr("y", (yT+yB)/2 + 4).attr("text-anchor","middle")
        .style("fill","#fffdf8").style("font-size","13px").style("font-family",C.serif).style("font-weight","600")
        .style("pointer-events","none").text(d.name + " · " + d.en);

      g.on("mouseover", function() { d3.select(this).select("path").style("filter","brightness(1.12)"); })
        .on("mouseout", function() { d3.select(this).select("path").style("filter","brightness(1)"); })
        .on("click", () => showDIKWDetail(d));
    });

    // 标注
    svg.append("text").attr("x", cx).attr("y", H+18).attr("text-anchor","middle")
      .style("fill", C.ink3).style("font-size","11px").style("font-family",C.mono).text("DIKW 金字塔 · 点击任意层");
  }

  function showDIKWDetail(d) {
    document.getElementById("dikwDetail").innerHTML =
      '<div class="dikw-detail-inner" style="border-left:3px solid ' + d.color + '; padding-left:14px">' +
      '<div class="layer-tag" style="color:' + d.color + '">' + d.en.toUpperCase() + '</div>' +
      '<h4 style="color:' + d.color + '">' + d.name + '</h4>' +
      '<dl>' +
      '<dt style="color:' + d.color + '">定义</dt><dd>' + d.def + '</dd>' +
      '<dt style="color:' + d.color + '">回答的问题</dt><dd>' + d.q + '</dd>' +
      '<dt style="color:' + d.color + '">新生数据示例</dt><dd>' + d.eg + '</dd>' +
      '<dt style="color:' + d.color + '">可视化的位置</dt><dd>' + d.viz + '</dd>' +
      '</dl></div>';
  }
  renderDIKW();

  /* ===========================================================
     1.3 Stevens 卡片点击 + Mackinlay 通道排序
     =========================================================== */
  const STEVENS = {
    nominal: { ops:"等价 / 不等价", eg:"姓名、性别", note:"只能判断相等与否。性别用色相（定性通道）编码。" },
    ordinal: { ops:"> < 比较", eg:"等级、班级序号", note:"有顺序，无间距。用亮度/密度（顺序通道）编码。" },
    interval: { ops:"+ 加减", eg:"温度（°C）、年份", note:"有间距，无真零点。0°C ≠ 没有温度。" },
    ratio: { ops:"+ 加减乘除", eg:"年龄、价格、人数", note:"有真零点。0 岁 = 没有年龄。用长度/位置（定量通道）编码。" },
  };
  document.querySelectorAll(".stevens-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".stevens-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      const tier = card.dataset.tier;
      const d = STEVENS[tier];
      document.getElementById("stevensNote").innerHTML =
        '<p class="muted"><b>允许运算</b>：' + d.ops + ' &nbsp;·&nbsp; <b>典型示例</b>：' + d.eg + '</p>' +
        '<p class="muted" style="margin-top:8px">' + d.note + '</p>';
    });
  });

  // Mackinlay 通道排序可视化
  function renderMackinlay() {
    const el = document.getElementById("mackinlayViz");
    el.innerHTML = "";
    const tiers = [
      { name:"定量型", color:C.primary, channels:[
        {ch:"位置", score:1.0}, {ch:"长度", score:0.94}, {ch:"角度", score:0.88}, {ch:"面积", score:0.7}
      ]},
      { name:"顺序型", color:C.accent2, channels:[
        {ch:"亮度", score:0.82}, {ch:"密度", score:0.72}, {ch:"饱和度", score:0.6}, {ch:"面积", score:0.55}
      ]},
      { name:"定性型", color:C.ink2, channels:[
        {ch:"色相", score:0.85}, {ch:"形状", score:0.6}, {ch:"纹理", score:0.45}, {ch:"运动", score:0.4}
      ]},
    ];
    const m = {t:20,r:30,b:50,l:120}, W = Math.min(el.clientWidth||720, 760), w=W-m.l-m.r;
    const allCh = tiers.flatMap(t=>t.channels.map(c=>({...c, tier:t.name, color:t.color})));
    const chCount = allCh.length;
    const h = chCount*30, H = h+m.t+m.b;
    const svg = d3.select(el).append("svg").attr("viewBox",`0 0 ${W} ${H}`);
    const g = svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
    const y = d3.scaleBand().domain(allCh.map(d=>d.ch)).range([0,h]).padding(0.15);
    const x = d3.scaleLinear().domain([0,1]).range([0,w]);

    // 分档背景 + 标签
    let acc = 0;
    tiers.forEach((t) => {
      const n = t.channels.length;
      const yT = acc*30, yB = (acc+n)*30;
      g.append("rect").attr("x",-110).attr("y",yT-2).attr("width",106).attr("height",yB-yT+4)
        .attr("rx",6).attr("fill",t.color).attr("opacity",0.12);
      g.append("text").attr("x",-57).attr("y",(yT+yB)/2+4).attr("text-anchor","middle")
        .style("fill",t.color).style("font-size","13px").style("font-family",C.mono).style("font-weight","600").text(t.name);
      acc += n;
    });

    // 轴
    g.append("g").attr("class","viz-axis").attr("transform",`translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")).tickSize(0).tickPadding(8));
    g.selectAll(".ch-tick").data(allCh).join("text")
      .attr("x",-10).attr("y",d=>y(d.ch)+y.bandwidth()/2+4).attr("text-anchor","end")
      .style("fill",C.ink2).style("font-size","12px").text(d=>d.ch);

    // 条
    g.selectAll(".mk-bar").data(allCh).join("rect").attr("class","mk-bar")
      .attr("x",0).attr("y",d=>y(d.ch)).attr("width",0).attr("height",y.bandwidth()).attr("rx",4)
      .attr("fill",d=>d.color).attr("opacity",0.85)
      .transition().duration(800).delay((_,i)=>i*60).attr("width",d=>x(d.score));

    g.selectAll(".mk-val").data(allCh).join("text")
      .attr("x",d=>x(d.score)+6).attr("y",d=>y(d.ch)+y.bandwidth()/2+4)
      .style("fill",C.ink2).style("font-size","11px").style("font-family",C.mono).style("opacity",0)
      .text(d=>(d.score*100).toFixed(0)+"%").transition().delay((_,i)=>i*60+600).duration(400).style("opacity",1);

    g.append("text").attr("x",w/2).attr("y",h+38).attr("text-anchor","middle")
      .style("fill",C.ink3).style("font-size","11px").style("font-family",C.mono).text("通道有效性（Mackinlay 1986）");
  }
  renderMackinlay();

  /* ===========================================================
     1.4 数据变换函数交互演示
     =========================================================== */
  // 示例数据（用新生数据前 8 条简化版）
  const SAMPLE = [
    {id:1, name:"张明", gender:"男", age:18, class:"软件1班"},
    {id:2, name:"李华", gender:"女", age:17, class:"软件1班"},
    {id:3, name:"王芳", gender:"女", age:18, class:"软件1班"},
    {id:4, name:"刘强", gender:"男", age:18, class:"软件1班"},
    {id:5, name:"陈静", gender:"女", age:17, class:"软件1班"},
    {id:6, name:"杨帆", gender:"男", age:18, class:"软件2班"},
    {id:7, name:"赵丽", gender:"女", age:18, class:"软件2班"},
    {id:8, name:"黄磊", gender:"男", age:17, class:"软件2班"},
  ];

  const FNS = {
    map: {
      code: '<span class="c">// map：提取每个学生的姓名</span>\n<span class="k">const</span> out = d3.<span class="k">map</span>(data, d => d.name);\n<span class="c">// → ["张明","李华","王芳",...]</span>',
      run: (d) => d3.map(d, x => x.name),
    },
    filter: {
      code: '<span class="c">// filter：筛选男生</span>\n<span class="k">const</span> out = d3.<span class="k">filter</span>(data, d => d.gender === <span class="s">"男"</span>);\n<span class="c">// → 4 条记录</span>',
      run: (d) => d3.filter(d, x => x.gender === "男"),
    },
    sort: {
      code: '<span class="c">// sort：按年龄升序</span>\n<span class="k">const</span> out = d3.<span class="k">sort</span>(data.slice(), (a,b) => a.age - b.age);\n<span class="c">// → 17 岁在前</span>',
      run: (d) => d3.sort([...d], (a,b) => a.age - b.age),
    },
    reduce: {
      code: '<span class="c">// reduce：计算总年龄</span>\n<span class="k">const</span> out = d3.<span class="k">reduce</span>(data, (s,d) => s + d.age, 0);\n<span class="c">// → 一个数字</span>',
      run: (d) => d3.reduce(d, (s,x) => s + x.age, 0),
    },
    group: {
      code: '<span class="c">// group：按班级分组（保留所有元素）</span>\n<span class="k">const</span> out = d3.<span class="k">group</span>(data, d => d.class);\n<span class="c">// → Map { "软件1班" => [...], "软件2班" => [...] }</span>',
      run: (d) => Array.from(d3.group(d, x => x.class)),
    },
    rollup: {
      code: '<span class="c">// rollup：按班级统计人数</span>\n<span class="k">const</span> out = d3.<span class="k">rollup</span>(data, v => v.length, d => d.class);\n<span class="c">// → Map { "软件1班" => 5, "软件2班" => 3 }</span>',
      run: (d) => Array.from(d3.rollup(d, v => v.length, x => x.class)),
    },
    cross: {
      code: '<span class="c">// cross：性别 × 班级 笛卡尔积</span>\n<span class="k">const</span> genders = [<span class="s">"男"</span>,<span class="s">"女"</span>];\n<span class="k">const</span> classes = [<span class="s">"软件1班"</span>,<span class="s">"软件2班"</span>];\n<span class="k">const</span> out = d3.<span class="k">cross</span>(genders, classes);\n<span class="c">// → 4 个组合</span>',
      run: () => d3.cross(["男","女"], ["软件1班","软件2班"]),
    },
    bin: {
      code: '<span class="c">// bin：年龄分箱</span>\n<span class="k">const</span> ages = data.map(d => d.age);\n<span class="k">const</span> out = d3.<span class="k">bin</span>().thresholds([17,18])(ages);\n<span class="c">// → 分箱结果</span>',
      run: (d) => d3.bin().thresholds([17,18])(d.map(x => x.age)).map(b => ({x0:b.x0, x1:b.x1, n:b.length})),
    },
  };

  function fmt(v) {
    if (v == null) return "null";
    if (typeof v === "number") return String(v);
    if (Array.isArray(v)) {
      return "[" + v.slice(0, 10).map(x => {
        if (x && typeof x === "object") {
          if (x[0] !== undefined && x[1] !== undefined && x.length === 2) {
            return "[" + JSON.stringify(x[0]) + ", " + JSON.stringify(x[1]) + "]";
          }
          return JSON.stringify(x);
        }
        return JSON.stringify(x);
      }).join(", ") + (v.length > 10 ? ", ..." : "") + "]";
    }
    return JSON.stringify(v);
  }

  function runTransform(name) {
    const fn = FNS[name];
    document.getElementById("ioInput").textContent = JSON.stringify(SAMPLE, null, 0).slice(0, 600) + (JSON.stringify(SAMPLE).length > 600 ? "..." : "");
    const out = fn.run(SAMPLE);
    document.getElementById("ioOutput").innerHTML = "<pre style=\"margin:0;white-space:pre-wrap\">" + fmt(out) + "</pre>";
    document.getElementById("transformCode").innerHTML = fn.code;
  }

  document.querySelectorAll(".fn-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".fn-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      runTransform(btn.dataset.fn);
    });
  });
  runTransform("map");

  /* ===========================================================
     1.5 Data-Join 三态演示
     =========================================================== */
  let joinData = [
    {id:1, v:30}, {id:2, v:55}, {id:3, v:80}, {id:4, v:45}, {id:5, v:70},
  ];
  let nextId = 6;
  let useKey = true;

  const joinSvgW = 680, joinSvgH = 200;
  const joinSvg = d3.select("#joinViz").append("svg").attr("viewBox", `0 0 ${joinSvgW} ${joinSvgH}`);
  const jg = joinSvg.append("g");

  function renderJoin(prevData) {
    const sel = jg.selectAll("g.item").data(joinData, useKey ? d => d.id : null);
    // 在 append/remove 前先计算三态数量
    const enterC = sel.enter().size();
    const exitC = sel.exit().size();
    const updateC = Math.max(0, joinData.length - enterC);
    const t = d3.transition().duration(500);

    // enter：新增元素（绿色，从缩小淡入）
    const enterG = sel.enter().append("g").attr("class","item")
      .attr("transform", (d,i) => `translate(${i*120+20}, 100) scale(0.3)`)
      .style("opacity", 0);
    enterG.append("circle").attr("r", 32).attr("fill", C.ok);
    enterG.append("text").attr("text-anchor","middle").attr("dy",5)
      .style("fill","#fffdf8").style("font-size","18px").style("font-weight","600").text(d=>"#"+d.id);

    // update + enter 合并：重新定位，update 用墨绿，enter 保持绿色
    sel.merge(enterG).transition(t)
      .attr("transform", (d,i) => `translate(${i*120+20}, 100)`)
      .style("opacity", 1);
    sel.merge(enterG).select("circle")
      .transition(t).attr("fill", (d) => {
        // prevData 中已存在 → update（墨绿）；否则 → enter（绿色）
        return (prevData && prevData.some(p => p.id === d.id)) ? C.primary3 : C.ok;
      });
    sel.merge(enterG).select("text").text(d=>"#"+d.id);

    // exit：多余元素（红色淡出后移除）
    sel.exit().each(function() { d3.select(this).select("circle").attr("fill", C.bad); })
      .transition(t).style("opacity", 0)
      .attr("transform", (d,i) => `translate(${i*120+20}, 100) scale(0.3)`).remove();

    // 计数标注
    jg.selectAll(".counter").remove();
    jg.append("text").attr("class","counter").attr("x", 20).attr("y", 30)
      .style("fill",C.ink3).style("font-size","12px").style("font-family",C.mono)
      .text(`enter: ${enterC}  ·  update: ${updateC}  ·  exit: ${exitC}  ·  共 ${joinData.length} 个  ·  key: ${useKey?"ON":"OFF"}`);
  }

  document.getElementById("joinAdd").addEventListener("click", () => {
    const prev = [...joinData];
    joinData.push({id: nextId++, v: Math.round(20+Math.random()*70)});
    renderJoin(prev);
  });
  document.getElementById("joinRemove").addEventListener("click", () => {
    const prev = [...joinData];
    if (joinData.length > 1) joinData.pop();
    renderJoin(prev);
  });
  document.getElementById("joinShuffle").addEventListener("click", () => {
    const prev = [...joinData];
    joinData = d3.shuffle([...joinData]);
    renderJoin(prev);
  });
  document.getElementById("joinReset").addEventListener("click", () => {
    joinData = [{id:1,v:30},{id:2,v:55},{id:3,v:80},{id:4,v:45},{id:5,v:70}];
    nextId = 6;
    renderJoin(null);
  });
  document.getElementById("keyToggle").addEventListener("change", (e) => {
    useKey = e.target.checked;
    renderJoin(null);
  });
  renderJoin(null);

  /* ===========================================================
     ★ 创新点①：Hero 数据流粒子动画（canvas）
     —— 飘落的 0/1 数据流 + 数据点
     =========================================================== */
  (function dataStreamCanvas() {
    const canvas = document.getElementById("dataCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, cols, drops, particles, raf;
    const CHARS = "01";

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fontSize = 14;
      cols = Math.floor(W / fontSize);
      drops = Array.from({ length: cols }, () => ({
        y: Math.random() * -H,
        speed: 0.5 + Math.random() * 1.5,
        ch: CHARS[Math.floor(Math.random() * CHARS.length)],
      }));
      particles = Array.from({ length: 18 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 2 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // 数据流字符
      ctx.font = "14px 'JetBrains Mono', monospace";
      drops.forEach((d, i) => {
        const x = i * 14 + 2;
        ctx.fillStyle = "rgba(15, 36, 25, 0.16)";
        ctx.fillText(d.ch, x, d.y);
        // 头部字符更亮
        ctx.fillStyle = "rgba(212, 160, 76, 0.45)";
        ctx.fillText(d.ch, x, d.y);
        d.y += d.speed * 1.2;
        if (d.y > H) {
          d.y = -14;
          d.ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        if (Math.random() < 0.02) d.ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      });
      // 数据点
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(45, 90, 69, 0.18)";
        ctx.fill();
        ctx.strokeStyle = "rgba(212, 160, 76, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    let cr;
    window.addEventListener("resize", () => {
      clearTimeout(cr);
      cr = setTimeout(resize, 200);
    });
    // 页面不可见时暂停
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); } else { draw(); }
    });
  })();

  /* ===========================================================
     ★ 创新点③：数字滚动动画（scroll count-up）
     =========================================================== */
  (function countUp() {
    const nums = document.querySelectorAll(".stat-num[data-count]");
    let done = false;
    function animate() {
      if (done) return;
      const hero = document.getElementById("heroStats");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        done = true;
        nums.forEach((el) => {
          const target = +el.dataset.count;
          const dur = 1200, start = performance.now();
          function step(now) {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased);
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = target;
          }
          requestAnimationFrame(step);
        });
      }
    }
    window.addEventListener("scroll", animate, { passive: true });
    setTimeout(animate, 600);
  })();

  /* ===========================================================
     ★ 创新点②：可视化通道实验台
     —— 同一数据，切换长度/色相/面积/角度 4 种通道编码
     =========================================================== */
  // 示例数据：4 个班级的人数（有差异，便于比较通道效果）
  const LAB_DATA = [
    { label: "软件1班", value: 24 },
    { label: "软件2班", value: 20 },
    { label: "软件3班", value: 18 },
    { label: "软件4班", value: 18 },
  ];

  // 各通道的 Mackinlay 排名与点评
  const LAB_META = {
    length: { rank: "★★★★★ 第 1", desc: "<b>长度通道</b>是定量数据最强的通道。人眼对长度差异的感知最精准，能立即判断谁多谁少。", rating: "最佳" },
    color:  { rank: "★★☆☆☆ 第 8", desc: "<b>色相</b>是定性通道，编码定量数据会丢失大小信息——只能区分「不同」，无法判断「多少」。", rating: "错配" },
    area:   { rank: "★★★☆☆ 第 4", desc: "<b>面积</b>可编码定量，但人眼对面积的感知弱于长度（Stevens 幂定律指数 < 1），会低估差异。", rating: "一般" },
    angle:  { rank: "★★★★☆ 第 3", desc: "<b>角度</b>在饼图中常用，感知略弱于长度但可接受。超过 5 类时角度难以比较。", rating: "尚可" },
  };

  function renderLab(channel) {
    const el = document.getElementById("labViz");
    el.innerHTML = "";
    const W = Math.min(el.clientWidth || 680, 700);
    const H = 260, m = { t: 16, r: 20, b: 40, l: 40 };
    const w = W - m.l - m.r, h = H - m.t - m.b;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const maxV = d3.max(LAB_DATA, d => d.value);
    const palette = [C.primary, C.primary3, C.accent2, C.ink2];

    if (channel === "length") {
      const x = d3.scaleBand().domain(LAB_DATA.map(d => d.label)).range([0, w]).padding(0.4);
      const y = d3.scaleLinear().domain([0, maxV * 1.15]).range([h, 0]).nice();
      g.append("g").attr("class","viz-axis").attr("transform",`translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(8));
      g.append("g").attr("class","viz-axis").call(d3.axisLeft(y).ticks(4).tickSize(-w)).call(gg=>gg.select(".domain").remove()).selectAll("line").style("stroke-dasharray","2 3");
      g.selectAll(".lb").data(LAB_DATA).join("rect").attr("class","lb")
        .attr("x", d => x(d.label)).attr("y", h).attr("width", x.bandwidth()).attr("height", 0).attr("rx", 4).attr("fill", C.primary)
        .transition().duration(600).attr("y", d => y(d.value)).attr("height", d => h - y(d.value));
    } else if (channel === "color") {
      const x = d3.scaleBand().domain(LAB_DATA.map(d => d.label)).range([0, w]).padding(0.15);
      g.selectAll(".ls").data(LAB_DATA).join("rect").attr("class","ls")
        .attr("x", d => x(d.label)).attr("y", 0).attr("width", x.bandwidth()).attr("height", h)
        .attr("fill", (d, i) => palette[i]).attr("opacity", 0).attr("rx", 4)
        .transition().duration(600).attr("opacity", 0.8);
      g.selectAll(".lt").data(LAB_DATA).join("text").attr("text-anchor","middle")
        .attr("x", d => x(d.label) + x.bandwidth()/2).attr("y", h/2 + 5)
        .style("fill", "#fffdf8").style("font-size", "13px").style("font-family", C.mono)
        .text(d => d.label + " " + d.value).style("opacity", 0).transition().delay(300).duration(400).style("opacity", 1);
    } else if (channel === "area") {
      const baseR = 12;
      const x = d3.scaleBand().domain(LAB_DATA.map(d => d.label)).range([0, w]).padding(0.2);
      const r = d3.scaleSqrt().domain([0, maxV]).range([baseR * 0.4, baseR * 2.2]);
      g.append("line").attr("x1", 0).attr("x2", w).attr("y1", h - 4).attr("y2", h - 4).attr("stroke", C.line);
      g.selectAll(".lc").data(LAB_DATA).join("circle").attr("class","lc")
        .attr("cx", d => x(d.label) + x.bandwidth()/2).attr("cy", h - 4)
        .attr("r", 0).attr("fill", C.accent2).attr("opacity", 0.75)
        .transition().duration(600).attr("r", d => r(d.value));
      g.selectAll(".lct").data(LAB_DATA).join("text").attr("text-anchor","middle")
        .attr("x", d => x(d.label) + x.bandwidth()/2).attr("y", d => h - r(d.value) - 14)
        .style("fill", C.ink).style("font-size", "12px").style("font-family", C.mono)
        .text(d => d.value).style("opacity", 0).transition().delay(400).duration(400).style("opacity", 1);
      g.selectAll(".llb").data(LAB_DATA).join("text").attr("text-anchor","middle")
        .attr("x", d => x(d.label) + x.bandwidth()/2).attr("y", h + 18)
        .style("fill", C.ink2).style("font-size", "11px").text(d => d.label);
    } else if (channel === "angle") {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 16;
      const pie = d3.pie().value(d => d.value).sort(null);
      const arc = d3.arc().innerRadius(R * 0.45).outerRadius(R).padAngle(0.03);
      const arcs = g.selectAll(".la").data(pie(LAB_DATA)).join("g").attr("class","la").attr("transform", `translate(${cx},${cy})`);
      arcs.append("path").attr("fill", (d, i) => palette[i])
        .transition().duration(600).attrTween("d", function(d) {
          const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
          return t => arc(i(t));
        });
      const la = d3.arc().innerRadius(R * 0.65).outerRadius(R * 0.65);
      arcs.append("text").attr("text-anchor","middle").attr("transform", d => `translate(${la.centroid(d)})`)
        .style("fill", "#fffdf8").style("font-size", "12px").style("font-weight", "600")
        .text(d => d.data.label.replace("软件", "") + " " + d.data.value).style("opacity", 0).transition().delay(500).duration(400).style("opacity", 1);
    }

    const meta = LAB_META[channel];
    document.getElementById("labReadout").innerHTML =
      '<span class="rank">' + meta.rank + '</span> &nbsp;·&nbsp; <b>' + meta.rating + '</b><br>' + meta.desc;
  }

  document.querySelectorAll(".lab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".lab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderLab(btn.dataset.channel);
    });
  });
  renderLab("length");

  /* ===========================================================
     ★ 创新点④：知识闯关测验
     =========================================================== */
  const QUIZ = [
    {
      q: "CSV 加载后，所有字段的默认类型是？",
      options: ["Number", "String", "Date", "Boolean"],
      answer: 1,
      explain: "CSV 是纯文本格式，d3.csv 解析后<b>所有字段都是 String</b>。必须在 row 回调里用 <code>+d['年龄']</code> 转 Number，<code>new Date(d['生日'])</code> 转 Date。",
    },
    {
      q: "按 Mackinlay 通道排序，编码定量数据最有效的通道是？",
      options: ["色相", "形状", "位置/长度", "纹理"],
      answer: 2,
      explain: "<b>位置/长度</b>是定量数据最强通道（Mackinlay 1986）。色相适合定性数据，形状和纹理效果更弱。",
    },
    {
      q: "Stevens 测量尺度中，'温度（°C）'属于哪一类？",
      options: ["名义 Nominal", "序数 Ordinal", "区间 Interval", "比率 Ratio"],
      answer: 2,
      explain: "温度有间距可加减（20°C 比 10°C 高 10°），但<b>没有真零点</b>（0°C ≠ 没有温度），所以是<b>区间尺度</b>，不是比率。",
    },
    {
      q: "d3.group 和 d3.rollup 的核心区别是？",
      options: ["group 更快", "rollup 只保留聚合值", "group 只能分一组", "没有区别"],
      answer: 1,
      explain: "<code>group</code> 保留每个 key 下的所有元素；<code>rollup</code> 对每组应用 reducer 只保留聚合结果（如计数、求和）。类比 SQL 的 GROUP BY + 聚合函数。",
    },
    {
      q: "Data-Join 中，key 函数（如 d => d.id）的作用是？",
      options: ["加速渲染", "绑定元素身份，避免重排错乱", "排序数据", "过滤无效数据"],
      answer: 1,
      explain: "key 函数<b>绑定元素与数据的身份</b>。无 key 时按 index 绑定，数据重排会导致所有元素都换位置；带 key 后重排只是属性变化，过渡自然。<b>类比 React 的 key</b>。",
    },
  ];

  let quizIdx = 0, quizScore = 0, quizAnswered = false;

  function renderQuiz() {
    const body = document.getElementById("quizBody");
    const nextBtn = document.getElementById("quizNext");
    const restartBtn = document.getElementById("quizRestart");
    nextBtn.style.display = "none";
    restartBtn.style.display = "none";

    if (quizIdx >= QUIZ.length) {
      const pass = quizScore >= 4;
      body.innerHTML = '<div class="quiz-result">' +
        '<div class="big">' + quizScore + ' / ' + QUIZ.length + '</div>' +
        '<div class="msg ' + (pass ? "pass" : "fail") + '">' +
        (pass ? "🎉 通关！你已掌握本章核心要点。" : "💪 还差一点，建议回顾标注的关键点后重试。") + '</div></div>';
      restartBtn.style.display = "inline-block";
      return;
    }

    quizAnswered = false;
    const item = QUIZ[quizIdx];
    document.getElementById("quizProgress").textContent = `第 ${quizIdx + 1} / ${QUIZ.length} 题`;
    document.getElementById("quizScore").textContent = quizScore;

    const keys = ["A", "B", "C", "D"];
    body.innerHTML =
      '<div class="quiz-q">' + item.q + '</div>' +
      '<div class="quiz-options">' + item.options.map((opt, i) =>
        '<button class="quiz-opt" data-i="' + i + '"><span class="opt-key">' + keys[i] + '</span><span>' + opt + '</span></button>'
      ).join("") + '</div>' +
      '<div class="quiz-explain" id="quizExplain"></div>';

    body.querySelectorAll(".quiz-opt").forEach((b) => {
      b.addEventListener("click", () => {
        if (quizAnswered) return;
        quizAnswered = true;
        const choice = +b.dataset.i;
        const correct = choice === item.answer;
        body.querySelectorAll(".quiz-opt").forEach((bb, i) => {
          bb.classList.add("locked");
          if (i === item.answer) bb.classList.add("correct");
          else if (i === choice && !correct) bb.classList.add("wrong");
        });
        if (correct) { quizScore++; document.getElementById("quizScore").textContent = quizScore; }
        const ex = document.getElementById("quizExplain");
        ex.innerHTML = (correct ? '<b>✓ 正确</b> ' : '<b>✗ 错误</b> 正确答案是 ' + keys[item.answer] + '。') + item.explain;
        ex.classList.add("show");
        nextBtn.style.display = "inline-block";
        nextBtn.disabled = false;
        if (quizIdx === QUIZ.length - 1) nextBtn.textContent = "查看结果 →";
      });
    });
  }

  document.getElementById("quizNext").addEventListener("click", () => {
    quizIdx++;
    renderQuiz();
  });
  document.getElementById("quizRestart").addEventListener("click", () => {
    quizIdx = 0; quizScore = 0; quizAnswered = false;
    document.getElementById("quizNext").textContent = "下一题 →";
    renderQuiz();
  });
  renderQuiz();

  /* ===========================================================
     响应式重绘
     =========================================================== */
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (studentData) { renderBarChart(studentData); renderPieChart(studentData); renderHistogram(studentData); }
      renderMackinlay();
      const activeLab = document.querySelector(".lab-btn.active");
      if (activeLab) renderLab(activeLab.dataset.channel);
    }, 250);
  });

})();
