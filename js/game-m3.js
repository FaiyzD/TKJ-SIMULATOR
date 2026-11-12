(function () {
  "use strict";

  const App = window.TKJ;
  if (!App) return;
  const state = App.state;
  const DOM = App.dom;
  const $ = App.$;

  const STEPS = [
    "Kupas jaket kabel UTP",
    "Pasang konektor RJ45",
    "Crimp konektor RJ45",
    "Hubungkan PC ke switch",
    "Konfigurasi alamat IP",
    "Uji koneksi dengan ping"
  ];

  const OBJECTIVES = [
    "Siapkan kabel UTP untuk menghubungkan workstation ke switch.",
    "Pasang konektor RJ45 pada delapan kabel UTP yang telah dikupas.",
    "Gunakan tang crimping untuk mengunci konektor RJ45.",
    "Hubungkan ujung kabel dari PC-LAB-01 ke port switch.",
    "Atur alamat IP PC dan gateway jaringan lab.",
    "Uji konektivitas ke gateway menggunakan perintah ping."
  ];

  const HINTS = [
    "Gunakan tombol kupas untuk melepas jaket luar tanpa merusak kabel di dalamnya.",
    "Tarik konektor RJ45 ke target di ujung kabel sampai terkunci.",
    "Klik tang crimping satu kali untuk mengunci pin konektor.",
    "Tarik chip ujung PC dan ujung switch ke port LAN yang sesuai pada perangkat.",
    "Gunakan IP 192.168.1.10, subnet mask 255.255.255.0, dan gateway 192.168.1.1.",
    "Ketik perintah ping 192.168.1.1 lalu tekan Enter atau tombol Kirim."
  ];

  const RJ45_ICON = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M7 8h18v13l-4 3H11l-4-3V8Z"/><path d="M10 12h12M10 15h12M10 18h12M13 24v4h6v-4M7 11H4M7 15H4M7 19H4"/></svg>';

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
      if (token !== run || state.current !== 3) return;
      fn();
    }, delay);
    timers.push(timer);
  }

  function buildChecklist(active) {
    const list = $("m3-step-list");
    list.innerHTML = STEPS.map(function (title, index) {
      const done = index < active;
      const current = index === active && active < STEPS.length;
      const dot = done ? '<svg><use href="#i-check"></use></svg>' : String(index + 1);
      return '<li class="check-item' + (done ? " done" : current ? " active" : "") + '">' +
        '<span class="check-dot">' + dot + "</span><strong>" + title + "</strong></li>";
    }).join("");
  }

  function updateProgress(active) {
    buildChecklist(Math.min(active, STEPS.length));
    const count = Math.min(active, 6);
    $("m3-progress-label").textContent = count + " / 6 LANGKAH";
    $("m3-progress-bar").style.width = Math.round((count / 6) * 100) + "%";
    $("m3-objective").textContent = active >= 6 ? "Koneksi jaringan berhasil dibangun dan diuji." : OBJECTIVES[active];
    $("m3-hint").textContent = active >= 6 ? "PC-LAB-01 dapat berkomunikasi dengan gateway melalui switch." : HINTS[active];
  }

  function utpMarkup() {
    const classes = "utp-cable" + (state.m3.stripped ? " is-stripped" : "") + (state.m3.terminated ? " is-terminated" : "");
    return '<div class="utp-workbench"><div class="' + classes + '">' +
      '<div class="cable-jacket"><span>CAT6 UTP · 8 CORE</span></div>' +
      '<div class="utp-wires"><i class="w1"></i><i class="w2"></i><i class="w3"></i><i class="w4"></i>' +
      '<i class="w5"></i><i class="w6"></i><i class="w7"></i><i class="w8"></i></div>' +
      '<div class="rj45-target" id="m3-rj45"></div>' +
      '<div class="rj45-installed"><div class="rj45-body"></div><small>RJ45 TERPASANG</small></div>' +
      "</div></div>";
  }

  function renderTool(step) {
    const tool = $("m3-tool");
    if (step === 0) {
      tool.innerHTML = '<div class="tool-content">' +
        toolInfo("LANGKAH 01 · CABLE PREP", "Kupas Jaket UTP", "Buka jaket luar kabel CAT6 untuk mengekspos delapan kabel konduktor.") +
        utpMarkup() +
        '<div class="tool-action"><button type="button" id="m3-strip" class="btn btn-primary"><span>Kupas Jaket</span></button><small>Gunakan alat kupas</small></div>' +
        "</div>";
      $("m3-strip").addEventListener("click", stripCable);
    } else if (step === 1) {
      tool.innerHTML = '<div class="tool-content">' +
        toolInfo("LANGKAH 02 · RJ45", "Pasang Konektor", "Susun delapan kabel sesuai standar T568B, lalu masukkan ke konektor RJ45.") +
        utpMarkup() +
        '<div class="tool-action"><div id="m3-connector" class="drag-connector" role="button" tabindex="0" aria-label="Tarik konektor RJ45 ke ujung kabel"><span class="drag-icon">' + RJ45_ICON + '</span><div><strong>Konektor RJ45</strong><span>Tarik ke ujung kabel</span></div></div><small>Drag &amp; drop konektor</small></div>' +
        "</div>";
      const connector = $("m3-connector");
      connector.addEventListener("pointerdown", startConnectorDrag);
      connector.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          terminateCable();
        }
      });
    } else if (step === 2) {
      tool.innerHTML = '<div class="tool-content">' +
        toolInfo("LANGKAH 03 · CRIMP", "Kunci Konektor", "Gunakan tang crimping agar pin RJ45 menancap sempurna pada kabel UTP.") +
        utpMarkup() +
        '<div class="tool-action"><button type="button" id="m3-crimp" class="crimp-tool" aria-label="Gunakan tang crimping"><span class="crimp-icon"><span class="crimp-jaw top"></span><span class="crimp-jaw bottom"></span><span class="crimp-handle top"></span><span class="crimp-handle bottom"></span></span><span><strong>Tang Crimping</strong><br><small>Klik untuk crimp</small></span></button><small>Crimp konektor sekali</small></div>' +
        "</div>";
      $("m3-crimp").addEventListener("click", crimpCable);
    } else if (step === 3) {
      tool.innerHTML = '<div class="tool-content">' +
        toolInfo("LANGKAH 04 · PATCH", "Hubungkan ke Switch", "Sambungkan kedua ujung kabel ke port LAN pada PC dan switch.") +
        '<div class="connection-kit"><div class="plug-chips">' +
        '<div class="plug-chip' + (state.m3.pcConnected ? " is-connected" : "") + '" data-plug="pc" role="button" tabindex="0" aria-label="Tarik ujung kabel PC"><svg>' + '<use href="#i-cable"></use>' + '</svg><span>Ujung PC-LAB-01</span></div>' +
        '<div class="plug-chip' + (state.m3.switchConnected ? " is-connected" : "") + '" data-plug="switch" role="button" tabindex="0" aria-label="Tarik ujung kabel switch"><svg><use href="#i-cable"></use></svg><span>Ujung Switch</span></div>' +
        '</div><div class="connection-note"><i></i><span>Tarik setiap ujung ke port LAN yang menyala.</span></div></div>' +
        '<div class="tool-action"><small>Port target: PC-LAB-01 &amp; SWITCH CORE</small></div>' +
        "</div>";
      tool.querySelectorAll(".plug-chip").forEach(function (chip) {
        chip.addEventListener("pointerdown", startPlugDrag);
        chip.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            connectPlug(chip.getAttribute("data-plug"));
          }
        });
      });
      document.querySelectorAll("#mission3 .net-port").forEach(function (port) {
        const plug = port.getAttribute("data-port");
        port.classList.add("active-target");
        port.classList.toggle("is-connected", plug === "pc" ? state.m3.pcConnected : state.m3.switchConnected);
      });
      drawNetworkCable();
    } else if (step === 4) {
      tool.innerHTML = '<div class="tool-content"><div class="ip-form">' +
        toolInfo("LANGKAH 05 · IP CONFIG", "Konfigurasi Alamat IP", "Isi alamat berikut: IP 192.168.1.10 · Mask 255.255.255.0 · Gateway 192.168.1.1.") +
        '<div class="field" id="m3-field-ip"><label for="m3-ip">IP ADDRESS</label><input id="m3-ip" inputmode="decimal" maxlength="15" placeholder="192.168.1.10"><span class="field-hint">Gunakan 192.168.1.10</span></div>' +
        '<div class="field" id="m3-field-mask"><label for="m3-mask">SUBNET MASK</label><input id="m3-mask" inputmode="decimal" maxlength="15" placeholder="255.255.255.0"><span class="field-hint">Gunakan 255.255.255.0</span></div>' +
        '<div class="field" id="m3-field-gw"><label for="m3-gw">DEFAULT GATEWAY</label><input id="m3-gw" inputmode="decimal" maxlength="15" placeholder="192.168.1.1"><span class="field-hint">Gunakan 192.168.1.1</span></div>' +
        '<div class="ip-submit"><button type="button" id="m3-apply-ip" class="btn btn-primary"><span>Terapkan IP</span></button></div>' +
        '</div></div>';
      $("m3-apply-ip").addEventListener("click", applyIp);
      ["m3-ip", "m3-mask", "m3-gw"].forEach(function (id) {
        $(id).addEventListener("input", function () {
          $(id).parentElement.classList.remove("has-error");
        });
        $(id).addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            applyIp();
          }
        });
      });
      requestAnimationFrame(function () {
        if (state.current === 3) $("m3-ip").focus();
      });
    } else if (step === 5) {
      tool.innerHTML = '<div class="tool-content"><div class="terminal">' +
        '<div class="terminal-bar"><i></i><i></i><i></i><span>COMMAND PROMPT · PC-LAB-01</span></div>' +
        '<div class="terminal-body" id="m3-terminal-body"><div class="terminal-line dim">Microsoft Windows [Version 10.0.19045.3803]</div><div class="terminal-line dim">(c) TKJ Laboratory. All rights reserved.</div><div class="terminal-line command">C:\\Users\\Lab&gt; ipconfig</div><div class="terminal-line">IPv4 Address. . . . . . . . . . . : 192.168.1.10</div><div class="terminal-line">Subnet Mask . . . . . . . . . . . : 255.255.255.0</div><div class="terminal-line">Default Gateway . . . . . . . . . : 192.168.1.1</div><div class="terminal-line dim">Ketik perintah ping untuk menguji koneksi ke gateway.</div></div>' +
        '<div class="terminal-input-row"><span class="prompt">C:\\Users\\Lab&gt;</span><input id="m3-command" autocomplete="off" spellcheck="false" placeholder="ping 192.168.1.1"><button type="button" id="m3-send">KIRIM</button></div>' +
        '</div></div>';
      $("m3-send").addEventListener("click", submitPing);
      $("m3-command").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          submitPing();
        }
      });
      requestAnimationFrame(function () {
        if (state.current === 3) $("m3-command").focus();
      });
    }
    tool.classList.remove("transition-in");
    void tool.offsetWidth;
    tool.classList.add("transition-in");
  }

  function toolInfo(kicker, title, copy) {
    return '<div class="tool-info"><span class="micro-label">' + kicker + "</span><h4>" + title + "</h4><p>" + copy + "</p></div>";
  }

  function setStep(step) {
    if (!state.m3) return;
    state.m3.step = step;
    updateProgress(step);
    renderTool(step);
    if (step >= 4) {
      document.querySelectorAll("#mission3 .net-port").forEach(function (port) {
        port.classList.remove("active-target");
      });
    }
  }

  function stripCable() {
    if (!state.m3 || state.m3.step !== 0) return;
    state.m3.stripped = true;
    if (window.LabAudio) {
      window.LabAudio.cable();
      window.LabAudio.click();
    }
    App.award(100);
    App.showToast("Jaket UTP dikupas", "Delapan kabel konduktor siap dipasang ke konektor RJ45.", "success");
    setStep(1);
  }

  function startConnectorDrag(event) {
    if (!state.m3 || state.m3.step !== 1) return;
    event.preventDefault();
    drag = { type: "rj45", x: event.clientX, y: event.clientY };
    const overlay = $("overlay-drag");
    overlay.innerHTML = '<div class="drag-component">' + RJ45_ICON + "</div>";
    overlay.style.left = event.clientX + "px";
    overlay.style.top = event.clientY + "px";
    overlay.classList.add("is-active");
    document.body.classList.add("is-dragging");
    if (window.LabAudio) window.LabAudio.pickup();
    updateConnectorDrag(event.clientX, event.clientY);
  }

  function updateConnectorDrag(x, y) {
    if (!drag) return;
    drag.x = x;
    drag.y = y;
    const ghost = $("overlay-drag");
    ghost.style.left = x + "px";
    ghost.style.top = y + "px";
    const target = $("m3-rj45");
    const rect = target.getBoundingClientRect();
    const inside = x >= rect.left - 16 && x <= rect.right + 16 && y >= rect.top - 16 && y <= rect.bottom + 16;
    target.classList.toggle("near", inside);
  }

  function endConnectorDrag(x, y) {
    if (!drag) return;
    const target = $("m3-rj45");
    const rect = target ? target.getBoundingClientRect() : null;
    drag = null;
    $("overlay-drag").classList.remove("is-active");
    $("overlay-drag").innerHTML = "";
    document.body.classList.remove("is-dragging");
    if (!rect) return;
    const inside = x >= rect.left - 18 && x <= rect.right + 18 && y >= rect.top - 18 && y <= rect.bottom + 18;
    if (target) target.classList.remove("near");
    if (inside) terminateCable();
    else {
      if (window.LabAudio) window.LabAudio.warning();
      App.showToast("Konektor belum terpasang", "Lepaskan konektor tepat di ujung kabel yang telah dikupas.", "warning");
    }
  }

  function terminateCable() {
    if (!state.m3 || state.m3.step !== 1 || state.m3.terminated) return;
    state.m3.terminated = true;
    if (window.LabAudio) {
      window.LabAudio.click();
      window.LabAudio.connect();
    }
    App.award(100);
    App.showToast("RJ45 terpasang", "Konektor sudah berada di ujung kabel. Lanjutkan proses crimping.", "success");
    setStep(2);
  }

  function crimpCable() {
    if (!state.m3 || state.m3.step !== 2 || state.m3.crimped) return;
    const button = $("m3-crimp");
    if (button) {
      button.disabled = true;
      const icon = button.querySelector(".crimp-icon");
      icon.classList.add("is-crimping");
    }
    if (window.LabAudio) window.LabAudio.crimp();
    later(function () {
      state.m3.crimped = true;
      App.award(100);
      App.showToast("Konektor terkunci", "Pin RJ45 telah dikunci. Kabel siap dihubungkan ke perangkat.", "success");
      setStep(3);
    }, 650);
  }

  function startPlugDrag(event) {
    if (!state.m3 || state.m3.step !== 3) return;
    const chip = event.currentTarget;
    const plug = chip.getAttribute("data-plug");
    if (plug === "pc" && state.m3.pcConnected) return;
    if (plug === "switch" && state.m3.switchConnected) return;
    event.preventDefault();
    drag = { type: "plug", plug: plug, x: event.clientX, y: event.clientY };
    const overlay = $("overlay-drag");
    overlay.innerHTML = '<div class="drag-component">' + RJ45_ICON + "</div>";
    overlay.style.left = event.clientX + "px";
    overlay.style.top = event.clientY + "px";
    overlay.classList.add("is-active");
    document.body.classList.add("is-dragging");
    chip.classList.add("dragging");
    if (window.LabAudio) window.LabAudio.pickup();
    updatePlugDrag(event.clientX, event.clientY);
  }

  function findPortAt(x, y) {
    const ports = document.querySelectorAll("#mission3 .net-port");
    for (let i = 0; i < ports.length; i++) {
      const rect = ports[i].getBoundingClientRect();
      if (x >= rect.left - 14 && x <= rect.right + 14 && y >= rect.top - 14 && y <= rect.bottom + 14) {
        return ports[i];
      }
    }
    return null;
  }

  function updatePlugDrag(x, y) {
    if (!drag) return;
    drag.x = x;
    drag.y = y;
    const ghost = $("overlay-drag");
    ghost.style.left = x + "px";
    ghost.style.top = y + "px";
    const port = findPortAt(x, y);
    document.querySelectorAll("#mission3 .net-port").forEach(function (item) {
      item.classList.remove("drag-target");
    });
    if (port) port.classList.add("drag-target");
  }

  function endPlugDrag(x, y) {
    if (!drag) return;
    const plug = drag.plug;
    drag = null;
    const overlay = $("overlay-drag");
    overlay.classList.remove("is-active");
    overlay.innerHTML = "";
    document.body.classList.remove("is-dragging");
    document.querySelectorAll(".plug-chip").forEach(function (chip) {
      chip.classList.remove("dragging");
    });
    document.querySelectorAll("#mission3 .net-port").forEach(function (item) {
      item.classList.remove("drag-target");
    });
    const port = findPortAt(x, y);
    if (!port) {
      if (window.LabAudio) window.LabAudio.warning();
      App.showToast("Port belum dituju", "Tarik ujung kabel ke port LAN yang menyala pada perangkat.", "warning");
      return;
    }
    if (port.getAttribute("data-port") !== plug) {
      App.penalize("Port tidak sesuai", "Hubungkan ujung PC ke port PC dan ujung switch ke port switch.");
      return;
    }
    connectPlug(plug);
  }

  function connectPlug(plug) {
    if (!state.m3 || state.m3.step !== 3) return;
    if (plug === "pc" && state.m3.pcConnected) return;
    if (plug === "switch" && state.m3.switchConnected) return;
    if (plug === "pc") state.m3.pcConnected = true;
    else state.m3.switchConnected = true;
    const port = document.querySelector('#mission3 .net-port[data-port="' + plug + '"]');
    if (port) {
      port.classList.add("is-connected");
      port.classList.remove("active-target", "drag-target");
    }
    const chip = document.querySelector('.plug-chip[data-plug="' + plug + '"]');
    if (chip) chip.classList.add("is-connected");
    if (window.LabAudio) window.LabAudio.link();
    if (state.m3.pcConnected && state.m3.switchConnected) {
      const svg = $("m3-cable-svg");
      svg.classList.add("is-linked");
      drawNetworkCable();
      $("m3-link-status").textContent = "LINK UP";
      const chipStatus = $("m3-net-chip");
      chipStatus.classList.add("online");
      chipStatus.querySelector("span").textContent = "KABEL TERHUBUNG";
      App.award(100);
      App.showToast("Kabel terhubung", "Link fisik PC-LAB-01 ke switch aktif. Konfigurasikan alamat IP.", "success");
      later(function () {
        setStep(4);
      }, 650);
    } else {
      App.showToast("Satu ujung terpasang", "Hubungkan ujung kabel lainnya ke port yang sesuai.", "info");
    }
  }

  function drawNetworkCable() {
    if (state.current !== 3) return;
    const canvas = $("m3-canvas");
    const svg = $("m3-cable-svg");
    const pcPort = document.querySelector('#mission3 .net-port[data-port="pc"]');
    const switchPort = document.querySelector('#mission3 .net-port[data-port="switch"]');
    const base = $("m3-cable-base");
    const flow = $("m3-cable-flow");
    if (!canvas || !svg || !pcPort || !switchPort || !base || !flow) return;
    const canvasRect = canvas.getBoundingClientRect();
    const pcRect = pcPort.getBoundingClientRect();
    const switchRect = switchPort.getBoundingClientRect();
    const startX = pcRect.left + pcRect.width / 2 - canvasRect.left + 8;
    const startY = pcRect.top + pcRect.height / 2 - canvasRect.top;
    const endX = switchRect.left + switchRect.width / 2 - canvasRect.left - 8;
    const endY = switchRect.top + switchRect.height / 2 - canvasRect.top;
    const bend = Math.max(44, Math.abs(endX - startX) * 0.44);
    const controlY = Math.min(startY, endY) - 52;
    const path = "M " + startX + " " + startY + " C " + (startX + bend) + " " + controlY + ", " + (endX - bend) + " " + controlY + ", " + endX + " " + endY;
    base.setAttribute("d", path);
    flow.setAttribute("d", path);
  }

  function validIp(value) {
    const parts = value.split(".");
    if (parts.length !== 4) return false;
    return parts.every(function (part) {
      return /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255;
    });
  }

  function setFieldError(id, hasError, message) {
    const field = $("m3-field-" + id);
    if (!field) return;
    field.classList.toggle("has-error", hasError);
    const hint = field.querySelector(".field-hint");
    if (hasError && message && hint) hint.textContent = message;
  }

  function applyIp() {
    if (!state.m3 || state.m3.step !== 4) return;
    const ipInput = $("m3-ip");
    const maskInput = $("m3-mask");
    const gwInput = $("m3-gw");
    if (!ipInput || !maskInput || !gwInput) return;
    const ip = ipInput.value.trim();
    const mask = maskInput.value.trim();
    const gw = gwInput.value.trim();
    const ipOk = validIp(ip) && ip === "192.168.1.10";
    const maskOk = validIp(mask) && mask === "255.255.255.0";
    const gwOk = validIp(gw) && gw === "192.168.1.1";
    setFieldError("ip", !ipOk, ip && validIp(ip) ? "Gunakan alamat 192.168.1.10" : "Format IP tidak valid");
    setFieldError("mask", !maskOk, mask && validIp(mask) ? "Gunakan subnet 255.255.255.0" : "Format subnet tidak valid");
    setFieldError("gw", !gwOk, gw && validIp(gw) ? "Gunakan gateway 192.168.1.1" : "Format gateway tidak valid");
    if (!ipOk || !maskOk || !gwOk) {
      App.penalize("Konfigurasi IP salah", "Periksa kembali alamat IP, subnet mask, dan gateway.");
      ipInput.focus();
      return;
    }
    state.m3.ipConfigured = true;
    document.querySelectorAll("#mission3 .net-device").forEach(function (device) {
      device.classList.add("is-online");
    });
    $("m3-pc-ip").textContent = "IP: 192.168.1.10";
    $("m3-switch-ip").textContent = "GW: 192.168.1.1";
    $("m3-link-status").textContent = "ONLINE";
    const chip = $("m3-net-chip");
    chip.classList.add("online");
    chip.querySelector("span").textContent = "JARINGAN ONLINE";
    App.award(100);
    if (window.LabAudio) window.LabAudio.link();
    App.showToast("IP berhasil diterapkan", "PC-LAB-01 kini berada pada jaringan 192.168.1.0/24.", "success");
    later(function () {
      setStep(5);
    }, 700);
  }

  function appendTerminal(text, type) {
    const body = $("m3-terminal-body");
    if (!body) return;
    const line = document.createElement("div");
    line.className = "terminal-line" + (type ? " " + type : "");
    line.textContent = text;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function submitPing() {
    if (!state.m3 || state.m3.step !== 5 || state.m3.pingStarted) return;
    const input = $("m3-command");
    if (!input) return;
    const command = input.value.trim();
    if (!/^ping\s+192\.168\.1\.1(\s+-n\s+4)?$/i.test(command)) {
      appendTerminal("C:\\Users\\Lab> " + command, "command");
      appendTerminal("Perintah tidak dikenali. Gunakan: ping 192.168.1.1", "error");
      App.penalize("Perintah ping salah", "Ketik ping 192.168.1.1 tanpa alamat lain.");
      input.select();
      return;
    }
    state.m3.pingStarted = true;
    input.disabled = true;
    const send = $("m3-send");
    if (send) send.disabled = true;
    appendTerminal("C:\\Users\\Lab> " + command, "command");
    appendTerminal("Pinging 192.168.1.1 with 32 bytes of data:", "dim");
    $("m3-cable-svg").classList.add("is-pinging");
    $("m3-link-status").textContent = "PINGING";
    if (window.LabAudio) window.LabAudio.ping();
    const replies = [1, 1, 2, 1];
    replies.forEach(function (time, index) {
      later(function () {
        appendTerminal("Reply from 192.168.1.1: bytes=32 time=" + time + "ms TTL=64", "success");
        if (window.LabAudio) window.LabAudio.ping();
      }, 350 + index * 380);
    });
    later(function () {
      appendTerminal("", "dim");
      appendTerminal("Ping statistics for 192.168.1.1:", "dim");
      appendTerminal("    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)", "success");
      $("m3-cable-svg").classList.remove("is-pinging");
      $("m3-link-status").textContent = "ONLINE";
      App.award(100);
      state.m3.step = 6;
      updateProgress(6);
      App.showToast("Ping berhasil", "Gateway 192.168.1.1 merespons. Koneksi jaringan tervalidasi.", "success");
      if (window.LabAudio) window.LabAudio.success();
    }, 2020);
    later(function () {
      App.completeMission(3);
    }, 3050);
  }

  function onPointerMove(event) {
    if (!drag || state.current !== 3) return;
    event.preventDefault();
    if (drag.type === "rj45") updateConnectorDrag(event.clientX, event.clientY);
    else if (drag.type === "plug") updatePlugDrag(event.clientX, event.clientY);
  }

  function onPointerUp(event) {
    if (!drag || state.current !== 3) return;
    if (drag.type === "rj45") endConnectorDrag(event.clientX, event.clientY);
    else if (drag.type === "plug") endPlugDrag(event.clientX, event.clientY);
  }

  function cancelDrag() {
    if (!drag) return;
    drag = null;
    const ghost = $("overlay-drag");
    ghost.classList.remove("is-active");
    ghost.innerHTML = "";
    document.body.classList.remove("is-dragging");
    document.querySelectorAll(".plug-chip").forEach(function (chip) {
      chip.classList.remove("dragging");
    });
    document.querySelectorAll("#mission3 .net-port").forEach(function (item) {
      item.classList.remove("drag-target");
    });
    const rj45 = $("m3-rj45");
    if (rj45) rj45.classList.remove("near");
  }

  function resetNetworkCanvas() {
    document.querySelectorAll("#mission3 .net-device").forEach(function (device) {
      device.classList.remove("is-online");
    });
    document.querySelectorAll("#mission3 .net-port").forEach(function (port) {
      port.classList.remove("is-connected", "active-target", "drag-target");
    });
    $("m3-cable-svg").classList.remove("is-linked", "is-pinging");
    $("m3-cable-base").setAttribute("d", "");
    $("m3-cable-flow").setAttribute("d", "");
    $("m3-link-status").textContent = "OFFLINE";
    const chip = $("m3-net-chip");
    chip.classList.remove("online");
    chip.querySelector("span").textContent = "KABEL BELUM TERHUBUNG";
    $("m3-pc-ip").textContent = "IP: —";
    $("m3-switch-ip").textContent = "GW: —";
  }

  function start() {
    if (!App.beginMission(3)) return;
    run += 1;
    clearTimers();
    drag = null;
    state.m3 = {
      step: 0,
      stripped: false,
      terminated: false,
      crimped: false,
      pcConnected: false,
      switchConnected: false,
      ipConfigured: false,
      pingStarted: false
    };
    resetNetworkCanvas();
    $("overlay-drag").classList.remove("is-active");
    $("overlay-drag").innerHTML = "";
    document.body.classList.remove("is-dragging");
    $("m3-progress-bar").style.width = "0%";
    updateProgress(0);
    renderTool(0);
    const overlay = $("mission3");
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlay.scrollTop = 0;
    App.showMissionIntro(3);
    if (window.LabAudio) window.LabAudio.click();
  }

  function stop() {
    run += 1;
    clearTimers();
    drag = null;
    const overlay = $("mission3");
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

  document.addEventListener("pointermove", onPointerMove, { passive: false });
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", cancelDrag);
  window.addEventListener("resize", function () {
    if (state.current === 3 && state.m3 && state.m3.pcConnected && state.m3.switchConnected) {
      drawNetworkCable();
    }
  });

  App.mission3 = { start: start, stop: stop };
})();
