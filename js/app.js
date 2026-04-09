/**
 * 球迷人格测试 — 主逻辑（按维度分页版）
 */

(function () {

  // ── 维度分页 ──
  var PAGES = [
    { key: "EI", label: "社交属性：外向 vs 内向", questions: [0,1,2,3,4,5] },
    { key: "SN", label: "认知方式：数据实感 vs 直觉灵感", questions: [6,7,8,9,10] },
    { key: "TF", label: "决策风格：理性思考 vs 情感驱动", questions: [11,12,13,14,15,16] },
    { key: "JP", label: "生活方式：计划控 vs 随性派", questions: [17,18,19,20,21] },
    { key: "cross", label: "综合判断", questions: [22,23] }
  ];

  var TOTAL_QUESTIONS = QUESTIONS.length;  // 24

  var currentPage = 0;
  var selections = {};  // { questionIndex: selectedValue 或 selectedValues }

  // ── DOM ──
  var pageStart   = document.getElementById('page-start');
  var pageQuiz    = document.getElementById('page-quiz');
  var pageResult  = document.getElementById('page-result');
  var dimLabel    = document.getElementById('quiz-dim-label');
  var pageNum     = document.getElementById('quiz-page-num');
  var progressFill = document.getElementById('progress-fill');
  var container   = document.getElementById('quiz-container');
  var btnNext     = document.getElementById('btn-next');
  var btnPrev     = document.getElementById('btn-prev');
  var toastEl     = document.getElementById('toast');

  // ── 开始测试 ──
  document.getElementById('btn-start').addEventListener('click', function () {
    pageStart.classList.remove('active');
    pageQuiz.classList.add('active');
    renderPage(0);
  });

  // ── 下一页按钮 ──
  btnNext.addEventListener('click', handleNext);

  // ── 上一页按钮 ──
  btnPrev.addEventListener('click', function () {
    if (currentPage > 0) {
      renderPage(currentPage - 1);
    }
  });

  // ── 渲染维度页 ──
  function renderPage(pageIndex) {
    currentPage = pageIndex;
    var pg = PAGES[pageIndex];

    // 顶部信息
    dimLabel.textContent = pg.label;
    pageNum.textContent = (pageIndex + 1) + ' / ' + PAGES.length;
    updateProgress();

    // 按钮文案
    btnNext.textContent = (pageIndex === PAGES.length - 1) ? '查看结果' : '下一页';

    // 第一页隐藏上一页按钮
    btnPrev.style.display = (pageIndex === 0) ? 'none' : '';

    // 生成题目卡片
    container.innerHTML = '';
    container.scrollTop = 0;

    pg.questions.forEach(function (qIdx, i) {
      var q = QUESTIONS[qIdx];
      var card = document.createElement('div');
      card.className = 'question-card';
      card.id = 'qcard-' + qIdx;

      // 如果已有选择，标记 answered
      if (selections[qIdx] !== undefined) {
        card.classList.add('answered');
      }

      var html = '';
      // 帖子头部：头像 + 标题 + 时间
      html += '<div class="q-header">';
      html += '  <div class="q-avatar"><img src="img/avatar-default.png" alt="" onerror="this.style.display=\'none\'"></div>';
      html += '  <div class="q-header-info">';
      html += '    <div class="q-title">' + escapeHtml(q.title) + '</div>';
      html += '    <div class="q-time">刚刚</div>';
      html += '  </div>';
      html += '</div>';
      // 帖子正文
      html += '<div class="q-text">' + escapeHtml(q.question) + '</div>';
      // 分隔引导
      html += '<div class="q-divider">';
      html += '  <div class="q-divider-bar"></div>';
      html += '  <div class="q-divider-text">你会选择：</div>';
      html += '</div>';
      html += '<div class="q-options">';

      if (q.dimension === 'cross') {
        // 交叉题：4选项
        q.options.forEach(function (opt, optIndex) {
          var sel = (selections[qIdx] === optIndex) ? ' selected' : '';
          html += '<button class="option-btn' + sel + '" data-qidx="' + qIdx + '" data-opt-index="' + optIndex + '">' + escapeHtml(opt.text) + '</button>';
        });
      } else {
        // 常规题：2选项
        var selA = (selections[qIdx] === 'A') ? ' selected' : '';
        var selB = (selections[qIdx] === 'B') ? ' selected' : '';
        html += '<button class="option-btn' + selA + '" data-qidx="' + qIdx + '" data-choice="A">' + escapeHtml(q.optionA.text) + '</button>';
        html += '<button class="option-btn' + selB + '" data-qidx="' + qIdx + '" data-choice="B">' + escapeHtml(q.optionB.text) + '</button>';
      }

      html += '</div>';
      card.innerHTML = html;
      container.appendChild(card);
    });

    // 事件代理：选项点击
    container.onclick = function (e) {
      var btn = e.target.closest('.option-btn');
      if (!btn) return;

      var qIdx = parseInt(btn.getAttribute('data-qidx'));
      var q = QUESTIONS[qIdx];

      if (q.dimension === 'cross') {
        var optIndex = parseInt(btn.getAttribute('data-opt-index'));
        selectOption(qIdx, optIndex);
      } else {
        var choice = btn.getAttribute('data-choice');
        selectOption(qIdx, choice);
      }
    };
  }

  // ── 选择/切换选项 ──
  function selectOption(qIdx, value) {
    var isNewAnswer = (selections[qIdx] === undefined);
    selections[qIdx] = value;

    // 更新按钮状态
    var card = document.getElementById('qcard-' + qIdx);
    card.classList.add('answered');
    var btns = card.querySelectorAll('.option-btn');

    var q = QUESTIONS[qIdx];
    if (q.dimension === 'cross') {
      btns.forEach(function (b) {
        var idx = parseInt(b.getAttribute('data-opt-index'));
        b.classList.toggle('selected', idx === value);
      });
    } else {
      btns.forEach(function (b) {
        b.classList.toggle('selected', b.getAttribute('data-choice') === value);
      });
    }

    // 更新进度条
    updateProgress();

    // 答完后自动滚到本页下一道未答题
    if (isNewAnswer) {
      var pg = PAGES[currentPage];
      var currentPos = pg.questions.indexOf(qIdx);
      for (var i = currentPos + 1; i < pg.questions.length; i++) {
        var nextQIdx = pg.questions[i];
        if (selections[nextQIdx] === undefined) {
          setTimeout(function () {
            scrollToQuestion(nextQIdx);
          }, 300);
          return;
        }
      }
    }
  }

  // ── 更新进度条（题目级）──
  function updateProgress() {
    var answered = Object.keys(selections).length;
    progressFill.style.width = (answered / TOTAL_QUESTIONS * 100) + '%';
    pageNum.textContent = answered + ' / ' + TOTAL_QUESTIONS;
  }

  // ── 下一页 / 查看结果 ──
  function handleNext() {
    var pg = PAGES[currentPage];
    var unanswered = [];

    pg.questions.forEach(function (qIdx) {
      if (selections[qIdx] === undefined) {
        unanswered.push(qIdx);
      }
    });

    if (unanswered.length > 0) {
      showToast('本页题目还没有答完哦');
      scrollToQuestion(unanswered[0]);
      return;
    }

    // 全部回答完
    if (currentPage < PAGES.length - 1) {
      renderPage(currentPage + 1);
    } else {
      showResult();
    }
  }

  // ── 滚动到指定题目 ──
  function scrollToQuestion(qIdx) {
    var card = document.getElementById('qcard-' + qIdx);
    if (!card) return;

    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 高亮闪烁
    card.classList.add('highlight');
    setTimeout(function () {
      card.classList.remove('highlight');
    }, 1500);
  }

  // ── Toast ──
  var toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2000);
  }

  // ── 算分 ──
  function calcScores() {
    var scores = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };

    for (var qIdx in selections) {
      var idx = parseInt(qIdx);
      var q = QUESTIONS[idx];
      var sel = selections[idx];

      if (q.dimension === 'cross') {
        // 交叉题：sel 是 optIndex
        var vals = q.options[sel].values;
        for (var dim in vals) {
          scores[vals[dim]]++;
        }
      } else {
        // 常规题：sel 是 'A' 或 'B'
        var chosen = (sel === 'A') ? q.optionA : q.optionB;
        scores[chosen.value]++;
      }
    }
    return scores;
  }

  function calcType(scores) {
    var type = '';
    type += scores.E >= scores.I ? 'E' : 'I';
    type += scores.S >= scores.N ? 'S' : 'N';
    type += scores.T >= scores.F ? 'T' : 'F';
    type += scores.J >= scores.P ? 'J' : 'P';
    return type;
  }

  // ── 显示结果 ──
  function showResult() {
    var scores = calcScores();
    var type = calcType(scores);
    var r = RESULTS[type];

    pageQuiz.classList.remove('active');
    pageResult.classList.add('active');

    document.getElementById('result-type').textContent = type;
    document.getElementById('result-name').textContent = r.name;
    document.getElementById('result-star').textContent = '代表球星：' + r.star;
    document.getElementById('result-tagline').textContent = '「' + r.tagline + '」';

    // 维度百分比条
    var pairs = [
      { a: 'E', b: 'I' },
      { a: 'S', b: 'N' },
      { a: 'T', b: 'F' },
      { a: 'J', b: 'P' }
    ];

    var barsHTML = '';
    pairs.forEach(function (p) {
      var total = scores[p.a] + scores[p.b];
      var pctA = total > 0 ? Math.round(scores[p.a] / total * 100) : 50;
      var winner, loser, winPct;
      if (scores[p.a] >= scores[p.b]) {
        winner = p.a; loser = p.b; winPct = pctA;
      } else {
        winner = p.b; loser = p.a; winPct = 100 - pctA;
      }
      barsHTML +=
        '<div class="dim-row">' +
          '<span class="dim-label active">' + winner + '</span>' +
          '<div class="dim-bar-bg"><div class="dim-bar-fill" style="width:' + winPct + '%"></div></div>' +
          '<span class="dim-pct">' + winPct + '%</span>' +
          '<div class="dim-bar-bg"><div class="dim-bar-fill" style="width:' + (100 - winPct) + '%;background:linear-gradient(90deg,#475569,#64748b)"></div></div>' +
          '<span class="dim-label inactive">' + loser + '</span>' +
        '</div>';
    });
    document.getElementById('dimension-bars').innerHTML = barsHTML;

    // 完整解读
    document.getElementById('full-result-text').textContent = r.description;

    // 解锁按钮
    document.getElementById('btn-unlock-video').onclick = unlockFull;
    document.getElementById('btn-unlock-pay').onclick = unlockFull;

    // 重测
    document.getElementById('btn-retry').onclick = function () {
      location.reload();
    };
  }

  function unlockFull() {
    document.getElementById('paywall').style.display = 'none';
    document.getElementById('full-result').classList.add('show');
  }

  // ── 工具 ──
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
