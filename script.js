(() => {
  // ===============================
  // Lock scroll immediately on load
  // ===============================
  document.documentElement.classList.add("scroll-locked");
  document.body.classList.add("scroll-locked");

  // Ensure page starts at top
  window.scrollTo(0, 0);

  const wrap = document.getElementById("wrap");
  const btn  = document.getElementById("sealBtn");
  const vid  = document.getElementById("envVideo");
  const hint = document.getElementById("hint");

  const countdownSection = document.getElementById("countdownSection");
  

  vid.muted = true;
  vid.playsInline = true;

  const PLAY_MS = 2800;
  let isPlaying = false;
  let stopTimer = null;

  // Turn this on/off depending on what you want:
  const AUTO_SCROLL_TO_COUNTDOWN = false;

  function unlockScroll(){
    document.documentElement.classList.remove("scroll-locked");
    document.body.classList.remove("scroll-locked");

    document.documentElement.classList.add("scroll-unlocked");
    document.body.classList.add("scroll-unlocked");
  }

  function showScrollIndicator(){
    const indicator = document.querySelector(".scroll-indicator");
    if (indicator) indicator.classList.add("is-visible");
  }


  function showMarried(){
    if (stopTimer) clearTimeout(stopTimer);
    stopTimer = null;

    vid.pause();
    wrap.classList.remove("is-playing");
    wrap.classList.add("show-married");
    // unlock scroll now
    unlockScroll();
    showScrollIndicator();

    btn.disabled = true;
    isPlaying = false;

    // Optional: smooth scroll down after the heart finishes
    if (AUTO_SCROLL_TO_COUNTDOWN && countdownSection) {
      setTimeout(() => {
        countdownSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 2600); // timed to your heart animations
    }
  }

  async function playClick(){
    if (wrap.classList.contains("show-married")) return;
    if (isPlaying) return;

    isPlaying = true;
    if (hint) hint.style.opacity = "0";
    wrap.classList.add("is-playing");

    if (stopTimer) clearTimeout(stopTimer);
    try { vid.currentTime = 0; } catch (e) {}

    try{
      const p = vid.play();
      if (p && typeof p.then === "function") await p;
    }catch(e){
      wrap.classList.remove("is-playing");
      isPlaying = false;
      if (hint) hint.style.opacity = "1";
      return;
    }

    stopTimer = setTimeout(showMarried, PLAY_MS);
  }

  vid.addEventListener("ended", showMarried);

  btn.addEventListener("pointerup", (e) => {
    e.preventDefault();
    playClick();
  }, { passive:false });

  btn.addEventListener("click", playClick);

  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playClick();
    }
  });

  // ---------------------------
  // Odometer helpers
  // ---------------------------
  function createOdometer(el, digits){
    el.innerHTML = "";
    const cols = [];

    for (let i=0; i<digits; i++){
      const col = document.createElement("div");
      col.className = "odo-col";

      const stack = document.createElement("div");
      stack.className = "odo-stack";

      // 0..9 twice for smoother roll
      for (let r=0; r<2; r++){
        for (let d=0; d<=9; d++){
          const digit = document.createElement("div");
          digit.className = "odo-digit";
          digit.textContent = String(d);
          stack.appendChild(digit);
        }
      }

      col.appendChild(stack);
      el.appendChild(col);
      cols.push({ stack, value: 0 });
    }

    return {
      cols,
      setValue(numberStr){
        const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--odo-digit-h")) || 40;

        for (let i=0; i<digits; i++){
          const targetDigit = parseInt(numberStr[i], 10);
          const curAbs = cols[i].value;
          const curDigit = curAbs % 10;

          let nextAbs = curAbs;

          if (targetDigit !== curDigit){
            let delta = targetDigit - curDigit;
            if (delta < 0) delta += 10;
            nextAbs = curAbs + delta;

            // prevent infinite growth
            if (nextAbs >= 15) nextAbs = nextAbs % 10;
          }

          cols[i].value = nextAbs;
          cols[i].stack.style.transform = `translateY(${-nextAbs * h}px)`;
        }
      }
    };
  }

  // ---------------------------
  // Countdown
  // ---------------------------
  const weddingDate = new Date("2026-07-26T00:00:00");

  const odoDays    = createOdometer(document.getElementById("odo-days"), 3);
  const odoHours   = createOdometer(document.getElementById("odo-hours"), 2);
  const odoMinutes = createOdometer(document.getElementById("odo-minutes"), 2);
  const odoSeconds = createOdometer(document.getElementById("odo-seconds"), 2);

  function updateCountdown(){
    const now = new Date();
    let diff = weddingDate - now;
    if (diff < 0) diff = 0;

    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    const dStr = String(Math.min(d, 999)).padStart(3, "0");
    const hStr = String(h).padStart(2, "0");
    const mStr = String(m).padStart(2, "0");
    const sStr = String(s).padStart(2, "0");

    odoDays.setValue(dStr);
    odoHours.setValue(hStr);
    odoMinutes.setValue(mStr);
    odoSeconds.setValue(sStr);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
  const items = Array.from(document.querySelectorAll(".faq-item"));
  if (!items.length) return;

  function closeItem(btn){
    btn.setAttribute("aria-expanded", "false");
    const ans = btn.nextElementSibling;
    if (ans) ans.hidden = true;
  }

  function openItem(btn){
    btn.setAttribute("aria-expanded", "true");
    const ans = btn.nextElementSibling;
    if (ans) ans.hidden = false;
  }

  items.forEach(btn => {
    closeItem(btn); // ensure consistent initial state

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // close others (single-open accordion)
      items.forEach(b => { if (b !== btn) closeItem(b); });

      if (isOpen) closeItem(btn);
      else openItem(btn);
    });
  });
})();