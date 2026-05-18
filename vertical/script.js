const totalQuestions = 10;
const wrongKey = "verticalWrongFacts";

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
  verticalSum: document.querySelector("#verticalSum"),
  feedback: document.querySelector("#feedback"),
  placeHint: document.querySelector("#placeHint"),
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

function makeNoCarryAdd() {
  const tens = randomInt(1, 6);
  const ones = randomInt(1, 5);
  const addTens = randomInt(1, 3);
  const addOnes = randomInt(1, 9 - ones);
  return makeQuestion("+", tens * 10 + ones, addTens * 10 + addOnes, "不进位加法");
}

function makeCarryAdd() {
  const tens = randomInt(1, 5);
  const ones = randomInt(5, 9);
  const addTens = randomInt(1, 3);
  const addOnes = randomInt(10 - ones, 9);
  return makeQuestion("+", tens * 10 + ones, addTens * 10 + addOnes, "进位加法");
}

function makeNoBorrowSubtract() {
  const tens = randomInt(4, 9);
  const ones = randomInt(3, 9);
  const subTens = randomInt(1, tens - 1);
  const subOnes = randomInt(1, ones);
  return makeQuestion("-", tens * 10 + ones, subTens * 10 + subOnes, "不退位减法");
}

function makeBorrowSubtract() {
  const tens = randomInt(4, 9);
  const ones = randomInt(0, 4);
  const subTens = randomInt(1, tens - 1);
  const subOnes = randomInt(ones + 1, 9);
  return makeQuestion("-", tens * 10 + ones, subTens * 10 + subOnes, "退位减法");
}

function makeCore() {
  const makers = [makeCarryAdd, makeNoBorrowSubtract, makeBorrowSubtract];
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
    makeNoCarryAdd(),
    makeNoBorrowSubtract(),
    makeNoCarryAdd(),
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

function makeChoices(answer) {
  const choices = new Set([answer]);

  while (choices.size < 6) {
    const offset = randomInt(-12, 12);
    const value = answer + offset;

    if (value >= 0 && value <= 99 && value !== answer) {
      choices.add(value);
    }
  }

  return shuffle([...choices]);
}

function renderAnswerButtons(question) {
  els.answerGrid.innerHTML = "";

  makeChoices(question.answer).forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = value;
    button.addEventListener("click", () => chooseAnswer(value));
    els.answerGrid.append(button);
  });
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

function numberDigits(value) {
  return String(value).padStart(2, " ").split("");
}

function renderVerticalSum(question) {
  const topDigits = numberDigits(question.left);
  const bottomDigits = numberDigits(question.right);
  els.verticalSum.innerHTML = "";

  const top = document.createElement("div");
  top.className = "sum-row";
  top.innerHTML = `<span></span><span>${topDigits[0]}</span><span>${topDigits[1]}</span>`;

  const bottom = document.createElement("div");
  bottom.className = "sum-row operator-row";
  bottom.innerHTML = `<span>${question.operator}</span><span>${bottomDigits[0]}</span><span>${bottomDigits[1]}</span>`;

  const line = document.createElement("div");
  line.className = "sum-line";

  const answer = document.createElement("div");
  answer.className = "sum-row answer-row";
  answer.innerHTML = "<span></span><span>?</span><span>?</span>";

  els.verticalSum.append(top, bottom, line, answer);
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
  els.feedback.className = "feedback";
  els.feedback.textContent = "先算个位，再算十位，选一个答案。";
  els.placeHint.textContent = "";
  els.summary.hidden = true;
  renderPath();
  renderVerticalSum(question);
  renderAnswerButtons(question);
  setAnswerButtonsDisabled(false);
}

function hintText(question) {
  const leftOnes = question.left % 10;
  const rightOnes = question.right % 10;

  if (question.operator === "+" && leftOnes + rightOnes >= 10) {
    return `个位 ${leftOnes} + ${rightOnes} 满 10，要向十位进 1。`;
  }

  if (question.operator === "-" && leftOnes < rightOnes) {
    return `个位 ${leftOnes} 不够减 ${rightOnes}，向十位借 1 个十。`;
  }

  return "再算一次个位，再算十位。";
}

function placeHintText(question) {
  const leftTens = Math.floor(question.left / 10);
  const leftOnes = question.left % 10;
  const rightTens = Math.floor(question.right / 10);
  const rightOnes = question.right % 10;

  if (question.operator === "+") {
    const ones = leftOnes + rightOnes;
    const carry = ones >= 10 ? 1 : 0;
    return `个位得 ${ones % 10}${carry ? "，进 1" : ""}；十位是 ${leftTens} + ${rightTens}${carry ? " + 1" : ""}。`;
  }

  const borrow = leftOnes < rightOnes ? 1 : 0;
  const ones = borrow ? leftOnes + 10 - rightOnes : leftOnes - rightOnes;
  return `个位得 ${ones}${borrow ? "，十位少 1" : ""}；十位是 ${leftTens}${borrow ? " - 1" : ""} - ${rightTens}。`;
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
    els.placeHint.textContent = placeHintText(question);
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
  els.placeHint.textContent = placeHintText(question);

  window.setTimeout(nextQuestion, 750);
}

function finishPractice() {
  const rate = Math.round((state.correct / totalQuestions) * 100);
  const weakStage = state.missed[0]?.stage || "继续保持每天练习";

  state.locked = true;
  setAnswerButtonsDisabled(true);
  renderPath();
  els.summaryText.textContent = `答对 ${state.correct} / ${totalQuestions} 题，正确率 ${rate}%，得到 ${state.stars} 颗星。`;
  els.parentTip.textContent = state.missed.length
    ? `家长提示：下一组会优先复习“${weakStage}”，答错的题会自动混入后续练习。`
    : "家长提示：今天竖式步骤很稳，后续继续保持短时间练习。";
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

startPractice();
