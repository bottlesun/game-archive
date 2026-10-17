// A self-contained hidden arcade stage, drawn without external assets.
(() => {
  const trigger = document.querySelector("#secret-game-trigger");
  if (!trigger) return;
  const dialog = document.querySelector("#breakout-dialog");
  const canvas = document.querySelector("#breakout-canvas");
  const ctx = canvas.getContext("2d");
  const action = document.querySelector("#breakout-action");
  const status = document.querySelector("#breakout-status");
  const scoreLabel = document.querySelector("#breakout-score");
  const livesLabel = document.querySelector("#breakout-lives");
  const width = canvas.width;
  const height = canvas.height;
  const paddle = { x: 203, y: 330, w: 74, h: 8 };
  const ball = { x: 240, y: 320, vx: 80, vy: -190, r: 5 };
  const keys = new Set();
  const colors = ["#ff7993", "#ffb04f", "#ffe77c", "#5ef2ce"];
  let bricks = [];
  let score = 0;
  let lives = 3;
  let state = "ready";
  let frame;
  let previousTime = 0;
  let secretClicks = 0;
  let lastSecretClick = 0;

  const sound = (kind) => window.arcadeAudio?.gameHit(kind);
  const updateScore = () => {
    scoreLabel.textContent = String(score).padStart(5, "0");
    livesLabel.textContent = lives ? Array(lives).fill("♥").join(" ") : "—";
  };
  const setState = (next) => {
    state = next;
    const messages = {
      ready: "Enter 또는 화면을 눌러 공을 발사하세요.",
      playing: "벽돌을 모두 깨뜨리세요!",
      paused: "PAUSED · 계속하려면 RESUME을 누르세요.",
      won: "STAGE CLEAR! 숨겨진 스테이지 정복!",
      lost: "GAME OVER · 다시 도전해 보세요!",
    };
    status.textContent = messages[next];
    action.textContent = next === "playing" ? "PAUSE" : next === "paused" ? "RESUME" : next === "ready" ? "LAUNCH" : "RETRY";
  };
  const tetherBall = () => {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 2;
  };
  const reset = () => {
    score = 0;
    lives = 3;
    paddle.x = (width - paddle.w) / 2;
    bricks = Array.from({ length: 28 }, (_, index) => ({
      x: 20 + (index % 7) * 64, y: 42 + Math.floor(index / 7) * 26,
      w: 56, h: 18, color: colors[Math.floor(index / 7)], alive: true,
    }));
    tetherBall();
    updateScore();
    setState("ready");
  };
  const launch = () => {
    if (state === "won" || state === "lost") reset();
    if (state === "ready") {
      ball.vx = 85;
      ball.vy = -190;
      setState("playing");
    } else if (state === "paused") setState("playing");
  };
  const advance = (dt) => {
    if (state !== "ready" && state !== "playing") return;
    const direction = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
    paddle.x = Math.max(0, Math.min(width - paddle.w, paddle.x + direction * 370 * dt));
    if (state === "ready") { tetherBall(); return; }
    if (state !== "playing") return;
    const oldX = ball.x;
    const oldY = ball.y;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < ball.r || ball.x > width - ball.r) {
      ball.x = Math.max(ball.r, Math.min(width - ball.r, ball.x));
      ball.vx *= -1;
      sound("wall");
    }
    if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); sound("wall"); }
    if (ball.vy > 0 && oldY + ball.r <= paddle.y && ball.y + ball.r >= paddle.y && ball.x + ball.r >= paddle.x && ball.x - ball.r <= paddle.x + paddle.w) {
      const offset = Math.max(-1, Math.min(1, (ball.x - paddle.x - paddle.w / 2) / (paddle.w / 2)));
      const speed = Math.min(330, Math.hypot(ball.vx, ball.vy) + 5);
      ball.vx = Math.sin(offset * 1.05) * speed;
      if (Math.abs(ball.vx) < 30) ball.vx = (ball.vx < 0 ? -1 : 1) * 30;
      ball.vy = -Math.sqrt(speed ** 2 - ball.vx ** 2);
      ball.y = paddle.y - ball.r;
      sound("paddle");
    }
    for (const brick of bricks) {
      if (!brick.alive || ball.x + ball.r < brick.x || ball.x - ball.r > brick.x + brick.w || ball.y + ball.r < brick.y || ball.y - ball.r > brick.y + brick.h) continue;
      brick.alive = false;
      if (oldY + ball.r <= brick.y || oldY - ball.r >= brick.y + brick.h) ball.vy *= -1;
      else if (oldX + ball.r <= brick.x || oldX - ball.r >= brick.x + brick.w) ball.vx *= -1;
      else ball.vy *= -1;
      score += 100;
      updateScore();
      sound("brick");
      if (bricks.every((item) => !item.alive)) {
        setState("won");
        window.arcadeAudio?.select();
      }
      break;
    }
    if (ball.y - ball.r > height) {
      lives--;
      updateScore();
      sound("miss");
      setState(lives ? "ready" : "lost");
      tetherBall();
    }
  };
  const draw = () => {
    ctx.fillStyle = "#100b1b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#26182e";
    for (let y = 12; y < height; y += 24) for (let x = 12; x < width; x += 24) ctx.fillRect(x, y, 1, 1);
    for (const brick of bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = "#682044";
      ctx.fillRect(brick.x + 2, brick.y + 3, brick.w, brick.h);
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillStyle = "#ffffff66";
      ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, 2);
    }
    ctx.fillStyle = "#ff396e";
    ctx.fillRect(Math.round(paddle.x) + 2, paddle.y + 3, paddle.w, paddle.h);
    ctx.fillStyle = "#ffe77c";
    ctx.fillRect(Math.round(paddle.x), paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = "#5ef2ce";
    ctx.fillRect(Math.round(ball.x - ball.r), Math.round(ball.y - ball.r), ball.r * 2, ball.r * 2);
    if (state === "paused" || state === "won" || state === "lost") {
      ctx.fillStyle = "#100b1bbf";
      ctx.fillRect(0, 145, width, 60);
      ctx.fillStyle = "#ffe77c";
      ctx.font = '18px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText(state === "paused" ? "PAUSED" : state === "won" ? "STAGE CLEAR" : "GAME OVER", width / 2, 182);
    }
  };
  const tick = (time) => {
    let remaining = Math.min((time - previousTime) / 1000 || 0, .04);
    previousTime = time;
    while (remaining > 0) {
      const dt = Math.min(remaining, .008);
      advance(dt);
      remaining -= dt;
    }
    draw();
    if (dialog.open) frame = requestAnimationFrame(tick);
  };
  trigger.addEventListener("click", () => {
    if (document.body.classList.contains("is-loading") || document.querySelector("#spin-button").disabled) return;
    const now = Date.now();
    secretClicks = now - lastSecretClick > 2500 ? 1 : secretClicks + 1;
    lastSecretClick = now;
    if (secretClicks < 5) return;
    secretClicks = 0;
    reset();
    dialog.showModal();
    canvas.focus({ preventScroll: true });
    dialog.animate([{ opacity: 0, transform: "translateX(-4px)" }, { opacity: 1, transform: "translateX(3px)" }, { opacity: 1, transform: "none" }], { duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220 });
    window.arcadeAudio?.select();
    previousTime = performance.now();
    frame = requestAnimationFrame(tick);
  });
  document.querySelector("#breakout-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { cancelAnimationFrame(frame); keys.clear(); });
  action.addEventListener("click", () => {
    if (state === "playing") { setState("paused"); keys.clear(); }
    else launch();
  });
  const movePointer = (event) => {
    const bounds = canvas.getBoundingClientRect();
    paddle.x = Math.max(0, Math.min(width - paddle.w, (event.clientX - bounds.left) / bounds.width * width - paddle.w / 2));
    if (state === "ready") tetherBall();
  };
  canvas.addEventListener("pointermove", movePointer);
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    movePointer(event);
    canvas.setPointerCapture(event.pointerId);
    if (state !== "paused") launch();
  });
  window.addEventListener("keydown", (event) => {
    if (!dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); keys.add(event.key); }
    if (["Enter", " "].includes(event.key) && !event.target.closest("button")) { event.preventDefault(); if (!event.repeat) launch(); }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key));
  const pause = () => { keys.clear(); if (dialog.open && state === "playing") setState("paused"); };
  window.addEventListener("blur", pause);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
})();
