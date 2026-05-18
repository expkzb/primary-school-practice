const totalQuestions = 10;
const wrongKey = "arithmeticWrongFacts";

const state = {
  questions: [],
  index: 0,
  correct: 0,
  stars: 0,
  missed: [],
  answeredWrongThisQuestion: false,
  locked: false
};

const els = {
  currentIndex: document.querySelector("#currentIndex"),
  correctCount: document.querySelector("#correctCount"),
  stars: document.querySelector("#stars"),
  questPath: document.querySelector("#questPath"),
  stageLabel: document.querySelector("#stageLabel"),
  questionText: document.querySelector("#questionText"),
  feedback: document.querySelector("#feedback"),
  beads: document.querySelector("#beads"),
  answerGrid: document.querySelector("#answerGrid"),
  restartButton: document.querySelector("#restartButton"),
  summary: document.querySelector("#summary"),
  summaryText: document.querySelector("#summaryText"),
  parentTip: document.querySelector("#parentTip"),
  againButton: document.querySelector("#againButton")
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function factId(question) {
  return `${question.left}${question.operator}${question.right}`;
}

function readWrongFacts() {
  try {
    return JSON.parse(localStorage.getItem(wrongKey)) || [];
  } catch {
    return [];
  }
}

function saveWrongFacts(facts) {
  localStorage.setItem(wrongKey, JSON.stringify(facts.slice(0, 20)));
}

function makeQuestion(operator, left, right, stage) {
  return {
    operator,
    left,
    right,
    answer: operator === "+" ? left + right : left - right,
    stage
  };
}

function makeWarmup() {
  if (Math.random() < 0.5) {
    const left = randomInt(1, 8);
    const right = randomInt(1, 10 - left);
    return makeQuestion("+", left, right, "热身题");
  }

  const left = randomInt(3, 10);
  const right = randomInt(1, left - 1);
  return makeQuestion("-", left, right, "热身题");
}

function makeBridgeTen() {
  const pairs = [
    [8, 2],
    [7, 3],
    [6, 4],
    [9, 1],
    [5, 5]
  ];
  const pair = pairs[randomInt(0, pairs.length - 1)];
  return makeQuestion("+", pair[0], pair[1], "凑十题");
}

function makeCarryAdd() {
  const left = randomInt(6, 9);
  const right = randomInt(4, 9);
  return makeQuestion("+", left, right, "进位加法");
}

function makeBorrowSubtract() {
  const answer = randomInt(3, 9);
  const right = randomInt(4, 9);
  return makeQuestion("-", answer + right, right, "退位减法");
}

function makeCore() {
  const makers = [makeBridgeTen, makeCarryAdd, makeBorrowSubtract];
  return makers[randomInt(0, makers.length - 1)]();
}

function makeReviewQuestions() {
  return shuffle(readWrongFacts()).slice(0, 2).map((item) => ({
    ...item,
    stage: "错题复习"
  }));
}

function buildQuestionSet() {
  const questions = [
    makeWarmup(),
    makeWarmup(),
    makeWarmup(),
    makeCore(),
    makeCore(),
    makeCore(),
    makeCore(),
    makeCore(),
    ...makeReviewQuestions()
  ];

  while (questions.length < totalQuestions) {
    questions.push(Math.random() < 0.5 ? makeCarryAdd() : makeBorrowSubtract());
  }

  return questions.slice(0, totalQuestions);
}

function renderAnswerButtons() {
  els.answerGrid.innerHTML = "";

  for (let value = 0; value <= 20; value += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = value;
    button.addEventListener("click", () => chooseAnswer(value));
    els.answerGrid.append(button);
  }
}

function renderPath() {
  els.questPath.innerHTML = "";

  for (let index = 0; index < totalQuestions; index += 1) {
    const step = document.createElement("span");
    step.classList.toggle("done", index < state.index);
    step.classList.toggle("current", index === state.index);
    els.questPath.append(step);
  }
}

function renderBeads(question, showHint) {
  els.beads.innerHTML = "";

  const count = question.operator === "+" ? question.left + question.right : question.left;
  for (let index = 0; index < count; index += 1) {
    const bead = document.createElement("span");
    bead.className = "bead";

    if (question.operator === "+" && index >= question.left) {
      bead.classList.add("second");
    }

    if (question.operator === "-" && showHint && index >= question.left - question.right) {
      bead.classList.add("removed");
    }

    els.beads.append(bead);
  }
}

function currentQuestion() {
  return state.questions[state.index];
}

function setAnswerButtonsDisabled(disabled) {
  document.querySelectorAll(".answer-button").forEach((button) => {
    button.disabled = disabled;
  });
}

function showQuestion() {
  const question = currentQuestion();
  state.answeredWrongThisQuestion = false;
  state.locked = false;

  els.currentIndex.textContent = state.index + 1;
  els.correctCount.textContent = state.correct;
  els.stars.textContent = state.stars;
  els.stageLabel.textContent = question.stage;
  els.questionText.textContent = `${question.left} ${question.operator} ${question.right} = ?`;
  els.feedback.className = "feedback";
  els.feedback.textContent = "选一个答案。";
  els.summary.hidden = true;
  renderPath();
  renderBeads(question, false);
  setAnswerButtonsDisabled(false);
}

function hintText(question) {
  if (question.operator === "+" && question.left + question.right >= 10) {
    const need = 10 - question.left;
    const rest = question.right - need;
    return `差一点。先想 ${question.left} 加 ${need} 变成 10，再加 ${rest}。`;
  }

  if (question.operator === "-") {
    return `再想想。先看一共有 ${question.left} 个，拿走 ${question.right} 个，剩下几个？`;
  }

  return "再想想，可以数一数下面的小珠子。";
}

function rememberMiss(question) {
  const facts = readWrongFacts().filter((item) => factId(item) !== factId(question));
  facts.unshift(question);
  saveWrongFacts(facts);
}

function chooseAnswer(value) {
  if (state.locked) return;

  const question = currentQuestion();

  if (value !== question.answer) {
    if (!state.answeredWrongThisQuestion) {
      state.missed.push(question);
      rememberMiss(question);
    }

    state.answeredWrongThisQuestion = true;
    els.feedback.className = "feedback wrong";
    els.feedback.textContent = hintText(question);
    renderBeads(question, true);
    return;
  }

  state.correct += state.answeredWrongThisQuestion ? 0 : 1;
  state.stars += state.answeredWrongThisQuestion ? 1 : 2;
  state.locked = true;
  setAnswerButtonsDisabled(true);
  els.correctCount.textContent = state.correct;
  els.stars.textContent = state.stars;
  els.feedback.className = "feedback correct";
  els.feedback.textContent = state.answeredWrongThisQuestion ? "这次想对了。" : "答对了。";

  window.setTimeout(nextQuestion, 650);
}

function finishPractice() {
  const rate = Math.round((state.correct / totalQuestions) * 100);
  const weakStage = state.missed[0]?.stage || "继续保持每天练习";

  state.locked = true;
  setAnswerButtonsDisabled(true);
  renderPath();
  els.summaryText.textContent = `答对 ${state.correct} / ${totalQuestions} 题，正确率 ${rate}%，得到 ${state.stars} 颗星。`;
  els.parentTip.textContent = state.missed.length
    ? `家长提示：明天优先复习“${weakStage}”，错过的题会自动混入下一组。`
    : "家长提示：今天很稳，明天继续保持短时间练习。";
  els.summary.hidden = false;
}

function nextQuestion() {
  state.index += 1;

  if (state.index >= totalQuestions) {
    finishPractice();
    return;
  }

  showQuestion();
}

function startPractice() {
  state.questions = buildQuestionSet();
  state.index = 0;
  state.correct = 0;
  state.stars = 0;
  state.missed = [];
  showQuestion();
}

els.restartButton.addEventListener("click", startPractice);
els.againButton.addEventListener("click", startPractice);

renderAnswerButtons();
startPractice();
