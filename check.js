
    const els = {
      brightBtn: document.getElementById("brightBtn"),
      darkBtn: document.getElementById("darkBtn"),
      brightFill: document.getElementById("brightFill"),
      darkFill: document.getElementById("darkFill"),
      brightText: document.getElementById("brightText"),
      darkText: document.getElementById("darkText"),
      mixLabel: document.getElementById("mixLabel"),
      magmaChamber: document.getElementById("magmaChamber"),
      stage: document.getElementById("stage"),
      rockPreview: document.getElementById("rockPreview"),
      rockRealPhoto: document.getElementById("rockRealPhoto"),
      rockPhotoHint: document.getElementById("rockPhotoHint"),
      realRockCta: document.getElementById("realRockCta"),
      photoModal: document.getElementById("photoModal"),
      photoModalImg: document.getElementById("photoModalImg"),
      photoModalTitle: document.getElementById("photoModalTitle"),
      photoModalSubtitle: document.getElementById("photoModalSubtitle"),
      photoModalOriginal: document.getElementById("photoModalOriginal"),
      photoZoomOut: document.getElementById("photoZoomOut"),
      photoZoomReset: document.getElementById("photoZoomReset"),
      photoZoomIn: document.getElementById("photoZoomIn"),
      photoModalClose: document.getElementById("photoModalClose"),
      rockName: document.getElementById("rockName"),
      resultTitle: document.getElementById("resultTitle"),
      resultExplain: document.getElementById("resultExplain"),
      facts: document.getElementById("facts"),
      statusText: document.getElementById("statusText"),
      resetBtn: document.getElementById("resetBtn"),
      startCoolingBtn: document.getElementById("startCoolingBtn"),
      compareBtn: document.getElementById("compareBtn"),
      deepMarker: document.getElementById("deepMarker"),
      surfaceMarker: document.getElementById("surfaceMarker"),
      coolingOverlay: document.getElementById("coolingOverlay"),
      coolingScene: document.getElementById("coolingScene"),
      coolingTitle: document.getElementById("coolingTitle"),
      coolingSubtitle: document.getElementById("coolingSubtitle"),
      coolingStatus: document.getElementById("coolingStatus"),
      coolingNote: document.getElementById("coolingNote"),
      bar1Label: document.getElementById("bar1Label"),
      bar1Fill: document.getElementById("bar1Fill"),
      bar1Text: document.getElementById("bar1Text"),
      bar2Row: document.getElementById("bar2Row"),
      bar2Label: document.getElementById("bar2Label"),
      bar2Fill: document.getElementById("bar2Fill"),
      bar2Text: document.getElementById("bar2Text"),
      closeCoolingBtn: document.getElementById("closeCoolingBtn")
    };

    let bright = 50;
    let locationType = "deep";
    let drag = null;
    let activeSession = 0;
    let currentPhotoRock = null;
    let photoZoom = 1;

    const rockImages = {
      "화강암": "images/granite.png",
      "섬록암": "images/diorite.png",
      "반려암": "images/gabbro.png",
      "유문암": "images/rhyolite.png",
      "안산암": "images/andesite.png",
      "현무암": "images/basalt.png"
};

    const rockTable = {
      deep: {
        bright: {
          name: "화강암",
          type: "심성암",
          texture: "큰 결정",
          explain: "깊은 곳에서 천천히 식어 결정이 크게 자랐고, 밝은 광물 성분이 많아 밝은색 심성암인 화강암이 되었습니다.",
          minerals: "석영·장석·흑운모",
          a: "#e5e7eb",
          b: "#a8a29e"
        },
        middle: {
          name: "섬록암",
          type: "심성암",
          texture: "큰 결정",
          explain: "깊은 곳에서 천천히 식어 결정이 크게 자랐고, 밝은 성분과 어두운 성분이 섞여 중간색 심성암인 섬록암이 되었습니다.",
          minerals: "사장석·각섬석·흑운모",
          a: "#a8a29e",
          b: "#57534e"
        },
        dark: {
          name: "반려암",
          type: "심성암",
          texture: "큰 결정",
          explain: "깊은 곳에서 천천히 식어 결정이 크게 자랐고, 어두운 광물 성분이 많아 어두운색 심성암인 반려암이 되었습니다.",
          minerals: "휘석·사장석·감람석",
          a: "#475569",
          b: "#111827"
        }
      },
      surface: {
        bright: {
          name: "유문암",
          type: "화산암",
          texture: "작은 결정",
          explain: "마그마가 지표 밖으로 분출된 뒤 빠르게 식어 결정이 작게 자랐고, 밝은 광물 성분이 많아 밝은색 화산암인 유문암이 되었습니다.",
          minerals: "석영·장석",
          a: "#f1f5f9",
          b: "#cbd5e1"
        },
        middle: {
          name: "안산암",
          type: "화산암",
          texture: "작은 결정",
          explain: "마그마가 지표 밖으로 분출된 뒤 빠르게 식어 결정이 작게 자랐고, 밝은 성분과 어두운 성분이 섞여 중간색 화산암인 안산암이 되었습니다.",
          minerals: "사장석·각섬석·휘석",
          a: "#94a3b8",
          b: "#475569"
        },
        dark: {
          name: "현무암",
          type: "화산암",
          texture: "작은 결정",
          explain: "마그마가 지표 밖으로 분출된 뒤 빠르게 식어 결정이 작게 자랐고, 어두운 광물 성분이 많아 어두운색 화산암인 현무암이 되었습니다.",
          minerals: "휘석·사장석·감람석",
          a: "#334155",
          b: "#020617"
        }
      }
    };

    function category() {
      if (bright >= 65) return "bright";
      if (bright <= 35) return "dark";
      return "middle";
    }

    function currentRock() {
      return rockTable[locationType][category()];
    }

    function updateUI() {
      const dark = 100 - bright;
      els.brightFill.style.width = bright + "%";
      els.darkFill.style.width = dark + "%";
      els.brightText.textContent = bright + "%";
      els.darkText.textContent = dark + "%";
      els.mixLabel.textContent = `마그마 성분: 밝은 ${bright}% · 어두운 ${dark}%`;

      const rock = currentRock();
      document.documentElement.style.setProperty("--rock-a", rock.a);
      document.documentElement.style.setProperty("--rock-b", rock.b);
      document.documentElement.style.setProperty("--grain", locationType === "deep" ? "5px" : "2px");
      document.documentElement.style.setProperty("--grain2", locationType === "deep" ? "4px" : "1.5px");
      document.documentElement.style.setProperty("--grain-gap", locationType === "deep" ? "34px" : "17px");

      els.deepMarker.classList.toggle("active", locationType === "deep");
      els.surfaceMarker.classList.toggle("active", locationType === "surface");

      els.facts.innerHTML = `
        <span class="fact">밝은 ${bright}%</span>
        <span class="fact">어두운 ${dark}%</span>
        <span class="fact">${locationType === "deep" ? "깊은 곳 선택" : "지표 부근 선택"}</span>
      `;
    }

    function createGhost(type) {
      const source = type === "bright" ? els.brightBtn : els.darkBtn;
      const color = type === "bright" ? "#fde68a" : "#334155";
      const ghost = document.createElement("div");
      ghost.className = "beaker-ghost";
      ghost.style.setProperty("--liquid", color);
      ghost.innerHTML = '<div class="beaker"><div class="liquid"></div></div><div class="ghost-stream"></div>';
      document.body.appendChild(ghost);
      source.style.opacity = "0.45";
      return ghost;
    }

    function spawnChamberBubble() {
      const bubble = document.createElement("div");
      bubble.className = "magma-bubble";
      bubble.style.left = (12 + Math.random() * 76) + "%";
      bubble.style.width = bubble.style.height = (8 + Math.random() * 12) + "px";
      els.magmaChamber.appendChild(bubble);
      setTimeout(() => bubble.remove(), 800);
    }

    function startBeakerDrag(event) {
      event.preventDefault();
      const type = event.currentTarget.dataset.type;
      const ghost = createGhost(type);
      drag = { type, ghost, source: event.currentTarget, overChamber: false, pouring: false, pourAccum: 0, pourLast: 0, raf: 0 };
      moveGhost(event.clientX, event.clientY);
      window.addEventListener("pointermove", moveBeaker);
      window.addEventListener("pointerup", endBeakerDrag, { once: true });
      els.statusText.textContent = "비커를 지하 깊은 마그마방으로 이동";
    }

    function moveGhost(x, y) {
      if (!drag) return;
      drag.ghost.style.left = x + "px";
      drag.ghost.style.top = y + "px";
    }

    function inside(el, x, y) {
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }

    function pourLoop(ts) {
      if (!drag || !drag.pouring) return;
      if (!drag.pourLast) drag.pourLast = ts;
      const dt = ts - drag.pourLast;
      drag.pourLast = ts;
      drag.pourAccum += dt;
      while (drag.pourAccum >= 120) {
        drag.pourAccum -= 120;
        if (drag.type === "bright") bright = Math.min(90, bright + 1);
        else bright = Math.max(10, bright - 1);
        updateUI();
        spawnChamberBubble();
      }
      els.rockPreview.classList.remove("ready");
      els.rockName.textContent = "?";
      els.resultTitle.textContent = "성분이 붓는 시간만큼 천천히 바뀌고 있습니다";
      els.resultExplain.textContent = "비커를 마그마방 위에 오래 두면 그 성분의 함량이 더 커집니다. 원하는 비율이 될 때까지 천천히 조절해 보세요.";
      els.statusText.textContent = drag.type === "bright" ? "밝은 성분을 붓는 중" : "어두운 성분을 붓는 중";
      drag.raf = requestAnimationFrame(pourLoop);
    }

    function startPouring() {
      if (!drag || drag.pouring) return;
      drag.pouring = true;
      drag.pourAccum = 0;
      drag.pourLast = 0;
      els.magmaChamber.classList.add("pouring");
      spawnChamberBubble();
      drag.raf = requestAnimationFrame(pourLoop);
    }

    function stopPouring() {
      if (!drag || !drag.pouring) return;
      drag.pouring = false;
      els.magmaChamber.classList.remove("pouring");
      if (drag.raf) cancelAnimationFrame(drag.raf);
      drag.raf = 0;
    }

    function moveBeaker(event) {
      if (!drag) return;
      event.preventDefault();
      moveGhost(event.clientX, event.clientY);
      drag.overChamber = inside(els.magmaChamber, event.clientX, event.clientY);
      els.magmaChamber.classList.toggle("drop-target", drag.overChamber);
      drag.ghost.classList.toggle("over-chamber", drag.overChamber);
      if (drag.overChamber) {
        startPouring();
        els.statusText.textContent = drag.type === "bright" ? "밝은 성분 비커를 붓는 중" : "어두운 성분 비커를 붓는 중";
      } else {
        stopPouring();
        els.statusText.textContent = "비커를 지하 깊은 마그마방으로 이동";
      }
    }

    function cleanupDrag() {
      if (!drag) return;
      stopPouring();
      drag.source.style.opacity = "1";
      drag.ghost.remove();
      drag = null;
      els.magmaChamber.classList.remove("drop-target", "pouring");
    }

    function endBeakerDrag(event) {
      if (!drag) return;
      event.preventDefault();
      const droppedOnMagma = inside(els.magmaChamber, event.clientX, event.clientY);
      if (droppedOnMagma) {
        els.statusText.textContent = "성분 조절 완료";
      } else {
        els.statusText.textContent = "마그마방 위에서 기울이면 성분이 천천히 증가합니다";
      }
      cleanupDrag();
      window.removeEventListener("pointermove", moveBeaker);
    }

    function setLocation(type) {
      locationType = type;
      document.querySelectorAll(".location").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.location === type);
      });
      els.statusText.textContent = type === "deep" ? "깊은 곳 느린 냉각 선택" : "지표 부근 빠른 냉각 선택";
      resetResultText();
      updateUI();
    }

    function resetResultText() {
      els.rockPreview.classList.remove("ready");
      clearRockPhoto();
      els.rockName.textContent = "?";
      els.resultTitle.textContent = "아직 암석이 만들어지지 않았습니다";
      els.resultExplain.textContent = "비커를 마그마방에 직접 가져가 부어 성분 비율을 바꾸고, 생성 위치를 선택한 뒤 냉각 시작 또는 동시 비교를 눌러 냉각 과정을 확인하세요.";
    }

    function resetBars() {
      els.bar1Fill.style.width = "0%";
      els.bar1Text.textContent = "0%";
      els.bar2Fill.style.width = "0%";
      els.bar2Text.textContent = "0%";
    }

    function closeCoolingOverlay() {
      activeSession += 1;
      els.coolingOverlay.classList.remove("show");
      els.coolingStatus.textContent = "닫힘";
    }

    function clearCoolingScene() {
      els.coolingScene.innerHTML = "";
    }

    function createPopupBase() {
      clearCoolingScene();
      els.coolingScene.innerHTML = `
        <div class="popup-sky-glow"></div>
        <div class="popup-ground"></div>
        <div class="popup-depth-arrow"></div>
        <div class="popup-label surface">지표</div>
        <div class="popup-label deep">지하 깊은 곳</div>
        <div class="popup-volcano">
          <div class="smoke"></div>
          <div class="cone-back"></div>
          <div class="conduit"></div>
          <div class="cone-front"></div>
          <div class="crater"></div>
        </div>
      `;
    }

    function setupScene(mode) {
      createPopupBase();

      const deepMold = document.createElement("div");
      deepMold.className = "rock-mold mold-deep cooling";
      deepMold.id = "deepMold";
      deepMold.dataset.label = "굳어가는 암석";
      deepMold.style.setProperty("--cooling-progress", "0");

      const surfaceMold = document.createElement("div");
      surfaceMold.className = "rock-mold mold-surface cooling";
      surfaceMold.id = "surfaceMold";
      surfaceMold.dataset.label = "굳어가는 암석";
      surfaceMold.style.setProperty("--cooling-progress", "0");

      const eruption = document.createElement("div");
      eruption.className = "eruption-column";
      eruption.id = "eruptionColumn";

      const lava = document.createElement("div");
      lava.className = "surface-lava-path";
      lava.id = "surfaceLavaPath";

      els.coolingScene.appendChild(deepMold);
      els.coolingScene.appendChild(surfaceMold);
      els.coolingScene.appendChild(eruption);
      els.coolingScene.appendChild(lava);

      if (mode === "slow") {
        deepMold.classList.add("selected");
        surfaceMold.style.opacity = ".18";
        surfaceMold.style.filter = "grayscale(1)";
        eruption.style.opacity = "0";
        lava.style.opacity = "0";
      } else if (mode === "fast") {
        surfaceMold.classList.add("selected");
        deepMold.style.opacity = ".18";
        deepMold.style.filter = "grayscale(1)";
      } else {
        if (locationType === "deep") deepMold.classList.add("selected");
        else surfaceMold.classList.add("selected");
      }

      return { deepMold, surfaceMold, eruption, lava };
    }

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    const mineralPalettes = {
      "화강암": [
        { color: "#f8fafc", weight: 28 },
        { color: "#e7e5e4", weight: 24 },
        { color: "#f3c1d4", weight: 22 },
        { color: "#111827", weight: 14 },
        { color: "#94a3b8", weight: 12 }
      ],
      "섬록암": [
        { color: "#f1f5f9", weight: 28 },
        { color: "#cbd5e1", weight: 18 },
        { color: "#94a3b8", weight: 18 },
        { color: "#334155", weight: 20 },
        { color: "#111827", weight: 16 }
      ],
      "반려암": [
        { color: "#111827", weight: 28 },
        { color: "#1f2937", weight: 22 },
        { color: "#475569", weight: 16 },
        { color: "#d1d5db", weight: 16 },
        { color: "#a3b18a", weight: 10 },
        { color: "#9ca3af", weight: 8 }
      ],
      "유문암": [
        { color: "#f8fafc", weight: 34 },
        { color: "#e5e7eb", weight: 26 },
        { color: "#f3c1d4", weight: 18 },
        { color: "#ede9fe", weight: 12 },
        { color: "#475569", weight: 10 }
      ],
      "안산암": [
        { color: "#e5e7eb", weight: 22 },
        { color: "#cbd5e1", weight: 18 },
        { color: "#94a3b8", weight: 22 },
        { color: "#475569", weight: 20 },
        { color: "#1f2937", weight: 18 }
      ],
      "현무암": [
        { color: "#111827", weight: 35 },
        { color: "#1f2937", weight: 24 },
        { color: "#334155", weight: 18 },
        { color: "#9ca3af", weight: 10 },
        { color: "#a3b18a", weight: 7 },
        { color: "#57534e", weight: 6 }
      ]
    };

    function pickWeightedColor(palette) {
      const total = palette.reduce((sum, item) => sum + item.weight, 0);
      let roll = Math.random() * total;
      for (const item of palette) {
        roll -= item.weight;
        if (roll <= 0) return item.color;
      }
      return palette[palette.length - 1].color;
    }

    function grainColor() {
      const rock = currentRock();
      const palette = mineralPalettes[rock.name] || mineralPalettes["섬록암"];
      return pickWeightedColor(palette);
    }

    function addGrain(target, deep, initialScale = null, finalDelay = 30, growDur = null) {
      if (!target) return null;
      const grain = document.createElement("div");
      grain.className = "mineral-grain";

      const finalSize = deep ? randomBetween(18, 44) : randomBetween(4, 10);
      grain.style.setProperty("--size", finalSize + "px");
      grain.style.setProperty("--x", randomBetween(5, 88) + "%");
      grain.style.setProperty("--y", randomBetween(8, 76) + "%");
      grain.style.setProperty("--color", grainColor());
      grain.style.setProperty("--rot", randomBetween(-80, 80) + "deg");
      grain.style.setProperty("--time", (deep ? randomBetween(600, 1100) : randomBetween(220, 480)) + "ms");
      target.appendChild(grain);

      if (initialScale !== null) {
        const rot = grain.style.getPropertyValue("--rot");
        grain.style.opacity = ".96";
        grain.style.animation = 'none';
        grain.style.transform = `scale(${initialScale}) rotate(${rot})`;
        setTimeout(() => {
          grain.style.transition = `transform ${growDur || randomBetween(3600, 5600)}ms ease`;
          grain.style.transform = `scale(1) rotate(${rot})`;
        }, finalDelay);
      }
      return grain;
    }

    function spawnGrowingNuclei(target, sessionId, totalDuration = 6200) {
      const nucleiCount = 58;
      for (let i = 0; i < nucleiCount; i++) {
        if (sessionId !== activeSession) return;
        const delay = 30 + i * 12;
        const growDuration = totalDuration - delay + randomBetween(120, 380);
        addGrain(target, true, randomBetween(0.12, 0.22), delay, growDuration);
      }
    }

    function spawnFastGrains(target, duration, sessionId, delay = 0) {
      const startAt = performance.now() + delay;
      let last = 0;
      function loop(now) {
        if (sessionId !== activeSession) return;
        if (now < startAt) {
          requestAnimationFrame(loop);
          return;
        }
        const elapsed = now - startAt;
        if (elapsed <= duration) {
          if (now - last >= 28) {
            for (let i = 0; i < 11; i++) addGrain(target, false);
            last = now;
          }
          requestAnimationFrame(loop);
        }
      }
      requestAnimationFrame(loop);
    }

    function animateSolidification(target, duration, sessionId, delay = 0) {
      const startAt = performance.now() + delay;
      function loop(now) {
        if (sessionId !== activeSession || !target) return;
        if (now < startAt) {
          target.style.setProperty("--cooling-progress", "0");
          requestAnimationFrame(loop);
          return;
        }
        const t = Math.min(1, (now - startAt) / duration);
        const eased = 1 - Math.pow(1 - t, 2.1);
        target.style.setProperty("--cooling-progress", eased.toFixed(3));
        if (t < 1) requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }

    function animateBar(fillEl, textEl, duration, sessionId, delay=0) {
      return new Promise(resolve => {
        const startAt = performance.now() + delay;
        function frame(now) {
          if (sessionId !== activeSession) { resolve(); return; }
          if (now < startAt) {
            fillEl.style.width = "0%";
            textEl.textContent = "0%";
            requestAnimationFrame(frame);
            return;
          }
          const t = Math.min(1, (now - startAt) / duration);
          const value = Math.round(t * 100);
          fillEl.style.width = value + "%";
          textEl.textContent = value + "%";
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    }

    function setRockPhoto(rock) {
      const src = rockImages[rock.name];
      currentPhotoRock = src ? rock.name : null;
      if (src) {
        els.rockRealPhoto.src = src;
        els.rockRealPhoto.alt = `${rock.name} 실제 암석 사진`;
        els.rockPreview.setAttribute("aria-label", `${rock.name} 실제 암석 사진 크게 보기`);
        els.realRockCta.classList.add("show");
        els.realRockCta.textContent = `🔍 여기를 눌러 ${rock.name} 실제 암석 사진을 크게 확인해 보세요. 팝업에서 원본 파일도 열 수 있어요.`;
      } else {
        els.rockRealPhoto.removeAttribute("src");
        els.rockRealPhoto.alt = "실제 암석 사진";
        els.rockPreview.setAttribute("aria-label", "실제 암석 사진 확대 보기");
        els.realRockCta.classList.remove("show");
      }
    }

    function clearRockPhoto() {
      currentPhotoRock = null;
      els.rockRealPhoto.removeAttribute("src");
      els.rockRealPhoto.alt = "실제 암석 사진";
      els.rockPreview.setAttribute("aria-label", "실제 암석 사진 확대 보기");
      els.realRockCta.classList.remove("show");
      closePhotoModal();
    }

    function setPhotoZoom(value) {
      photoZoom = Math.max(1, Math.min(3, value));
      els.photoModalImg.style.setProperty("--photo-zoom", photoZoom.toFixed(2));
      els.photoModalImg.classList.toggle("zoomed", photoZoom > 1.02);
      if (els.photoZoomReset) els.photoZoomReset.textContent = Math.round(photoZoom * 100) + "%";
    }

    function openPhotoModal() {
      if (!currentPhotoRock) return;
      const src = rockImages[currentPhotoRock];
      if (!src) return;
      els.photoModalImg.src = src;
      els.photoModalImg.alt = `${currentPhotoRock} 실제 암석 확대 사진`;
      els.photoModalTitle.textContent = `${currentPhotoRock} 실제 암석 사진`;
      els.photoModalSubtitle.textContent = "사진을 클릭하거나 ＋/－ 버튼, 마우스 휠로 확대·축소하면서 색과 알갱이 크기를 관찰해 보세요.";
      if (els.photoModalOriginal) {
        els.photoModalOriginal.href = src;
        els.photoModalOriginal.download = `${currentPhotoRock}.png`;
      }
      setPhotoZoom(1);
      els.photoModal.classList.add("show");
      els.photoModal.setAttribute("aria-hidden", "false");
    }

    function closePhotoModal() {
      if (!els.photoModal) return;
      els.photoModal.classList.remove("show");
      els.photoModal.setAttribute("aria-hidden", "true");
    }

    function reflectRockResult() {
      const rock = currentRock();
      els.rockPreview.classList.add("ready");
      els.rockName.textContent = rock.name;
      setRockPhoto(rock);
      els.resultTitle.textContent = `결과: ${rock.name}`;
      els.resultExplain.textContent = rock.explain;
      els.statusText.textContent = rock.name + " 생성 완료";
      updateUI();
      els.facts.innerHTML = `
        <span class="fact">${rock.type}</span>
        <span class="fact">${rock.texture}</span>
        <span class="fact">대표 광물: ${rock.minerals}</span>
        <span class="fact">밝은 ${bright}%</span>
        <span class="fact">어두운 ${100 - bright}%</span>
        <span class="fact">${locationType === "deep" ? "깊은 곳 냉각" : "지표 부근 냉각"}</span>
      `;
    }

    function showPopup(mode) {
      activeSession += 1;
      const sessionId = activeSession;
      els.coolingOverlay.classList.add("show");
      els.coolingStatus.textContent = "관찰 중";
      resetBars();

      if (mode === "slow") {
        els.coolingTitle.textContent = "느리게 냉각 보기";
        els.coolingSubtitle.textContent = "지하 깊은 곳의 마그마 방에서 광물핵이 계속 자라고, 덩어리의 색도 마그마색에서 암석색으로 천천히 바뀝니다.";
        els.bar1Label.textContent = "느린 냉각 정도";
        els.bar2Row.style.display = "none";
        els.coolingNote.textContent = "느리게 냉각에서는 처음 생긴 광물핵이 긴 시간 동안 계속 커지고, 바탕색도 점점 암석 고유의 색으로 굳어 갑니다.";
      } else if (mode === "fast") {
        els.coolingTitle.textContent = "빠르게 냉각 보기";
        els.coolingSubtitle.textContent = "마그마가 분출구에서 분출된 뒤 화산의 경사면을 따라 흐르고, 지표 부근에서 빠르게 식으면서 색이 급하게 암석색으로 바뀝니다.";
        els.bar1Label.textContent = "빠른 냉각 정도";
        els.bar2Row.style.display = "none";
        els.coolingNote.textContent = "빠른 냉각은 분출된 용암이 짧은 시간 안에 굳으면서 작은 광물이 많이 생기고, 밝은 용암색이 빠르게 암석색으로 변합니다.";
      } else {
        els.coolingTitle.textContent = "동시 비교 보기";
        els.coolingSubtitle.textContent = "한 화산 단면에서 지하 깊은 곳의 느린 냉각과 지표 위의 빠른 냉각을 동시에 비교하며, 색 변화와 광물 성장 차이를 함께 봅니다.";
        els.bar1Label.textContent = "느린 냉각 정도";
        els.bar2Label.textContent = "빠른 냉각 정도";
        els.bar2Row.style.display = "grid";
        els.coolingNote.textContent = "느린 냉각은 광물핵이 오래 자라고 색이 천천히 굳으며, 빠른 냉각은 더 많은 작은 광물이 빠르게 생기면서 색도 급하게 바뀝니다.";
      }

      const scene = setupScene(mode);
      const deepDuration = 9000;
      const fastDelay = 850;
      const fastDuration = 1050;

      if (mode === "slow") {
        animateSolidification(scene.deepMold, deepDuration, sessionId);
        spawnGrowingNuclei(scene.deepMold, sessionId, deepDuration);
        animateBar(els.bar1Fill, els.bar1Text, deepDuration, sessionId).then(() => {
          if (sessionId !== activeSession) return;
          els.coolingStatus.textContent = "관찰 완료";
          reflectRockResult();
        });
      } else if (mode === "fast") {
        setTimeout(() => {
          if (sessionId !== activeSession) return;
          scene.eruption.classList.add("flow");
        }, 100);
        setTimeout(() => {
          if (sessionId !== activeSession) return;
          scene.lava.classList.add("flow");
        }, 520);
        animateSolidification(scene.surfaceMold, fastDuration, sessionId, fastDelay);
        spawnFastGrains(scene.surfaceMold, fastDuration, sessionId, fastDelay);
        animateBar(els.bar1Fill, els.bar1Text, fastDuration, sessionId, fastDelay).then(() => {
          if (sessionId !== activeSession) return;
          els.coolingStatus.textContent = "관찰 완료";
          reflectRockResult();
        });
      } else {
        setTimeout(() => {
          if (sessionId !== activeSession) return;
          scene.eruption.classList.add("flow");
        }, 100);
        setTimeout(() => {
          if (sessionId !== activeSession) return;
          scene.lava.classList.add("flow");
        }, 520);
        animateSolidification(scene.deepMold, deepDuration, sessionId);
        animateSolidification(scene.surfaceMold, fastDuration, sessionId, fastDelay);
        spawnGrowingNuclei(scene.deepMold, sessionId, deepDuration);
        spawnFastGrains(scene.surfaceMold, fastDuration, sessionId, fastDelay);
        Promise.all([
          animateBar(els.bar1Fill, els.bar1Text, deepDuration, sessionId, 0),
          animateBar(els.bar2Fill, els.bar2Text, fastDuration, sessionId, fastDelay)
        ]).then(() => {
          if (sessionId !== activeSession) return;
          els.coolingStatus.textContent = "비교 완료";
          reflectRockResult();
        });
      }
    }

    function resetAll() {
      closeCoolingOverlay();
      bright = 50;
      locationType = "deep";
      document.querySelectorAll(".location").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.location === "deep");
      });
      resetResultText();
      els.statusText.textContent = "비커를 지하 깊은 마그마방에 부어 보세요";
      updateUI();
    }

    els.brightBtn.addEventListener("pointerdown", startBeakerDrag);
    els.darkBtn.addEventListener("pointerdown", startBeakerDrag);
    document.querySelectorAll(".location").forEach(btn => {
      btn.addEventListener("click", () => setLocation(btn.dataset.location));
    });
    els.startCoolingBtn.addEventListener("click", () => showPopup(locationType === "deep" ? "slow" : "fast"));
    els.compareBtn.addEventListener("click", () => showPopup("compare"));
    els.resetBtn.addEventListener("click", resetAll);
    els.closeCoolingBtn.addEventListener("click", closeCoolingOverlay);
    els.rockPreview.addEventListener("click", openPhotoModal);
    els.rockPreview.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPhotoModal();
      }
    });
    els.realRockCta.addEventListener("click", openPhotoModal);
    els.photoModalImg.addEventListener("click", () => {
      setPhotoZoom(photoZoom > 1.02 ? 1 : 2);
    });
    els.photoZoomOut.addEventListener("click", () => setPhotoZoom(photoZoom - 0.25));
    els.photoZoomReset.addEventListener("click", () => setPhotoZoom(1));
    els.photoZoomIn.addEventListener("click", () => setPhotoZoom(photoZoom + 0.25));
    els.photoModalImg.addEventListener("wheel", event => {
      event.preventDefault();
      setPhotoZoom(photoZoom + (event.deltaY < 0 ? 0.18 : -0.18));
    }, { passive:false });
    els.photoModalClose.addEventListener("click", closePhotoModal);
    els.photoModal.addEventListener("click", event => {
      if (event.target === els.photoModal) closePhotoModal();
    });
    window.addEventListener("keydown", event => {
      if (event.key === "Escape") closePhotoModal();
      if (!els.photoModal.classList.contains("show")) return;
      if (event.key === "+" || event.key === "=") setPhotoZoom(photoZoom + 0.25);
      if (event.key === "-" || event.key === "_") setPhotoZoom(photoZoom - 0.25);
      if (event.key === "0") setPhotoZoom(1);
    });

    updateUI();
    resetResultText();
  