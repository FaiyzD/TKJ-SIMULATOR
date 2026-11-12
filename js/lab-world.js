(function () {
  "use strict";

  const THREE = window.THREE;
  const DESK_TOP = 0.815;
  const MONITOR_POS = new THREE.Vector3(-0.03, DESK_TOP, -2.58);
  const CPU_POS = new THREE.Vector3(1.3, DESK_TOP, -2.56);
  const CABLE_POS = new THREE.Vector3(-1.3, DESK_TOP + 0.014, -2.21);
  const OUTLET_POS = new THREE.Vector3(2.72, 1.19, -4.12);
  const POWER_BUTTON_POS = new THREE.Vector3(1.43, 1.39, -2.196);
  const SCREEN_WORLD_POS = new THREE.Vector3(-0.03, 1.54, -2.535);

  function makeCanvasTexture(width, height, draw, anisotropy) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    draw(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = anisotropy || 4;
    return texture;
  }

  function addBox(parent, width, height, depth, material, x, y, z, options) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    const opts = options || {};
    if (opts.ry) mesh.rotation.y = opts.ry;
    if (opts.rx) mesh.rotation.x = opts.rx;
    if (opts.rz) mesh.rotation.z = opts.rz;
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radiusTop, radiusBottom, height, segments, material, x, y, z, options) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
    mesh.position.set(x, y, z);
    const opts = options || {};
    if (opts.rx) mesh.rotation.x = opts.rx;
    if (opts.ry) mesh.rotation.y = opts.ry;
    if (opts.rz) mesh.rotation.z = opts.rz;
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    return mesh;
  }

  function createFloorTexture(anisotropy) {
    const texture = makeCanvasTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = "#8a959d";
      ctx.fillRect(0, 0, w, h);
      const size = 128;
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          const n = Math.sin(x * 0.13 + y * 0.17) * 3;
          ctx.fillStyle = "rgb(" + Math.round(137 + n) + "," + Math.round(149 + n) + "," + Math.round(157 + n) + ")";
          ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
          ctx.strokeStyle = "rgba(57,72,83,0.42)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        }
      }
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "rgba(255,255,255,0.05)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.04)");
      grad.addColorStop(1, "rgba(255,255,255,0.03)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = "rgba(40,55,66," + (Math.random() * 0.07) + ")";
        ctx.fillRect(x, y, Math.random() * 9 + 1, Math.random() * 3 + 1);
      }
    }, anisotropy);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
    return texture;
  }

  function createWallTexture(anisotropy) {
    const texture = makeCanvasTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = "#c6d0d6";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) {
        const shade = 235 + Math.floor(Math.random() * 20);
        ctx.fillStyle = "rgba(" + shade + "," + shade + "," + shade + ",0.06)";
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.strokeStyle = "rgba(75,93,105,0.11)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    }, anisotropy);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 2);
    return texture;
  }

  function createDeskTexture(anisotropy) {
    const texture = makeCanvasTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = "#c9c1b5";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = "rgba(116,101,85," + (0.015 + Math.random() * 0.05) + ")";
        ctx.lineWidth = Math.random() * 1.5 + 0.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + Math.random() * 22, w * 0.7, y - Math.random() * 20, w, y + Math.random() * 9);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(0, 0, w, 18);
    }, anisotropy);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }

  function createKeyboardTexture(anisotropy) {
    return makeCanvasTexture(640, 240, function (ctx, w, h) {
      ctx.fillStyle = "#161d24";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#0a1015";
      ctx.fillRect(8, 8, w - 16, h - 16);
      const rows = 5;
      const keyH = 34;
      const startY = 18;
      for (let r = 0; r < rows; r++) {
        const keyW = r === 0 ? 50 : 40;
        const count = r === 0 ? 13 : Math.floor((w - 50) / (keyW + 5));
        const offset = r === 0 ? 18 : 25;
        for (let k = 0; k < count; k++) {
          const x = offset + k * (keyW + 5);
          const y = startY + r * 41;
          const grad = ctx.createLinearGradient(0, y, 0, y + keyH);
          grad.addColorStop(0, "#2d3a45");
          grad.addColorStop(1, "#1a242c");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, keyW, keyH, 5);
          ctx.fill();
          ctx.strokeStyle = "rgba(129,167,197,0.15)";
          ctx.stroke();
          if (r === 1 && k === 3) {
            ctx.strokeStyle = "rgba(68,176,255,0.4)";
            ctx.strokeRect(x + 5, y + 5, keyW - 10, keyH - 10);
          }
        }
      }
      ctx.fillStyle = "#25323d";
      ctx.beginPath();
      ctx.roundRect(w * 0.34, 205, w * 0.32, 22, 5);
      ctx.fill();
    }, anisotropy);
  }

  function createWhiteboardTexture(anisotropy) {
    return makeCanvasTexture(1024, 512, function (ctx, w, h) {
      ctx.fillStyle = "#eef1ee";
      ctx.fillRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "rgba(255,255,255,0.4)");
      grad.addColorStop(0.6, "rgba(179,198,203,0.04)");
      grad.addColorStop(1, "rgba(255,255,255,0.25)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(77,111,131,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(22, 22, w - 44, h - 44);
      ctx.fillStyle = "#1f4d70";
      ctx.font = "700 33px Arial";
      ctx.fillText("JADWAL PRAKTIK — LAB TKJ 01", 52, 82);
      ctx.fillStyle = "#47758f";
      ctx.font = "20px Arial";
      ctx.fillText("Semester Genap / Kelas XII TKJ", 52, 116);
      ctx.strokeStyle = "rgba(53,95,120,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 136);
      ctx.lineTo(w - 50, 136);
      ctx.stroke();
      const days = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"];
      const x0 = 54;
      const col = (w - 108) / 5;
      for (let i = 0; i < days.length; i++) {
        ctx.fillStyle = "#295d7f";
        ctx.font = "700 18px Arial";
        ctx.fillText(days[i], x0 + i * col + 12, 178);
        ctx.strokeStyle = "rgba(52,98,123,0.16)";
        ctx.strokeRect(x0 + i * col + 6, 190, col - 12, 120);
        ctx.strokeRect(x0 + i * col + 6, 314, col - 12, 132);
      }
      ctx.fillStyle = "#233f52";
      ctx.font = "600 17px Arial";
      ctx.fillText("Perakitan PC", x0 + 16, 225);
      ctx.fillText("Jaringan LAN", x0 + col + 16, 225);
      ctx.fillText("Instalasi OS", x0 + col * 2 + 16, 225);
      ctx.fillText("Troubleshooting", x0 + col * 3 + 16, 225);
      ctx.fillText("Kewirausahaan", x0 + col * 4 + 16, 225);
      ctx.fillStyle = "#4b7186";
      ctx.font = "15px Arial";
      ctx.fillText("07.30 – 10.00", x0 + 16, 251);
      ctx.fillText("10.15 – 12.45", x0 + col + 16, 251);
      ctx.fillText("07.30 – 10.00", x0 + col * 2 + 16, 251);
      ctx.fillText("13.00 – 15.30", x0 + col * 3 + 16, 251);
      ctx.fillText("10.15 – 11.45", x0 + col * 4 + 16, 251);
      ctx.fillStyle = "#a23f3f";
      ctx.font = "700 24px Arial";
      ctx.save();
      ctx.translate(770, 388);
      ctx.rotate(-0.04);
      ctx.fillText("SELALU CEK DAYA!", 0, 0);
      ctx.restore();
      ctx.strokeStyle = "rgba(162,63,63,0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(742, 420);
      ctx.lineTo(950, 411);
      ctx.stroke();
      ctx.fillStyle = "#438262";
      ctx.font = "600 17px Arial";
      ctx.fillText("Akhiri praktik dengan shutdown yang benar.", 55, 475);
    }, anisotropy);
  }

  function createPosterTexture(anisotropy) {
    return makeCanvasTexture(512, 720, function (ctx, w, h) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#0c3555");
      grad.addColorStop(1, "#071b2b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(93,190,255,0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#62c8ff";
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(35, 110 + i * 20);
        ctx.lineTo(w - 35, 110 + i * 20);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "#7fd3ff";
      ctx.font = "700 23px Arial";
      ctx.fillText("COMPUTER LABORATORY", 44, 84);
      ctx.fillStyle = "#f0f9ff";
      ctx.font = "700 128px Arial";
      ctx.fillText("TKJ", 44, 260);
      ctx.fillStyle = "rgba(166,220,255,0.8)";
      ctx.font = "600 25px Arial";
      ctx.fillText("TEKNIK KOMPUTER", 46, 310);
      ctx.fillText("DAN JARINGAN", 46, 344);
      ctx.strokeStyle = "rgba(111,203,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(46, 380);
      ctx.lineTo(w - 46, 380);
      ctx.stroke();
      ctx.fillStyle = "rgba(200,236,255,0.65)";
      ctx.font = "18px Arial";
      ctx.fillText("POWER  •  ASSEMBLY  •  NETWORK", 46, 422);
      ctx.fillStyle = "rgba(60,213,179,0.8)";
      ctx.beginPath();
      ctx.arc(w - 74, h - 80, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#051723";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w - 86, h - 80);
      ctx.lineTo(w - 77, h - 71);
      ctx.lineTo(w - 60, h - 90);
      ctx.stroke();
      ctx.fillStyle = "rgba(151,207,241,0.45)";
      ctx.font = "16px Arial";
      ctx.fillText("EXPERTISE CLASS / 01", 44, h - 55);
    }, anisotropy);
  }

  function createLogoTexture(anisotropy) {
    return makeCanvasTexture(512, 128, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(225,240,250,0.7)";
      ctx.font = "700 62px Arial";
      ctx.fillText("TKJ", 24, 78);
      ctx.fillStyle = "rgba(133,188,226,0.35)";
      ctx.font = "20px Arial";
      ctx.fillText("LAB SERIES", 180, 72);
      ctx.strokeStyle = "rgba(100,180,240,0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(165, 36);
      ctx.lineTo(165, 92);
      ctx.stroke();
    }, anisotropy);
  }

  function build(renderer) {
    const anisotropy = renderer.capabilities.getMaxAnisotropy();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b141d);
    scene.fog = new THREE.Fog(0x101c28, 10, 23);

    const floorTex = createFloorTexture(anisotropy);
    const wallTex = createWallTexture(anisotropy);
    const deskTex = createDeskTexture(anisotropy);
    const keyTex = createKeyboardTexture(anisotropy);
    const logoTexture = createLogoTexture(anisotropy);

    const mats = {
      floor: new THREE.MeshStandardMaterial({ map: floorTex, color: 0xb8c2c9, roughness: 0.82, metalness: 0.08 }),
      wall: new THREE.MeshStandardMaterial({ map: wallTex, color: 0xd2dbe1, roughness: 0.92 }),
      wallBand: new THREE.MeshStandardMaterial({ color: 0x2d475a, roughness: 0.8 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0xcfd7db, roughness: 0.95 }),
      desk: new THREE.MeshStandardMaterial({ map: deskTex, color: 0xc8bfb4, roughness: 0.58, metalness: 0.05 }),
      deskEdge: new THREE.MeshStandardMaterial({ color: 0x2b3842, roughness: 0.6 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x596871, roughness: 0.35, metalness: 0.7 }),
      darkMetal: new THREE.MeshStandardMaterial({ color: 0x1e2a34, roughness: 0.38, metalness: 0.62 }),
      blackPlastic: new THREE.MeshStandardMaterial({ color: 0x0d151c, roughness: 0.55, metalness: 0.2 }),
      plastic: new THREE.MeshStandardMaterial({ color: 0x222d36, roughness: 0.62, metalness: 0.18 }),
      silver: new THREE.MeshStandardMaterial({ color: 0x8c9aa4, roughness: 0.35, metalness: 0.75 }),
      white: new THREE.MeshStandardMaterial({ color: 0xe4e8ea, roughness: 0.55 }),
      blue: new THREE.MeshStandardMaterial({ color: 0x16497a, roughness: 0.5 }),
      darkFabric: new THREE.MeshStandardMaterial({ color: 0x172532, roughness: 0.9 }),
      screenEdge: new THREE.MeshStandardMaterial({ color: 0x070b0e, roughness: 0.35, metalness: 0.3 })
    };

    const room = new THREE.Group();
    scene.add(room);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 12.6), mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 1.9);
    floor.receiveShadow = true;
    room.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 12.6), mats.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.3, 1.9);
    ceiling.receiveShadow = true;
    room.add(ceiling);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 3.3), mats.wall);
    backWall.position.set(0, 1.65, -4.2);
    backWall.receiveShadow = true;
    room.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 3.3), mats.wall);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6.1, 1.65, 2);
    leftWall.receiveShadow = true;
    room.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 3.3), mats.wall);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(6.1, 1.65, 2);
    rightWall.receiveShadow = true;
    room.add(rightWall);

    addBox(room, 12.2, 0.12, 0.04, mats.deskEdge, 0, 0.1, -4.17, { cast: false });
    addBox(room, 12.2, 0.04, 0.05, mats.deskEdge, 0, 0.95, -4.18, { cast: false });
    addBox(room, 0.06, 0.98, 12.4, mats.wallBand, -6.08, 0.49, 2, { cast: false });
    addBox(room, 0.06, 0.98, 12.4, mats.wallBand, 6.08, 0.49, 2, { cast: false });
    addBox(room, 12.2, 0.98, 0.06, mats.wallBand, 0, 0.49, -4.18, { cast: false });

    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0xf1f8ff, emissive: 0xdff2ff, emissiveIntensity: 1.3, roughness: 0.4 });
    for (let i = 0; i < 3; i++) {
      addBox(room, 0.9, 0.04, 2.4, fixtureMat, -2.8, 3.27, -1.1 + i * 2.4, { cast: false });
      addBox(room, 0.9, 0.04, 2.4, fixtureMat, 2.8, 3.27, -1.1 + i * 2.4, { cast: false });
    }
    for (let i = 0; i < 4; i++) {
      addBox(room, 0.035, 0.03, 12.2, mats.darkMetal, -2.1 + i * 1.4, 3.29, 2, { cast: false });
    }

    const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x38434c, 0.52);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff3e2, 1.0);
    sun.position.set(-3.8, 5.8, 3.5);
    sun.target.position.set(0, 0.7, -2);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 22;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    scene.add(sun.target);

    const ceilingLightA = new THREE.PointLight(0xe8f5ff, 0.62, 12, 2);
    ceilingLightA.position.set(-2.6, 3.0, -0.8);
    scene.add(ceilingLightA);
    const ceilingLightB = new THREE.PointLight(0xe8f5ff, 0.52, 12, 2);
    ceilingLightB.position.set(2.7, 3.0, 2.0);
    scene.add(ceilingLightB);
    const fillLight = new THREE.PointLight(0x8fc6ff, 0.36, 8, 2);
    fillLight.position.set(0.5, 1.8, 2.8);
    scene.add(fillLight);

    function makeWhiteboard() {
      const texture = createWhiteboardTexture(anisotropy);
      const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.75, metalness: 0.05 });
      const group = new THREE.Group();
      group.position.set(-2.75, 1.88, -4.15);
      const frame = addBox(group, 2.35, 1.16, 0.055, mats.metal, 0, 0, 0, { cast: true });
      const board = new THREE.Mesh(new THREE.PlaneGeometry(2.26, 1.07), material);
      board.position.set(0, 0, 0.032);
      board.castShadow = false;
      group.add(board);
      const tray = addBox(group, 1.2, 0.04, 0.09, mats.metal, 0, -0.61, 0.05);
      tray.castShadow = true;
      const marker1 = addBox(group, 0.12, 0.025, 0.025, new THREE.MeshStandardMaterial({ color: 0xc94e4e }), -0.2, -0.57, 0.07);
      marker1.castShadow = false;
      const marker2 = addBox(group, 0.12, 0.025, 0.025, new THREE.MeshStandardMaterial({ color: 0x3f6fc8 }), 0.05, -0.57, 0.07);
      marker2.castShadow = false;
      scene.add(group);
      return group;
    }

    makeWhiteboard();

    function makePoster() {
      const group = new THREE.Group();
      group.position.set(2.53, 2.38, -4.16);
      const frame = addBox(group, 0.62, 0.9, 0.03, mats.darkMetal, 0, 0, 0, { cast: false });
      const texture = createPosterTexture(anisotropy);
      const posterMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72 });
      const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.82), posterMat);
      poster.position.set(0, 0, 0.018);
      group.add(poster);
      scene.add(group);
      return group;
    }

    makePoster();

    function makeClock() {
      const group = new THREE.Group();
      group.position.set(0.33, 2.56, -4.16);
      addCylinder(group, 0.23, 0.23, 0.035, 32, mats.darkMetal, 0, 0, 0, { rx: Math.PI / 2 });
      const faceMat = new THREE.MeshBasicMaterial({ color: 0xe9edf0 });
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.205, 40), faceMat);
      face.position.z = 0.022;
      group.add(face);
      const handMat = new THREE.MeshBasicMaterial({ color: 0x1e2b34 });
      const hourHand = addBox(group, 0.012, 0.09, 0.005, handMat, 0, 0.025, 0.028, { cast: false });
      hourHand.rotation.z = -0.5;
      const minuteHand = addBox(group, 0.008, 0.15, 0.005, handMat, 0, 0.035, 0.03, { cast: false });
      minuteHand.rotation.z = 1.3;
      const hub = addCylinder(group, 0.012, 0.012, 0.008, 12, handMat, 0, 0, 0.032, { rx: Math.PI / 2, cast: false });
      scene.add(group);
      return group;
    }

    makeClock();

    function createDesk(x, z, width) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      const deskWidth = width || 3.7;
      addBox(group, deskWidth, 0.075, 1.22, mats.desk, 0, 0.78, 0);
      addBox(group, deskWidth, 0.035, 0.04, mats.deskEdge, 0, 0.745, 0.6, { cast: false });
      addBox(group, 0.075, 0.74, 0.075, mats.darkMetal, -deskWidth / 2 + 0.09, 0.37, -0.48);
      addBox(group, 0.075, 0.74, 0.075, mats.darkMetal, deskWidth / 2 - 0.09, 0.37, -0.48);
      addBox(group, 0.075, 0.74, 0.075, mats.darkMetal, -deskWidth / 2 + 0.09, 0.37, 0.48);
      addBox(group, 0.075, 0.74, 0.075, mats.darkMetal, deskWidth / 2 - 0.09, 0.37, 0.48);
      addBox(group, deskWidth - 0.12, 0.045, 0.06, mats.darkMetal, 0, 0.16, -0.5, { cast: false });
      const drawer = new THREE.Group();
      drawer.position.set(-deskWidth / 2 + 0.39, 0.41, -0.15);
      addBox(drawer, 0.62, 0.62, 0.72, mats.darkMetal, 0, 0, 0);
      for (let i = 0; i < 3; i++) {
        addBox(drawer, 0.54, 0.16, 0.02, mats.metal, 0, 0.18 - i * 0.19, 0.37, { cast: false });
        addBox(drawer, 0.16, 0.012, 0.012, mats.silver, 0, 0.18 - i * 0.19, 0.39, { cast: false });
      }
      group.add(drawer);
      scene.add(group);
      return group;
    }

    function createMonitor(offOnly) {
      const group = new THREE.Group();
      group.position.copy(MONITOR_POS);
      addBox(group, 0.58, 0.025, 0.24, mats.darkMetal, 0, 0.015, 0.06);
      addBox(group, 0.065, 0.34, 0.06, mats.darkMetal, 0, 0.18, 0.025);
      const neck = addBox(group, 0.15, 0.09, 0.065, mats.blackPlastic, 0, 0.35, 0.025);
      neck.castShadow = true;
      const body = addBox(group, 1.31, 0.77, 0.06, mats.screenEdge, 0, 0.76, 0.01);
      body.castShadow = true;
      addBox(group, 1.24, 0.7, 0.015, mats.blackPlastic, 0, 0.76, 0.043, { cast: false });
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x05090d, toneMapped: false });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.19, 0.66), screenMat);
      screen.position.set(0, 0.76, 0.052);
      group.add(screen);
      addBox(group, 0.008, 0.66, 0.012, mats.blue, -0.61, 0.76, 0.048, { cast: false });
      const ledMat = new THREE.MeshStandardMaterial({ color: 0x1d3037, emissive: 0x000000, emissiveIntensity: 0 });
      addCylinder(group, 0.009, 0.009, 0.006, 10, ledMat, 0.42, 0.355, 0.064, { rx: Math.PI / 2, cast: false });
      const logoMat = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, opacity: 0.35 });
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.09), logoMat);
      logo.position.set(0, 0.36, 0.055);
      group.add(logo);
      if (offOnly) {
        screenMat.color.setHex(0x05080b);
      }
      scene.add(group);
      return { group: group, screen: screen, screenMat: screenMat, ledMat: ledMat };
    }

    const monitor = createMonitor(false);

    function createTower() {
      const group = new THREE.Group();
      group.position.copy(CPU_POS);
      addBox(group, 0.39, 0.67, 0.67, mats.darkMetal, 0, 0.335, 0);
      addBox(group, 0.36, 0.64, 0.015, mats.blackPlastic, 0, 0.335, 0.344, { cast: false });
      addBox(group, 0.02, 0.58, 0.012, mats.blue, -0.165, 0.33, 0.353, { cast: false });
      addBox(group, 0.012, 0.58, 0.012, mats.metal, 0.162, 0.33, 0.353, { cast: false });
      for (let i = 0; i < 4; i++) {
        addBox(group, 0.26, 0.008, 0.008, mats.metal, -0.015, 0.14 + i * 0.024, 0.354, { cast: false });
      }
      addBox(group, 0.1, 0.018, 0.012, mats.silver, 0, 0.61, 0.354, { cast: false });
      addBox(group, 0.065, 0.018, 0.015, mats.blackPlastic, -0.08, 0.47, 0.354, { cast: false });
      addBox(group, 0.065, 0.018, 0.015, mats.blackPlastic, -0.0, 0.47, 0.354, { cast: false });
      addBox(group, 0.035, 0.012, 0.012, mats.darkMetal, -0.13, 0.42, 0.354, { cast: false });
      addBox(group, 0.035, 0.012, 0.012, mats.darkMetal, -0.08, 0.42, 0.354, { cast: false });
      const powerLedMat = new THREE.MeshStandardMaterial({ color: 0x3a2020, emissive: 0x2a0505, emissiveIntensity: 0.35, roughness: 0.4 });
      addCylinder(group, 0.007, 0.007, 0.008, 10, powerLedMat, 0.14, 0.485, 0.356, { rx: Math.PI / 2, cast: false });
      const powerButton = new THREE.Group();
      powerButton.position.set(0.14, 0.55, 0.357);
      const buttonMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.016, 22), mats.silver);
      buttonMesh.rotation.x = Math.PI / 2;
      buttonMesh.castShadow = true;
      powerButton.add(buttonMesh);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.029, 0.003, 6, 24), new THREE.MeshStandardMaterial({ color: 0x55646f, roughness: 0.45, metalness: 0.6 }));
      ring.position.z = 0.003;
      powerButton.add(ring);
      group.add(powerButton);
      const hitbox = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.07), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hitbox.position.set(0.14, 0.53, 0.36);
      group.add(hitbox);
      const brandMat = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, opacity: 0.25 });
      const brand = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.06), brandMat);
      brand.position.set(-0.02, 0.34, 0.354);
      brand.rotation.z = Math.PI / 2;
      group.add(brand);
      scene.add(group);
      return {
        group: group,
        powerButton: powerButton,
        powerLedMat: powerLedMat,
        hitbox: hitbox
      };
    }

    const tower = createTower();

    function createKeyboardMouse() {
      const group = new THREE.Group();
      addBox(group, 0.94, 0.026, 0.3, mats.darkMetal, 0, DESK_TOP + 0.014, -1.94);
      const keysMat = new THREE.MeshStandardMaterial({ map: keyTex, roughness: 0.65 });
      const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.27), keysMat);
      keys.rotation.x = -Math.PI / 2;
      keys.position.set(0, DESK_TOP + 0.028, -1.94);
      group.add(keys);
      addBox(group, 0.92, 0.006, 0.012, mats.blue, 0, DESK_TOP + 0.031, -1.795, { cast: false });
      const padMat = new THREE.MeshStandardMaterial({ color: 0x15212b, roughness: 0.94 });
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.25), padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(0.77, DESK_TOP + 0.003, -1.93);
      group.add(pad);
      const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 12), mats.darkMetal);
      mouse.scale.set(1, 0.32, 1.35);
      mouse.position.set(0.77, DESK_TOP + 0.04, -1.94);
      mouse.castShadow = true;
      group.add(mouse);
      addBox(group, 0.024, 0.012, 0.045, mats.blue, 0.77, DESK_TOP + 0.067, -1.985, { cast: false });
      group.position.set(0, 0, 0);
      scene.add(group);
      return group;
    }

    createKeyboardMouse();

    function createChair(x, z, ry) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = ry || 0;
      const seatMat = mats.darkFabric;
      const seat = addBox(group, 0.55, 0.09, 0.52, seatMat, 0, 0.47, 0);
      seat.geometry.translate(0, 0, 0);
      addBox(group, 0.53, 0.64, 0.09, seatMat, 0, 0.82, 0.27, { rx: -0.11 });
      addBox(group, 0.08, 0.34, 0.08, mats.darkMetal, 0, 0.24, 0.03);
      addCylinder(group, 0.04, 0.04, 0.06, 12, mats.silver, 0, 0.06, 0.03);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const leg = addBox(group, 0.3, 0.035, 0.06, mats.darkMetal, Math.cos(a) * 0.16, 0.045, 0.03 + Math.sin(a) * 0.16);
        leg.rotation.y = -a;
      }
      const post = addCylinder(group, 0.028, 0.028, 0.34, 10, mats.metal, 0, 0.3, 0.03);
      post.castShadow = true;
      scene.add(group);
      return group;
    }

    createChair(-0.28, -1.42, 0.08);

    function createOtherWorkstation(x, z, ry) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = ry || 0;
      const desk = new THREE.Group();
      addBox(desk, 2.6, 0.07, 1.05, mats.desk, 0, 0.78, 0);
      addBox(desk, 0.07, 0.73, 0.07, mats.darkMetal, -1.25, 0.36, -0.42);
      addBox(desk, 0.07, 0.73, 0.07, mats.darkMetal, 1.25, 0.36, -0.42);
      addBox(desk, 0.07, 0.73, 0.07, mats.darkMetal, -1.25, 0.36, 0.42);
      addBox(desk, 0.07, 0.73, 0.07, mats.darkMetal, 1.25, 0.36, 0.42);
      group.add(desk);
      const towerGroup = new THREE.Group();
      addBox(towerGroup, 0.3, 0.52, 0.52, mats.darkMetal, 0.9, 1.05, -0.06);
      addBox(towerGroup, 0.28, 0.49, 0.012, mats.blackPlastic, 0.9, 1.05, 0.206, { cast: false });
      addBox(towerGroup, 0.32, 0.02, 0.55, mats.darkMetal, 0.9, 1.32, -0.06);
      group.add(towerGroup);
      const mGroup = new THREE.Group();
      mGroup.position.set(-0.32, 0.815, -0.26);
      addBox(mGroup, 0.42, 0.025, 0.2, mats.darkMetal, 0, 0.01, 0.04);
      addBox(mGroup, 0.05, 0.25, 0.05, mats.darkMetal, 0, 0.14, 0.02);
      addBox(mGroup, 0.92, 0.58, 0.05, mats.screenEdge, 0, 0.52, 0);
      addBox(mGroup, 0.87, 0.52, 0.012, mats.blackPlastic, 0, 0.52, 0.03, { cast: false });
      addBox(mGroup, 0.6, 0.02, 0.2, mats.darkMetal, 0, 0.82, 0.15);
      group.add(mGroup);
      const kGroup = new THREE.Group();
      addBox(kGroup, 0.72, 0.02, 0.23, mats.darkMetal, -0.35, 0.822, 0.32);
      group.add(kGroup);
      createChairAt(group, -0.34, 0.82, 0.04, 0.78);
      scene.add(group);
      return group;
    }

    function createChairAt(parent, x, y, z, scale) {
      const chair = new THREE.Group();
      chair.position.set(x, y, z);
      chair.scale.setScalar(scale);
      addBox(chair, 0.48, 0.08, 0.46, mats.darkFabric, 0, 0.44, 0);
      addBox(chair, 0.46, 0.54, 0.07, mats.darkFabric, 0, 0.73, 0.25, { rx: -0.08 });
      addBox(chair, 0.06, 0.3, 0.06, mats.darkMetal, 0, 0.23, 0.02);
      addCylinder(chair, 0.025, 0.025, 0.3, 8, mats.metal, 0, 0.29, 0.02);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        addBox(chair, 0.24, 0.03, 0.05, mats.darkMetal, Math.cos(a) * 0.13, 0.04, 0.02 + Math.sin(a) * 0.13);
      }
      parent.add(chair);
    }

    createOtherWorkstation(-3.95, -2.0, 0.05);

    function createServerRack() {
      const group = new THREE.Group();
      group.position.set(4.58, 0, -2.7);
      group.rotation.y = -0.06;
      addBox(group, 0.68, 1.95, 0.62, mats.darkMetal, 0, 0.975, 0);
      addBox(group, 0.58, 1.78, 0.02, mats.blackPlastic, 0, 1.02, 0.319, { cast: false });
      for (let i = 0; i < 7; i++) {
        addBox(group, 0.54, 0.16, 0.04, mats.plastic, 0, 0.27 + i * 0.24, 0.327, { cast: false });
        addBox(group, 0.05, 0.012, 0.01, mats.silver, -0.19, 0.32 + i * 0.24, 0.35, { cast: false });
        addBox(group, 0.3, 0.012, 0.006, mats.blackPlastic, 0.06, 0.22 + i * 0.24, 0.35, { cast: false });
      }
      const ledColors = [0x39d58c, 0x39a9ff, 0xffb84d, 0x39d58c, 0x39a9ff];
      const blinkers = [];
      for (let i = 0; i < 5; i++) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x11221c, emissive: ledColors[i], emissiveIntensity: 1.3 });
        addCylinder(group, 0.007, 0.007, 0.01, 8, mat, 0.18, 0.31 + i * 0.24, 0.352, { rx: Math.PI / 2, cast: false });
        blinkers.push(mat);
      }
      addBox(group, 0.62, 0.03, 0.64, mats.darkMetal, 0, 1.97, 0);
      addBox(group, 0.5, 0.2, 0.02, mats.screenEdge, 0, 1.8, 0.32, { cast: false });
      addBox(group, 0.36, 0.04, 0.005, mats.blue, 0, 1.8, 0.334, { cast: false });
      scene.add(group);
      return { group: group, blinkers: blinkers };
    }

    const rack = createServerRack();

    function createCabinet() {
      const group = new THREE.Group();
      group.position.set(-5.25, 0, -1.2);
      group.rotation.y = 0.1;
      addBox(group, 1.0, 1.35, 0.62, mats.metal, 0, 0.675, 0);
      addBox(group, 0.94, 0.03, 0.6, mats.darkMetal, 0, 1.36, 0);
      for (let i = 0; i < 2; i++) {
        addBox(group, 0.44, 0.09, 0.015, mats.white, -0.23 + i * 0.46, 0.78, 0.315, { cast: false });
        addBox(group, 0.1, 0.015, 0.02, mats.silver, -0.23 + i * 0.46, 0.78, 0.33, { cast: false });
      }
      addBox(group, 0.55, 0.04, 0.4, mats.darkMetal, 0, 1.42, 0.02);
      const plantGroup = new THREE.Group();
      plantGroup.position.set(0.18, 1.44, 0);
      addCylinder(plantGroup, 0.11, 0.15, 0.18, 12, mats.white, 0, 0.09, 0);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2c6e50, roughness: 0.8 });
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), leafMat);
        leaf.scale.set(0.45, 1.5, 0.3);
        leaf.position.set(Math.cos(i * 1.1) * 0.11, 0.28 + (i % 3) * 0.09, Math.sin(i * 1.1) * 0.1);
        leaf.rotation.z = Math.cos(i * 1.1) * 0.5;
        plantGroup.add(leaf);
      }
      group.add(plantGroup);
      scene.add(group);
    }

    createCabinet();

    function createOutlet() {
      const group = new THREE.Group();
      group.position.copy(OUTLET_POS);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0xe7ebec, roughness: 0.5, metalness: 0.05 });
      addBox(group, 0.26, 0.4, 0.035, plateMat, 0, 0, 0);
      const socketMat = new THREE.MeshStandardMaterial({ color: 0x1d2429, roughness: 0.55 });
      for (let i = 0; i < 2; i++) {
        addCylinder(group, 0.053, 0.053, 0.012, 22, socketMat, 0, 0.075 - i * 0.15, 0.024, { rx: Math.PI / 2, cast: false });
        addBox(group, 0.016, 0.042, 0.012, new THREE.MeshStandardMaterial({ color: 0x0a0e11 }), 0, 0.093 - i * 0.15, 0.033, { cast: false });
        addBox(group, 0.016, 0.042, 0.012, new THREE.MeshStandardMaterial({ color: 0x0a0e11 }), 0, 0.057 - i * 0.15, 0.033, { cast: false });
      }
      const ledMat = new THREE.MeshStandardMaterial({ color: 0x1c2b22, emissive: 0x000000, emissiveIntensity: 0 });
      addCylinder(group, 0.009, 0.009, 0.008, 10, ledMat, 0.085, -0.16, 0.027, { rx: Math.PI / 2, cast: false });
      addBox(group, 0.1, 0.016, 0.005, new THREE.MeshStandardMaterial({ color: 0x45555e }), -0.05, -0.16, 0.024, { cast: false });
      scene.add(group);
      return { group: group, ledMat: ledMat };
    }

    const outlet = createOutlet();

    function createCableCoil() {
      const group = new THREE.Group();
      group.position.copy(CABLE_POS);
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x0a0d10, roughness: 0.7, metalness: 0.08 });
      const points = [];
      for (let i = 0; i <= 120; i++) {
        const t = i / 120;
        const angle = t * Math.PI * 5.1;
        const r = 0.115 + Math.sin(t * Math.PI) * 0.028;
        points.push(new THREE.Vector3(Math.cos(angle) * r, 0.012 + Math.sin(t * Math.PI * 5) * 0.006, Math.sin(angle) * r * 0.8));
      }
      points.push(new THREE.Vector3(0.2, 0.012, 0.11));
      points.push(new THREE.Vector3(0.33, 0.012, 0.18));
      points.push(new THREE.Vector3(0.42, 0.015, 0.22));
      const curve = new THREE.CatmullRomCurve3(points);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 130, 0.011, 7, false), cableMat);
      tube.castShadow = true;
      group.add(tube);
      const plug = new THREE.Group();
      plug.position.set(0.44, 0.02, 0.23);
      plug.rotation.y = 0.4;
      addBox(plug, 0.055, 0.032, 0.075, mats.silver, 0, 0, 0);
      addBox(plug, 0.036, 0.018, 0.06, mats.blackPlastic, 0, 0, 0.005);
      for (let i = 0; i < 3; i++) {
        addBox(plug, 0.004, 0.004, 0.018, mats.silver, -0.012 + i * 0.012, 0.013, 0.05, { cast: false });
      }
      group.add(plug);
      const tagMat = new THREE.MeshStandardMaterial({ color: 0x2a7bbd, roughness: 0.55, emissive: 0x0a2d4c, emissiveIntensity: 0.35 });
      addBox(group, 0.16, 0.007, 0.045, tagMat, 0.22, 0.019, 0.06, { cast: false });
      const tagTexture = makeCanvasTexture(256, 64, function (ctx, w, h) {
        ctx.fillStyle = "#0f4772";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#a8ddff";
        ctx.font = "700 25px Arial";
        ctx.fillText("POWER", 16, 42);
      }, anisotropy);
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.032), new THREE.MeshBasicMaterial({ map: tagTexture }));
      tag.rotation.x = -Math.PI / 2;
      tag.position.set(0.22, 0.024, 0.06);
      group.add(tag);
      const auraMat = new THREE.MeshBasicMaterial({ color: 0x3d9eff, transparent: true, opacity: 0.35, depthWrite: false });
      const aura = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.005, 6, 48), auraMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.003;
      group.add(aura);
      scene.add(group);
      return { group: group, plug: plug, aura: aura, auraMat: auraMat };
    }

    const cable = createCableCoil();

    function createConnectedCable() {
      const group = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.72, 1.19, -4.10),
        new THREE.Vector3(2.72, 0.98, -4.06),
        new THREE.Vector3(2.73, 0.22, -4.03),
        new THREE.Vector3(2.86, 0.065, -3.86),
        new THREE.Vector3(3.02, 0.06, -3.42),
        new THREE.Vector3(2.94, 0.08, -3.12),
        new THREE.Vector3(2.65, 0.39, -2.96),
        new THREE.Vector3(2.18, 0.75, -2.9),
        new THREE.Vector3(1.76, 0.95, -2.9),
        new THREE.Vector3(1.52, 1.13, -2.9)
      ]);
      const geometry = new THREE.TubeGeometry(curve, 150, 0.013, 7, false);
      const material = new THREE.MeshStandardMaterial({ color: 0x080b0e, roughness: 0.58, metalness: 0.15 });
      const tube = new THREE.Mesh(geometry, material);
      tube.castShadow = true;
      group.add(tube);
      const plugMat = mats.silver;
      const outletPlug = new THREE.Group();
      outletPlug.position.set(2.72, 1.19, -4.075);
      addBox(outletPlug, 0.055, 0.07, 0.035, plugMat, 0, 0, 0);
      for (let i = 0; i < 3; i++) {
        addBox(outletPlug, 0.004, 0.004, 0.018, mats.silver, -0.012 + i * 0.012, 0, 0.025, { cast: false });
      }
      group.add(outletPlug);
      const cpuPlug = new THREE.Group();
      cpuPlug.position.set(1.51, 1.13, -2.9);
      cpuPlug.rotation.x = Math.PI / 2;
      addBox(cpuPlug, 0.052, 0.03, 0.06, plugMat, 0, 0, 0);
      group.add(cpuPlug);
      const total = geometry.index ? geometry.index.count : geometry.attributes.position.count;
      geometry.setDrawRange(0, 0);
      group.visible = false;
      scene.add(group);
      return { group: group, geometry: geometry, total: total, outletPlug: outletPlug, cpuPlug: cpuPlug };
    }

    const connectedCable = createConnectedCable();

    const screenLight = new THREE.PointLight(0x7fc3ff, 0.0, 3.8, 2);
    screenLight.position.set(MONITOR_POS.x, 1.55, -2.12);
    scene.add(screenLight);

    const dustCount = 240;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 10.5;
      dustPositions[i * 3 + 1] = 0.25 + Math.random() * 2.75;
      dustPositions[i * 3 + 2] = -3.8 + Math.random() * 9.6;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xbddcf0, size: 0.016, transparent: true, opacity: 0.24, depthWrite: false });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const desk = createDesk(0, -2.35, 3.7);

    return {
      scene: scene,
      desk: desk,
      monitor: monitor,
      tower: tower,
      cable: cable,
      connectedCable: connectedCable,
      outlet: outlet,
      rack: rack,
      dust: dust,
      screenLight: screenLight,
      anchors: {
        monitor: SCREEN_WORLD_POS.clone(),
        cable: CABLE_POS.clone(),
        outlet: OUTLET_POS.clone(),
        powerButton: POWER_BUTTON_POS.clone(),
        cpu: new THREE.Vector3(CPU_POS.x, 1.18, CPU_POS.z)
      }
    };
  }

  window.LabWorld = { build: build };
})();
