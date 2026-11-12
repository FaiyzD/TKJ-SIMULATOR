(function () {
  "use strict";

  const $ = function (id) {
    return document.getElementById(id);
  };

  const App = {};
  window.TKJ = App;

  const LEVELS = [
    { min: 0, name: "PEMULA" },
    { min: 450, name: "TEKNISI MAGANG" },
    { min: 1000, name: "TEKNISI JARINGAN" },
    { min: 1400, name: "ADMIN LAB" },
    { min: 1750, name: "MASTER TKJ" }
  ];

  const MISSION_META = {
    1: {
      label: "MISI 01 · POWER ON",
      kicker: "MISI 01 · POWER ON",
      title: "Menyalakan Komputer",
      intro: "Sambungkan daya, nyalakan CPU, dan tunggu Windows siap.",
      resultTitle: "Workstation Menyala",
      resultCopy: "Rangkaian daya terpasang dan Windows berhasil dimuat."
    },
    2: {
      label: "MISI 02 · HARDWARE ASSEMBLY",
      kicker: "MISI 02 · HARDWARE ASSEMBLY",
      title: "Perakitan Komputer",
      intro: "Pasang setiap komponen ke dalam casing workstation.",
      resultTitle: "Perakitan Selesai",
      resultCopy: "Seluruh komponen terpasang pada casing workstation A-01."
    },
    3: {
      label: "MISI 03 · NETWORK PRACTICE",
      kicker: "MISI 03 · NETWORK PRACTICE",
      title: "Praktik Jaringan",
      intro: "Siapkan kabel UTP, hubungkan PC ke switch, lalu uji jaringan.",
      resultTitle: "Jaringan Terhubung",
      resultCopy: "PC-LAB-01 berhasil terhubung ke switch dan merespons ping."
    }
  };

  const M1_STEPS = [
    {
      title: "Temukan kabel power",
      sub: "Ambil kabel dari meja kerja",
      objective: "Temukan kabel power yang berada di area meja kerja.",
      hint: "Kabel power tergulung di dekat keyboard. Klik penanda interaktif untuk mengambilnya."
    },
    {
      title: "Sambungkan ke stopkontak",
      sub: "Tarik steker ke dinding",
      objective: "Tarik kabel power ke stopkontak di dinding.",
      hint: "Tahan panel kabel di kiri bawah, geser ke cincin stopkontak, lalu lepaskan saat cincin berubah hijau."
    },
    {
      title: "Tekan tombol power",
      sub: "Hidupkan workstation",
      objective: "Tekan tombol power pada panel depan CPU.",
      hint: "Tombol power berada di sisi kanan atas casing. Klik penanda untuk menyalakan komputer."
    },
    {
      title: "Tunggu Windows siap",
      sub: "BIOS POST dan boot OS",
      objective: "Tunggu BIOS melakukan POST hingga Windows selesai dimuat.",
      hint: "Proses berjalan otomatis. Perhatikan layar monitor sampai desktop Windows muncul."
    }
  ];

  const state = {
    sessionStarted: false,
    current: 1,
    completed: { 1: false, 2: false, 3: false },
    missionScores: { 1: 0, 2: 0, 3: 0 },
    mistakes: { 1: 0, 2: 0, 3: 0 },
    level: 1,
    finishing: false,
    paused: false,
    soundMuted: false,
    m1: null
  };

  const DOM = {};
  let hotspotList = [];
  let m1Token = 0;
  let m1Timer = null;
  let m1BootTimer = null;
  let lastResultId = null;
  let resultPrimaryAction = null;
  let menuSource = "game";
  let levelUpTimer = null;
  let dragCleanup = null;

  App.state = state;
  App.meta = MISSION_META;
  App.dom = DOM;
  App.$ = $;
  App.levels = LEVELS;

  function cacheDom() {
    [
      "loader", "start-screen", "hud", "hud-mission-label", "stat-level", "stat-score",
      "level-name", "xp-label", "xp-fill", "instruction-panel", "panel-kicker",
      "panel-step-count", "panel-title", "panel-objective", "step-list", "panel-hint",
      "panel-controls", "objective-pill", "objective-text", "interaction-guide",
      "guide-text", "hotspots", "crosshair", "toasts", "level-up", "level-up-name",
      "drag-layer", "drag-svg", "drag-path", "hand-dock", "outlet-target", "drag-ghost",
      "mission-intro", "intro-kicker", "intro-title", "intro-copy", "screen-flash",
      "mission2", "mission3", "modal-menu", "menu-close", "menu-level", "menu-score",
      "menu-done", "menu-mission-list", "menu-resume", "menu-restart", "menu-home",
      "modal-brief", "brief-close", "brief-ok", "modal-result", "result-kicker",
      "result-title", "result-copy", "result-stars", "result-points", "result-accuracy",
      "result-level", "result-unlock", "result-primary", "result-secondary",
      "modal-final", "final-grade", "final-score", "final-level", "final-accuracy",
      "final-restart", "final-home", "btn-play", "btn-brief", "btn-sound", "btn-menu",
      "m2-case-panel", "m2-step-list", "m2-objective", "m2-hint", "m2-progress-label",
      "m2-progress-bar", "m2-components", "m2-component-counter", "m2-status",
      "m2-case", "m2-case-state", "m3-step-list", "m3-objective", "m3-hint",
      "m3-progress-label", "m3-progress-bar", "m3-tool", "m3-canvas", "m3-cable-svg",
      "m3-cable-base", "m3-cable-flow", "m3-link-status", "m3-net-chip", "m3-pc-ip",
      "m3-switch-ip", "overlay-drag", "app"
    ].forEach(function (id) {
      DOM[id] = $(id);
    });
    DOM.startScreen = DOM["start-screen"];
    DOM.hudMission = DOM["hud-mission-label"];
    DOM.panelStepCount = DOM["panel-step-count"];
    DOM.panelTitle = DOM["panel-title"];
    DOM.panelObjective = DOM["panel-objective"];
    DOM.stepList = DOM["step-list"];
    DOM.panelHint = DOM["panel-hint"];
    DOM.panelControls = DOM["panel-controls"];
    DOM.objectivePill = DOM["objective-pill"];
    DOM.objectiveText = DOM["objective-text"];
    DOM.interactionGuide = DOM["interaction-guide"];
    DOM.guideText = DOM["guide-text"];
    DOM.dragSvg = DOM["drag-svg"];
    DOM.dragPath = DOM["drag-path"];
    DOM.handDock = DOM["hand-dock"];
    DOM.outletTarget = DOM["outlet-target"];
    DOM.dragGhost = DOM["drag-ghost"];
    DOM.missionIntro = DOM["mission-intro"];
    DOM.introKicker = DOM["intro-kicker"];
    DOM.introTitle = DOM["intro-title"];
    DOM.introCopy = DOM["intro-copy"];
    DOM.screenFlash = DOM["screen-flash"];
    DOM.modalMenu = DOM["modal-menu"];
    DOM.menuClose = DOM["menu-close"];
    DOM.menuLevel = DOM["menu-level"];
    DOM.menuScore = DOM["menu-score"];
    DOM.menuDone = DOM["menu-done"];
    DOM.menuMissionList = DOM["menu-mission-list"];
    DOM.menuResume = DOM["menu-resume"];
    DOM.menuRestart = DOM["menu-restart"];
    DOM.menuHome = DOM["menu-home"];
    DOM.modalBrief = DOM["modal-brief"];
    DOM.modalResult = DOM["modal-result"];
    DOM.resultKicker = DOM["result-kicker"];
    DOM.resultTitle = DOM["result-title"];
    DOM.resultCopy = DOM["result-copy"];
    DOM.resultStars = DOM["result-stars"];
    DOM.resultPoints = DOM["result-points"];
    DOM.resultAccuracy = DOM["result-accuracy"];
    DOM.resultLevel = DOM["result-level"];
    DOM.resultUnlock = DOM["result-unlock"];
    DOM.resultPrimary = DOM["result-primary"];
    DOM.resultSecondary = DOM["result-secondary"];
    DOM.modalFinal = DOM["modal-final"];
    DOM.finalGrade = DOM["final-grade"];
    DOM.finalScore = DOM["final-score"];
    DOM.finalLevel = DOM["final-level"];
    DOM.finalAccuracy = DOM["final-accuracy"];
    DOM.finalRestart = DOM["final-restart"];
    DOM.finalHome = DOM["final-home"];
    DOM.overlayDrag = DOM["overlay-drag"];
    DOM.handDock = DOM["hand-dock"];
    DOM.btnPlay = DOM["btn-play"];
    DOM.btnBrief = DOM["btn-brief"];
    DOM.btnSound = DOM["btn-sound"];
    DOM.btnMenu = DOM["btn-menu"];
    DOM.statLevel = DOM["stat-level"];
    DOM.statScore = DOM["stat-score"];
    DOM.instructionPanel = DOM["instruction-panel"];
    DOM.panelKicker = DOM["panel-kicker"];
    DOM.levelUp = DOM["level-up"];
    DOM.levelUpName = DOM["level-up-name"];
  }

  function totalScore() {
    return state.missionScores[1] + state.missionScores[2] + state.missionScores[3];
  }

  function levelFor(score) {
    let index = 0;
    for (let i = 0; i < LEVELS.length; i++) {
      if (score >= LEVELS[i].min) index = i;
    }
    return {
      index: index + 1,
      name: LEVELS[index].name,
      min: LEVELS[index].min,
      next: LEVELS[index + 1] ? LEVELS[index + 1].min : null
    };
  }

  function updateHUD() {
    const score = totalScore();
    const level = levelFor(score);
    if (DOM.statScore) {
      DOM.statScore.textContent = String(score).padStart(4, "0");
      DOM.statLevel.textContent = String(level.index).padStart(2, "0");
      DOM["level-name"].textContent = level.name;
    }
    if (DOM["xp-fill"]) {
      let progress = 1;
      let label = score + " / " + score + " XP";
      if (level.next !== null) {
        progress = (score - level.min) / (level.next - level.min);
        label = (score - level.min) + " / " + (level.next - level.min) + " XP";
      }
      DOM["xp-fill"].style.width = Math.round(Math.max(0, Math.min(1, progress)) * 100) + "%";
      DOM["xp-label"].textContent = label;
    }
    if (level.index > state.level) {
      state.level = level.index;
      showLevelUp(level.name);
    } else {
      state.level = level.index;
    }
    updateMenuSummary();
  }

  function updateMenuSummary() {
    if (!DOM.menuLevel) return;
    const score = totalScore();
    const level = levelFor(score);
    DOM.menuLevel.textContent = String(level.index).padStart(2, "0") + " · " + level.name;
    DOM.menuScore.textContent = String(score).padStart(4, "0");
    const done = Number(state.completed[1]) + Number(state.completed[2]) + Number(state.completed[3]);
    DOM.menuDone.textContent = done + " / 3";
  }

  function bumpScore() {
    if (!DOM.statScore) return;
    DOM.statScore.classList.remove("score-bump");
    void DOM.statScore.offsetWidth;
    DOM.statScore.classList.add("score-bump");
    setTimeout(function () {
      DOM.statScore.classList.remove("score-bump");
    }, 380);
  }

  function showLevelUp(name) {
    if (!DOM.levelUp) return;
    DOM.levelUp.classList.remove("show");
    void DOM.levelUp.offsetWidth;
    DOM.levelUpName.textContent = name;
    DOM.levelUp.classList.add("show");
    if (window.LabAudio) window.LabAudio.levelUp();
    clearTimeout(levelUpTimer);
    levelUpTimer = setTimeout(function () {
      DOM.levelUp.classList.remove("show");
    }, 2800);
  }

  function showToast(title, message, type, duration) {
    if (!DOM.toasts) return;
    const toast = document.createElement("div");
    toast.className = "toast " + (type || "info");
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.textContent = type === "success" ? "✓" : type === "error" ? "!" : type === "warning" ? "!" : "i";
    const copy = document.createElement("div");
    copy.className = "toast-copy";
    const strong = document.createElement("strong");
    strong.textContent = title || "";
    const span = document.createElement("span");
    span.textContent = message || "";
    copy.appendChild(strong);
    if (message) copy.appendChild(span);
    toast.appendChild(icon);
    toast.appendChild(copy);
    DOM.toasts.appendChild(toast);
    while (DOM.toasts.children.length > 3) {
      DOM.toasts.removeChild(DOM.toasts.firstElementChild);
    }
    setTimeout(function () {
      toast.classList.add("is-out");
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 320);
    }, duration || 3400);
  }

  function flashScreen() {
    if (!DOM.screenFlash) return;
    DOM.screenFlash.classList.remove("flash");
    void DOM.screenFlash.offsetWidth;
    DOM.screenFlash.classList.add("flash");
    setTimeout(function () {
      DOM.screenFlash.classList.remove("flash");
    }, 700);
  }

  function setGuide(text, visible) {
    if (!DOM.interactionGuide) return;
    if (text) DOM.guideText.textContent = text;
    DOM.interactionGuide.classList.toggle("hidden", !visible);
  }

  function setQuestVisible(visible) {
    if (!DOM.hud) return;
    DOM.hud.classList.toggle("quest-hidden", !visible);
    const button = $("btn-quest");
    if (!button) return;
    const use = button.querySelector("use");
    if (use) use.setAttribute("href", visible ? "#i-eye-off" : "#i-eye");
    button.setAttribute("aria-label", visible ? "Sembunyikan panduan misi" : "Tampilkan panduan misi");
    button.setAttribute("title", visible ? "Sembunyikan panduan misi (Q)" : "Tampilkan panduan misi (Q)");
    button.classList.toggle("is-off", !visible);
  }

  function award(points) {
    const mission = state.current;
    state.missionScores[mission] = Math.max(0, state.missionScores[mission] + points);
    updateHUD();
    bumpScore();
  }

  function penalize(title, message) {
    const mission = state.current;
    state.mistakes[mission] += 1;
    state.missionScores[mission] = Math.max(0, state.missionScores[mission] - 10);
    updateHUD();
    if (window.LabAudio) window.LabAudio.error();
    showToast(title || "Kesalahan", message || "Poin berkurang 10. Periksa kembali langkah praktik.", "error");
  }

  function accuracyFor(mission) {
    return Math.max(0, Math.min(100, Math.round(100 - state.mistakes[mission] * 4)));
  }

  function starsFor(mission) {
    const mistakes = state.mistakes[mission];
    if (mistakes === 0) return 3;
    if (mistakes <= 2) return 2;
    return 1;
  }

  function showMissionIntro(mission) {
    const meta = MISSION_META[mission];
    if (!DOM.missionIntro || !meta) return;
    DOM.introKicker.textContent = meta.kicker;
    DOM.introTitle.textContent = meta.title;
    DOM.introCopy.textContent = meta.intro;
    DOM.missionIntro.classList.remove("is-visible");
    void DOM.missionIntro.offsetWidth;
    DOM.missionIntro.classList.add("is-visible");
  }

  function clearHotspots() {
    hotspotList = [];
    if (DOM.hotspots) DOM.hotspots.innerHTML = "";
  }

  function setHotspots(list) {
    clearHotspots();
    (list || []).forEach(function (config) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hotspot" + (config.tone === "amber" ? " amber" : "");
      button.setAttribute("aria-label", config.label);
      button.innerHTML =
        '<span class="hs-ring"><span class="hs-core"><svg><use href="' + config.icon + '"></use></svg></span></span>' +
        '<span class="hs-label"><small>' + config.kicker + "</small><strong>" + config.label + "</strong></span>";
      button.addEventListener("click", function () {
        if (window.LabAudio) window.LabAudio.click();
        if (config.onClick) config.onClick();
      });
      DOM.hotspots.appendChild(button);
      hotspotList.push({ element: button, anchor: config.anchor });
    });
    updateHotspots();
  }

  function updateHotspots() {
    if (!window.Lab || state.current !== 1) return;
    hotspotList.forEach(function (item) {
      const projected = window.Lab.project(item.anchor);
      item.element.classList.toggle("is-hidden", !projected.visible);
      if (projected.visible) {
        item.element.style.left = projected.x + "px";
        item.element.style.top = projected.y + "px";
      }
    });
  }

  function hideM1DragUi() {
    if (DOM.handDock) {
      DOM.handDock.classList.remove("is-visible", "is-source");
    }
    if (DOM.outletTarget) {
      DOM.outletTarget.classList.remove("is-visible", "near", "connected");
    }
    if (DOM.dragGhost) DOM.dragGhost.classList.remove("is-active");
    if (DOM.dragSvg) DOM.dragSvg.classList.remove("is-active");
    document.body.classList.remove("is-dragging");
    if (DOM.dragPath) DOM.dragPath.setAttribute("d", "");
  }

  function buildM1Steps(active) {
    DOM.stepList.innerHTML = M1_STEPS.map(function (step, index) {
      const done = index < active;
      const current = index === active && active < M1_STEPS.length;
      const dot = done
        ? '<svg><use href="#i-check"></use></svg>'
        : String(index + 1);
      return '<li class="step-item' + (done ? " done" : current ? " active" : "") + '">' +
        '<span class="step-dot">' + dot + "</span>" +
        '<span class="step-copy"><strong>' + step.title + "</strong><small>" + step.sub + "</small></span></li>";
    }).join("");
  }

  function updateM1Interface() {
    if (!state.m1) return;
    const step = Math.min(state.m1.step, 4);
    const current = M1_STEPS[Math.min(step, M1_STEPS.length - 1)];
    DOM.panelStepCount.textContent = Math.min(step + 1, 4) + " / 4";
    DOM.panelObjective.textContent = step >= 4 ? "Workstation menyala dan Windows siap digunakan." : current.objective;
    DOM.panelHint.textContent = step >= 4 ? "Praktik power-on selesai. Lanjutkan ke modul perakitan komputer." : current.hint;
    DOM.objectiveText.textContent = step >= 4 ? "Windows siap digunakan" : current.objective;
    buildM1Steps(step);
  }

  function startMission1() {
    if (!window.Lab || !window.Lab.ready) {
      showToast("Laboratorium belum siap", "Muat ulang halaman untuk memulai simulasi.", "error");
      return;
    }
    if (App.desktop && App.desktop.close) App.desktop.close();
    if (App.mission2 && App.mission2.stop) App.mission2.stop();
    if (App.mission3 && App.mission3.stop) App.mission3.stop();
    m1Token += 1;
    clearTimeout(m1Timer);
    clearTimeout(m1BootTimer);
    state.current = 1;
    state.finishing = false;
    state.completed[1] = false;
    state.missionScores[1] = 0;
    state.mistakes[1] = 0;
    state.m1 = {
      step: 0,
      taken: false,
      connected: false,
      powerReady: false,
      booting: false,
      bootDone: false,
      showOutlet: false,
      drag: null,
      stage: ""
    };
    lastResultId = null;
    hideAllModals();
    hideM1DragUi();
    clearHotspots();
    setGuide("", false);
    setQuestVisible(true);
    DOM.mission2.classList.add("hidden");
    DOM.mission2.setAttribute("aria-hidden", "true");
    DOM.mission3.classList.add("hidden");
    DOM.mission3.setAttribute("aria-hidden", "true");
    DOM.startScreen.classList.add("leaving");
    setTimeout(function () {
      DOM.startScreen.classList.add("hidden");
    }, 680);
    DOM.hud.classList.remove("hidden");
    DOM.hud.setAttribute("aria-hidden", "false");
    DOM.instructionPanel.classList.remove("hidden");
    DOM.objectivePill.classList.remove("hidden");
    DOM.crosshair.classList.remove("hidden");
    DOM.hudMission.textContent = MISSION_META[1].label;
    DOM.panelKicker.textContent = "MISI 01 · HARDWARE DASAR";
    DOM.panelTitle.textContent = "Menyalakan Komputer";
    DOM.panelControls.textContent = "Klik objek · Tarik kabel dengan mouse";
    updateM1Interface();
    updateHUD();
    window.Lab.reset();
    window.Lab.focusDesk();
    showMissionIntro(1);
    const token = m1Token;
    m1BootTimer = setTimeout(function () {
      if (token !== m1Token || state.current !== 1) return;
      setHotspots([
        {
          anchor: "cable",
          icon: "#i-cable",
          kicker: "INTERAKSI 01",
          label: "Ambil Kabel Power",
          onClick: pickUpCable
        }
      ]);
      setGuide("Klik kabel power di atas meja", true);
    }, 950);
  }

  function pickUpCable() {
    if (!state.m1 || state.m1.step !== 0 || state.current !== 1) return;
    state.m1.step = 1;
    state.m1.taken = true;
    state.m1.showOutlet = true;
    award(75);
    window.Lab.pickupCable();
    setHotspots([]);
    setGuide("", false);
    updateM1Interface();
    DOM.handDock.classList.add("is-visible");
    window.LabAudio.pickup();
    showToast("Kabel power diambil", "Tarik steker ke stopkontak pada dinding kanan.", "success");
    positionOutletTarget();
  }

  function positionOutletTarget() {
    if (!state.m1 || !state.m1.showOutlet || state.m1.connected) return;
    if (state.current !== 1) return;
    const projected = window.Lab.project("outlet");
    if (projected.visible) {
      DOM.outletTarget.style.left = projected.x + "px";
      DOM.outletTarget.style.top = projected.y + "px";
      DOM.outletTarget.classList.add("is-visible");
    } else {
      DOM.outletTarget.classList.remove("is-visible");
    }
  }

  function beginCableDrag(event) {
    if (!state.m1 || state.m1.step !== 1 || state.m1.connected || state.current !== 1) return;
    event.preventDefault();
    state.m1.drag = { active: true, x: event.clientX, y: event.clientY, near: false };
    DOM.handDock.classList.add("is-source");
    DOM.dragGhost.classList.add("is-active");
    DOM.dragSvg.classList.add("is-active");
    document.body.classList.add("is-dragging");
    updateCableDrag(event.clientX, event.clientY);
  }

  function updateCableDrag(x, y) {
    if (!state.m1 || !state.m1.drag || !state.m1.drag.active) return;
    state.m1.drag.x = x;
    state.m1.drag.y = y;
    const targetRect = DOM.outletTarget.getBoundingClientRect();
    const cx = targetRect.left + targetRect.width / 2;
    const cy = targetRect.top + targetRect.height / 2;
    const distance = Math.hypot(x - cx, y - cy);
    const near = distance < Math.max(76, targetRect.width * 0.58);
    state.m1.drag.near = near;
    DOM.outletTarget.classList.toggle("near", near);
    DOM.dragGhost.style.left = x + "px";
    DOM.dragGhost.style.top = y + "px";
    const handRect = DOM.handDock.getBoundingClientRect();
    const startX = handRect.left + 42;
    const startY = handRect.top + handRect.height / 2;
    const midX = (startX + x) / 2;
    const midY = Math.min(startY, y) - 55;
    DOM.dragPath.setAttribute("d", "M " + startX + " " + startY + " Q " + midX + " " + midY + " " + x + " " + y);
  }

  function finishCableDrag(event) {
    if (!state.m1 || !state.m1.drag || !state.m1.drag.active) return;
    const drag = state.m1.drag;
    state.m1.drag = null;
    updateCableDrag(event.clientX, event.clientY);
    DOM.handDock.classList.remove("is-source");
    DOM.dragGhost.classList.remove("is-active");
    DOM.dragSvg.classList.remove("is-active");
    document.body.classList.remove("is-dragging");
    DOM.dragPath.setAttribute("d", "");
    if (drag.near) {
      connectPowerCable();
      return;
    }
    DOM.outletTarget.classList.remove("near");
    DOM.handDock.classList.add("is-visible");
    if (window.LabAudio) window.LabAudio.warning();
    penalize("Kabel belum terhubung", "Lepaskan steker tepat di tengah cincin stopkontak.");
  }

  function connectPowerCable() {
    if (!state.m1 || state.m1.connected) return;
    state.m1.connected = true;
    state.m1.step = 2;
    state.m1.showOutlet = false;
    award(125);
    updateM1Interface();
    DOM.outletTarget.classList.add("connected");
    DOM.outletTarget.classList.remove("near");
    DOM.handDock.classList.remove("is-visible", "is-source");
    setTimeout(function () {
      DOM.outletTarget.classList.remove("is-visible", "connected");
    }, 540);
    window.LabAudio.connect();
    window.LabAudio.cable();
    window.Lab.focusOutlets();
    showToast("Kabel terhubung", "Stopkontak memberi daya. Cari tombol power pada CPU.", "success");
    const token = m1Token;
    window.Lab.connectCable(function () {
      if (token !== m1Token || state.current !== 1) return;
      state.m1.powerReady = true;
      window.Lab.focusPower();
      setHotspots([
        {
          anchor: "powerButton",
          icon: "#i-bolt",
          kicker: "KENDALI DAYA",
          label: "Tekan Tombol Power",
          tone: "amber",
          onClick: pressPower
        }
      ]);
      setGuide("Klik tombol power pada CPU", true);
    });
  }

  function pressPower() {
    if (!state.m1 || state.m1.step !== 2 || state.m1.booting || state.current !== 1) return;
    state.m1.step = 3;
    state.m1.booting = true;
    award(100);
    setHotspots([]);
    setGuide("", false);
    updateM1Interface();
    DOM.panelObjective.textContent = "BIOS sedang melakukan POST. Tunggu proses boot selesai.";
    DOM.objectiveText.textContent = "Tunggu Windows selesai dimuat";
    window.LabAudio.power();
    window.Lab.pressPower();
    flashScreen();
    showToast("Daya diteruskan", "CPU menyala. BIOS sedang melakukan POST.", "info");
    const token = m1Token;
    m1BootTimer = setTimeout(function () {
      if (token !== m1Token || state.current !== 1) return;
      window.Lab.focusMonitor();
    }, 780);
  }

  function handleBootStage(stage) {
    if (!state.m1 || state.m1.step < 3 || state.m1.bootDone || state.current !== 1) return;
    if (stage === "bios") {
      window.LabAudio.bios();
      showToast("POST berhasil", "BIOS mendeteksi prosesor, memori, dan SSD NVMe.", "success");
      DOM.panelHint.textContent = "BIOS POST selesai. Windows sedang disiapkan.";
    } else if (stage === "windows") {
      state.m1.stage = "windows";
      window.Lab.focusMonitor();
      window.LabAudio.windows();
      showToast("Windows dimuat", "Sistem operasi sedang memuat layanan dan desktop.", "info");
      DOM.panelObjective.textContent = "Windows sedang dimuat. Tunggu hingga desktop muncul.";
      DOM.objectiveText.textContent = "Tunggu desktop Windows";
      DOM.panelHint.textContent = "Boot manager berhasil. Jangan matikan daya saat proses berlangsung.";
    } else if (stage === "desktop") {
      state.m1.stage = "desktop";
      window.LabAudio.desktop();
      DOM.panelHint.textContent = "Desktop Windows muncul. Workstation siap digunakan.";
    }
  }

  function handleBootDone() {
    if (!state.m1 || state.m1.bootDone || state.current !== 1) return;
    if (!state.m1.booting) return;
    state.m1.bootDone = true;
    state.m1.step = 4;
    award(150);
    updateM1Interface();
    setHotspots([]);
    setGuide("Windows berhasil dimuat", true);
    DOM.panelObjective.textContent = "Workstation menyala dan seluruh proses boot selesai.";
    DOM.objectiveText.textContent = "Windows siap digunakan";
    window.LabAudio.success();
    showToast("Workstation menyala", "Windows berhasil dimuat. Komputer kini bisa digunakan lewat tombol Gunakan Komputer.", "success");
    const token = m1Token;
    m1Timer = setTimeout(function () {
      if (token !== m1Token || state.current !== 1) return;
      setGuide("", false);
      completeMission(1);
    }, 1000);
  }

  function completeMission(mission) {
    if (state.current !== mission || state.finishing) return;
    state.finishing = true;
    state.completed[mission] = true;
    clearHotspots();
    setGuide("", false);
    hideM1DragUi();
    if (window.LabAudio) window.LabAudio.success();
    updateHUD();
    setTimeout(function () {
      if (state.current !== mission) return;
      showResultModal(mission);
    }, 480);
  }

  function showResultModal(mission) {
    const meta = MISSION_META[mission];
    if (!meta) return;
    const stars = starsFor(mission);
    const total = totalScore();
    const level = levelFor(total);
    lastResultId = mission;
    DOM.resultKicker.textContent = "MISI 0" + mission + " SELESAI";
    DOM.resultTitle.textContent = meta.resultTitle;
    DOM.resultCopy.textContent = meta.resultCopy;
    DOM.resultStars.innerHTML = [0, 1, 2].map(function (index) {
      return '<svg class="' + (index < stars ? "lit" : "unlit") + '"><use href="#i-star"></use></svg>';
    }).join("");
    DOM.resultPoints.textContent = "+" + state.missionScores[mission];
    DOM.resultAccuracy.textContent = accuracyFor(mission) + "%";
    DOM.resultLevel.textContent = String(level.index).padStart(2, "0");
    DOM.resultUnlock.classList.remove("hidden");
    const usePc = $("result-use-pc");
    if (usePc) usePc.classList.toggle("hidden", !(window.Lab && window.Lab.booted));
    if (mission < 3) {
      DOM.resultUnlock.querySelector("span").textContent = "Misi berikutnya telah terbuka";
      DOM.resultPrimary.querySelector("span").textContent = mission === 1 ? "Lanjut ke Misi 2" : "Lanjut ke Misi 3";
      resultPrimaryAction = mission === 1 ? startMission2 : startMission3;
    } else {
      DOM.resultUnlock.querySelector("span").textContent = "Semua modul praktik telah diselesaikan";
      DOM.resultPrimary.querySelector("span").textContent = "Lihat Hasil Praktik";
      resultPrimaryAction = showFinal;
    }
    DOM.modalResult.classList.remove("hidden");
    DOM.modalResult.setAttribute("aria-hidden", "false");
  }

  function hideResult() {
    DOM.modalResult.classList.add("hidden");
    DOM.modalResult.setAttribute("aria-hidden", "true");
  }

  function hideAllModals() {
    [DOM.modalMenu, DOM.modalBrief, DOM.modalResult, DOM.modalFinal].forEach(function (modal) {
      if (!modal) return;
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    });
    state.paused = false;
  }

  function showFinal() {
    hideResult();
    const total = totalScore();
    const level = levelFor(total);
    const mistakes = state.mistakes[1] + state.mistakes[2] + state.mistakes[3];
    const accuracy = Math.max(0, Math.round(100 - mistakes * 2.5));
    DOM.finalScore.textContent = String(total).padStart(4, "0");
    DOM.finalLevel.textContent = level.name;
    DOM.finalAccuracy.textContent = accuracy + "%";
    DOM.finalGrade.textContent = total >= 1680 ? "A" : total >= 1300 ? "B" : "C";
    const usePc = $("final-use-pc");
    if (usePc) usePc.classList.toggle("hidden", !(window.Lab && window.Lab.booted));
    DOM.modalFinal.classList.remove("hidden");
    DOM.modalFinal.setAttribute("aria-hidden", "false");
    if (window.LabAudio) window.LabAudio.levelUp();
  }

  function renderMenu() {
    const items = [
      { id: 1, title: "Menyalakan Komputer", copy: "Power wiring & BIOS boot" },
      { id: 2, title: "Perakitan Komputer", copy: "Hardware assembly" },
      { id: 3, title: "Praktik Jaringan", copy: "UTP, IP & connectivity" }
    ];
    const done = Number(state.completed[1]) + Number(state.completed[2]) + Number(state.completed[3]);
    DOM.menuDone.textContent = done + " / 3";
    updateMenuSummary();
    const menuDesktop = $("menu-desktop");
    if (menuDesktop) menuDesktop.classList.toggle("hidden", !(window.Lab && window.Lab.booted));
    DOM.menuMissionList.innerHTML = "";
    items.forEach(function (item) {
      const locked = item.id > 1 && !state.completed[item.id - 1];
      const isDone = state.completed[item.id];
      const isCurrent = state.current === item.id;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "menu-mission" + (isCurrent ? " active" : "");
      button.disabled = locked;
      const status = locked ? "TERKUNCI" : isDone ? "SELESAI" : isCurrent ? "AKTIF" : "SIAP";
      const statusClass = isDone ? "done" : isCurrent && !locked ? "current" : "";
      button.innerHTML = '<span class="mission-no">0' + item.id + "</span>" +
        '<div><strong>' + item.title + "</strong><span>" + item.copy + "</span></div>" +
        '<em class="' + statusClass + '">' + status + "</em>";
      button.addEventListener("click", function () {
        if (locked) return;
        if (isCurrent && !isDone) {
          closeMenu();
          return;
        }
        hideAllModals();
        if (item.id === 1) startMission1();
        if (item.id === 2) startMission2();
        if (item.id === 3) startMission3();
      });
      DOM.menuMissionList.appendChild(button);
    });
  }

  function openMenu(source) {
    if (!state.sessionStarted) return;
    menuSource = source || "game";
    if (source === "result") hideResult();
    state.paused = true;
    renderMenu();
    DOM.modalMenu.classList.remove("hidden");
    DOM.modalMenu.setAttribute("aria-hidden", "false");
    if (window.LabAudio) window.LabAudio.click();
  }

  function closeMenu() {
    DOM.modalMenu.classList.add("hidden");
    DOM.modalMenu.setAttribute("aria-hidden", "true");
    state.paused = false;
    if (menuSource === "result" && lastResultId) {
      showResultModal(lastResultId);
    }
    menuSource = "game";
  }

  function restartCurrentMission() {
    const current = state.current;
    hideAllModals();
    if (current === 1) startMission1();
    else if (current === 2) startMission2();
    else startMission3();
  }

  function startMission2() {
    if (App.mission2 && App.mission2.start) {
      App.mission2.start();
      return;
    }
    showToast("Modul belum tersedia", "Muat ulang halaman untuk membuka misi perakitan.", "error");
  }

  function startMission3() {
    if (App.mission3 && App.mission3.start) {
      App.mission3.start();
      return;
    }
    showToast("Modul belum tersedia", "Muat ulang halaman untuk membuka misi jaringan.", "error");
  }

  function beginMission(mission) {
    state.current = mission;
    state.finishing = false;
    state.completed[mission] = false;
    state.missionScores[mission] = 0;
    state.mistakes[mission] = 0;
    state.paused = false;
    lastResultId = null;
    resultPrimaryAction = null;
    if (App.mission2 && mission !== 2 && App.mission2.stop) App.mission2.stop();
    if (App.mission3 && mission !== 3 && App.mission3.stop) App.mission3.stop();
    hideAllModals();
    hideM1DragUi();
    clearHotspots();
    setGuide("", false);
    DOM.dragPath.setAttribute("d", "");
    DOM.mission2.classList.add("hidden");
    DOM.mission2.setAttribute("aria-hidden", "true");
    DOM.mission3.classList.add("hidden");
    DOM.mission3.setAttribute("aria-hidden", "true");
    DOM.hud.classList.remove("hidden");
    DOM.hud.setAttribute("aria-hidden", "false");
    DOM.instructionPanel.classList.add("hidden");
    DOM.objectivePill.classList.add("hidden");
    DOM.crosshair.classList.add("hidden");
    DOM.hudMission.textContent = MISSION_META[mission].label;
    DOM.startScreen.classList.add("leaving", "hidden");
    updateHUD();
    return true;
  }

  function startNewSession() {
    if (!window.Lab || !window.Lab.ready) {
      showToast("WebGL tidak tersedia", "Simulator membutuhkan WebGL yang aktif di browser.", "error");
      return;
    }
    if (window.LabAudio) {
      window.LabAudio.unlock();
      window.LabAudio.setMuted(state.soundMuted);
    }
    state.sessionStarted = true;
    state.completed = { 1: false, 2: false, 3: false };
    state.missionScores = { 1: 0, 2: 0, 3: 0 };
    state.mistakes = { 1: 0, 2: 0, 3: 0 };
    state.level = 1;
    state.finishing = false;
    hideAllModals();
    startMission1();
  }

  function resetProgress() {
    state.completed = { 1: false, 2: false, 3: false };
    state.missionScores = { 1: 0, 2: 0, 3: 0 };
    state.mistakes = { 1: 0, 2: 0, 3: 0 };
    state.level = 1;
    state.finishing = false;
    state.paused = false;
    state.current = 1;
    state.m1 = null;
    lastResultId = null;
    resultPrimaryAction = null;
  }

  function goHome() {
    m1Token += 1;
    clearTimeout(m1Timer);
    clearTimeout(m1BootTimer);
    if (App.desktop && App.desktop.close) App.desktop.close();
    if (App.mission2 && App.mission2.stop) App.mission2.stop();
    if (App.mission3 && App.mission3.stop) App.mission3.stop();
    resetProgress();
    hideAllModals();
    hideM1DragUi();
    clearHotspots();
    setGuide("", false);
    setQuestVisible(true);
    DOM.hud.classList.add("hidden");
    DOM.hud.setAttribute("aria-hidden", "true");
    DOM.mission2.classList.add("hidden");
    DOM.mission2.setAttribute("aria-hidden", "true");
    DOM.mission3.classList.add("hidden");
    DOM.mission3.setAttribute("aria-hidden", "true");
    DOM.startScreen.classList.remove("hidden", "leaving");
    state.sessionStarted = false;
    if (window.Lab) {
      window.Lab.reset();
      window.Lab.setView("hero");
    }
    updateHUD();
  }

  function handleResultPrimary() {
    const action = resultPrimaryAction;
    if (!action) return;
    hideResult();
    action();
  }

  function handleResultSecondary() {
    openMenu("result");
  }

  function openBrief() {
    DOM.modalBrief.classList.remove("hidden");
    DOM.modalBrief.setAttribute("aria-hidden", "false");
    if (window.LabAudio) window.LabAudio.click();
  }

  function closeBrief() {
    DOM.modalBrief.classList.add("hidden");
    DOM.modalBrief.setAttribute("aria-hidden", "true");
  }

  function toggleSound() {
    if (!window.LabAudio) return;
    if (!window.LabAudio.ctx) window.LabAudio.unlock();
    state.soundMuted = window.LabAudio.toggle();
    const use = DOM.btnSound.querySelector("use");
    use.setAttribute("href", state.soundMuted ? "#i-muted" : "#i-volume");
    DOM.btnSound.setAttribute("aria-label", state.soundMuted ? "Nyalakan suara" : "Matikan suara");
    if (!state.soundMuted) window.LabAudio.click();
  }

  function setupEvents() {
    DOM.btnPlay.addEventListener("click", startNewSession);
    DOM.btnBrief.addEventListener("click", openBrief);
    $("brief-close").addEventListener("click", closeBrief);
    $("brief-ok").addEventListener("click", closeBrief);
    DOM.btnSound.addEventListener("click", toggleSound);
    const questBtn = $("btn-quest");
    if (questBtn) {
      questBtn.addEventListener("click", function () {
        if (window.LabAudio) window.LabAudio.click();
        setQuestVisible(DOM.hud.classList.contains("quest-hidden"));
      });
    }
    DOM.btnMenu.addEventListener("click", function () {
      openMenu("game");
    });
    DOM.menuClose.addEventListener("click", closeMenu);
    DOM.menuResume.addEventListener("click", closeMenu);
    DOM.menuRestart.addEventListener("click", restartCurrentMission);
    DOM.menuHome.addEventListener("click", goHome);
    DOM.resultPrimary.addEventListener("click", handleResultPrimary);
    DOM.resultSecondary.addEventListener("click", handleResultSecondary);
    DOM.finalRestart.addEventListener("click", function () {
      resetProgress();
      startMission1();
    });
    DOM.finalHome.addEventListener("click", goHome);
    DOM.handDock.addEventListener("pointerdown", beginCableDrag);
    document.addEventListener("pointermove", function (event) {
      if (!state.m1 || !state.m1.drag || !state.m1.drag.active) return;
      event.preventDefault();
      updateCableDrag(event.clientX, event.clientY);
    }, { passive: false });
    document.addEventListener("pointerup", function (event) {
      if (!state.m1 || !state.m1.drag || !state.m1.drag.active) return;
      finishCableDrag(event);
    });
    document.addEventListener("pointercancel", function () {
      if (!state.m1 || !state.m1.drag || !state.m1.drag.active) return;
      state.m1.drag = null;
      DOM.handDock.classList.remove("is-source");
      DOM.dragGhost.classList.remove("is-active");
      DOM.dragSvg.classList.remove("is-active");
      DOM.outletTarget.classList.remove("near");
      document.body.classList.remove("is-dragging");
      DOM.handDock.classList.add("is-visible");
    });
    window.addEventListener("keydown", function (event) {
      const tag = event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (event.key === "Escape") closeBrief();
        return;
      }
      if (event.key === "Escape") {
        if (!DOM.modalBrief.classList.contains("hidden")) {
          closeBrief();
          return;
        }
        if (!DOM.modalMenu.classList.contains("hidden")) {
          closeMenu();
          return;
        }
        if (DOM.modalResult.classList.contains("hidden") && DOM.modalFinal.classList.contains("hidden") && state.sessionStarted) {
          openMenu("game");
        }
        return;
      }
      if ((event.key === "q" || event.key === "Q") && state.sessionStarted) {
        const busy = !DOM.modalMenu.classList.contains("hidden") ||
          !DOM.modalBrief.classList.contains("hidden") ||
          !DOM.modalResult.classList.contains("hidden") ||
          !DOM.modalFinal.classList.contains("hidden") ||
          !$("desktop-mode").classList.contains("hidden");
        if (!busy && !DOM.hud.classList.contains("hidden")) {
          setQuestVisible(DOM.hud.classList.contains("quest-hidden"));
        }
      }
    });
    window.addEventListener("resize", function () {
      if (state.m1) positionOutletTarget();
    });
  }

  function onFrame() {
    if (!state.sessionStarted) return;
    if (state.current === 1) {
      updateHotspots();
      positionOutletTarget();
    }
  }

  function bootGame() {
    cacheDom();
    setupEvents();
    state.soundMuted = false;
    try {
      if (!window.Lab) throw new Error("Laboratorium tidak ditemukan");
      const ready = window.Lab.init({
        onFrame: onFrame,
        onStage: handleBootStage,
        onBootDone: handleBootDone,
        onPower: null
      });
      if (!ready) throw new Error("Renderer WebGL gagal dibuat");
    } catch (error) {
      const copy = DOM.loader.querySelector(".loader-copy strong");
      const sub = DOM.loader.querySelector(".loader-copy span");
      if (copy) copy.textContent = "WebGL tidak tersedia";
      if (sub) sub.textContent = "Aktifkan akselerasi grafis lalu muat ulang halaman.";
      DOM.btnPlay.disabled = true;
      DOM.btnPlay.classList.add("is-disabled");
      if (window.console && console.error) console.error(error);
      return;
    }
    setTimeout(function () {
      DOM.loader.classList.add("is-hidden");
    }, 620);
    updateHUD();
    updateMenuSummary();
  }

  App.startMission1 = startMission1;
  App.startMission2 = startMission2;
  App.startMission3 = startMission3;
  App.beginMission = beginMission;
  App.completeMission = completeMission;
  App.penalize = penalize;
  App.award = award;
  App.updateHUD = updateHUD;
  App.showToast = showToast;
  App.showMissionIntro = showMissionIntro;
  App.openMenu = openMenu;
  App.closeMenu = closeMenu;
  App.goHome = goHome;
  App.restartCurrentMission = restartCurrentMission;
  App.accuracyFor = accuracyFor;
  App.starsFor = starsFor;
  App.totalScore = totalScore;
  App.levelFor = levelFor;
  App.clearHotspots = clearHotspots;
  App.setGuide = setGuide;
  App.finishMission = completeMission;
  App.flashScreen = flashScreen;
  App.getMissionMeta = function (id) {
    return MISSION_META[id];
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootGame);
  } else {
    setTimeout(bootGame, 0);
  }
})();
