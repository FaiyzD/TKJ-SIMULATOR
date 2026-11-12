(function () {
  "use strict";

  const App = window.TKJ;
  if (!App) return;
  const state = App.state;
  const DOM = App.dom;
  const $ = App.$;

  const STEPS = [
    { title: "Buka panel samping", hint: "Klik panel samping casing (sisi kanan) untuk membukanya." },
    { title: "Pasang motherboard", hint: "Tarik kartu Motherboard ke kotak MOTHERBOARD yang berkedip di dalam casing." },
    { title: "Pasang prosesor", hint: "Tarik kartu Processor ke kotak CPU SOCKET yang berkedip di tengah motherboard." },
    { title: "Pasang cooler CPU", hint: "Tarik kartu CPU Cooler ke lingkaran COOLER di atas area prosesor." },
    { title: "Pasang memori RAM", hint: "Tarik kartu Memory RAM ke slot RAM vertikal di kanan motherboard." },
    { title: "Pasang SSD NVMe", hint: "Tarik kartu SSD NVMe ke slot M.2 horizontal di bawah motherboard." },
    { title: "Hubungkan kabel PSU", hint: "Tarik kartu Kabel PSU ke area 24-PIN di sisi kiri motherboard." }
  ];

  const ORDER = ["mobo", "cpu", "cooler", "ram", "ssd", "cables"];

  const TARGETS = {
    mobo: "MOTHERBOARD",
    cpu: "CPU SOCKET",
    cooler: "COOLER",
    ram: "RAM",
    ssd: "SSD NVME",
    cables: "24-PIN"
  };

  const COMPONENTS = {
    mobo: {
      name: "Motherboard",
      detail: "ATX B660 · LGA1700",
      icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="4" width="24" height="24" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M20 8h4M20 11h4M20 14h4M8 20h16M8 23h9M20 20v4"/><circle cx="23" cy="24" r="1.2"/></svg>'
    },
    cpu: {
      name: "Processor",
      detail: "Intel Core i5 · 6-Core",
      icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="8" y="8" width="16" height="16" rx="2"/><rect x="13" y="13" width="6" height="6" rx="1"/><path d="M11 4v4M16 4v4M21 4v4M11 24v4M16 24v4M21 24v4M4 11h4M4 16h4M4 21h4M24 11h4M24 16h4M24 21h4"/></svg>'
    },
    cooler: {
      name: "CPU Cooler",
      detail: "Tower fan 120 mm",
      icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="4"/><path d="M16 5c3 3 2 7 0 8M27 16c-3 3-7 2-8 0M16 27c-3-3-2-7 0-8M5 16c3-3 7-2 8 0"/></svg>'
    },
    ram: {
      name: "Memory RAM",
      detail: "16 GB DDR4 · 3200 MHz",
      icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="8" width="6" height="17" rx="1"/><rect x="13" y="8" width="6" height="17" rx="1"/><rect x="21" y="8" width="6" height="17" rx="1"/><path d="M6 5h4v3H6zM14 5h4v3h-4zM22 5h4v3h-4zM7 25v3M15 25v3M23 25v3"/></svg>'
    },
    ssd: {
      name: "SSD NVMe",
      detail: "512 GB · M.2 PCIe",
      icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="4" y="10" width="24" height="12" rx="2"/><rect x="8" y="14" width="7" height="4" rx="1"/><path d="M19 14h3M19 17h3M24 14h2M24 17h2"/></svg>'
    },
    cables: {
      name: "Kabel PSU",
      detail: "24-pin + 8-pin CPU",
      icon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 6v7c0 2 2 4 4 4h4c2 0 4 2 4 4v5"/><path d="M16 6v6c0 2 2 4 4 4h4c2 0 3 1 3 3v7"/><rect x="4" y="3" width="4" height="5" rx="1"/><rect x="14" y="3" width="4" height="5" rx="1"/><rect x="25" y="25" width="4" height="4" rx="1"/></svg>'
    }
  };

  let run = 0;
  let timers = [];
  let drag = null;

  function clearTimers() {
    timers.forEach(function (timer) {
      clearTimeout(timer);
    });
    timers = [];
  }

  function later(fn, delay) {
    const token = run;
    const timer = setTimeout(function () {
      if (token !== run || state.current !== 2) return;
      fn();
    }, delay);
    timers.push(timer);
  }

  function buildChecklist(active) {
    const list = $("m2-step-list");
    list.innerHTML = STEPS.map(function (step, index) {
      const done = index < active;
      const current = index === active && active < STEPS.length;
      const dot = done ? '<svg><use href="#i-check"></use></svg>' : String(index + 1);
      return '<li class="check-item' + (done ? " done" : current ? " active" : "") + '">' +
        '<span class="check-dot">' + dot + "</span><strong>" + step.title + "</strong></li>";
    }).join("");
  }

  function renderCards() {
    const panel = $("m2-components");
    panel.innerHTML = ORDER.map(function (comp) {
      const data = COMPONENTS[comp];
      return '<button type="button" class="component-card locked" data-comp="' + comp + '">' +
        '<span class="component-icon">' + data.icon + "</span>" +
        '<span class="component-meta"><strong>' + data.name + "</strong><span>" + data.detail + "</span></span>" +
        '<span class="card-state">LOCKED</span></button>';
    }).join("");
    panel.querySelectorAll(".component-card").forEach(function (card) {
      card.addEventListener("pointerdown", onCardDown);
    });
  }

  function activeComponent() {
    if (!state.m2 || state.m2.step < 1 || state.m2.step > 6) return null;
    return ORDER[state.m2.step - 1];
  }

  function updateCards() {
    if (!state.m2) return;
    const active = activeComponent();
    const panel = $("m2-components");
    panel.querySelectorAll(".component-card").forEach(function (card) {
      const comp = card.getAttribute("data-comp");
      const index = ORDER.indexOf(comp);
      const installed = index < state.m2.step - 1;
      const isActive = comp === active;
      card.classList.toggle("is-done", installed);
      card.classList.toggle("is-active", isActive);
      card.classList.toggle("locked", !installed && !isActive);
      const stateLabel = card.querySelector(".card-state");
      stateLabel.textContent = installed ? "TERPASANG" : isActive ? "SIAP" : "LOCKED";
    });
    $("m2-component-counter").textContent = Math.min(6, Math.max(0, state.m2.step - 1)) + " / 6";
  }

  function updateZones() {
    if (!state.m2) return;
    const active = activeComponent();
    document.querySelectorAll("#m2-case .drop-zone").forEach(function (zone) {
      const comp = zone.getAttribute("data-drop");
      const installed = ORDER.indexOf(comp) < state.m2.step - 1;
      zone.classList.toggle("is-installed", installed);
      zone.classList.toggle("is-active", comp === active);
      zone.classList.remove("drag-over");
    });
  }

  function updateInterface() {
    if (!state.m2) return;
    const step = state.m2.step;
    buildChecklist(Math.min(step, STEPS.length));
    const progress = Math.min(step, 7);
    $("m2-progress-label").textContent = progress + " / 7 LANGKAH";
    $("m2-progress-bar").style.width = Math.round((progress / 7) * 100) + "%";
    if (step === 0) {
      $("m2-objective").textContent = "Buka panel samping casing untuk memulai perakitan.";
      $("m2-hint").textContent = STEPS[0].hint;
      $("m2-status").textContent = "CASING TERTUTUP";
      $("m2-case-state").textContent = "PANEL TERKUNCI";
    } else if (step >= 7) {
      $("m2-objective").textContent = "Seluruh komponen berhasil dipasang. Workstation siap diuji.";
      $("m2-hint").textContent = "Perakitan selesai. Casing siap ditutup dan diuji oleh teknisi.";
      $("m2-status").textContent = "PERAKITAN SELESAI";
      $("m2-case-state").textContent = "LENGKAP";
      $("m2-case").classList.add("case-powered");
    } else {
      const current = STEPS[step];
      const active = activeComponent();
      const target = TARGETS[active] || "";
      $("m2-objective").textContent = "Tarik " + COMPONENTS[active].name + " ke area " + target + " yang berkedip di dalam casing.";
      $("m2-hint").textContent = current.hint;
      $("m2-status").textContent = "MERAKIT · " + current.title.replace("Pasang ", "").toUpperCase();
      $("m2-case-state").textContent = "PANEL TERBUKA";
    }
    updateCards();
    updateZones();
    if (drag) {
      const active = activeComponent();
      $("overlay-drag").classList.toggle("is-active", !!active);
    }
  }

  function setStep(step) {
    if (!state.m2) return;
    state.m2.step = step;
    updateInterface();
  }

  function openCase() {
    if (!state.m2 || state.m2.step !== 0 || state.current !== 2) return;
    state.m2.opened = true;
    $("m2-case-panel").classList.add("is-open");
    $("m2-case").classList.remove("case-powered");
    if (window.LabAudio) {
      window.LabAudio.click();
      window.LabAudio.cable();
    }
    App.award(100);
    setStep(1);
    App.showToast("Panel casing terbuka", "Motherboard kini dapat dipasang pada dudukan casing.", "success");
  }

  function beginDrag(comp, event) {
    if (!state.m2 || state.m2.step < 1 || state.m2.step > 6) return;
    if (comp !== activeComponent()) return;
    event.preventDefault();
    drag = { comp: comp, x: event.clientX, y: event.clientY };
    const data = COMPONENTS[comp];
    const overlay = $("overlay-drag");
    overlay.innerHTML = '<div class="drag-component">' + data.icon + "</div>";
    overlay.style.left = event.clientX + "px";
    overlay.style.top = event.clientY + "px";
    overlay.classList.add("is-active");
    document.body.classList.add("is-dragging");
    const card = document.querySelector('#m2-components .component-card[data-comp="' + comp + '"]');
    if (card) card.classList.add("dragging");
    if (window.LabAudio) window.LabAudio.pickup();
    updateDrag(event.clientX, event.clientY);
  }

  function findZoneAt(x, y) {
    const zones = document.querySelectorAll("#m2-case .drop-zone");
    const active = activeComponent();
    const activeZone = document.querySelector('#m2-case .drop-zone[data-drop="' + active + '"]');
    if (activeZone) {
      const rect = activeZone.getBoundingClientRect();
      const pad = 12;
      if (x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad) {
        return activeZone;
      }
    }
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      if (zone === activeZone || !zone.classList.contains("is-installed")) continue;
      const rect = zone.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return zone;
      }
    }
    return null;
  }

  function updateDrag(x, y) {
    if (!drag) return;
    drag.x = x;
    drag.y = y;
    const overlay = $("overlay-drag");
    overlay.style.left = x + "px";
    overlay.style.top = y + "px";
    const zone = findZoneAt(x, y);
    const active = activeComponent();
    document.querySelectorAll("#m2-case .drop-zone").forEach(function (item) {
      item.classList.remove("drag-over");
    });
    if (zone && zone.getAttribute("data-drop") === active) zone.classList.add("drag-over");
  }

  function endDrag(x, y) {
    if (!drag) return;
    const comp = drag.comp;
    drag = null;
    const overlay = $("overlay-drag");
    overlay.classList.remove("is-active");
    overlay.innerHTML = "";
    document.body.classList.remove("is-dragging");
    document.querySelectorAll("#m2-case .drop-zone").forEach(function (item) {
      item.classList.remove("drag-over");
    });
    document.querySelectorAll("#m2-components .component-card").forEach(function (card) {
      card.classList.remove("dragging");
    });
    const zone = findZoneAt(x, y);
    const active = activeComponent();
    if (!zone) {
      window.LabAudio.warning();
      App.showToast("Area pemasangan belum tepat", "Tarik komponen hingga berada di dalam casing.", "warning");
      return;
    }
    if (zone.getAttribute("data-drop") !== active || comp !== active) {
      App.penalize("Komponen tidak cocok", "Area tersebut bukan tempat untuk komponen ini.");
      return;
    }
    installComponent(comp, zone);
  }

  function installComponent(comp, zone) {
    if (!state.m2 || state.m2.step < 1 || state.m2.step > 6) return;
    zone.classList.add("is-installed");
    zone.classList.remove("is-active", "drag-over");
    if (window.LabAudio) window.LabAudio.connect();
    App.award(100);
    const data = COMPONENTS[comp];
    App.showToast(data.name + " terpasang", "Komponen terpasang dengan benar. Lanjutkan ke langkah berikutnya.", "success");
    setStep(state.m2.step + 1);
    if (state.m2.step >= 7) {
      $("m2-case").classList.add("case-powered");
      if (window.LabAudio) window.LabAudio.success();
      App.showToast("Perakitan selesai", "Seluruh komponen berhasil dipasang pada workstation A-01.", "success");
      later(function () {
        App.completeMission(2);
      }, 1000);
    }
  }

  function onCardDown(event) {
    if (!state.m2 || state.current !== 2) return;
    const card = event.currentTarget;
    if (card.classList.contains("is-active")) {
      beginDrag(card.getAttribute("data-comp"), event);
    }
  }

  function onPointerMove(event) {
    if (!drag || state.current !== 2) return;
    event.preventDefault();
    updateDrag(event.clientX, event.clientY);
  }

  function onPointerUp(event) {
    if (!drag || state.current !== 2) return;
    endDrag(event.clientX, event.clientY);
  }

  function onPointerCancel() {
    if (!drag) return;
    drag = null;
    $("overlay-drag").classList.remove("is-active");
    $("overlay-drag").innerHTML = "";
    document.body.classList.remove("is-dragging");
    document.querySelectorAll("#m2-case .drop-zone").forEach(function (item) {
      item.classList.remove("drag-over");
    });
    document.querySelectorAll("#m2-components .component-card").forEach(function (card) {
      card.classList.remove("dragging");
    });
  }

  function start() {
    if (!App.beginMission(2)) return;
    run += 1;
    clearTimers();
    drag = null;
    state.m2 = { step: 0, opened: false };
    document.querySelectorAll("#m2-case .drop-zone").forEach(function (zone) {
      zone.classList.remove("is-installed", "is-active", "drag-over");
    });
    $("m2-case-panel").classList.remove("is-open");
    $("m2-case").classList.remove("case-powered");
    $("m2-progress-bar").style.width = "0%";
    $("overlay-drag").classList.remove("is-active");
    $("overlay-drag").innerHTML = "";
    document.body.classList.remove("is-dragging");
    renderCards();
    updateInterface();
    const overlay = $("mission2");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlay.scrollTop = 0;
    App.showMissionIntro(2);
    if (window.LabAudio) window.LabAudio.click();
  }

  function stop() {
    run += 1;
    clearTimers();
    drag = null;
    const overlay = $("mission2");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    }
    const ghost = $("overlay-drag");
    if (ghost) {
      ghost.classList.remove("is-active");
      ghost.innerHTML = "";
    }
    document.body.classList.remove("is-dragging");
  }

  $("m2-case-panel").addEventListener("click", openCase);
  document.addEventListener("pointermove", onPointerMove, { passive: false });
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerCancel);

  App.mission2 = { start: start, stop: stop };
})();
