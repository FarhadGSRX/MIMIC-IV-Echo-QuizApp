(function () {
  "use strict";

  let data = [];
  let currentItem = null;
  let answered = false;
  let browseFiltered = [];

  // DOM refs
  const quizSection = document.getElementById("quiz-mode");
  const browseSection = document.getElementById("browse-mode");
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
    .then((r) => r.json())
    .then((json) => {
      data = json;
      populateFilters();
      loadRandomQuestion();
    })
    .catch((err) => {
      questionText.textContent = "Failed to load data: " + err.message;
    });

  // ---- Mode switching ----

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const mode = tab.dataset.mode;
      if (mode === "quiz") {
        quizSection.classList.remove("hidden");
        browseSection.classList.add("hidden");
      } else {
        quizSection.classList.add("hidden");
        browseSection.classList.remove("hidden");
        applyFilters();
      }
    });
  });

  // ---- Quiz Mode ----

  function loadQuestion(item) {
    currentItem = item;
    answered = false;

    // Video
    const videoPath = item.videos[0];
    videoSource.src = videoPath;
    video.load();
    video.play().catch(() => {});

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
    const letters = ["A", "B", "C", "D"];
    letters.forEach((letter) => {
      const text = item["option_" + letter];
      if (!text) return; // skip empty options (some questions have only 2)
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML =
        '<span class="option-letter">' + letter + "</span><span>" + escapeHtml(text) + "</span>";
      btn.addEventListener("click", () => handleAnswer(letter, btn));
      optionsContainer.appendChild(btn);
    });

    // Hide answer panel & next
    answerPanel.classList.add("hidden");
    nextBtn.classList.add("hidden");
    reportContent.classList.add("hidden");
    reportToggle.textContent = "Show Full Report";
  }

  function loadRandomQuestion() {
    const idx = Math.floor(Math.random() * data.length);
    loadQuestion(data[idx]);
  }

  function handleAnswer(letter, clickedBtn) {
    if (answered) return;
    answered = true;

    const correct = currentItem.correct_option;

    // Mark all buttons
    optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
      btn.classList.add("disabled");
      const btnLetter = btn.querySelector(".option-letter").textContent;
      if (btnLetter === correct) {
        btn.classList.add("correct");
      }
    });

    if (letter !== correct) {
      clickedBtn.classList.add("incorrect");
    }

    // Show answer panel
    correctAnswerText.textContent = currentItem.answer;
    reportText.textContent = currentItem.report || "No report available.";
    answerPanel.classList.remove("hidden");
    nextBtn.classList.remove("hidden");
  }

  // Report toggle
  reportToggle.addEventListener("click", () => {
    const isHidden = reportContent.classList.toggle("hidden");
    reportToggle.textContent = isHidden ? "Show Full Report" : "Hide Report";
  });

  // Next question
  nextBtn.addEventListener("click", () => {
    loadRandomQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---- Browse Mode ----

  function populateFilters() {
    const structures = [...new Set(data.map((d) => d.structure).filter(Boolean))].sort();
    const views = [...new Set(data.map((d) => d.view).filter(Boolean))].sort();

    structures.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      filterStructure.appendChild(opt);
    });

    views.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      filterView.appendChild(opt);
    });
  }

  function applyFilters() {
    const struct = filterStructure.value;
    const view = filterView.value;
    const search = filterSearch.value.toLowerCase().trim();

    browseFiltered = data.filter((item) => {
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
    browseFiltered.forEach((item, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + escapeHtml(item.question) + "</td>" +
        "<td>" + escapeHtml(item.structure || "") + "</td>" +
        "<td>" + escapeHtml(item.view || "") + "</td>";
      tr.addEventListener("click", () => {
        // Switch to quiz mode with this item
        tabs.forEach((t) => t.classList.remove("active"));
        tabs[0].classList.add("active");
        browseSection.classList.add("hidden");
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

  // ---- Helpers ----

  function makeTag(text) {
    const span = document.createElement("span");
    span.className = "meta-tag";
    span.textContent = text;
    return span;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
