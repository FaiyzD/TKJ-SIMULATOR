(function () {
  "use strict";

  const App = window.TKJ;
  if (!App) return;
  const $ = App.$;
  const state = App.state;

  const root = $("desktop-mode");
  const win = $("desktop-window");
  const winTitle = $("desktop-window-title");
  const winBody = $("desktop-window-body");
  const clockEl = $("desktop-clock");
  const taskLabel = $("desktop-task-label");
  const startBtn = $("desktop-start");
  const startMenu = $("desktop-start-menu");
  const exitBtn = $("desktop-exit");
  const powerBtn = $("desktop-power");
  const closeWinBtn = $("desktop-window-close");

  if (!root || !win || !winBody) return;

  const APP_META = {
    pc: { title: "This PC" },
    network: { title: "Network & Internet" },
    tools: { title: "TKJ Tools" },
    bin: { title: "Recycle Bin" }
  };

  let activeApp = null;
  let clockTimer = null;
  let asyncTimers = [];

  function isBooted() {
    return !!(window.Lab && window.Lab.booted);
  }

  function sound(name) {
    if (window.LabAudio && window.LabAudio[name]) window.LabAudio[name]();
  }

  function clearAsync() {
    asyncTimers.forEach(function (timer) {
      clearTimeout(timer);
      clearInterval(timer);
    });
    asyncTimers = [];
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function updateClock() {
    const now = new Date();
    clockEl.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
  }

  function startClock() {
    updateClock();
    clearInterval(clockTimer);
    clockTimer = setInterval(updateClock, 1000);
  }

  function stopClock() {
    clearInterval(clockTimer);
    clockTimer = null;
  }

  function closeStartMenu() {
    startMenu.classList.add("hidden");
    startBtn.setAttribute("aria-expanded", "false");
  }

  function toggleStartMenu() {
    const willShow = startMenu.classList.contains("hidden");
    startMenu.classList.toggle("hidden", !willShow);
    startBtn.setAttribute("aria-expanded", String(willShow));
    if (willShow) sound("click");
  }

  function hideAppWindow() {
    win.classList.add("hidden");
    activeApp = null;
    winBody.innerHTML = "";
    taskLabel.textContent = "Desktop";
    clearAsync();
  }

  function openApp(id) {
    const meta = APP_META[id];
    if (!meta) return;
    clearAsync();
    activeApp = id;
    winTitle.textContent = meta.title;
    taskLabel.textContent = meta.title;
    winBody.innerHTML = renderAppContent(id);
    win.classList.remove("hidden");
    winBody.scrollTop = 0;
    bindApp(id);
    closeStartMenu();
    sound("click");
  }

  function openDesktop() {
    if (!isBooted()) {
      if (App.showToast) {
        App.showToast("Komputer belum siap", "Selesaikan misi power-on sampai Windows selesai dimuat.", "warning");
      }
      return;
    }
    root.classList.remove("hidden");
    root.setAttribute("aria-hidden", "false");
    hideAppWindow();
    closeStartMenu();
    startClock();
    sound("power");
  }

  function closeDesktop() {
    root.classList.add("hidden");
    root.setAttribute("aria-hidden", "true");
    hideAppWindow();
    closeStartMenu();
    stopClock();
    sound("click");
  }

  function spec(label, title, detail) {
    return '<div class="app-spec"><span>' + label + "</span><strong>" + title + "</strong><small>" + detail + "</small></div>";
  }

  function renderPc() {
    return '<div class="app-spec-grid">' +
      spec("PROSESOR", "Intel Core i5-12400", "6-Core · 12-Thread · LGA1700") +
      spec("MEMORI", "16 GB DDR4-3200", "Dual channel") +
      spec("PENYIMPANAN", "SSD NVMe 512 GB", "M.2 PCIe · Drive sistem") +
      spec("GRAFIS", "Intel UHD Graphics 730", "Shared memory") +
      spec("JARINGAN", "Realtek GbE", "LAN 01 · Gigabit") +
      spec("SISTEM OPERASI", "Windows 10 Pro", "22H2 · TKJ Lab Build") +
      "</div>" +
      '<div class="app-note"><i></i><span id="app-pc-note">Semua perangkat terdeteksi dan berjalan normal.</span></div>' +
      '<div class="app-actions">' +
      '<button type="button" class="btn btn-ghost" id="app-pc-scan"><svg><use href="#i-bolt"></use></svg><span>Pindai Ulang Perangkat</span></button>' +
      '<button type="button" class="btn btn-ghost" id="app-pc-tools"><svg><use href="#i-terminal"></use></svg><span>Buka Terminal</span></button>' +
      "</div>";
  }

  function renderNetwork() {
    const configured = !!state.completed[3];
    const ip = configured ? "192.168.1.10" : "169.254.12.8";
    const gateway = configured ? "192.168.1.1" : "—";
    const status = configured
      ? '<i class="ok"></i>Terhubung'
      : '<i class="warn"></i>Belum dikonfigurasi';
    const firstLine = configured
      ? "Adapter LAN 01 aktif. Gateway 192.168.1.1 siap diuji."
      : "Adapter LAN 01 aktif, tetapi alamat IP belum dikonfigurasi.\nSelesaikan Misi 03 untuk mengaktifkan koneksi gateway.";
    return '<div class="app-kv">' +
      "<div><span>STATUS ADAPTOR</span><strong>" + status + "</strong></div>" +
      "<div><span>ALAMAT IP</span><strong>" + ip + "</strong></div>" +
      "<div><span>SUBNET MASK</span><strong>255.255.255.0</strong></div>" +
      "<div><span>GATEWAY</span><strong>" + gateway + "</strong></div>" +
      "</div>" +
      '<pre class="app-terminal" id="app-net-output">' + firstLine + "</pre>" +
      '<div class="app-actions">' +
      '<button type="button" class="btn btn-ghost" id="app-net-ping"><svg><use href="#i-network"></use></svg><span>Ping Gateway</span></button>' +
      "</div>";
  }

  function renderTools() {
    return '<div class="app-terminal" id="app-console" style="min-height:180px">TKJ Tools Console · Microsoft Windows [Version 10.0.19045]\nKetik "help" untuk melihat daftar perintah.</div>' +
      '<form class="app-console-form" id="app-console-form">' +
      "<span>&gt;</span>" +
      '<input id="app-console-input" autocomplete="off" spellcheck="false" aria-label="Perintah terminal">' +
      "<button type=\"submit\">Kirim</button>" +
      "</form>";
  }

  function renderBin() {
    return '<div class="app-empty"><svg><use href="#i-trash"></use></svg><strong>Recycle Bin kosong</strong><span>Tidak ada file yang dihapus. Workstation ini baru saja selesai dirakit.</span></div>';
  }

  function renderAppContent(id) {
    if (id === "pc") return renderPc();
    if (id === "network") return renderNetwork();
    if (id === "tools") return renderTools();
    return renderBin();
  }

  function bindApp(id) {
    if (id === "pc") {
      const scan = $("app-pc-scan");
      const tools = $("app-pc-tools");
      if (scan) {
        scan.addEventListener("click", function () {
          const note = $("app-pc-note");
          if (note) note.textContent = "Pemindaian selesai · 6 perangkat terdeteksi dalam kondisi OK.";
          sound("success");
        });
      }
      if (tools) tools.addEventListener("click", function () { openApp("tools"); });
    } else if (id === "network") {
      const ping = $("app-net-ping");
      if (ping) ping.addEventListener("click", runNetworkPing);
    } else if (id === "tools") {
      const form = $("app-console-form");
      const input = $("app-console-input");
      if (form && input) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          const value = input.value.trim();
          input.value = "";
          if (value) runCommand(value);
          input.focus();
        });
        setTimeout(function () {
          if (input.isConnected) input.focus();
        }, 80);
      }
    }
  }

  function appendConsole(text, tone) {
    const consoleEl = $("app-console");
    if (!consoleEl) return;
    const line = document.createElement("span");
    line.className = "line" + (tone ? " " + tone : "");
    line.textContent = text;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function consolePing(host) {
    const online = !!state.completed[3];
    appendConsole("Pinging " + host + " with 32 bytes of data:");
    let count = 0;
    function next() {
      if (!root.classList.contains("hidden") && activeApp === "tools") {
        if (count >= 4) {
          appendConsole(
            "Ping statistics for " + host + ": Sent = 4, Received = " + (online ? 4 : 0) + ", Lost = " + (online ? 0 : 4) + " (" + (online ? 0 : 100) + "% loss)",
            online ? "ok" : "err"
          );
          return;
        }
        if (online) {
          appendConsole("Reply from " + host + ": bytes=32 time=" + (1 + count) + "ms TTL=64", "ok");
        } else {
          appendConsole("Request timed out.", "err");
        }
        count += 1;
        asyncTimers.push(setTimeout(next, 260));
      }
    }
    next();
  }

  function runCommand(raw) {
    appendConsole("> " + raw, "prompt");
    const parts = raw.split(/\s+/);
    const name = parts[0].toLowerCase();
    const host = parts[1] || "192.168.1.1";
    const configured = !!state.completed[3];

    if (name === "help") {
      appendConsole("Perintah tersedia:");
      appendConsole("  help             Tampilkan bantuan");
      appendConsole("  ipconfig         Lihat konfigurasi jaringan");
      appendConsole("  ping <host>      Uji koneksi ke host");
      appendConsole("  systeminfo       Informasi perangkat");
      appendConsole("  dir              Daftar isi folder");
      appendConsole("  ver              Versi sistem operasi");
      appendConsole("  cls              Bersihkan layar");
      appendConsole("  exit             Keluar dari terminal");
    } else if (name === "ipconfig") {
      if (configured) {
        appendConsole("Adapter LAN 01 · Realtek GbE");
        appendConsole("   IPv4 Address . . . . . . : 192.168.1.10");
        appendConsole("   Subnet Mask . . . . . . : 255.255.255.0");
        appendConsole("   Default Gateway . . . . : 192.168.1.1", "ok");
      } else {
        appendConsole("Adapter LAN 01 · Realtek GbE");
        appendConsole("   IPv4 Address . . . . . . : 169.254.12.8 (APIPA)");
        appendConsole("   Subnet Mask . . . . . . : 255.255.0.0");
        appendConsole("   Default Gateway . . . . : (kosong)", "err");
        appendConsole("Konfigurasi IP belum dijalankan. Selesaikan Misi 03.", "err");
      }
    } else if (name === "ping") {
      consolePing(host);
    } else if (name === "systeminfo") {
      appendConsole("Host Name       : PC-LAB-01");
      appendConsole("OS Name         : Windows 10 Pro 22H2");
      appendConsole("Processor       : Intel Core i5-12400 · 6-Core");
      appendConsole("Memory          : 16384 MB DDR4-3200");
      appendConsole("Storage         : NVMe SSD 512 GB");
      appendConsole("Network         : Realtek GbE · LAN 01");
    } else if (name === "dir") {
      appendConsole(" Volume in drive C is TKJ-LAB");
      appendConsole(" Directory of C:\\Users\\Teknisi");
      appendConsole("");
      appendConsole("08/12/2026  08:00    <DIR>          Documents");
      appendConsole("08/12/2026  08:00    <DIR>          Downloads");
      appendConsole("08/12/2026  08:00    <DIR>          TKJ-Tools");
      appendConsole("08/12/2026  08:00             1,024 laporan-praktik.txt");
    } else if (name === "ver") {
      appendConsole("Microsoft Windows [Version 10.0.19045.3803]");
    } else if (name === "cls" || name === "clear") {
      const consoleEl = $("app-console");
      if (consoleEl) consoleEl.innerHTML = "";
    } else if (name === "exit") {
      closeDesktop();
    } else {
      appendConsole('"' + raw + '" bukan perintah yang dikenal. Ketik "help".', "err");
    }
  }

  function runNetworkPing() {
    const out = $("app-net-output");
    const button = $("app-net-ping");
    if (!out) return;
    const configured = !!state.completed[3];
    clearAsync();
    if (button) button.disabled = true;
    out.textContent = "> ping 192.168.1.1\nPinging 192.168.1.1 with 32 bytes of data:\n";
    let count = 0;
    function next() {
      if (!out.isConnected || root.classList.contains("hidden") || activeApp !== "network") return;
      if (count >= 4) {
        out.textContent += configured
          ? "\nPing statistics for 192.168.1.1:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
          : "\nPing statistics for 192.168.1.1:\n    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)";
        if (button) button.disabled = false;
        return;
      }
      out.textContent += configured
        ? "Reply from 192.168.1.1: bytes=32 time=1ms TTL=64\n"
        : "Request timed out.\n";
      count += 1;
      asyncTimers.push(setTimeout(next, 320));
    }
    next();
  }

  exitBtn.addEventListener("click", closeDesktop);
  powerBtn.addEventListener("click", closeDesktop);
  closeWinBtn.addEventListener("click", function () {
    hideAppWindow();
    sound("click");
  });

  startBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleStartMenu();
  });

  document.addEventListener("click", function (event) {
    if (root.classList.contains("hidden") || startMenu.classList.contains("hidden")) return;
    if (startMenu.contains(event.target) || startBtn.contains(event.target)) return;
    closeStartMenu();
  });

  document.querySelectorAll("#desktop-mode [data-app]").forEach(function (button) {
    button.addEventListener("click", function () {
      openApp(button.getAttribute("data-app"));
    });
  });

  ["result-use-pc", "final-use-pc", "menu-desktop"].forEach(function (id) {
    const button = $(id);
    if (button) button.addEventListener("click", openDesktop);
  });

  window.addEventListener("keydown", function (event) {
    if (root.classList.contains("hidden")) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      if (!startMenu.classList.contains("hidden")) {
        closeStartMenu();
        return;
      }
      if (!win.classList.contains("hidden")) {
        hideAppWindow();
        return;
      }
      closeDesktop();
    }
  }, true);

  App.desktop = {
    open: openDesktop,
    close: closeDesktop,
    available: isBooted
  };
})();
