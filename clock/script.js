const state = {
  answerHour: 12,
  answerMinute: 0,
  selectedHour: null,
  selectedMinute: null,
  selectedMinuteTens: null,
  selectedMinuteOnes: null,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  locked: false
};

const els = {
  clock: document.querySelector(".clock"),
  clockNumbers: document.querySelector("#clockNumbers"),
  minuteTicks: document.querySelector("#minuteTicks"),
  hourHand: document.querySelector("#hourHand"),
  minuteHand: document.querySelector("#minuteHand"),
  hourGrid: document.querySelector("#hourGrid"),
  minuteTensGrid: document.querySelector("#minuteTensGrid"),
  minuteOnesGrid: document.querySelector("#minuteOnesGrid"),
  quickMinutes: document.querySelector("#quickMinutes"),
  selectedHour: document.querySelector("#selectedHour"),
  selectedMinute: document.querySelector("#selectedMinute"),
  feedback: document.querySelector("#feedback"),
  score: document.querySelector("#score"),
  correctRate: document.querySelector("#correctRate"),
  wrongRate: document.querySelector("#wrongRate"),
  clearButton: document.querySelector("#clearButton"),
  submitButton: document.querySelector("#submitButton"),
  nextButton: document.querySelector("#nextButton")
};

const svgNS = "http://www.w3.org/2000/svg";
const clockCenter = 120;

function padMinute(value) {
  return String(value).padStart(2, "0");
}

function clockPoint(angle, radius) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: clockCenter + Math.sin(radians) * radius,
    y: clockCenter - Math.cos(radians) * radius
  };
}

function buildClockFace() {
  for (let number = 1; number <= 12; number += 1) {
    const angle = number * 30;
    const point = clockPoint(angle, 78);
    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("class", "clock-number");
    label.setAttribute("x", String(point.x));
    label.setAttribute("y", String(point.y));
    label.textContent = number;
    els.clockNumbers.append(label);
  }

  for (let minute = 0; minute < 60; minute += 1) {
    const angle = minute * 6;
    const outer = clockPoint(angle, 99);
    const inner = clockPoint(angle, minute % 5 === 0 ? 88 : 93);
    const tick = document.createElementNS(svgNS, "line");
    tick.setAttribute("class", minute % 5 === 0 ? "tick major" : "tick");
    tick.setAttribute("x1", String(outer.x));
    tick.setAttribute("y1", String(outer.y));
    tick.setAttribute("x2", String(inner.x));
    tick.setAttribute("y2", String(inner.y));
    els.minuteTicks.append(tick);
  }
}

function buildPickers() {
  for (let hour = 1; hour <= 12; hour += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = hour;
    button.dataset.hour = String(hour);
    button.addEventListener("click", () => chooseHour(hour));
    els.hourGrid.append(button);
  }

  for (let tens = 0; tens <= 5; tens += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = tens;
    button.dataset.minuteTens = String(tens);
    button.addEventListener("click", () => chooseMinuteTens(tens));
    els.minuteTensGrid.append(button);
  }

  for (let ones = 0; ones <= 9; ones += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = ones;
    button.dataset.minuteOnes = String(ones);
    button.addEventListener("click", () => chooseMinuteOnes(ones));
    els.minuteOnesGrid.append(button);
  }

  [0, 15, 30, 45].forEach((minute) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-choice";
    button.textContent = padMinute(minute);
    button.dataset.quickMinute = String(minute);
    button.addEventListener("click", () => chooseMinute(minute));
    els.quickMinutes.append(button);
  });
}

function syncMinuteFromDigits() {
  if (state.selectedMinuteTens === null || state.selectedMinuteOnes === null) {
    state.selectedMinute = null;
    return;
  }

  state.selectedMinute = state.selectedMinuteTens * 10 + state.selectedMinuteOnes;
}

function setHandAngles(hour, minute) {
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const minuteAngle = minute * 6;

  els.hourHand.style.transform = `rotate(${hourAngle}deg)`;
  els.minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
}

function playClockChangeAnimation() {
  els.clock.classList.remove("is-changing");
  void els.clock.offsetWidth;
  els.clock.classList.add("is-changing");
}

function updateScoreboard() {
  const total = state.correctCount + state.wrongCount;
  const correctRate = total === 0 ? 0 : Math.round((state.correctCount / total) * 100);
  const wrongRate = total === 0 ? 0 : 100 - correctRate;

  els.score.textContent = state.score;
  els.correctRate.textContent = `${correctRate}%`;
  els.wrongRate.textContent = `${wrongRate}%`;
}

function updateSelectedDisplay() {
  els.selectedHour.textContent = state.selectedHour ?? "?";
  els.selectedMinute.textContent = state.selectedMinute === null ? "??" : padMinute(state.selectedMinute);

  document.querySelectorAll("[data-hour]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.hour) === state.selectedHour);
  });

  document.querySelectorAll("[data-minute-tens]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.minuteTens) === state.selectedMinuteTens);
  });

  document.querySelectorAll("[data-minute-ones]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.minuteOnes) === state.selectedMinuteOnes);
  });

  document.querySelectorAll("[data-quick-minute]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.quickMinute) === state.selectedMinute);
  });
}

function chooseHour(hour) {
  if (state.locked) return;
  state.selectedHour = hour;
  updateSelectedDisplay();
}

function chooseMinute(minute) {
  if (state.locked) return;
  state.selectedMinute = minute;
  state.selectedMinuteTens = Math.floor(minute / 10);
  state.selectedMinuteOnes = minute % 10;
  updateSelectedDisplay();
}

function chooseMinuteTens(tens) {
  if (state.locked) return;
  state.selectedMinuteTens = tens;
  syncMinuteFromDigits();
  updateSelectedDisplay();
}

function chooseMinuteOnes(ones) {
  if (state.locked) return;
  state.selectedMinuteOnes = ones;
  syncMinuteFromDigits();
  updateSelectedDisplay();
}

function clearAnswer() {
  if (state.locked) return;
  state.selectedHour = null;
  state.selectedMinute = null;
  state.selectedMinuteTens = null;
  state.selectedMinuteOnes = null;
  els.feedback.className = "answer-line";
  els.feedback.textContent = "看时针和分针，点击答案。";
  updateSelectedDisplay();
}

function randomQuestion() {
  state.answerHour = Math.floor(Math.random() * 12) + 1;
  state.answerMinute = Math.floor(Math.random() * 60);
  state.selectedHour = null;
  state.selectedMinute = null;
  state.selectedMinuteTens = null;
  state.selectedMinuteOnes = null;
  state.locked = false;

  playClockChangeAnimation();
  setHandAngles(state.answerHour, state.answerMinute);
  els.feedback.className = "answer-line";
  els.feedback.textContent = "看时针和分针，点击答案。";
  els.submitButton.hidden = false;
  els.nextButton.hidden = true;
  els.clearButton.disabled = false;
  updateSelectedDisplay();
}

function submitAnswer() {
  if (state.locked) return;

  if (state.selectedHour === null || state.selectedMinute === null) {
    els.feedback.className = "answer-line wrong";
    els.feedback.textContent = "先选小时和分钟，再提交。";
    return;
  }

  const hourCorrect = state.selectedHour === state.answerHour;
  const minuteCorrect = state.selectedMinute === state.answerMinute;
  const answer = `${state.answerHour} 点 ${padMinute(state.answerMinute)} 分`;

  state.locked = true;
  els.clearButton.disabled = true;
  els.submitButton.hidden = true;
  els.nextButton.hidden = false;

  if (hourCorrect && minuteCorrect) {
    state.score += 10;
    state.correctCount += 1;
    els.feedback.className = "answer-line correct";
    els.feedback.textContent = `答对了！答案是 ${answer}，+10 分。`;
  } else if (hourCorrect || minuteCorrect) {
    state.score += 4;
    state.wrongCount += 1;
    els.feedback.className = "answer-line partial";
    els.feedback.textContent = `接近了，答案是 ${answer}，+4 分。`;
  } else {
    state.wrongCount += 1;
    els.feedback.className = "answer-line wrong";
    els.feedback.textContent = `这题答案是 ${answer}，下一题再试。`;
  }

  updateScoreboard();
}

els.clearButton.addEventListener("click", clearAnswer);
els.submitButton.addEventListener("click", submitAnswer);
els.nextButton.addEventListener("click", randomQuestion);

buildClockFace();
buildPickers();
updateScoreboard();
randomQuestion();
