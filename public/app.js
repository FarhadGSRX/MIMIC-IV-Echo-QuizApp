(function () {
  "use strict";

  let data = [];
  let currentItem = null;
  let answered = false;
  let browseFiltered = [];

  // ---- Progress Tracking ----

  const PROGRESS_KEY = "echoQuizProgress";

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore corrupt data */ }
    return { results: {} };
  }

  function saveResult(id, correct) {
    const progress = loadProgress();
    progress.results[id] = { correct: correct, answeredAt: Date.now() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  function resetProgress() {
    localStorage.removeItem(PROGRESS_KEY);
  }

  function getStats() {
    const progress = loadProgress();
    const results = Object.values(progress.results);
    const total = data.length;
    const answeredCount = results.length;
    const correctCount = results.filter(function (r) { return r.correct; }).length;
    const incorrectCount = answeredCount - correctCount;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    return { total: total, answered: answeredCount, correct: correctCount, incorrect: incorrectCount, accuracy: accuracy };
  }

  // DOM refs
  const quizSection = document.getElementById("quiz-mode");
  const browseSection = document.getElementById("browse-mode");
  const statsSection = document.getElementById("stats-mode");
  const tabs = document.querySelectorAll(".tab");
  const video = document.getElementById("echo-video");
  const videoSource = document.getElementById("video-source");
  const videoMeta = document.getElementById("video-meta");
  const questionText = document.getElementById("question-text");
  const optionsContainer = document.getElementById("options");
  const answerPanel = document.getElementById("answer-panel");
  const correctAnswerText = document.getElementById("correct-answer-text");
  const reportToggle = document.getElementById("report-toggle");
  const reportContent = document.getElementById("report-content");
  const reportText = document.getElementById("report-text");
  const nextBtn = document.getElementById("next-btn");
  const filterStructure = document.getElementById("filter-structure");
  const filterView = document.getElementById("filter-view");
  const filterSearch = document.getElementById("filter-search");
  const browseBody = document.getElementById("browse-body");
  const resultCount = document.getElementById("result-count");

  // ---- Init ----

  fetch("data/MIMICEchoQA.json")
    .then(function (r) { return r.json(); })
    .then(function (json) {
      data = json;
      populateFilters();
      loadRandomQuestion();
    })
    .catch(function (err) {
      questionText.textContent = "Failed to load data: " + err.message;
    });

  // ---- Mode switching ----

  var allSections = [quizSection, browseSection, statsSection];

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      var mode = tab.dataset.mode;

      allSections.forEach(function (s) { s.classList.add("hidden"); });

      if (mode === "quiz") {
        quizSection.classList.remove("hidden");
      } else if (mode === "browse") {
        browseSection.classList.remove("hidden");
        applyFilters();
      } else if (mode === "stats") {
        statsSection.classList.remove("hidden");
        renderStats();
      }
    });
  });

  // ---- Quiz Mode ----

  function loadQuestion(item) {
    currentItem = item;
    answered = false;

    // Video
    var videoPath = item.videos[0];
    videoSource.src = videoPath;
    video.load();
    video.play().catch(function () {});

    // Meta tags
    videoMeta.innerHTML = "";
    if (item.structure) {
      videoMeta.appendChild(makeTag(item.structure));
    }
    if (item.view) {
      videoMeta.appendChild(makeTag(item.view));
    }

    // Question
    questionText.textContent = item.question;

    // Options
    optionsContainer.innerHTML = "";
    var letters = ["A", "B", "C", "D"];
    letters.forEach(function (letter) {
      var text = item["option_" + letter];
      if (!text) return;
      var btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML =
        '<span class="option-letter">' + letter + "</span><span>" + escapeHtml(text) + "</span>";
      btn.addEventListener("click", function () { handleAnswer(letter, btn); });
      optionsContainer.appendChild(btn);
    });

    // Hide answer panel & next
    answerPanel.classList.add("hidden");
    nextBtn.classList.add("hidden");
    reportContent.classList.add("hidden");
    reportToggle.textContent = "Show Full Report";
  }

  function loadRandomQuestion() {
    var progress = loadProgress();
    var unanswered = data.filter(function (item) {
      return !progress.results[item.messages_id];
    });

    if (unanswered.length === 0 && data.length > 0) {
      // All questions answered
      questionText.textContent = "All " + data.length + " questions completed!";
      optionsContainer.innerHTML = '<p class="completed-message">You\'ve answered every question. Visit the <a href="#" id="go-to-stats">Stats tab</a> to review your performance, or reset your progress to start again.</p>';
      var statsLink = document.getElementById("go-to-stats");
      if (statsLink) {
        statsLink.addEventListener("click", function (e) {
          e.preventDefault();
          // Activate stats tab
          tabs.forEach(function (t) { t.classList.remove("active"); });
          tabs[2].classList.add("active");
          allSections.forEach(function (s) { s.classList.add("hidden"); });
          statsSection.classList.remove("hidden");
          renderStats();
        });
      }
      videoMeta.innerHTML = "";
      answerPanel.classList.add("hidden");
      nextBtn.classList.add("hidden");
      return;
    }

    var idx = Math.floor(Math.random() * unanswered.length);
    loadQuestion(unanswered[idx]);
  }

  function handleAnswer(letter, clickedBtn) {
    if (answered) return;
    answered = true;

    var correct = currentItem.correct_option;
    var isCorrect = letter === correct;

    // Record progress
    saveResult(currentItem.messages_id, isCorrect);

    // Mark all buttons
    optionsContainer.querySelectorAll(".option-btn").forEach(function (btn) {
      btn.classList.add("disabled");
      var btnLetter = btn.querySelector(".option-letter").textContent;
      if (btnLetter === correct) {
        btn.classList.add("correct");
      }
    });

    if (!isCorrect) {
      clickedBtn.classList.add("incorrect");
    }

    // Show answer panel
    correctAnswerText.textContent = currentItem.answer;
    reportText.textContent = currentItem.report || "No report available.";
    answerPanel.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
  }

  // Report toggle
  reportToggle.addEventListener("click", function () {
    var isHidden = reportContent.classList.toggle("hidden");
    reportToggle.textContent = isHidden ? "Show Full Report" : "Hide Report";
  });

  // Next question
  nextBtn.addEventListener("click", function () {
    loadRandomQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---- Browse Mode ----

  function populateFilters() {
    var structures = [].concat(new Set(data.map(function (d) { return d.structure; }).filter(Boolean)));
    // Set dedup
    var structSet = {};
    data.forEach(function (d) { if (d.structure) structSet[d.structure] = true; });
    var structList = Object.keys(structSet).sort();

    var viewSet = {};
    data.forEach(function (d) { if (d.view) viewSet[d.view] = true; });
    var viewList = Object.keys(viewSet).sort();

    structList.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      filterStructure.appendChild(opt);
    });

    viewList.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      filterView.appendChild(opt);
    });
  }

  function applyFilters() {
    var struct = filterStructure.value;
    var view = filterView.value;
    var search = filterSearch.value.toLowerCase().trim();

    browseFiltered = data.filter(function (item) {
      if (struct && item.structure !== struct) return false;
      if (view && item.view !== view) return false;
      if (search && !item.question.toLowerCase().includes(search)) return false;
      return true;
    });

    resultCount.textContent = browseFiltered.length + " question" + (browseFiltered.length !== 1 ? "s" : "");
    renderBrowseTable();
  }

  function renderBrowseTable() {
    browseBody.innerHTML = "";
    browseFiltered.forEach(function (item) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + escapeHtml(item.question) + "</td>" +
        "<td>" + escapeHtml(item.structure || "") + "</td>" +
        "<td>" + escapeHtml(item.view || "") + "</td>";
      tr.addEventListener("click", function () {
        // Switch to quiz mode with this item
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tabs[0].classList.add("active");
        allSections.forEach(function (s) { s.classList.add("hidden"); });
        quizSection.classList.remove("hidden");
        loadQuestion(item);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      browseBody.appendChild(tr);
    });
  }

  filterStructure.addEventListener("change", applyFilters);
  filterView.addEventListener("change", applyFilters);
  filterSearch.addEventListener("input", applyFilters);

  // ---- Stats Mode ----

  function renderStats() {
    var stats = getStats();
    var progress = loadProgress();

    // Summary cards
    document.getElementById("stats-answered").textContent = stats.answered + " / " + stats.total;
    document.getElementById("stats-correct").textContent = stats.correct;
    document.getElementById("stats-incorrect").textContent = stats.incorrect;
    document.getElementById("stats-accuracy").textContent = stats.accuracy + "%";

    // Progress bar
    var pct = stats.total > 0 ? (stats.answered / stats.total) * 100 : 0;
    document.getElementById("stats-progress-bar").style.width = pct + "%";

    // Breakdown by structure
    renderBreakdownTable("stats-by-structure", "structure", progress);

    // Breakdown by view
    renderBreakdownTable("stats-by-view", "view", progress);
  }

  function renderBreakdownTable(tbodyId, field, progress) {
    var tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";

    // Group data items by field
    var groups = {};
    data.forEach(function (item) {
      var key = item[field] || "Unknown";
      if (!groups[key]) groups[key] = { total: 0, answered: 0, correct: 0 };
      groups[key].total++;
      var result = progress.results[item.messages_id];
      if (result) {
        groups[key].answered++;
        if (result.correct) groups[key].correct++;
      }
    });

    var keys = Object.keys(groups).sort();
    keys.forEach(function (key) {
      var g = groups[key];
      var acc = g.answered > 0 ? Math.round((g.correct / g.answered) * 100) + "%" : "-";
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + escapeHtml(key) + "</td>" +
        "<td>" + g.answered + " / " + g.total + "</td>" +
        "<td>" + g.correct + "</td>" +
        "<td>" + acc + "</td>";
      tbody.appendChild(tr);
    });
  }

  // Reset button
  document.getElementById("reset-progress-btn").addEventListener("click", function () {
    if (confirm("Reset all progress? This will clear your answer history and cannot be undone.")) {
      resetProgress();
      renderStats();
    }
  });

  // ---- Helpers ----

  function makeTag(text) {
    var span = document.createElement("span");
    span.className = "meta-tag";
    span.textContent = text;
    return span;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
