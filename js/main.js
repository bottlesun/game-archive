const gameGrid = document.querySelector("#game-grid");
const spinButton = document.querySelector("#spin-button");
const screenMessage = document.querySelector("#screen-message");
const todayResult = document.querySelector("#today-result");
const resultContent = document.querySelector("#result-content");
let reelTrack;
let currentReelIndex = 1;
let selectedPickAnswer = 0;

const padNumber = (number) => String(number).padStart(2, "0");

async function showPageLoader(ready = Promise.resolve()) {
  const loader = document.querySelector("#page-loader");
  if (!loader) return;

  const fill = document.querySelector("#loading-fill");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("is-loading");
  loader.hidden = false;
  fill.style.clipPath = "inset(0 100% 0 0)";
  const progress = fill.animate([
    { clipPath: "inset(0 100% 0 0)" },
    { clipPath: "inset(0 10% 0 0)" },
  ], { duration: reducedMotion ? 100 : 900, easing: "steps(9, end)", fill: "forwards" });

  await Promise.all([ready, progress.finished]);
  fill.style.clipPath = "inset(0)";
  progress.cancel();
  await new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 0 : 160));
  document.body.classList.remove("is-loading");
  await loader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reducedMotion ? 0 : 180 }).finished;
  loader.hidden = true;
}

function initDateScore() {
  const score = document.querySelector("#today-score");
  if (!score) return;

  const board = document.querySelector("#date-score");
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  });
  let previousDate;

  const refresh = () => {
    const parts = Object.fromEntries(formatter.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    const dateValue = `${parts.year}${parts.month}${parts.day}`;
    if (dateValue === previousDate) return;
    previousDate = dateValue;
    score.dateTime = `${parts.year}-${parts.month}-${parts.day}`;
    score.setAttribute("aria-label", `${parts.year}년 ${parts.month}월 ${parts.day}일`);
    board.classList.remove("is-record");

    const finish = () => {
      score.textContent = dateValue;
      board.classList.add("is-record");
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const start = performance.now();
    const countUp = (now) => {
      const progress = Math.min((now - start) / 1400, 1);
      score.textContent = String(Math.floor(Number(dateValue) * (1 - (1 - progress) ** 3))).padStart(8, "0");
      if (progress < 1) requestAnimationFrame(countUp);
      else finish();
    };
    requestAnimationFrame(countUp);
  };

  refresh();
  window.setInterval(refresh, 60000);
}

function initStartMenu() {
  const choices = [...document.querySelectorAll(".choice-link")];
  if (!choices.length) return;

  let selectedIndex = 0;
  let isLeaving = false;
  let confirmAnimation;
  let exitAnimation;
  const stage = document.querySelector(".title-stage");
  const select = (index) => {
    if (isLeaving) return;
    selectedIndex = (index + choices.length) % choices.length;
    choices.forEach((choice, choiceIndex) => {
      choice.classList.toggle("is-selected", choiceIndex === selectedIndex);
    });
  };

  const activate = async (index) => {
    if (isLeaving) return;
    window.arcadeAudio?.select();
    select(index);
    isLeaving = true;
    const choice = choices[index];
    const destination = choice.href;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stage.classList.add("is-confirming");
    choice.classList.add("is-confirmed");

    confirmAnimation = choice.animate(
      reducedMotion ? [{ opacity: 1 }, { opacity: 1 }] : [
        { opacity: 1, easing: "steps(1, end)" },
        { opacity: 0, easing: "steps(1, end)" },
        { opacity: 1 },
      ],
      { duration: reducedMotion ? 80 : 400, iterations: reducedMotion ? 1 : 3, fill: "forwards" },
    );
    await confirmAnimation.finished;

    document.body.classList.add("is-leaving");
    exitAnimation = stage.animate(
      reducedMotion ? [{ opacity: 1 }, { opacity: 0 }] : [
        { transform: "scale(1, 1)", opacity: 1 },
        { transform: "scale(1, .006)", opacity: 1, offset: .75 },
        { transform: "scale(0, .006)", opacity: 0 },
      ],
      { duration: reducedMotion ? 100 : 340, easing: "ease-in", fill: "forwards" },
    );
    await exitAnimation.finished;
    window.location.assign(destination);
  };

  choices.forEach((choice, index) => {
    choice.addEventListener("pointerenter", () => select(index));
    choice.addEventListener("focus", () => select(index));
    choice.addEventListener("click", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      activate(index);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest(".sound-toggle, .lobby-history")) return;
    if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      select(selectedIndex + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1));
      choices[selectedIndex].focus({ preventScroll: true });
    } else if (event.key === "Enter") {
      event.preventDefault();
      const focusedChoice = choices.find((choice) => choice === document.activeElement);
      activate(focusedChoice ? choices.indexOf(focusedChoice) : selectedIndex);
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    confirmAnimation?.cancel();
    exitAnimation?.cancel();
    isLeaving = false;
    stage.classList.remove("is-confirming");
    document.body.classList.remove("is-leaving");
    choices.forEach((choice) => choice.classList.remove("is-confirmed"));
  });
}

function renderGames(games) {
  if (!gameGrid) return;

  gameGrid.innerHTML = games.map((game, index) => `
    <button class="game-choice" type="button" aria-label="${game.title}" aria-pressed="false">
      <span class="card-number">${padNumber(index + 1)}</span>
      <span class="menu-game-copy"><span class="card-title">${game.title}<span class="glitch-copy" aria-hidden="true" data-text="${game.title}" hidden></span></span><span class="menu-genre">${game.genre}</span></span>
    </button>
  `).join("");

  const choices = [...gameGrid.querySelectorAll(".game-choice")];
  const detail = document.querySelector("#game-detail");
  document.querySelector("#game-count").textContent = padNumber(games.length);
  let selectedIndex = 0;
  const dialog = document.querySelector("#game-dialog");
  const openDetails = () => {
    const game = games[selectedIndex];
    document.querySelector("#dialog-content").innerHTML = `
      <div class="detail-preview"><img src="${game.thumbnail}" alt="${game.title} 게임 화면"></div>
      <p class="detail-genre">${game.genre}</p>
      <h2 class="detail-title" id="dialog-title"><span class="glitch-title">${game.title}<span class="glitch-copy" aria-hidden="true" data-text="${game.title}"></span></span></h2>
      ${game.firstDeployedAt ? `<p class="release-date"><span>FIRST RELEASE</span><time datetime="${game.firstDeployedAt}" aria-label="첫 공개 기준일 ${game.firstDeployedAt}">${game.firstDeployedAt.replaceAll("-", ".")}</time></p>` : ""}
      <p class="dialog-overview">${game.overview}</p>
      <h3 class="dialog-section-title">HOW TO PLAY</h3>
      <ul class="dialog-features">${game.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
    `;
    const start = document.querySelector("#start-selected-game");
    start.href = game.url;
    start.target = /^https?:/.test(game.url) ? "_blank" : "_self";
    dialog.showModal();
    document.querySelector("#dialog-content").scrollTop = 0;
    document.querySelector("#close-game-detail").focus({ preventScroll: true });
  };
  document.querySelector("#close-game-detail").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => choices[selectedIndex].focus({ preventScroll: true }));
  const choose = (index, playSound = true) => {
    if (playSound) window.arcadeAudio?.select();
    selectedIndex = (index + games.length) % games.length;
    const game = games[selectedIndex];
    choices.forEach((choice, choiceIndex) => {
      choice.classList.toggle("is-selected", choiceIndex === selectedIndex);
      choice.setAttribute("aria-pressed", String(choiceIndex === selectedIndex));
      choice.querySelector(".card-title").classList.toggle("glitch-title", choiceIndex === selectedIndex);
      choice.querySelector(".glitch-copy").hidden = choiceIndex !== selectedIndex;
    });
    detail.innerHTML = `
      <div class="detail-preview">
        <img src="${game.thumbnail}" alt="${game.title} 게임 화면">
        <div class="preview-caption"><span>PREVIEW</span><span>${padNumber(selectedIndex + 1)} / ${padNumber(games.length)}</span></div>
      </div>
      <div class="detail-info">
        <p class="detail-genre">${game.genre}</p>
        <h2 class="detail-title"><span class="glitch-title">${game.title}<span class="glitch-copy" aria-hidden="true" data-text="${game.title}"></span></span></h2>
        <p class="detail-description">${game.description}</p>
        <button class="arcade-action detail-link" type="button" aria-label="${game.title} 상세 설명">DETAILS <span aria-hidden="true">◀</span></button>
      </div>
    `;
    detail.querySelector(".detail-link").addEventListener("click", openDetails);
  };
  choices.forEach((choice, index) => {
    choice.addEventListener("click", () => {
      choose(index);
      choice.focus({ preventScroll: true });
    });
    choice.addEventListener("focus", () => {
      if (selectedIndex !== index) choose(index, false);
    });
  });
  choose(0, false);

  window.addEventListener("keydown", (event) => {
    if (dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.target.closest("a, .sound-toggle")) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      choose(selectedIndex + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1));
      choices[selectedIndex].focus({ preventScroll: true });
    } else if (event.key === "Enter") {
      event.preventDefault();
      detail.querySelector(".detail-link").click();
    }
  });
}

function initSubpageKeys() {
  if (!document.body.classList.contains("inner-page") || document.body.dataset.page === "survivor") return;
  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || document.querySelector("#game-dialog")?.open || document.querySelector("#breakout-dialog")?.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      window.location.assign("index.html");
    } else if (spinButton) {
      const confirm = document.querySelector("#pick-confirm");
      if (!confirm.hidden && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && !event.target.closest(".pixel-header")) {
        event.preventDefault();
        selectPickAnswer(selectedPickAnswer + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1));
        confirm.querySelectorAll(".pick-answer")[selectedPickAnswer].focus({ preventScroll: true });
      } else if (event.key === "Enter" && !event.target.closest("a, button")) {
        event.preventDefault();
        if (confirm.hidden) spinButton.click();
        else confirm.querySelectorAll(".pick-answer")[selectedPickAnswer].click();
      }
    }
  });
}

function renderReels(games) {
  const reelWindow = document.querySelector("#reel-window");
  if (!reelWindow) return;

  document.querySelector("#reel-roll").innerHTML = '<div class="reel-track"></div><div class="reel-target" aria-hidden="true"><span>▶</span><span>◀</span></div>';
  reelTrack = reelWindow.querySelector(".reel-track");
  renderReelRows(games, 1);
}

function renderReelRows(games, cycles) {
  reelTrack.innerHTML = Array.from({ length: cycles }, () => games).flat().map((game) => `
    <div class="reel" data-game-id="${game.id}" aria-hidden="true">
      <span class="reel-name">${game.title}</span>
    </div>
  `).join("");
  reelTrack.style.transform = "translateY(0)";
}

function selectPickAnswer(index) {
  const answers = [...document.querySelectorAll(".pick-answer")];
  selectedPickAnswer = (index + answers.length) % answers.length;
  answers.forEach((answer, answerIndex) => answer.classList.toggle("is-selected", answerIndex === selectedPickAnswer));
}

async function setPickerExpanded(expanded) {
  const reelWindow = document.querySelector("#reel-window");
  const fromHeight = reelWindow.getBoundingClientRect().height;
  reelWindow.classList.toggle("is-revealed", expanded);
  const toHeight = reelWindow.getBoundingClientRect().height;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  await reelWindow.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], {
    duration: reducedMotion ? 80 : 440,
    easing: "cubic-bezier(.2, .8, .25, 1)",
  }).finished;
}

async function renderTodayPick(game) {
  todayResult.classList.toggle("is-bonus", Boolean(game.rouletteOnly));
  resultContent.innerHTML = `
    <div class="result-art"><img src="${game.thumbnail}" alt="${game.title} 게임 화면"></div>
    <div class="result-copy">
      <p class="result-label">${game.rouletteOnly ? "BONUS GAME!" : "TODAY'S PICK"}</p>
      <h2 class="result-game-title"><span class="glitch-title">${game.title}<span class="glitch-copy" aria-hidden="true" data-text="${game.title}"></span></span></h2>
      <p class="result-genre">${game.genre}</p>
      <p class="result-game-description">${game.description}</p>
    </div>
  `;
  const yes = document.querySelector("#pick-yes");
  yes.href = game.url;
  yes.target = /^https?:/.test(game.url) ? "_blank" : "_self";
  yes.setAttribute("aria-label", `YES — ${game.title} 플레이`);
  await setPickerExpanded(true);
  document.querySelector("#reel-roll").hidden = true;
  todayResult.hidden = false;
  spinButton.hidden = true;
  document.querySelector("#pick-confirm").hidden = false;
  document.querySelector("#pick-loading-notice").hidden = false;
  selectPickAnswer(0);
  screenMessage.textContent = game.rouletteOnly ? "보너스 게임 발견! 60초 생존에 도전할까요?" : "이 게임을 플레이할까요?";
  document.querySelector("#today-help").textContent = "← → SELECT · ENTER CONFIRM";
  yes.focus({ preventScroll: true });
}

async function spinAgain(games) {
  if (spinButton.disabled) return;
  spinButton.disabled = true;
  document.querySelector("#pick-confirm").hidden = true;
  document.querySelector("#pick-loading-notice").hidden = true;
  todayResult.hidden = true;
  document.querySelector("#reel-roll").hidden = false;
  screenMessage.textContent = "다시 뽑아볼게요!";
  await setPickerExpanded(false);
  spinButton.hidden = false;
  spinButton.disabled = false;
  document.querySelector("#today-help").textContent = "ENTER · SPIN";
  spinButton.focus({ preventScroll: true });
  spin(games);
}

function spin(games) {
  if (!games.length || spinButton.disabled) return;

  spinButton.disabled = true;
  todayResult.hidden = true;
  screenMessage.textContent = "게임이 돌아가는 중...";
  const selectedIndex = Math.floor(Math.random() * games.length);
  const selected = games[selectedIndex];
  const cycles = 32;
  const targetIndex = (6 * games.length) + selectedIndex;
  renderReelRows(games, cycles);
  reelTrack.classList.add("is-spinning");

  const row = reelTrack.querySelector(".reel");
  const rowPitch = row.getBoundingClientRect().height + parseFloat(getComputedStyle(reelTrack).rowGap);
  const endOffset = (targetIndex - 1) * rowPitch;
  const startOffset = ((26 * games.length) + currentReelIndex - 1) * rowPitch;
  const distance = startOffset - endOffset;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  reelTrack.style.transform = `translateY(-${startOffset}px)`;
  reelTrack.offsetHeight;
  const spinAnimation = reelTrack.animate(reducedMotion ? [
    { transform: `translateY(-${startOffset}px)` },
    { transform: `translateY(-${endOffset}px)` },
  ] : [
    { transform: `translateY(-${startOffset}px)`, filter: "blur(0px)", offset: 0, easing: "ease-out" },
    { transform: `translateY(${-startOffset - 10}px)`, filter: "blur(0px)", offset: .06, easing: "cubic-bezier(.5, 0, .8, .5)" },
    { transform: `translateY(${-startOffset + distance * .16}px)`, filter: "blur(1.2px)", offset: .24, easing: "linear" },
    { transform: `translateY(${-startOffset + distance * .68}px)`, filter: "blur(1.8px)", offset: .48, easing: "cubic-bezier(0, 0, .58, 1)" },
    { transform: `translateY(${-endOffset + 24}px)`, filter: "blur(0px)", offset: .84, easing: "cubic-bezier(.2, .7, .3, 1)" },
    { transform: `translateY(${-endOffset - 10}px)`, filter: "blur(0px)", offset: .92, easing: "ease-out" },
    { transform: `translateY(${-endOffset + 4}px)`, filter: "blur(0px)", offset: .97, easing: "ease-out" },
    { transform: `translateY(-${endOffset}px)`, filter: "blur(0px)", offset: 1 },
  ], { duration: reducedMotion ? 100 : 5500 });
  window.arcadeAudio?.startSpin(spinAnimation);

  if (!reducedMotion) {
    document.querySelector(".reel-target").animate([
      { boxShadow: "0 2px #e8417f, 0 0 0px transparent" },
      { boxShadow: "0 2px #ff75a8, 0 0 20px rgb(255 231 124 / 55%)", offset: .25 },
      { boxShadow: "0 2px #e8417f, 0 0 0px transparent" },
    ], { delay: 4620, duration: 880, easing: "ease-out" });
  }

  spinAnimation.onfinish = async () => {
    window.arcadeAudio?.finishSpin(Boolean(selected.rouletteOnly));
    reelTrack.style.transform = `translateY(-${endOffset}px)`;
    spinAnimation.cancel();
    reelTrack.classList.remove("is-spinning");
    currentReelIndex = selectedIndex;
    reelTrack.children[targetIndex].classList.add("is-winner");
    const winnerName = reelTrack.children[targetIndex].querySelector(".reel-name");
    winnerName.classList.add("glitch-title");
    winnerName.insertAdjacentHTML("beforeend", `<span class="glitch-copy" aria-hidden="true" data-text="${selected.title}"></span>`);
    screenMessage.textContent = "오늘의 게임이 선택됐어요!";
    await renderTodayPick(selected);
    spinButton.disabled = false;
  };
}

async function init() {
  if (!gameGrid && !spinButton) return;

  try {
    const response = await fetch("data/games.json", { cache: "no-store" });
    if (!response.ok) throw new Error("게임 목록을 불러오지 못했습니다.");
    const games = await response.json();
    renderGames(games.filter((game) => !game.rouletteOnly));
    renderReels(games);
    if (spinButton) {
      spinButton.addEventListener("click", () => spin(games));
      document.querySelector("#pick-no").addEventListener("click", () => spinAgain(games));
      document.querySelectorAll(".pick-answer").forEach((answer, index) => {
        answer.addEventListener("focus", () => selectPickAnswer(index));
        answer.addEventListener("pointerenter", () => selectPickAnswer(index));
      });
    }
  } catch (error) {
    if (gameGrid) gameGrid.innerHTML = '<p class="page-intro">게임 목록을 불러오지 못했습니다. 새로고침해 주세요.</p>';
    if (screenMessage) screenMessage.textContent = "게임 목록을 불러오지 못했어요.";
    if (spinButton) spinButton.disabled = true;
    console.error(error);
  }
}

window.addEventListener("keydown", (event) => {
  if (!document.body.classList.contains("is-loading")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, { capture: true });

window.addEventListener("pageshow", (event) => {
  if (event.persisted) showPageLoader();
});

async function startPage() {
  await showPageLoader(init());
  initStartMenu();
  initDateScore();
  initSubpageKeys();
  initHistory();
}

startPage();

function initHistory() {
  const roll = document.querySelector("#credits-roll");
  if (!roll) return;
  const viewport = document.querySelector("#credits-viewport");
  const pause = document.querySelector("#credits-pause");
  const replay = document.querySelector("#credits-replay");
  const skip = document.querySelector("#credits-skip");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pause.hidden = true;
    replay.hidden = true;
    skip.hidden = true;
    viewport.classList.add("credits-static");
    return;
  }
  const animation = roll.animate([
    { transform: `translateY(${viewport.clientHeight}px)` },
    { transform: `translateY(-${roll.offsetHeight}px)` },
  ], { duration: 65000, easing: "linear", fill: "both" });
  const finishCredits = async () => {
    skip.disabled = true;
    pause.disabled = true;
    replay.disabled = true;
    const blink = viewport.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, fill: "forwards" });
    await blink.finished;
    animation.cancel();
    viewport.classList.add("credits-static");
    viewport.scrollTop = 0;
    viewport.setAttribute("aria-label", "제작 크레딧. 스크롤해서 읽을 수 있습니다.");
    pause.textContent = "SCROLL TO READ";
    blink.cancel();
    await viewport.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140 }).finished;
    replay.disabled = false;
    replay.hidden = false;
  };
  animation.onfinish = finishCredits;
  skip.addEventListener("click", () => {
    animation.pause();
    finishCredits();
  });
  const pauseCredits = () => {
    if (animation.playState === "running") { animation.pause(); pause.textContent = "RESUME"; }
  };
  viewport.addEventListener("focusin", (event) => {
    if (event.target.closest("a") && event.target.matches(":focus-visible")) pauseCredits();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("a, button") || viewport.classList.contains("credits-static")) return;
    if (animation.playState === "running") pauseCredits();
    else if (animation.playState === "paused") {
      animation.play();
      pause.textContent = "PAUSE";
    }
  });
  pause.addEventListener("click", () => {
    if (animation.playState === "running") { animation.pause(); pause.textContent = "RESUME"; }
    else { animation.play(); pause.textContent = "PAUSE"; }
  });
  replay.addEventListener("click", () => {
    replay.hidden = true;
    pause.focus({ preventScroll: true });
    viewport.classList.remove("credits-static");
    viewport.scrollTop = 0;
    viewport.setAttribute("aria-label", "제작 크레딧. PAUSE 버튼으로 멈출 수 있습니다.");
    animation.currentTime = 0;
    animation.play();
    pause.disabled = false;
    skip.disabled = false;
    pause.textContent = "PAUSE";
  });
}
