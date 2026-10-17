// Original synthesized UI effects; no external audio samples.
(() => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  let context;
  let output;
  let muted = localStorage.getItem("arcade-muted") === "true";
  const toggle = document.createElement("button");
  toggle.className = "sound-toggle";
  toggle.type = "button";
  document.body.append(toggle);
  const update = () => {
    toggle.textContent = muted ? "♪ OFF" : "♪ ON";
    toggle.setAttribute("aria-label", muted ? "소리 켜기" : "소리 끄기");
    toggle.setAttribute("aria-pressed", String(!muted));
    if (output) output.gain.setTargetAtTime(muted ? 0 : .22, context.currentTime, .025);
  };
  const note = (midi, time, duration, volume, type = "square") => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + .008);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(envelope).connect(output);
    oscillator.start(time);
    oscillator.stop(time + duration + .02);
  };
  const unlock = () => {
    if (!context) {
      context = new AudioContext();
      output = context.createGain();
      output.connect(context.destination);
      update();
    }
    if (context.state === "suspended") {
      context.resume();
    }
  };
  let spinFrame;
  let lastSelection = -1;
  window.arcadeAudio = {
    select() {
      unlock();
      if (muted || document.body.classList.contains("is-loading")) return;
      const time = context.currentTime;
      if (time - lastSelection < .055) return;
      lastSelection = time;
      lastEffect = time;
      [76, 83, 88].forEach((pitch, index) => note(pitch, time + index * .055, .16, .32));
    },
    gameHit(kind) {
      unlock();
      if (muted || document.hidden) return;
      const time = context.currentTime;
      note(kind === "brick" ? 84 : kind === "miss" ? 43 : 69, time, kind === "miss" ? .25 : .07, .2);
    },
    startSpin(animation) {
      unlock();
      cancelAnimationFrame(spinFrame);
      let nextTick = 0;
      let tick = 0;
      const duration = animation.effect.getTiming().duration;
      const roll = () => {
        if (animation.playState === "idle" || animation.playState === "finished") return;
        const elapsed = Number(animation.currentTime || 0);
        const progress = Math.min(elapsed / duration, 1);
        if (elapsed >= nextTick) {
          if (!muted && !document.hidden && context.state === "running") {
            note([72, 76, 79, 76][tick % 4], context.currentTime, .055, .28);
          }
          const interval = progress < .24
            ? 180 - 135 * (progress / .24)
            : progress < .48 ? 45 : 45 + 230 * ((progress - .48) / .52) ** 2;
          nextTick = elapsed + interval;
          tick++;
        }
        spinFrame = requestAnimationFrame(roll);
      };
      spinFrame = requestAnimationFrame(roll);
    },
    finishSpin() {
      cancelAnimationFrame(spinFrame);
      if (!context || muted || document.hidden) return;
      const time = context.currentTime;
      [79, 83, 88].forEach((pitch, index) => note(pitch, time + index * .075, .2, .25));
    },
  };
  let lastEffect = 0;
  const effect = (confirm) => {
    if (!context || muted || document.body.classList.contains("is-loading")) return;
    const time = context.currentTime;
    if (time - lastEffect < .055) return;
    lastEffect = time;
    note(confirm ? 79 : 72, time, .065, .25);
    if (confirm) note(86, time + .07, .12, .2);
  };
  toggle.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem("arcade-muted", String(muted));
    unlock();
    update();
  });
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("click", (event) => {
    if (event.target.closest(".choice-link, .game-choice")) return;
    if (event.target.closest(".pick-answer, .detail-link")) {
      window.arcadeAudio.select();
      return;
    }
    if (event.target.closest("a, button") && !event.target.closest(".sound-toggle")) effect(true);
  }, { capture: true });
  document.addEventListener("pointerover", (event) => {
    const control = event.target.closest("a, button");
    if (control && !control.matches(".game-choice") && !control.contains(event.relatedTarget)) effect(false);
  });
  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (["Enter", " ", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      unlock();
      const choosingGame = !document.querySelector("#pick-confirm")?.hidden && document.querySelector("#pick-confirm") && ["Enter", " "].includes(event.key);
      const selectingInMenu = !event.target.closest(".pixel-header, .sound-toggle, .lobby-history") && (
        (document.body.classList.contains("start-page") && event.key === "Enter") ||
        (document.body.dataset.page === "games" && !document.querySelector("#game-dialog")?.open && ["Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key))
      );
      if (!choosingGame && !selectingInMenu) effect(event.key === "Enter" || event.key === " ");
    }
  }, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (!context) return;
    if (document.hidden) context.suspend();
    else unlock();
  });
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(spinFrame);
    context?.suspend();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && context) {
      unlock();
    }
  });
  update();
})();
