// Self-contained 60-second canvas game. All coordinates use a fixed logical stage.
(() => {
  const canvas = document.querySelector("#survivor-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const action = document.querySelector("#survivor-action");
  const overlay = document.querySelector("#survivor-overlay");
  const status = document.querySelector("#survivor-status");
  const timeLabel = document.querySelector("#survivor-time");
  const scoreLabel = document.querySelector("#survivor-score");
  const bestLabel = document.querySelector("#survivor-best");
  const keys = new Set();
  const player = { x: 320, y: 360, r: 4 };
  let best = 0;
  try { best = Math.max(0, Number(localStorage.getItem("neon-survivor-best")) || 0); } catch { /* Session play still works without storage. */ }
  let state = "ready";
  let elapsed = 0;
  let bonus = 0;
  let shields = 1;
  let slowUntil = 0;
  let safeUntil = 0;
  let bullets = [];
  let items = [];
  let sparks = [];
  let pointer = null;
  let previous = 0;
  let frame;
  let nextVolley = 1;
  let nextBurst = 12;
  let nextItem = 8;
  let itemNumber = 0;
  const score = () => Math.floor(elapsed * 100) + bonus;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const sound = (kind) => window.arcadeAudio?.gameHit(kind);
  const hud = () => {
    timeLabel.textContent = Math.max(0, 60 - elapsed).toFixed(1);
    scoreLabel.textContent = String(score()).padStart(5, "0");
    bestLabel.textContent = String(best).padStart(5, "0");
    status.textContent = `보호막 ${shields}` + (elapsed < slowUntil ? "회 · SLOW TIME!" : "회 · ◇ 보호막 / ⏱ 감속");
  };
  const message = (label, title, copy) => {
    document.querySelector("#survivor-result-label").textContent = label;
    document.querySelector("#survivor-result-title").textContent = title;
    document.querySelector("#survivor-result-copy").textContent = copy;
    overlay.hidden = false;
  };
  const end = (won) => {
    state = won ? "won" : "lost";
    if (won) bonus += 2000;
    const record = score() > best;
    if (record) {
      best = score();
      try { localStorage.setItem("neon-survivor-best", String(best)); } catch { /* Keep the record in memory. */ }
    }
    keys.clear();
    pointer = null;
    action.textContent = "RETRY ◀";
    hud();
    message(record ? "NEW HIGH SCORE!" : won ? "MISSION COMPLETE" : "TRY AGAIN", won ? "60초 생존 성공!" : "GAME OVER", `${score().toLocaleString()}점 · ${elapsed.toFixed(1)}초 생존 · Enter로 다시 도전하세요.`);
    if (won) window.arcadeAudio?.select();
    else sound("miss");
  };
  const particles = (x, y, color) => {
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      sparks.push({ x, y, vx: Math.cos(angle) * 65, vy: Math.sin(angle) * 65, life: .45, color });
    }
  };
  const shot = (x, y, angle, speed) => {
    bullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 4 });
  };
  const volley = () => {
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? -8 : side === 1 ? 648 : 32 + Math.random() * 576;
    const y = side === 2 ? -8 : side === 3 ? 488 : 32 + Math.random() * 416;
    const angle = Math.atan2(player.y - y, player.x - x);
    const count = elapsed < 20 ? 3 : 5;
    for (let i = 0; i < count; i++) shot(x, y, angle + (i - (count - 1) / 2) * .24, 95 + elapsed * 1.6);
  };
  const update = (dt) => {
    elapsed = Math.min(60, elapsed + dt);
    if (elapsed >= 60) { end(true); return; }
    let dx = Number(keys.has("ArrowRight") || keys.has("d")) - Number(keys.has("ArrowLeft") || keys.has("a"));
    let dy = Number(keys.has("ArrowDown") || keys.has("s")) - Number(keys.has("ArrowUp") || keys.has("w"));
    if (dx || dy) pointer = null;
    else if (pointer) { dx = pointer.x - player.x; dy = pointer.y - player.y; }
    const distance = Math.hypot(dx, dy);
    if (distance) {
      const step = pointer ? Math.min(distance, 275 * dt) : 275 * dt;
      player.x = clamp(player.x + dx / distance * step, 12, 628);
      player.y = clamp(player.y + dy / distance * step, 12, 468);
    }
    if (elapsed >= nextVolley) { volley(); nextVolley = elapsed + Math.max(.45, 1.15 - elapsed * .012); }
    if (elapsed >= nextBurst) {
      const x = 70 + Math.random() * 500;
      for (let i = 0; i < 11; i++) shot(x, 6, .15 + i * (Math.PI - .3) / 10, 100 + elapsed);
      nextBurst += 12;
    }
    if (elapsed >= nextItem) {
      items.push({ x: 60 + Math.random() * 520, y: 60 + Math.random() * 360, kind: itemNumber++ % 2 ? "shield" : "slow", until: elapsed + 8 });
      nextItem += 9;
    }
    const slow = elapsed < slowUntil ? .42 : 1;
    for (const bullet of bullets) {
      bullet.x += bullet.vx * dt * slow;
      bullet.y += bullet.vy * dt * slow;
      if (elapsed >= safeUntil && Math.hypot(bullet.x - player.x, bullet.y - player.y) < bullet.r + player.r) {
        if (!shields) { end(false); return; }
        shields--;
        safeUntil = elapsed + 1.2;
        particles(player.x, player.y, "#5ef2ce");
        bullets = bullets.filter((other) => Math.hypot(other.x - player.x, other.y - player.y) > 85);
        sound("paddle");
        break;
      }
    }
    bullets = bullets.filter((bullet) => bullet.x > -24 && bullet.x < 664 && bullet.y > -24 && bullet.y < 504);
    items = items.filter((item) => {
      if (elapsed > item.until) return false;
      if (Math.hypot(item.x - player.x, item.y - player.y) > 18) return true;
      if (item.kind === "shield") shields = Math.min(2, shields + 1);
      else slowUntil = elapsed + 4;
      bonus += 250;
      particles(item.x, item.y, item.kind === "shield" ? "#5ef2ce" : "#ffe77c");
      sound("brick");
      return false;
    });
    sparks = sparks.filter((spark) => {
      spark.life -= dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      return spark.life > 0;
    });
    hud();
  };
  const draw = () => {
    ctx.fillStyle = "#100b1b";
    ctx.fillRect(0, 0, 640, 480);
    ctx.strokeStyle = "#30203d";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 640; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke(); }
    for (let y = 0; y <= 480; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke(); }
    ctx.fillStyle = "#9c7aa8";
    for (let i = 0; i < 35; i++) ctx.fillRect((i * 97) % 640, (i * 59 + elapsed * 12) % 480, 2, 2);
    for (const bullet of bullets) {
      ctx.fillStyle = "#ff396e33"; ctx.fillRect(Math.round(bullet.x) - 7, Math.round(bullet.y) - 7, 14, 14);
      ctx.fillStyle = elapsed < slowUntil ? "#ffb04f" : "#ff7993";
      ctx.fillRect(Math.round(bullet.x) - 4, Math.round(bullet.y) - 4, 8, 8);
      ctx.fillStyle = "#ffe3a6"; ctx.fillRect(Math.round(bullet.x) - 1, Math.round(bullet.y) - 1, 2, 2);
    }
    for (const item of items) {
      ctx.strokeStyle = item.kind === "shield" ? "#5ef2ce" : "#ffe77c";
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(item.x) - 10, Math.round(item.y) - 10, 20, 20);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = 'bold 15px monospace'; ctx.textAlign = "center";
      ctx.fillText(item.kind === "shield" ? "◇" : "S", item.x, item.y + 5);
    }
    for (const spark of sparks) { ctx.fillStyle = spark.color; ctx.fillRect(Math.round(spark.x), Math.round(spark.y), 3, 3); }
    if (!(elapsed < safeUntil && Math.floor(elapsed * 12) % 2)) {
      ctx.fillStyle = "#5ef2ce";
      const x = Math.round(player.x), y = Math.round(player.y);
      ctx.fillRect(x - 3, y - 12, 6, 21); ctx.fillRect(x - 11, y + 1, 22, 6);
      ctx.fillStyle = "#ff396e"; ctx.fillRect(x - 3, y + 10, 6, 6);
      if (shields) { ctx.strokeStyle = "#5ef2ce77"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = "#171126"; ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = "#fff7dc"; ctx.fillRect(x - 3, y - 3, 6, 6);
    }
    ctx.fillStyle = "#ffe77c"; ctx.fillRect(0, 477, 640 * elapsed / 60, 3);
  };
  const tick = (now) => {
    if (state !== "playing") return;
    update(Math.min((now - previous) / 1000, .033));
    previous = now;
    draw();
    if (state === "playing") frame = requestAnimationFrame(tick);
  };
  const play = () => {
    state = "playing";
    overlay.hidden = true;
    action.textContent = "PAUSE";
    previous = performance.now();
    frame = requestAnimationFrame(tick);
    canvas.focus({ preventScroll: true });
  };
  const start = () => {
    cancelAnimationFrame(frame);
    elapsed = bonus = slowUntil = safeUntil = itemNumber = 0;
    shields = 1; bullets = []; items = []; sparks = [];
    nextVolley = 1; nextBurst = 12; nextItem = 8;
    player.x = 320; player.y = 360;
    keys.clear(); pointer = null;
    hud(); play();
  };
  const pause = () => {
    if (state !== "playing") return;
    state = "paused"; cancelAnimationFrame(frame); keys.clear(); pointer = null;
    action.textContent = "RESUME ◀";
    message("TAKE A BREATH", "PAUSED", "Enter 또는 RESUME으로 계속하세요.");
    draw();
  };
  action.addEventListener("click", () => {
    if (document.body.classList.contains("is-loading")) return;
    if (state === "playing") pause();
    else if (state === "paused") play();
    else start();
  });
  window.addEventListener("keydown", (event) => {
    if (document.body.classList.contains("is-loading") || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"].includes(key) && !event.target.closest("a")) {
      event.preventDefault(); if (state === "playing") keys.add(key);
    }
    if ((key === "Enter" || key === " ") && !event.repeat && !event.target.closest("a, button")) { event.preventDefault(); action.click(); }
    if (key === "Escape" && !event.repeat) { event.preventDefault(); if (state === "playing") pause(); }
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
  const move = (event) => {
    if (state !== "playing") return;
    const box = canvas.getBoundingClientRect();
    pointer = { x: (event.clientX - box.left) / box.width * 640, y: (event.clientY - box.top) / box.height * 480 };
  };
  canvas.addEventListener("pointerdown", (event) => { if (event.button === 0) { canvas.setPointerCapture(event.pointerId); move(event); } });
  canvas.addEventListener("pointermove", (event) => { if (event.pointerType === "mouse" || canvas.hasPointerCapture(event.pointerId)) move(event); });
  canvas.addEventListener("pointercancel", () => { pointer = null; });
  canvas.addEventListener("pointerup", (event) => { if (event.pointerType !== "mouse") pointer = null; });
  window.addEventListener("blur", pause);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  window.addEventListener("pagehide", () => { pause(); cancelAnimationFrame(frame); });
  hud(); draw();
})();
