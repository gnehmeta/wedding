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

  if (vid) {
    vid.muted = true;
    vid.playsInline = true;
  }

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

    if (vid) vid.pause();
    if (wrap) {
      wrap.classList.remove("is-playing");
      wrap.classList.add("show-married");
    }

    unlockScroll();
    showScrollIndicator();

    if (btn) btn.disabled = true;
    isPlaying = false;

    // Optional: smooth scroll down after the heart finishes
    if (AUTO_SCROLL_TO_COUNTDOWN && countdownSection) {
      setTimeout(() => {
        countdownSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 2600);
    }
  }

  async function playClick(){
    if (!wrap || !vid) return;
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

  if (vid) vid.addEventListener("ended", showMarried);

  if (btn) {
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
  }

  // ---------------------------
  // Odometer helpers
  // ---------------------------
  function createOdometer(el, digits){
    if (!el) {
      return {
        cols: [],
        setValue(){ /* noop */ }
      };
    }

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

  // ---------------------------
  // FAQ accordion (do NOT return if FAQ missing)
  // ---------------------------
  const items = Array.from(document.querySelectorAll(".faq-item"));

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

  if (items.length) {
    items.forEach(btn => {
      closeItem(btn);

      btn.addEventListener("click", () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true";
        items.forEach(b => { if (b !== btn) closeItem(b); });
        if (isOpen) closeItem(btn);
        else openItem(btn);
      });
    });
  }

  // ---------------------------
  // RSVP dynamic guest names
  // ---------------------------
  const rsvpForm = document.getElementById("rsvpForm");
  const rsvpNote = document.getElementById("rsvpNote");
  const guestsInput = document.getElementById("rsvpGuests");
  const guestNamesWrap = document.getElementById("guestNamesWrap");
  const guestNamesList = document.getElementById("guestNamesList");

  function getAttendValue() {
    const yes = rsvpForm?.querySelector('input[name="attend"][value="yes"]');
    const no  = rsvpForm?.querySelector('input[name="attend"][value="no"]');
    if (yes?.checked) return "yes";
    if (no?.checked) return "no";
    return "";
  }

  function normalizeGuests(n) {
    const v = parseInt(n, 10);
    if (!Number.isFinite(v)) return 1;
    return Math.max(1, Math.min(10, v));
  }

  function readExistingGuestNames() {
    if (!guestNamesList) return [];
    return Array.from(guestNamesList.querySelectorAll("input"))
      .map(i => (i.value || "").trim());
  }

  function renderGuestNameFields() {
    if (!rsvpForm || !guestsInput || !guestNamesWrap || !guestNamesList) return;

    const attend = getAttendValue();
    const guests = normalizeGuests(guestsInput.value);
    const extraCount = Math.max(0, guests - 1);

    if (attend !== "yes" || extraCount === 0) {
      guestNamesList.innerHTML = "";
      guestNamesWrap.hidden = true;
      return;
    }

    const prev = readExistingGuestNames();
    guestNamesWrap.hidden = false;
    guestNamesList.innerHTML = "";

    for (let i = 0; i < extraCount; i++) {
      const label = document.createElement("label");
      label.className = "rsvp-label";
      label.style.marginTop = "0";
      label.textContent = `Guest ${i + 2} Name`;

      const input = document.createElement("input");
      input.className = "rsvp-input";
      input.type = "text";
      input.name = `guest_name_${i + 2}`;
      input.placeholder = `Guest ${i + 2} name`;
      input.required = true;
      input.value = prev[i] || "";

      guestNamesList.appendChild(label);
      guestNamesList.appendChild(input);
    }
  }

  if (rsvpForm) {
    rsvpForm.addEventListener("change", (e) => {
      if (e.target && e.target.name === "attend") renderGuestNameFields();
    });

    if (guestsInput) {
      guestsInput.addEventListener("input", renderGuestNameFields);
      guestsInput.addEventListener("change", renderGuestNameFields);
    }

    renderGuestNameFields();

    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fd = new FormData(rsvpForm);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const attend = (fd.get("attend") || "").toString().trim();
      const guests = normalizeGuests(fd.get("guests"));

      if (!name || (attend !== "yes" && attend !== "no")) {
        if (rsvpNote) rsvpNote.textContent = "Please complete the required fields.";
        return;
      }

      let guestNames = [];
      if (attend === "yes" && guests > 1) {
        guestNames = Array.from(guestNamesList?.querySelectorAll("input") || [])
          .map(i => (i.value || "").trim());

        if (guestNames.some(v => !v)) {
          if (rsvpNote) rsvpNote.textContent = "Please enter all guest names.";
          return;
        }
      }

      if (rsvpNote) {
        rsvpNote.textContent =
          attend === "yes"
            ? `Thank you, ${name}. RSVP received for ${guests} guest(s).`
            : `Thank you, ${name}. We appreciate your response.`;
      }

      // Later: submit to backend (when you decide)
    });
  }

  // ---------------------------
  // Logistics: Hotels & Taxis (MAPS LINK ONLY)
  // ---------------------------
  const logisticsForm = document.getElementById("logisticsForm");
  const hotelMore = document.getElementById("hotelMore");
  const taxiMore = document.getElementById("taxiMore");
  const pickupAddress = document.getElementById("pickupAddress"); // optional details
  const pickupMapsUrl = document.getElementById("pickupMapsUrl"); // required when taxi=yes
  const logisticsNote = document.getElementById("logisticsNote");
  const logisticsSaveBtn = document.getElementById("logisticsSaveBtn");

  function getCheckedValue(form, name){
    const el = form?.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  function toggleLogistics(){
    if (!logisticsForm) return;

    const hotelNeed = getCheckedValue(logisticsForm, "hotel_need");
    const taxiNeed  = getCheckedValue(logisticsForm, "taxi_need");

    if (hotelMore) hotelMore.hidden = (hotelNeed !== "yes");
    if (taxiMore)  taxiMore.hidden  = (taxiNeed !== "yes");

    // Maps link is required only when taxi=yes
    if (pickupMapsUrl) {
      pickupMapsUrl.required = false;           // NOT required anymore
      if (taxiNeed !== "yes") pickupMapsUrl.value = "";
    }


    // Address textarea becomes optional details only
    if (pickupAddress) {
      pickupAddress.required = false;
      if (taxiNeed !== "yes") pickupAddress.value = "";
    }
  }

  if (logisticsForm) {
    logisticsForm.addEventListener("change", toggleLogistics);
    toggleLogistics();

    if (logisticsSaveBtn) {
      logisticsSaveBtn.addEventListener("click", () => {
        const hotelNeed = getCheckedValue(logisticsForm, "hotel_need");
        const taxiNeed  = getCheckedValue(logisticsForm, "taxi_need");

        const hotelPeople = (document.getElementById("hotelPeople")?.value || "1").toString();
        const hotelNote   = (document.getElementById("hotelNote")?.value || "").toString().trim();

        const taxiPeople  = (document.getElementById("taxiPeople")?.value || "1").toString();
        const mapsLink    = (pickupMapsUrl?.value || "").toString().trim();
        const details     = (pickupAddress?.value || "").toString().trim();

        if (taxiNeed === "yes" && !mapsLink && logisticsNote) {
          logisticsNote.textContent = "Tip: you can paste a Google Maps link to make pickup easier.";
        }


        const payload = {
          hotelNeed,
          hotelPeople: hotelNeed === "yes" ? hotelPeople : "",
          hotelNote: hotelNeed === "yes" ? hotelNote : "",
          taxiNeed,
          taxiPeople: taxiNeed === "yes" ? taxiPeople : "",
          pickupMapsUrl: taxiNeed === "yes" ? mapsLink : "",
          pickupDetails: taxiNeed === "yes" ? details : ""
        };

        try {
          localStorage.setItem("wedding_logistics", JSON.stringify(payload));
          if (logisticsNote) logisticsNote.textContent = "Saved. Thank you.";
        } catch (e) {
          if (logisticsNote) logisticsNote.textContent = "Could not save on this device.";
        }
      });
    }
  }

  // ---------------------------
  // Final confirmation (single submit)
  // ---------------------------
  const finalSubmitBtn = document.getElementById("finalSubmitBtn");
  const finalNote = document.getElementById("finalNote");
  const messageForUs = document.getElementById("messageForUs");

  if (finalSubmitBtn) {
    finalSubmitBtn.addEventListener("click", () => {
      const message = (messageForUs?.value || "").trim();

      // Later: gather RSVP + logistics + message and send to backend
      // For now: just confirm UX

      finalNote.textContent = "Thank you! Your confirmation has been received 💛";

      finalSubmitBtn.disabled = true;
      finalSubmitBtn.style.opacity = "0.85";
    });
  }

})();
