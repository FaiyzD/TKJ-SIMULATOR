(function () {
  "use strict";

  const THREE = window.THREE;

  if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
      const r = Math.min(typeof radius === "number" ? radius : 0, width / 2, height / 2);
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + width, y, x + width, y + height, r);
      this.arcTo(x + width, y + height, x, y + height, r);
      this.arcTo(x, y + height, x, y, r);
      this.arcTo(x, y, x + width, y, r);
      this.closePath();
      return this;
    };
  }

  const clamp = function (value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  const ease = function (value) {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  };

  const BIOS_END = 3200;
  const WINDOWS_END = 6800;
  const DESKTOP_END = 8100;

  const VIEWS = {
    hero: {
      position: new THREE.Vector3(3.45, 2.08, 2.72),
      target: new THREE.Vector3(-0.15, 1.25, -2.75),
      duration: 1.4
    },
    desk: {
      position: new THREE.Vector3(1.02, 1.72, 0.18),
      target: new THREE.Vector3(0.42, 1.34, -2.68),
      duration: 1.5
    },
    power: {
      position: new THREE.Vector3(1.52, 1.48, -1.15),
      target: new THREE.Vector3(1.42, 1.35, -2.23),
      duration: 1.1
    },
    monitor: {
      position: new THREE.Vector3(-0.02, 1.64, -1.62),
      target: new THREE.Vector3(-0.02, 1.52, -2.58),
      duration: 1.35
    },
    outlet: {
      position: new THREE.Vector3(2.05, 1.5, -2.82),
      target: new THREE.Vector3(2.72, 1.23, -4.08),
      duration: 1.1
    }
  };

  const Lab = {
    ready: false,
    booted: false,
    powered: false,
    connected: false,
    renderer: null,
    scene: null,
    camera: null,
    world: null,
    screenCanvas: null,
    screenCtx: null,
    screenTexture: null,
    screenState: "off",
    basePosition: new THREE.Vector3(),
    baseTarget: new THREE.Vector3(),
    viewFrom: new THREE.Vector3(),
    targetFrom: new THREE.Vector3(),
    viewTo: new THREE.Vector3(),
    targetTo: new THREE.Vector3(),
    viewElapsed: 0,
    viewDuration: 0,
    viewName: "hero",
    mouseX: 0,
    mouseY: 0,
    reduceMotion: false,
    boot: null,
    cableAnim: null,
    onFrame: null,
    onStage: null,
    onBootDone: null,
    onPower: null,

    init: function (options) {
      if (this.ready) return true;
      if (!THREE || !window.LabWorld) return false;
      const settings = options || {};
      this.onFrame = settings.onFrame || null;
      this.onStage = settings.onStage || null;
      this.onBootDone = settings.onBootDone || null;
      this.onPower = settings.onPower || null;
      this.reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const container = document.getElementById("webgl");
      if (!container) return false;

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.02;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);

      this.world = window.LabWorld.build(this.renderer);
      this.scene = this.world.scene;
      this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.04, 40);
      this.basePosition.copy(VIEWS.hero.position);
      this.baseTarget.copy(VIEWS.hero.target);
      this.camera.position.copy(this.basePosition);
      this.camera.lookAt(this.baseTarget);
      this.viewName = "hero";

      this.initScreen();
      this.bindEvents();
      this.reset();
      this.ready = true;
      requestAnimationFrame(this.tick.bind(this));
      return true;
    },

    bindEvents: function () {
      const self = this;
      window.addEventListener("resize", function () {
        self.resize();
      });
      window.addEventListener("pointermove", function (event) {
        if (event.pointerType === "touch") return;
        self.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
        self.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
      window.addEventListener("mouseleave", function () {
        self.mouseX = 0;
        self.mouseY = 0;
      });
    },

    resize: function () {
      if (!this.renderer || !this.camera) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    },

    initScreen: function () {
      this.screenCanvas = document.createElement("canvas");
      this.screenCanvas.width = 1024;
      this.screenCanvas.height = 576;
      this.screenCtx = this.screenCanvas.getContext("2d");
      this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
      this.screenTexture.encoding = THREE.sRGBEncoding;
      this.screenTexture.minFilter = THREE.LinearFilter;
      this.screenTexture.magFilter = THREE.LinearFilter;
      this.screenTexture.generateMipmaps = false;
      this.world.monitor.screenMat.map = this.screenTexture;
      this.world.monitor.screenMat.color.setHex(0xffffff);
      this.world.monitor.screenMat.needsUpdate = true;
      this.drawOffScreen();
    },

    markScreen: function () {
      if (this.screenTexture) this.screenTexture.needsUpdate = true;
    },

    drawOffScreen: function () {
      const ctx = this.screenCtx;
      if (!ctx) return;
      ctx.fillStyle = "#04080b";
      ctx.fillRect(0, 0, 1024, 576);
      const sheen = ctx.createLinearGradient(0, 0, 1024, 576);
      sheen.addColorStop(0, "rgba(130,180,210,0.055)");
      sheen.addColorStop(0.34, "rgba(130,180,210,0.015)");
      sheen.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, 1024, 576);
      ctx.fillStyle = "rgba(90,128,150,0.16)";
      ctx.fillRect(1018, 0, 1, 576);
      this.screenState = "off";
      this.markScreen();
    },

    drawRoundRect: function (x, y, width, height, radius, fill) {
      const ctx = this.screenCtx;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fillStyle = fill;
      ctx.fill();
    },

    drawBios: function (elapsed) {
      const ctx = this.screenCtx;
      const progress = clamp(elapsed / BIOS_END, 0, 1);
      ctx.fillStyle = "#050b10";
      ctx.fillRect(0, 0, 1024, 576);
      const glow = ctx.createRadialGradient(740, 260, 10, 740, 260, 380);
      glow.addColorStop(0, "rgba(25,73,112,0.22)");
      glow.addColorStop(1, "rgba(4,10,15,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1024, 576);

      ctx.fillStyle = "#0a2f50";
      ctx.fillRect(0, 0, 1024, 58);
      ctx.fillStyle = "#1e76b5";
      ctx.fillRect(0, 56, 1024, 3);
      ctx.fillStyle = "#dff2ff";
      ctx.font = "700 22px Consolas, monospace";
      ctx.fillText("TKJ LAB BIOS", 34, 37);
      ctx.font = "12px Consolas, monospace";
      ctx.fillStyle = "#7cb3d6";
      ctx.fillText("SETUP UTILITY  /  REV 2.14", 250, 36);
      ctx.textAlign = "right";
      ctx.fillStyle = "#9bc9e7";
      ctx.fillText("LAB 01  ·  WORKSTATION A-01", 990, 36);
      ctx.textAlign = "left";

      ctx.fillStyle = "#88b7d7";
      ctx.font = "700 14px Consolas, monospace";
      ctx.fillText("SYSTEM INFORMATION", 38, 98);
      ctx.strokeStyle = "rgba(91,154,197,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(38, 109);
      ctx.lineTo(986, 109);
      ctx.stroke();

      const checks = [
        ["Processor", "Intel Core i5-12400  6-Core / 12-Thread"],
        ["Memory", "16384 MB DDR4-3200  ·  DUAL CHANNEL"],
        ["Storage", "NVME SSD 512 GB  ·  SATA PORT 0"],
        ["Graphics", "Intel UHD Graphics 730  ·  SHARED MEMORY"],
        ["Network", "Realtek GbE Family Controller  ·  LAN 01"],
        ["Power", "ATX 650W  ·  STABLE"]
      ];
      let visibleChecks = Math.floor(progress * (checks.length + 0.6));
      ctx.font = "15px Consolas, monospace";
      checks.forEach(function (check, index) {
        if (index > visibleChecks) return;
        const y = 148 + index * 37;
        ctx.fillStyle = "#6192b0";
        ctx.fillText(check[0], 42, y);
        ctx.fillStyle = "#c8e5f6";
        ctx.fillText(check[1], 222, y);
        if (index < visibleChecks) {
          ctx.fillStyle = "#48d19e";
          ctx.textAlign = "right";
          ctx.fillText("OK", 710, y);
          ctx.textAlign = "left";
        }
      });

      ctx.fillStyle = "#88b7d7";
      ctx.font = "700 14px Consolas, monospace";
      ctx.fillText("BOOT DEVICE", 746, 148);
      ctx.strokeStyle = "rgba(91,154,197,0.22)";
      ctx.strokeRect(744, 162, 240, 124);
      ctx.font = "13px Consolas, monospace";
      ctx.fillStyle = "#c8e5f6";
      ctx.fillText("1. NVME SSD 512 GB", 764, 194);
      ctx.fillStyle = "#5e8aa6";
      ctx.fillText("2. USB HDD", 764, 222);
      ctx.fillText("3. NETWORK BOOT", 764, 250);

      const lines = [
        "POST: MEMORY TEST ........ 16384 MB OK",
        "DETECTING STORAGE ........ NVME SSD OK",
        "LOADING BOOT AGENT ....... WINDOWS 10",
        "VERIFYING SYSTEM ......... PASS"
      ];
      ctx.font = "12px Consolas, monospace";
      const lineCount = Math.min(lines.length, Math.floor(progress * 5));
      for (let i = 0; i < lineCount; i++) {
        ctx.fillStyle = i === lineCount - 1 ? "#7fc8f0" : "#426b84";
        ctx.fillText(lines[i], 42, 388 + i * 24);
      }

      ctx.fillStyle = "rgba(62,117,155,0.24)";
      ctx.fillRect(42, 492, 940, 12);
      const barGradient = ctx.createLinearGradient(42, 0, 982, 0);
      barGradient.addColorStop(0, "#1e78c9");
      barGradient.addColorStop(0.65, "#4ec2ff");
      barGradient.addColorStop(1, "#68e7c7");
      ctx.fillStyle = barGradient;
      ctx.fillRect(42, 492, 940 * progress, 12);
      ctx.fillStyle = "#6995af";
      ctx.font = "12px Consolas, monospace";
      ctx.fillText("POST CHECK", 42, 526);
      ctx.textAlign = "right";
      ctx.fillStyle = progress > 0.82 ? "#7fe0ba" : "#88b7d7";
      ctx.fillText(Math.round(progress * 100) + "%  ·  " + (progress > 0.82 ? "BOOTING WINDOWS" : "CHECKING HARDWARE"), 982, 526);
      ctx.textAlign = "left";
      if (Math.floor(elapsed / 430) % 2 === 0) {
        ctx.fillStyle = "#b8ddf3";
        ctx.font = "700 12px Consolas, monospace";
        ctx.fillText("TEKAN ENTER UNTUK MELANJUTKAN", 42, 558);
      }
      ctx.textAlign = "right";
      ctx.fillStyle = "#456e87";
      ctx.fillText("DEL: SETUP   F8: BOOT MENU   F12: NETWORK BOOT", 982, 558);
      ctx.textAlign = "left";
      this.screenState = "bios";
      this.markScreen();
    },

    drawWindows: function (elapsed) {
      const ctx = this.screenCtx;
      const t = elapsed - BIOS_END;
      const gradient = ctx.createLinearGradient(0, 0, 1024, 576);
      gradient.addColorStop(0, "#03111f");
      gradient.addColorStop(0.55, "#062743");
      gradient.addColorStop(1, "#02101c");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 576);
      const bloom = ctx.createRadialGradient(512, 240, 20, 512, 240, 360);
      bloom.addColorStop(0, "rgba(36,122,190,0.28)");
      bloom.addColorStop(1, "rgba(4,18,32,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, 1024, 576);

      const size = 48;
      const gap = 7;
      const startX = 512 - size - gap / 2;
      const startY = 188;
      const colors = ["#63c7ff", "#45a8ef", "#7cd8ff", "#4bb9ff"];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const offset = (row * 2 + col) * 0.15;
          ctx.globalAlpha = clamp((t - offset * 1000) / 700, 0, 1);
          ctx.fillStyle = colors[row * 2 + col];
          ctx.fillRect(startX + col * (size + gap), startY + row * (size + gap), size, size);
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(153,221,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(512, 340, 28, -Math.PI / 2, Math.PI * 1.35);
      ctx.stroke();
      ctx.strokeStyle = "rgba(203,240,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const spinnerAngle = t / 420;
      ctx.arc(512, 340, 28, spinnerAngle, spinnerAngle + 0.82);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#e4f5ff";
      ctx.font = "300 28px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Memuat Windows", 512, 420);
      ctx.fillStyle = "#7faac7";
      ctx.font = "13px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("TKJ LAB WORKSTATION  ·  A-01", 512, 448);
      const dots = ".".repeat(Math.floor(t / 350) % 4);
      ctx.fillStyle = "#4c7897";
      ctx.fillText("Menyiapkan perangkat" + dots, 512, 474);
      ctx.textAlign = "left";
      ctx.fillStyle = "#37627f";
      ctx.font = "11px Consolas, monospace";
      ctx.fillText("WINDOWS 10 PRO  |  22H2  |  LAB BUILD", 34, 548);
      ctx.textAlign = "right";
      ctx.fillText("SECURE BOOT: ON", 990, 548);
      ctx.textAlign = "left";
      this.screenState = "windows";
      this.markScreen();
    },

    drawDesktop: function () {
      const ctx = this.screenCtx;
      const background = ctx.createLinearGradient(0, 0, 1024, 576);
      background.addColorStop(0, "#061221");
      background.addColorStop(0.5, "#0b3b60");
      background.addColorStop(1, "#04101c");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 1024, 576);

      ctx.save();
      ctx.globalAlpha = 0.9;
      const beamA = ctx.createLinearGradient(0, 0, 0, 560);
      beamA.addColorStop(0, "rgba(43,158,222,0.5)");
      beamA.addColorStop(1, "rgba(8,49,79,0)");
      ctx.fillStyle = beamA;
      ctx.beginPath();
      ctx.moveTo(160, 480);
      ctx.bezierCurveTo(330, 310, 480, 80, 760, 0);
      ctx.lineTo(1024, 0);
      ctx.lineTo(1024, 300);
      ctx.bezierCurveTo(760, 330, 450, 420, 160, 480);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#72e2e8";
      ctx.beginPath();
      ctx.moveTo(1024, 0);
      ctx.bezierCurveTo(810, 180, 550, 240, 340, 380);
      ctx.bezierCurveTo(610, 290, 850, 240, 1024, 140);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const logo = ctx.createRadialGradient(512, 270, 10, 512, 270, 220);
      logo.addColorStop(0, "rgba(94,205,255,0.16)");
      logo.addColorStop(1, "rgba(4,20,34,0)");
      ctx.fillStyle = logo;
      ctx.fillRect(0, 0, 1024, 576);
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(218,245,255,0.2)";
      ctx.font = "600 74px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("TKJ LAB", 512, 300);
      ctx.fillStyle = "rgba(144,209,240,0.16)";
      ctx.font = "13px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("COMPUTER LABORATORY  ·  WORKSTATION A-01", 512, 329);
      ctx.textAlign = "left";

      const desktopIcons = [
        { label: "This PC", x: 38, y: 38, fill: "#67c7f2" },
        { label: "Recycle Bin", x: 38, y: 126, fill: "#9ab6c7" },
        { label: "Network", x: 38, y: 214, fill: "#70d9b1" },
        { label: "TKJ Tools", x: 38, y: 302, fill: "#ffc36e" }
      ];
      desktopIcons.forEach(function (icon, index) {
        ctx.fillStyle = "rgba(6,18,29,0.52)";
        ctx.beginPath();
        ctx.roundRect(icon.x - 6, icon.y - 6, 74, 70, 7);
        ctx.fill();
        ctx.fillStyle = icon.fill;
        ctx.globalAlpha = 0.9;
        if (index === 0) {
          ctx.fillRect(icon.x + 8, icon.y + 7, 38, 25);
          ctx.fillStyle = "#223b4c";
          ctx.fillRect(icon.x + 13, icon.y + 12, 28, 15);
          ctx.fillStyle = icon.fill;
          ctx.fillRect(icon.x + 22, icon.y + 34, 12, 4);
          ctx.fillRect(icon.x + 15, icon.y + 40, 26, 3);
        } else if (index === 1) {
          ctx.fillRect(icon.x + 10, icon.y + 12, 34, 31);
          ctx.fillStyle = "#526b7c";
          ctx.fillRect(icon.x + 15, icon.y + 17, 24, 5);
        } else if (index === 2) {
          ctx.beginPath();
          ctx.arc(icon.x + 28, icon.y + 25, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#223b4c";
          ctx.beginPath();
          ctx.arc(icon.x + 28, icon.y + 25, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = icon.fill;
          ctx.fillRect(icon.x + 5, icon.y + 12, 8, 5);
          ctx.fillRect(icon.x + 43, icon.y + 12, 8, 5);
        } else {
          ctx.fillRect(icon.x + 8, icon.y + 10, 38, 32);
          ctx.fillStyle = "#203b4c";
          ctx.font = "10px Consolas, monospace";
          ctx.fillText("</>", icon.x + 19, icon.y + 32);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(225,244,255,0.82)";
        ctx.font = "11px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(icon.label, icon.x + 31, icon.y + 58);
        ctx.textAlign = "left";
      });

      const welcomeX = 760;
      this.drawRoundRect(welcomeX, 56, 220, 116, 12, "rgba(5,21,35,0.7)");
      ctx.strokeStyle = "rgba(89,178,232,0.18)";
      ctx.strokeRect(welcomeX + 0.5, 56.5, 219, 115);
      ctx.fillStyle = "#86cdef";
      ctx.font = "700 10px Consolas, monospace";
      ctx.fillText("SELAMAT DATANG", welcomeX + 17, 82);
      ctx.fillStyle = "#e8f7ff";
      ctx.font = "20px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Teknisi Lab", welcomeX + 17, 110);
      ctx.fillStyle = "#6f9ab4";
      ctx.font = "11px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Workstation siap digunakan.", welcomeX + 17, 134);
      ctx.fillStyle = "#4bd6a2";
      ctx.font = "700 10px Consolas, monospace";
      ctx.fillText("● ONLINE", welcomeX + 17, 156);

      const taskbarGradient = ctx.createLinearGradient(0, 512, 0, 576);
      taskbarGradient.addColorStop(0, "rgba(5,21,35,0.9)");
      taskbarGradient.addColorStop(1, "rgba(3,13,23,0.98)");
      ctx.fillStyle = taskbarGradient;
      ctx.fillRect(0, 512, 1024, 64);
      ctx.strokeStyle = "rgba(130,196,235,0.16)";
      ctx.beginPath();
      ctx.moveTo(0, 512.5);
      ctx.lineTo(1024, 512.5);
      ctx.stroke();

      const startX = 22;
      const startSize = 17;
      ctx.fillStyle = "#65c8ff";
      ctx.fillRect(startX, 535, startSize, startSize);
      ctx.fillStyle = "#4db6f5";
      ctx.fillRect(startX + 20, 535, startSize, startSize);
      ctx.fillStyle = "#7edaff";
      ctx.fillRect(startX, 555, startSize, startSize);
      ctx.fillStyle = "#44a8e8";
      ctx.fillRect(startX + 20, 555, startSize, startSize);

      ctx.fillStyle = "rgba(117,177,214,0.13)";
      ctx.beginPath();
      ctx.roundRect(74, 533, 186, 28, 14);
      ctx.fill();
      ctx.fillStyle = "#6086a0";
      ctx.font = "11px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Cari di sini", 90, 552);
      ctx.strokeStyle = "#527c97";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(242, 547, 5, 0, Math.PI * 2);
      ctx.moveTo(246, 551);
      ctx.lineTo(250, 555);
      ctx.stroke();

      const taskApps = ["#3e8cc3", "#63c0a3", "#d6a756", "#d6776f", "#7d9fbd", "#6ba4ce"];
      taskApps.forEach(function (color, index) {
        ctx.fillStyle = "rgba(84,143,181,0.17)";
        ctx.beginPath();
        ctx.roundRect(328 + index * 48, 532, 38, 30, 7);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(338 + index * 48, 540, 18, 14, 3);
        ctx.fill();
      });

      ctx.fillStyle = "rgba(137,193,227,0.11)";
      ctx.beginPath();
      ctx.roundRect(842, 531, 156, 31, 7);
      ctx.fill();
      ctx.textAlign = "right";
      ctx.fillStyle = "#d0e7f5";
      ctx.font = "11px 'Segoe UI', Arial, sans-serif";
      const now = new Date();
      const time = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      const date = now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
      ctx.fillText(time, 984, 545);
      ctx.fillStyle = "#89aec4";
      ctx.font = "9px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(date, 984, 559);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(111,216,179,0.9)";
      ctx.font = "700 10px Consolas, monospace";
      ctx.fillText("LAN 01  ·  CONNECTED", 550, 549);
      this.screenState = "desktop";
      this.markScreen();
    },

    reset: function () {
      if (!this.ready) return;
      this.powered = false;
      this.booted = false;
      this.connected = false;
      this.boot = null;
      this.cableAnim = null;
      this.world.connectedCable.group.visible = false;
      this.world.connectedCable.geometry.setDrawRange(0, 0);
      this.world.connectedCable.cpuPlug.visible = false;
      this.world.connectedCable.outletPlug.visible = true;
      this.world.cable.group.visible = true;
      this.world.cable.auraMat.opacity = 0.35;
      this.world.tower.powerLedMat.color.setHex(0x3a2020);
      this.world.tower.powerLedMat.emissive.setHex(0x2a0505);
      this.world.tower.powerLedMat.emissiveIntensity = 0.35;
      this.world.tower.powerButton.position.z = 0.357;
      this.world.monitor.ledMat.color.setHex(0x1d3037);
      this.world.monitor.ledMat.emissive.setHex(0x000000);
      this.world.monitor.ledMat.emissiveIntensity = 0;
      this.world.screenLight.intensity = 0;
      this.drawOffScreen();
      this.setView("hero", true);
    },

    setView: function (name, immediate) {
      const view = VIEWS[name];
      if (!view) return;
      this.viewName = name;
      this.viewFrom.copy(this.basePosition);
      this.targetFrom.copy(this.baseTarget);
      this.viewTo.copy(view.position);
      this.targetTo.copy(view.target);
      this.viewElapsed = 0;
      this.viewDuration = immediate ? 0 : view.duration;
      if (immediate) {
        this.basePosition.copy(view.position);
        this.baseTarget.copy(view.target);
        this.camera.position.copy(view.position);
        this.camera.lookAt(view.target);
      }
    },

    tick: function (now) {
      if (!this.ready) return;
      const dt = Math.min(0.05, (now - (this.lastTick || now)) / 1000);
      this.lastTick = now;
      this.animateView(dt);
      this.animateWorld(dt, now);
      if (this.boot && this.boot.active) this.updateBoot(now);
      if (this.cableAnim) this.updateCable(now);
      this.renderer.render(this.scene, this.camera);
      if (this.onFrame) this.onFrame(now);
      requestAnimationFrame(this.tick.bind(this));
    },

    animateView: function (dt) {
      if (this.viewDuration > 0) {
        this.viewElapsed += dt;
        const t = clamp(this.viewElapsed / this.viewDuration, 0, 1);
        const k = ease(t);
        this.basePosition.lerpVectors(this.viewFrom, this.viewTo, k);
        this.baseTarget.lerpVectors(this.targetFrom, this.targetTo, k);
        if (t >= 1) this.viewDuration = 0;
      }
      const amount = this.reduceMotion ? 0 : 1;
      this.camera.position.copy(this.basePosition);
      this.camera.position.x += this.mouseX * 0.075 * amount;
      this.camera.position.y -= this.mouseY * 0.045 * amount;
      const tx = this.baseTarget.x + this.mouseX * 0.045 * amount;
      const ty = this.baseTarget.y - this.mouseY * 0.025 * amount;
      this.camera.lookAt(tx, ty, this.baseTarget.z);
    },

    animateWorld: function (dt, now) {
      const t = now / 1000;
      if (this.world.dust) {
        this.world.dust.rotation.y += dt * 0.012;
        this.world.dust.position.y = Math.sin(t * 0.12) * 0.05;
      }
      if (this.world.cable.group.visible && this.world.cable.aura) {
        this.world.cable.aura.rotation.z += dt * 0.34;
        this.world.cable.auraMat.opacity = 0.25 + Math.sin(t * 2.1) * 0.1;
      }
      if (this.world.rack && this.world.rack.blinkers) {
        this.world.rack.blinkers.forEach(function (mat, index) {
          mat.emissiveIntensity = 0.85 + Math.sin(t * (2.2 + index * 0.38) + index * 1.7) * 0.55;
        });
      }
      if (this.powered) {
        const target = this.screenState === "desktop" ? 0.92 : this.screenState === "windows" ? 0.86 : 0.68;
        this.world.screenLight.intensity += (target - this.world.screenLight.intensity) * Math.min(1, dt * 4);
      }
      if (this.boot && this.boot.pressStart) {
        const p = clamp((now - this.boot.pressStart) / 280, 0, 1);
        this.world.tower.powerButton.position.z = 0.357 - Math.sin(p * Math.PI) * 0.012;
      }
    },

    updateBoot: function (now) {
      const elapsed = now - this.boot.start;
      if (this.boot.stage !== "bios" && elapsed < BIOS_END) {
        if (this.boot.stage !== "bios") this.emitStage("bios");
      }
      if (this.boot.stage === "bios" && elapsed < BIOS_END) {
        this.drawBios(elapsed);
      }
      if (elapsed >= BIOS_END && this.boot.stage === "bios") {
        this.emitStage("windows");
      }
      if (this.boot.stage === "windows" && elapsed < WINDOWS_END) {
        this.drawWindows(elapsed);
      }
      if (elapsed >= WINDOWS_END && this.boot.stage === "windows") {
        this.emitStage("desktop");
        this.drawDesktop();
      }
      if (elapsed >= DESKTOP_END && this.boot.active) {
        this.boot.active = false;
        this.booted = true;
        if (this.onBootDone) this.onBootDone();
      }
    },

    emitStage: function (stage) {
      if (!this.boot) return;
      this.boot.stage = stage;
      if (stage === "bios") {
        this.drawBios(0);
      } else if (stage === "windows") {
        this.drawWindows(BIOS_END);
      } else if (stage === "desktop") {
        this.drawDesktop();
      }
      if (this.onStage) this.onStage(stage);
    },

    updateCable: function (now) {
      const anim = this.cableAnim;
      const t = clamp((now - anim.start) / anim.duration, 0, 1);
      const k = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.world.connectedCable.geometry.setDrawRange(0, Math.floor(anim.total * k));
      this.world.connectedCable.cpuPlug.visible = k > 0.84;
      if (t >= 1) {
        this.world.connectedCable.geometry.setDrawRange(0, anim.total);
        this.world.connectedCable.cpuPlug.visible = true;
        this.cableAnim = null;
        if (anim.onDone) anim.onDone();
      }
    },

    hideCableCoil: function () {
      if (!this.world) return;
      this.world.cable.group.visible = false;
    },

    pickupCable: function () {
      this.hideCableCoil();
    },

    connectCable: function (onDone) {
      if (!this.world || this.connected) return false;
      this.world.connectedCable.group.visible = true;
      this.world.connectedCable.geometry.setDrawRange(0, 0);
      this.world.connectedCable.outletPlug.visible = true;
      this.world.connectedCable.cpuPlug.visible = false;
      this.world.outlet.ledMat.color.setHex(0x173d2b);
      this.world.outlet.ledMat.emissive.setHex(0x30d88b);
      this.world.outlet.ledMat.emissiveIntensity = 1.8;
      this.cableAnim = {
        start: performance.now(),
        duration: 1150,
        total: this.world.connectedCable.total,
        onDone: function () {
          this.connected = true;
          if (onDone) onDone();
        }.bind(this)
      };
      return true;
    },

    setConnected: function () {
      this.connected = true;
      this.world.connectedCable.group.visible = true;
      this.world.connectedCable.geometry.setDrawRange(0, this.world.connectedCable.total);
      this.world.connectedCable.cpuPlug.visible = true;
      this.world.outlet.ledMat.color.setHex(0x173d2b);
      this.world.outlet.ledMat.emissive.setHex(0x30d88b);
      this.world.outlet.ledMat.emissiveIntensity = 1.8;
    },

    pressPower: function () {
      if (!this.world || this.powered) return false;
      this.powered = true;
      this.boot = {
        active: true,
        start: performance.now() + 260,
        pressStart: performance.now(),
        stage: "boot"
      };
      this.world.tower.powerLedMat.color.setHex(0x0f3d27);
      this.world.tower.powerLedMat.emissive.setHex(0x43ffad);
      this.world.tower.powerLedMat.emissiveIntensity = 2.4;
      this.world.monitor.ledMat.color.setHex(0x143b2d);
      this.world.monitor.ledMat.emissive.setHex(0x4effb7);
      this.world.monitor.ledMat.emissiveIntensity = 1.7;
      this.drawBios(0);
      if (this.onPower) this.onPower();
      return true;
    },

    project: function (anchor) {
      if (!this.camera || !this.world) return { x: 0, y: 0, visible: false };
      let position = anchor;
      if (typeof anchor === "string") position = this.world.anchors[anchor];
      if (!position) return { x: 0, y: 0, visible: false };
      const projected = position.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
      const visible = projected.z > -1 && projected.z < 1 && x > -60 && x < window.innerWidth + 60 && y > 64 && y < window.innerHeight + 60;
      return { x: x, y: y, visible: visible };
    },

    focusDesk: function () {
      this.setView("desk");
    },

    focusPower: function () {
      this.setView("power");
    },

    focusMonitor: function () {
      this.setView("monitor");
    },

    focusOutlets: function () {
      this.setView("outlet");
    }
  };

  window.Lab = Lab;
})();
