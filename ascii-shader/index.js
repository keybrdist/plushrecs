class ASCIIConverter {
  constructor() {
    this.originalCanvas = document.getElementById("originalCanvas");
    this.asciiCanvas = document.getElementById("asciiCanvas");
    this.originalCtx = this.originalCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.asciiCtx = this.asciiCanvas.getContext("2d");

    this.settings = {
      resolution: 80,
      contrast: 1.0,
      brightness: 0,
      hue: 0,
      saturation: 0,
      inverted: false,
      charSet: "simple",
      color: "#00ff00",
      animationSpeed: 1.0,
      effects: new Set(),
      useOriginalColors: true,
      backgroundColor: "#000000",
      transparentBackground: false,
      aspectRatioMult: 0.5,
    };

    this.charSets = {
      simple: " .:-=+*#%@",
      complex:
        " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
      custom: " ░▒▓█",
    };

    this.visualStyleEffectsList = [
      "halftone",
      "edgeDetect",
      "crt",
      "kaleidoscope",
    ];

    this.currentImage = null;
    this.currentVideo = null;
    this.animationFrameId = null;
    this.startTime = Date.now();
    
    // Recording state
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingAnimationId = null;

    this.initializeEventListeners();
    // Hi-DPI scaling helpers
    this._applyHiDPI = (canvas, ctx) => {
      const dpr = window.devicePixelRatio || 1;
      // When canvas size changes, reset the transform and re-scale
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const cssW = canvas.width;
      const cssH = canvas.height;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.scale(dpr, dpr);
    };
    document.getElementById("charSetSimple").classList.add("active");
    document.getElementById("noImagePlaceholder").textContent = "";
  }

  initializeEventListeners() {
    const uploadArea = document.getElementById("uploadArea");
    const fileInput = document.getElementById("fileInput");

    uploadArea.addEventListener("click", () => fileInput.click());
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });
    uploadArea.addEventListener("dragleave", () =>
      uploadArea.classList.remove("dragover")
    );
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      this.handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener("change", (e) =>
      this.handleFiles(e.target.files)
    );

    document.querySelectorAll(".preset-image").forEach((div) => {
      const imgEl = div.querySelector("img");
      if (!imgEl) {
        // Ensure img element exists if not added by default
        const newImg = document.createElement("img");
        newImg.src = div.dataset.url;
        newImg.alt = div.title || "Preset Image";
        newImg.style.width = "100%";
        newImg.style.height = "100%";
        newImg.style.objectFit = "cover";
        div.appendChild(newImg);
      }
      div.addEventListener("click", () =>
        this.loadImageFromURL(div.dataset.url)
      );
    });

    document
      .querySelectorAll(".canvas-tab")
      .forEach((tab) =>
        tab.addEventListener("click", () => this.switchTab(tab.dataset.tab))
      );
    this.setupControlListeners();
  }

  setupControlListeners() {
    document
      .getElementById("resolutionSlider")
      .addEventListener("input", (e) => {
        this.settings.resolution = parseInt(e.target.value);
        document.getElementById("resolutionValue").textContent = `${
          this.settings.resolution
        }x${
          this.originalCanvas.height && this.originalCanvas.width
            ? Math.floor(
                this.settings.resolution *
                  (this.originalCanvas.height / this.originalCanvas.width) *
                  this.settings.aspectRatioMult
              )
            : Math.floor(this.settings.resolution * this.settings.aspectRatioMult)
        }`;
        this.redrawCurrentMedia();
      });
    document.getElementById("contrastSlider").addEventListener("input", (e) => {
      this.settings.contrast = parseFloat(e.target.value);
      document.getElementById("contrastValue").textContent =
        this.settings.contrast.toFixed(1);
      this.redrawCurrentMedia();
    });
    document
      .getElementById("brightnessSlider")
      .addEventListener("input", (e) => {
        this.settings.brightness = parseInt(e.target.value);
        document.getElementById("brightnessValue").textContent =
          this.settings.brightness;
        this.redrawCurrentMedia();
      });
    document.getElementById("hueSlider").addEventListener("input", (e) => {
      this.settings.hue = parseInt(e.target.value);
      document.getElementById("hueValue").textContent = `${this.settings.hue}°`;
      this.redrawCurrentMedia();
    });
    document.getElementById("saturationSlider").addEventListener("input", (e) => {
      this.settings.saturation = parseInt(e.target.value);
      document.getElementById("saturationValue").textContent = this.settings.saturation;
      this.redrawCurrentMedia();
    });
    document.getElementById("colorPicker").addEventListener("input", (e) => {
      this.settings.color = e.target.value;
      this.redrawCurrentMedia();
    });
    document
      .getElementById("useOriginalColorsCheckbox")
      .addEventListener("change", (e) => {
        this.settings.useOriginalColors = e.target.checked;
        this.redrawCurrentMedia();
      });
    const backgroundColorPickerInput = document.getElementById(
      "backgroundColorPicker"
    );
    backgroundColorPickerInput.addEventListener("input", (e) => {
      this.settings.backgroundColor = e.target.value;
      if (!this.settings.transparentBackground) this.redrawCurrentMedia();
    });
    document
      .getElementById("transparentBgCheckbox")
      .addEventListener("change", (e) => {
        this.settings.transparentBackground = e.target.checked;
        backgroundColorPickerInput.disabled =
          this.settings.transparentBackground;
        backgroundColorPickerInput.style.opacity = this.settings
          .transparentBackground
          ? 0.5
          : 1;
        this.redrawCurrentMedia();
      });
    document.getElementById("speedSlider").addEventListener("input", (e) => {
      this.settings.animationSpeed = parseFloat(e.target.value);
      document.getElementById("speedValue").textContent =
        this.settings.animationSpeed.toFixed(1);
    });
    document.querySelectorAll(".char-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".char-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.settings.charSet = btn.id.replace("charSet", "").toLowerCase();
        this.redrawCurrentMedia();
      });
    });

    document
      .getElementById("visualStylePresetSelect")
      .addEventListener("change", (e) => {
        const selectedStyle = e.target.value;
        this.visualStyleEffectsList.forEach((eff) =>
          this.settings.effects.delete(eff)
        );

        if (selectedStyle !== "none") {
          this.settings.effects.add(selectedStyle);
        }

        this.updateUIForEffects();
        this.redrawCurrentMedia();
        if (this.currentImage && this.settings.effects.size > 0) {
          this.startAnimationLoop();
        }
      });

    this.setupEffectButtons();
    // Aspect ratio selector
    const aspectSel = document.getElementById("aspectRatioSelect");
    if (aspectSel) {
      aspectSel.value = this.settings.aspectRatioMult;
      aspectSel.addEventListener("change", (e) => {
        this.settings.aspectRatioMult = parseFloat(e.target.value);
        // Update displayed resolution label
        document.getElementById("resolutionValue").textContent = `${this.settings.resolution}x${
          this.originalCanvas.height && this.originalCanvas.width
            ? Math.floor(
                this.settings.resolution *
                  (this.originalCanvas.height / this.originalCanvas.width) *
                  this.settings.aspectRatioMult
              )
            : Math.floor(this.settings.resolution * 0.75 * this.settings.aspectRatioMult)
        }`;
        this.redrawCurrentMedia();
      });
    }
    document
      .getElementById("exportImageBtn")
      .addEventListener("click", () => this.exportAsImage());
    document
      .getElementById("exportTextBtn")
      .addEventListener("click", () => this.exportAsText());
    document
      .getElementById("startRecordingBtn")
      .addEventListener("click", () => this.startRecording());
    document
      .getElementById("stopRecordingBtn")
      .addEventListener("click", () => this.stopRecording());
    const toggleControlsBtn = document.getElementById("toggleControlsBtn");
    const controlsPanel = document.querySelector(".controls");
    toggleControlsBtn.addEventListener("click", () => {
      controlsPanel.classList.toggle("hidden");
      toggleControlsBtn.textContent = controlsPanel.classList.contains("hidden")
        ? "+"
        : "-";
    });
  }

  redrawCurrentMedia() {
    if (
      this.currentImage ||
      (this.currentVideo && this.currentVideo.readyState >= 2)
    ) {
      if (
        this.currentVideo &&
        !this.currentVideo.paused &&
        !this.currentVideo.ended
      ) {
        this.originalCtx.drawImage(
          this.currentVideo,
          0,
          0,
          this.originalCanvas.width,
          this.originalCanvas.height
        );
      } else if (this.currentImage) {
        this.originalCtx.drawImage(
          this.currentImage,
          0,
          0,
          this.originalCanvas.width,
          this.originalCanvas.height
        );
      }
      this.convertToASCII();
    }
  }

  setupEffectButtons() {
    // MODIFIED: Added 'lightShadow' to animation effect buttons
    const effectButtons = [
      "wave",
      "pulse",
      "scanline",
      "glitch",
      "lightShadow",
    ];
    effectButtons.forEach((effect) => {
      const btn = document.getElementById(effect + "Btn");
      if (btn) {
        btn.addEventListener("click", () => {
          this.toggleAnimationEffect(effect, btn);
        });
      }
    });
    const invertBtn = document.getElementById("invertBtn");
    invertBtn.addEventListener("click", () => {
      this.settings.inverted = !this.settings.inverted;
      invertBtn.textContent = this.settings.inverted ? "On" : "Off";
      invertBtn.classList.toggle("active", this.settings.inverted);
      this.redrawCurrentMedia();
    });
  }

  toggleAnimationEffect(effect, btn) {
    const isActivating = !this.settings.effects.has(effect);

    if (isActivating) {
      this.settings.effects.add(effect);
      btn.classList.add("active");
    } else {
      this.settings.effects.delete(effect);
      btn.classList.remove("active");
    }

    if (this.currentImage || this.currentVideo) {
      if (this.settings.effects.size > 0) {
        this.startAnimationLoop();
      } else if (this.animationFrameId) {
        if (!this.currentVideo) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
      }
    }
    this.redrawCurrentMedia();
  }




  setupEffectButtons() {
    // MODIFIED: Added 'lightShadow' to animation effect buttons
    const effectButtons = [
      "wave",
      "pulse",
      "scanline",
      "glitch",
      "lightShadow",
    ];
    effectButtons.forEach((effect) => {
      const btn = document.getElementById(effect + "Btn");
      if (btn) {
        btn.addEventListener("click", () => {
          this.toggleAnimationEffect(effect, btn);
        });
      }
    });
    const invertBtn = document.getElementById("invertBtn");
    invertBtn.addEventListener("click", () => {
      this.settings.inverted = !this.settings.inverted;
      invertBtn.textContent = this.settings.inverted ? "On" : "Off";
      invertBtn.classList.toggle("active", this.settings.inverted);
      this.redrawCurrentMedia();
    });
  }

  toggleAnimationEffect(effect, btn) {
    const isActivating = !this.settings.effects.has(effect);

    if (isActivating) {
      this.settings.effects.add(effect);
      btn.classList.add("active");
    } else {
      this.settings.effects.delete(effect);
      btn.classList.remove("active");
    }

    if (this.currentImage || this.currentVideo) {
      if (this.settings.effects.size > 0) {
        this.startAnimationLoop();
      } else if (this.animationFrameId) {
        if (!this.currentVideo) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
      }
    }
    this.redrawCurrentMedia();
  }

  updateUIForEffects() {
    const isHalftone = this.settings.effects.has("halftone");
    const isEdgeDetect = this.settings.effects.has("edgeDetect");

    document.querySelectorAll(".char-btn").forEach((b) => {
      b.disabled = isHalftone;
    });
    document.getElementById("exportTextBtn").disabled =
      isHalftone || isEdgeDetect;
  }

  clearMediaState() {
    // Do not revoke currentBlobUrl here; it is revoked before loading new media to avoid premature deletion.
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.currentVideo) {
      this.currentVideo.pause();
      this.currentVideo.removeAttribute("src");
      this.currentVideo.load();
      this.currentVideo.onloadedmetadata = null;
    }
    this.animationFrameId = null;
    this.currentVideo = null;
    this.currentImage = null;
    document.getElementById("noImagePlaceholder").style.display = "block";
    document.getElementById("stats").innerHTML = "";
    this.originalCanvas.width = 1;
    this.originalCanvas.height = 1;
    this.asciiCanvas.width = 1;
    this.asciiCanvas.height = 1;
  }

  handleFiles(files) {
    // Revoke previous object URL before loading new file
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      // clear media state *before* storing new url so it isn't revoked immediately
      this.clearMediaState();
      this.currentBlobUrl = url;
      if (file.type.startsWith("image/")) {
        this.loadImageFromURL(url);
      } else if (file.type.startsWith("video/")) {
        this.loadVideo(url);
      } else {
        console.warn("Unsupported file type:", file.type);
        document.getElementById("effectPreview").textContent =
          "Unsupported file type.";
        URL.revokeObjectURL(url);
        document.getElementById("noImagePlaceholder").style.display = "block";
      }
    }
  }

  loadImageFromURL(url, onRevokeNeeded) {
    const img = new Image();
    img.onload = () => {
      this.currentImage = img;
      this.currentVideo = null;
      this.displayOriginalImage();
      document.getElementById("noImagePlaceholder").style.display = "none";
      document.getElementById("effectPreview").textContent = "Image loaded.";
      this.updateStats();
      this.convertToASCII();
      if (this.settings.effects.size > 0) {
        this.startAnimationLoop();
      }
      if (onRevokeNeeded) onRevokeNeeded();
    };
    img.onerror = () => {
      console.error("Failed to load image:", url);
      document.getElementById("effectPreview").textContent =
        "Error loading image.";
      if (onRevokeNeeded) onRevokeNeeded();
      document.getElementById("noImagePlaceholder").style.display = "block";
    };
    img.src = url;
  }

  loadVideo(url, onRevokeNeeded) {
    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.autoplay = true;
    video.muted = true;
    video.loop = true;

    video.onloadedmetadata = () => {
      this.currentVideo = video;
      this.currentImage = null;
      this.displayOriginalVideoFrame();
      document.getElementById("noImagePlaceholder").style.display = "none";
      document.getElementById("effectPreview").textContent = "Video loaded.";
      this.updateStats();
      video
        .play()
        .then(() => {
          this.processVideoFrame();
        })
        .catch((e) => {
          console.error("Video play failed:", e);
          document.getElementById("effectPreview").textContent =
            "Video playback error.";
        });
      if (onRevokeNeeded) onRevokeNeeded(); // Revoke if successful load meta, video element holds the blob now.
    };
    video.onerror = (e) => {
      console.error("Failed to load video:", e);
      document.getElementById("effectPreview").textContent =
        "Error loading video.";
      if (onRevokeNeeded) onRevokeNeeded();
      document.getElementById("noImagePlaceholder").style.display = "block";
    };
    video.src = url;
  }

  displayOriginalImage() {
    if (!this.currentImage) return;
    const containerWidth = this.mainContentWidth || 800;
    const maxWidth = Math.min(containerWidth - 40, 800);
    const maxHeight = 600;

    let { width, height } = this.currentImage;
    const aspectRatio = width / height;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    this.originalCanvas.width = Math.round(width);
    this.originalCanvas.height = Math.round(height);
    // Draw directly without Hi-DPI scaling to preserve full image
    this.originalCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.originalCanvas.style.width = `${this.originalCanvas.width}px`;
    this.originalCanvas.style.height = `${this.originalCanvas.height}px`;
    this.originalCtx.drawImage(
      this.currentImage,
      0,
      0,
      this.originalCanvas.width,
      this.originalCanvas.height
    );
  }

  displayOriginalVideoFrame() {
    if (!this.currentVideo) return;
    const containerWidth = this.mainContentWidth || 800;
    const maxWidth = Math.min(containerWidth - 40, 800);
    const maxHeight = 600;

    let width = this.currentVideo.videoWidth,
      height = this.currentVideo.videoHeight;
    const aspectRatio = width / height;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    this.originalCanvas.width = Math.round(width);
    this.originalCanvas.height = Math.round(height);
  }

  processVideoFrame() {
    if (
      !this.currentVideo ||
      this.currentVideo.paused ||
      this.currentVideo.ended
    ) {
      return;
    }

    this.originalCtx.drawImage(
      this.currentVideo,
      0,
      0,
      this.originalCanvas.width,
      this.originalCanvas.height
    );
    this.convertToASCII();
    this.animationFrameId = requestAnimationFrame(() => this.processVideoFrame());
  }


  startAnimationLoop() {
    if (this.animationFrameId && !this.currentVideo) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (
      this.currentVideo &&
      !this.currentVideo.paused &&
      !this.currentVideo.ended
    ) {
      if (!this.animationFrameId) this.processVideoFrame();
      return;
    }

    this.startTime = Date.now();

    const animate = () => {
      const shouldAnimateStatic =
        (this.currentImage && this.settings.effects.size > 0) ||
        (this.currentVideo &&
          (this.currentVideo.paused || this.currentVideo.ended) &&
          this.settings.effects.size > 0);

      if (shouldAnimateStatic) {
        if (
          this.currentVideo &&
          (this.currentVideo.paused || this.currentVideo.ended)
        ) {
          this.originalCtx.drawImage(
            this.currentVideo,
            0,
            0,
            this.originalCanvas.width,
            this.originalCanvas.height
          );
        }
        this.convertToASCII();
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
        // If it was a video that paused and has no effects, redraw one last time without animation
        if (
          this.currentVideo &&
          (this.currentVideo.paused || this.currentVideo.ended) &&
          this.settings.effects.size === 0
        ) {
          this.redrawCurrentMedia();
        }
      }
    };

    if (!this.animationFrameId && this.settings.effects.size > 0) {
      animate();
    }
  }

  _getPixelBrightness(data, width, x, y) {
    x = Math.max(0, Math.min(width - 1, Math.floor(x)));
    y = Math.max(0, Math.min(data.length / (4 * width) - 1, Math.floor(y)));
    const i = (y * width + x) * 4;
    if (i < 0 || i + 2 >= data.length) return 0;
    return (data[i] + data[i + 1] + data[i + 2]) / 3;
  }

  _getPixelColor(data, width, x, y) {
    x = Math.floor(Math.max(0, Math.min(width - 1, x)));
    y = Math.floor(Math.max(0, Math.min(data.length / (4 * width) - 1, y)));
    const i = (y * width + x) * 4;
    if (i < 0 || i + 2 >= data.length) return { r: 0, g: 0, b: 0 };
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  }

  // Convert RGB to HSL
  _rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  // Convert HSL to RGB
  _hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  // Apply hue and saturation adjustments to a color
  _adjustHueSaturation(r, g, b) {
    if (this.settings.hue === 0 && this.settings.saturation === 0) {
      return { r, g, b };
    }

    const hsl = this._rgbToHsl(r, g, b);
    
    // Adjust hue (wrap around 360 degrees)
    hsl.h = (hsl.h + this.settings.hue + 360) % 360;
    
    // Adjust saturation (clamp between 0 and 100)
    hsl.s = Math.max(0, Math.min(100, hsl.s + this.settings.saturation));
    
    return this._hslToRgb(hsl.h, hsl.s, hsl.l);
  }

  convertToASCII() {
    if (
      !this.originalCanvas.width ||
      !this.originalCanvas.height ||
      this.originalCanvas.width <= 1 ||
      this.originalCanvas.height <= 1
    ) {
      return;
    }

    let imageData;
    try {
      imageData = this.originalCtx.getImageData(
        0,
        0,
        this.originalCanvas.width,
        this.originalCanvas.height
      );
    } catch (e) {
      console.error(
        "Error getting image data, canvas might be tainted or too small:",
        e,
        this.originalCanvas.width,
        this.originalCanvas.height
      );
      return;
    }

    const asciiWidth = this.settings.resolution;
    const aspectRatio = this.settings.effects.has("halftone") ? 1.0 : this.settings.aspectRatioMult;
    const asciiHeight = Math.max(
      1,
      Math.floor(
        asciiWidth *
          (this.originalCanvas.height / this.originalCanvas.width) *
          aspectRatio
      )
    );

    const cellBaseSize = 8; // reduced for crisper cell size
    const cellWidth = this.settings.effects.has("halftone") ? 10 : cellBaseSize;
    const cellHeight = this.settings.effects.has("halftone")
      ? 10
      : cellBaseSize * 2;

    if (
      this.asciiCanvas.width !== asciiWidth * cellWidth ||
      this.asciiCanvas.height !== asciiHeight * cellHeight
    ) {
      this.asciiCanvas.width = Math.max(1, asciiWidth * cellWidth);
      this.asciiCanvas.height = Math.max(1, asciiHeight * cellHeight);
    }

    // Apply Hi-DPI scaling for ASCII canvas before rendering
    this._applyHiDPI(this.asciiCanvas, this.asciiCtx);
    this._renderVisualsToContext(
      this.asciiCtx,
      imageData,
      asciiWidth,
      asciiHeight,
      cellWidth,
      cellHeight
    );

    const currentTime = Date.now();
    const effectTime = currentTime - this.startTime;
    this.applyPostProcessingEffects(effectTime);
  }

  _renderVisualsToContext(ctx, imageData, gridW, gridH, cellW, cellH) {
    if (this.settings.transparentBackground) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
      ctx.fillStyle = this.settings.backgroundColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    const { data, width: srcW, height: srcH } = imageData;
    const charSetToUse =
      this.charSets[this.settings.charSet] || this.charSets.simple;
    const time =
      (Date.now() - this.startTime) * (this.settings.animationSpeed / 1000);

    ctx.font = `${cellH * 0.9}px Courier New, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        let u = (x + 0.5) / gridW;
        let v = (y + 0.5) / gridH;

        if (this.settings.effects.has("kaleidoscope")) {
          const repetitions = 4;
          let translatedU = u - 0.5;
          let translatedV = v - 0.5;
          let angle = Math.atan2(translatedV, translatedU) + time * 0.5;
          let radius = Math.sqrt(
            translatedU * translatedU + translatedV * translatedV
          );
          angle =
            (angle % ((Math.PI * 2) / repetitions)) - Math.PI / repetitions;
          u = 0.5 + radius * Math.cos(angle);
          v = 0.5 + radius * Math.sin(angle);
        }
        if (this.settings.effects.has("crt")) {
          let du = u - 0.5;
          let dv = v - 0.5;
          let dist = Math.sqrt(du * du + dv * dv);
          let barrelPower = 0.2;
          let rFactor = 1.0 + barrelPower * dist * dist;
          u = 0.5 + du / rFactor;
          v = 0.5 + dv / rFactor;
        }

        let sx = u * (srcW - 1);
        let sy = v * (srcH - 1);

        let brightness;
        let pixelColor;

        if (this.settings.effects.has("edgeDetect")) {
          const Gx =
            -1 * this._getPixelBrightness(data, srcW, sx - 1, sy - 1) +
            1 * this._getPixelBrightness(data, srcW, sx + 1, sy - 1) +
            -2 * this._getPixelBrightness(data, srcW, sx - 1, sy) +
            2 * this._getPixelBrightness(data, srcW, sx + 1, sy) +
            -1 * this._getPixelBrightness(data, srcW, sx - 1, sy + 1) +
            1 * this._getPixelBrightness(data, srcW, sx + 1, sy + 1);
          const Gy =
            -1 * this._getPixelBrightness(data, srcW, sx - 1, sy - 1) -
            2 * this._getPixelBrightness(data, srcW, sx, sy - 1) -
            1 * this._getPixelBrightness(data, srcW, sx + 1, sy - 1) +
            1 * this._getPixelBrightness(data, srcW, sx - 1, sy + 1) +
            2 * this._getPixelBrightness(data, srcW, sx, sy + 1) +
            1 * this._getPixelBrightness(data, srcW, sx + 1, sy + 1);
          brightness = Math.min(255, Math.sqrt(Gx * Gx + Gy * Gy));
          pixelColor = this._getPixelColor(data, srcW, sx, sy);
          // Apply hue and saturation adjustments
          pixelColor = this._adjustHueSaturation(pixelColor.r, pixelColor.g, pixelColor.b);
        } else {
          pixelColor = this._getPixelColor(data, srcW, sx, sy);
          // Apply hue and saturation adjustments
          pixelColor = this._adjustHueSaturation(pixelColor.r, pixelColor.g, pixelColor.b);
          brightness = (pixelColor.r + pixelColor.g + pixelColor.b) / 3;
        }

        brightness =
          (brightness - 128) * this.settings.contrast +
          128 +
          this.settings.brightness;
        brightness = Math.max(0, Math.min(255, brightness));

        // --- Light & Shadow Effect Logic ---
        if (this.settings.effects.has("lightShadow")) {
          const lightSpeedX = 0.3; // Speed of light movement on X axis
          const lightSpeedY = 0.2; // Speed of light movement on Y axis
          // Light position moving diagonally and looping
          const lightX = (Math.sin(time * lightSpeedX) + 1) / 2; // Normalized 0-1
          const lightY = (Math.cos(time * lightSpeedY) + 1) / 2; // Normalized 0-1

          const cellNormX = (x + 0.5) / gridW;
          const cellNormY = (y + 0.5) / gridH;

          const distToLight = Math.sqrt(
            Math.pow(cellNormX - lightX, 2) + Math.pow(cellNormY - lightY, 2)
          );

          const lightRadius = 0.5; // How far the light 'reaches' effectively
          const falloffRate = 2.0; // How sharply the light diminishes
          let lightFactor = Math.max(
            0,
            1.0 - (distToLight / lightRadius) * falloffRate
          );
          lightFactor = lightFactor * lightFactor; // Make falloff more pronounced (quadratic)

          const shadowIntensity = 0.7; // How much darker shadows are (0.0 means no shadow, 1.0 means full black)
          const brightnessMultiplier =
            1.0 - shadowIntensity * (1.0 - lightFactor);

          brightness *= brightnessMultiplier;
          brightness = Math.max(0, Math.min(255, brightness));
        }
        // --- End Light & Shadow Effect Logic ---

        let finalBrightness = this.settings.inverted
          ? 255 - brightness
          : brightness;

        let fillColor;
        if (this.settings.useOriginalColors) {
          let r = pixelColor.r,
            g = pixelColor.g,
            b = pixelColor.b;
          // If light shadow is active, modulate original color brightness too
          if (this.settings.effects.has("lightShadow")) {
            // Re-calculate lightFactor here if it's not scoped outside
            // This assumes lightFactor calculation is just above
            const lightSpeedX = 0.3;
            const lightSpeedY = 0.2;
            const lightX = (Math.sin(time * lightSpeedX) + 1) / 2;
            const lightY = (Math.cos(time * lightSpeedY) + 1) / 2;
            const cellNormX = (x + 0.5) / gridW;
            const cellNormY = (y + 0.5) / gridH;
            const distToLight = Math.sqrt(
              Math.pow(cellNormX - lightX, 2) + Math.pow(cellNormY - lightY, 2)
            );
            const lightRadius = 0.5;
            const falloffRate = 2.0;
            let lightFactor = Math.max(
              0,
              1.0 - (distToLight / lightRadius) * falloffRate
            );
            lightFactor = lightFactor * lightFactor;

            const shadowIntensity = 0.5; // Color shadow intensity
            const colorMultiplier = 1.0 - shadowIntensity * (1.0 - lightFactor);
            r = Math.min(255, r * colorMultiplier);
            g = Math.min(255, g * colorMultiplier);
            b = Math.min(255, b * colorMultiplier);
          }
          fillColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(
            b
          )})`;
        } else {
          fillColor = this.settings.color;
          // Optionally, modulate the fixed color's brightness if lightShadow is on
          // This would require parsing the hex, adjusting, and re-stringifying,
          // or converting to HSL, adjusting L, and converting back.
          // For now, fixed color is not directly changed by light/shadow, only char selection.
        }

        let drawX = x * cellW;
        let drawY = y * cellH;

        if (this.settings.effects.has("halftone")) {
          const radius =
            (finalBrightness / 255) * (Math.min(cellW, cellH) / 2) * 1.1;
          ctx.fillStyle = fillColor;
          ctx.beginPath();
          ctx.arc(
            drawX + cellW / 2,
            drawY + cellH / 2,
            Math.max(0, radius),
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else if (this.settings.effects.has("edgeDetect")) {
          const edgeAlpha = finalBrightness / 255;
          if (this.settings.useOriginalColors) {
            ctx.fillStyle = `rgba(${pixelColor.r}, ${pixelColor.g}, ${pixelColor.b}, ${edgeAlpha})`;
          } else {
            const r = parseInt(this.settings.color.slice(1, 3), 16);
            const g = parseInt(this.settings.color.slice(3, 5), 16);
            const b = parseInt(this.settings.color.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${edgeAlpha})`;
          }
          ctx.fillRect(drawX, drawY, cellW, cellH);
        } else {
          const charIndex = Math.floor(
            (finalBrightness / 255) * (charSetToUse.length - 1)
          );
          const char = charSetToUse[charIndex];

          let currentDrawX = drawX;
          let currentDrawY = drawY;

          if (this.settings.effects.has("wave")) {
            currentDrawX += Math.sin(y * 0.3 + time * 2) * (cellW * 0.5);
            currentDrawY += Math.cos(x * 0.3 + time * 2) * (cellH * 0.25);
          }

          if (
            this.settings.effects.has("crt") &&
            !this.settings.useOriginalColors
          ) {
            ctx.fillStyle = this.settings.color;
            ctx.fillText(
              char,
              currentDrawX + cellW * 0.1,
              currentDrawY + cellH * 0.05
            );
          } else if (
            this.settings.effects.has("crt") &&
            this.settings.useOriginalColors
          ) {
            const offset = cellW * 0.05;
            const alpha = finalBrightness / 255; // Use potentially light-shadow modified brightness for alpha

            // Get base pixel color without light/shadow modification for chromatic components
            const originalPixelForCRT = this._getPixelColor(data, srcW, sx, sy);

            ctx.globalCompositeOperation = "lighter";

            ctx.fillStyle = `rgba(${originalPixelForCRT.r}, 0, 0, ${alpha})`;
            ctx.fillText(
              char,
              currentDrawX + offset + cellW * 0.1,
              currentDrawY + cellH * 0.05
            );

            ctx.fillStyle = `rgba(0, ${originalPixelForCRT.g}, 0, ${alpha})`;
            ctx.fillText(
              char,
              currentDrawX + cellW * 0.1,
              currentDrawY + cellH * 0.05
            );

            ctx.fillStyle = `rgba(0, 0, ${originalPixelForCRT.b}, ${alpha})`;
            ctx.fillText(
              char,
              currentDrawX - offset + cellW * 0.1,
              currentDrawY + cellH * 0.05
            );

            ctx.globalCompositeOperation = "source-over";
          } else {
            ctx.fillStyle = fillColor; // fillColor already considers light/shadow if useOriginalColors
            ctx.fillText(
              char,
              currentDrawX + cellW * 0.1,
              currentDrawY + cellH * 0.05
            );
          }
        }
      }
    }
  }

  applyPostProcessingEffects(timeMillis) {
    const time = timeMillis / 1000.0;

    if (this.settings.effects.has("scanline")) {
      const scanLineHeight = Math.max(
        1,
        Math.floor(this.asciiCanvas.height / 150)
      );
      for (let i = 0; i < this.asciiCanvas.height; i += scanLineHeight * 2) {
        this.asciiCtx.fillStyle = "rgba(0,0,0,0.1)";
        this.asciiCtx.fillRect(0, i, this.asciiCanvas.width, scanLineHeight);
      }
    }
    if (this.settings.effects.has("pulse")) {
      const pulseAmount =
        (Math.sin(time * Math.PI * 1.0 * this.settings.animationSpeed) + 1) / 2; // Pulse speed affected by animationSpeed
      this.asciiCtx.globalAlpha = 1.0 - pulseAmount * 0.2;
    }

    if (this.settings.effects.has("glitch") && Math.random() < 0.05) {
      const y = Math.random() * this.asciiCanvas.height;
      const h =
        Math.random() * (this.asciiCanvas.height * 0.1) +
        this.asciiCanvas.height * 0.02;
      const xOff = (Math.random() - 0.5) * (this.asciiCanvas.width * 0.1);
      if (
        y + h > this.asciiCanvas.height ||
        h <= 0 ||
        this.asciiCanvas.width <= 0
      )
        return;

      try {
        const strip = this.asciiCtx.getImageData(
          0,
          y,
          this.asciiCanvas.width,
          h
        );
        this.asciiCtx.clearRect(0, y, this.asciiCanvas.width, h);
        this.asciiCtx.putImageData(strip, xOff, y);
      } catch (e) {
        // console.warn("Glitch effect failed to get/put image data:", e);
      }
    }

    if (this.settings.effects.has("crt")) {
      const gradient = this.asciiCtx.createRadialGradient(
        this.asciiCanvas.width / 2,
        this.asciiCanvas.height / 2,
        this.asciiCanvas.height / 3,
        this.asciiCanvas.width / 2,
        this.asciiCanvas.height / 2,
        this.asciiCanvas.width * 0.65
      );
      gradient.addColorStop(0.3, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.3)");
      this.asciiCtx.fillStyle = gradient;
      this.asciiCtx.fillRect(
        0,
        0,
        this.asciiCanvas.width,
        this.asciiCanvas.height
      );

      this.asciiCtx.beginPath();
      for (let i = 0; i < this.asciiCanvas.height; i += 4) {
        let curve = Math.sin((i / this.asciiCanvas.height) * Math.PI) * 5;
        this.asciiCtx.moveTo(curve, i);
        this.asciiCtx.lineTo(this.asciiCanvas.width - curve, i);
      }
      this.asciiCtx.strokeStyle = "rgba(200, 255, 200, 0.03)";
      this.asciiCtx.lineWidth = 1;
      this.asciiCtx.stroke();
    }
    this.asciiCtx.globalAlpha = 1.0;
  }

  switchTab(tabName) {
    document
      .querySelectorAll(".canvas-tab")
      .forEach((tab) =>
        tab.classList.toggle("active", tab.dataset.tab === tabName)
      );
    document.getElementById("originalCanvas").style.display =
      tabName === "original" ? "block" : "none";
    document.getElementById("asciiCanvas").style.display =
      tabName === "ascii" ? "block" : "none";
  }
  updateStats() {
    const source = this.currentImage || this.currentVideo;
    const srcW = source
      ? this.currentImage
        ? this.currentImage.width
        : this.currentVideo.videoWidth
      : 0;
    const srcH = source
      ? this.currentImage
        ? this.currentImage.height
        : this.currentVideo.videoHeight
      : 0;
    const type = this.currentImage
      ? "Image"
      : this.currentVideo
      ? "Video"
      : "N/A";
    const sourceInfo = srcW > 0 ? `${srcW}x${srcH}px (${type})` : "N/A";

    const aspectRatio = this.settings.effects.has("halftone") ? 1.0 : this.settings.aspectRatioMult;
    const outputHeight =
      srcW > 0
        ? Math.floor(this.settings.resolution * (srcH / srcW) * aspectRatio)
        : Math.floor(this.settings.resolution * 0.75 * aspectRatio);

    // document.getElementById(
    //   "stats"
    // ).innerHTML = `Source: ${sourceInfo} | Output Res: ${this.settings.resolution}x${outputHeight}`;
    // document.getElementById(
    //   "resolutionValue"
    // ).textContent = `${this.settings.resolution}x${outputHeight}`;
  }
  exportAsImage() {
    const link = document.createElement("a");
    link.download = `visualizer-output-${Date.now()}.png`;
    link.href = this.asciiCanvas.toDataURL("image/png");
    link.click();
    document.getElementById("effectPreview").textContent = "Image saved.";
  }
  exportAsText() {
    if (!this.originalCanvas.width || this.originalCanvas.width <= 1) {
      alert("Load an image or video first.");
      document.getElementById("effectPreview").textContent =
        "Cannot export text: No media loaded.";
      return;
    }
    if (
      this.settings.effects.has("halftone") ||
      this.settings.effects.has("edgeDetect")
    ) {
      alert(
        "Text export is not available for Halftone or Edge Detect effects."
      );
      document.getElementById("effectPreview").textContent =
        "Text export unavailable for current effect.";
      return;
    }

    let text = "";
    const asciiWidth = this.settings.resolution;
    const asciiHeight = Math.floor(
      asciiWidth *
        (this.originalCanvas.height / this.originalCanvas.width) *
        0.5
    );
    const charSetToUse =
      this.charSets[this.settings.charSet] || this.charSets.simple;

    let imageData;
    try {
      imageData = this.originalCtx.getImageData(
        0,
        0,
        this.originalCanvas.width,
        this.originalCanvas.height
      );
    } catch (e) {
      alert("Could not get image data for text export.");
      document.getElementById("effectPreview").textContent =
        "Error getting data for text export.";
      return;
    }
    const { data, width: srcW, height: srcH } = imageData;
    const time =
      (Date.now() - this.startTime) * (this.settings.animationSpeed / 1000); // For light/shadow consistency

    for (let y = 0; y < asciiHeight; y++) {
      for (let x = 0; x < asciiWidth; x++) {
        const sx = Math.floor(x * (srcW / asciiWidth));
        const sy = Math.floor(y * (srcH / asciiHeight));

        let r = 0,
          g = 0,
          b = 0;
        const idx = (sy * srcW + sx) * 4;
        if (idx + 2 < data.length) {
          r = data[idx];
          g = data[idx + 1];
          b = data[idx + 2];
        }

        let avg = (r + g + b) / 3;
        avg =
          (avg - 128) * this.settings.contrast + 128 + this.settings.brightness;
        avg = Math.max(0, Math.min(255, avg));

        if (this.settings.effects.has("lightShadow")) {
          const lightSpeedX = 0.3;
          const lightSpeedY = 0.2;
          const lightXNorm = (Math.sin(time * lightSpeedX) + 1) / 2;
          const lightYNorm = (Math.cos(time * lightSpeedY) + 1) / 2;

          const cellNormX = (x + 0.5) / asciiWidth; // Use asciiWidth/Height for normalized cell pos
          const cellNormY = (y + 0.5) / asciiHeight;

          const distToLight = Math.sqrt(
            Math.pow(cellNormX - lightXNorm, 2) +
              Math.pow(cellNormY - lightYNorm, 2)
          );

          const lightRadius = 0.5;
          const falloffRate = 2.0;
          let lightFactor = Math.max(
            0,
            1.0 - (distToLight / lightRadius) * falloffRate
          );
          lightFactor = lightFactor * lightFactor;

          const shadowIntensity = 0.7;
          const brightnessMultiplier =
            1.0 - shadowIntensity * (1.0 - lightFactor);

          avg *= brightnessMultiplier;
          avg = Math.max(0, Math.min(255, avg));
        }

        if (this.settings.inverted) avg = 255 - avg;

        const charIndex = Math.floor((avg / 255) * (charSetToUse.length - 1));
        text += charSetToUse[charIndex];
      }
      text += "\n";
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("ASCII text copied to clipboard!");
        document.getElementById("effectPreview").textContent =
          "ASCII text copied.";
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy text. Check console for details.");
        document.getElementById("effectPreview").textContent =
          "Failed to copy text.";
      });
  }

  startRecording() {
    if (this.isRecording) {
      return;
    }

    // Check if browser supports MediaRecorder
    if (!window.MediaRecorder) {
      alert("Recording is not supported in this browser.");
      document.getElementById("recordingStatus").textContent = "Recording not supported";
      return;
    }

    try {
      // Store canvas stream reference for manual frame control
      this.canvasStream = this.asciiCanvas.captureStream(); // No FPS limit - capture every frame
      
      // Check for WebM support with higher bitrate
      const options = { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 12000000 // Increased to 12 Mbps for better quality
      };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8';
        options.videoBitsPerSecond = 8000000; // 8 Mbps fallback
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
          options.videoBitsPerSecond = 5000000; // 5 Mbps fallback
        }
      }

      this.mediaRecorder = new MediaRecorder(this.canvasStream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        this.updateRecordingUI(false);
        document.getElementById("recordingStatus").textContent = "Recording error occurred";
      };

      this.mediaRecorder.start(16); // Collect data every 16ms (~60fps) for smoother recording
      this.isRecording = true;
      this.updateRecordingUI(true);
      
      // Force consistent animation loop during recording
      this.startRecordingAnimationLoop();

      document.getElementById("recordingStatus").textContent = "Recording in progress...";
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording. Please try again.");
      document.getElementById("recordingStatus").textContent = "Failed to start recording";
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;
    this.updateRecordingUI(false);
    document.getElementById("recordingStatus").textContent = "Processing recording...";
    
    // Stop recording animation loop and return to normal animation
    if (this.recordingAnimationId) {
      cancelAnimationFrame(this.recordingAnimationId);
      this.recordingAnimationId = null;
    }
    
    // Clean up canvas stream reference
    if (this.canvasStream) {
      this.canvasStream = null;
    }
    
    // Resume normal animation if effects are active
    if (this.settings.effects.size > 0 && (this.currentImage || this.currentVideo)) {
      this.startAnimationLoop();
    }
  }

  saveRecording() {
    if (this.recordedChunks.length === 0) {
      document.getElementById("recordingStatus").textContent = "No data recorded";
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascii-recording-${Date.now()}.webm`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    this.recordedChunks = [];
    this.mediaRecorder = null;
    
    document.getElementById("recordingStatus").textContent = "Recording saved successfully!";
    document.getElementById("effectPreview").textContent = "Recording saved as WebM file.";
    
    // Clear status after 3 seconds
    setTimeout(() => {
      document.getElementById("recordingStatus").textContent = "";
    }, 3000);
  }

  updateRecordingUI(isRecording) {
    const startBtn = document.getElementById("startRecordingBtn");
    const stopBtn = document.getElementById("stopRecordingBtn");
    
    startBtn.disabled = isRecording;
    stopBtn.disabled = !isRecording;
    
    if (isRecording) {
      startBtn.style.opacity = "0.5";
      stopBtn.style.opacity = "1";
    } else {
      startBtn.style.opacity = "1";
      stopBtn.style.opacity = "0.5";
    }
  }

  startRecordingAnimationLoop() {
    // Cancel any existing animation loops
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.recordingAnimationId) {
      cancelAnimationFrame(this.recordingAnimationId);
    }

    // Use the existing canvas stream reference
    // Force maximum frame rate with no timing restrictions
    const recordingAnimate = () => {
      if (!this.isRecording) {
        return;
      }

      // Always redraw during recording to ensure smooth capture
      if (this.currentVideo && !this.currentVideo.paused && !this.currentVideo.ended) {
        this.originalCtx.drawImage(
          this.currentVideo,
          0,
          0,
          this.originalCanvas.width,
          this.originalCanvas.height
        );
      } else if (this.currentImage) {
        this.originalCtx.drawImage(
          this.currentImage,
          0,
          0,
          this.originalCanvas.width,
          this.originalCanvas.height
        );
      }

      this.convertToASCII();
      
      // Force canvas stream to capture this frame immediately
      if (this.canvasStream && this.canvasStream.requestFrame) {
        this.canvasStream.requestFrame();
      }
      
      // Continue the recording loop at maximum speed
      this.recordingAnimationId = requestAnimationFrame(recordingAnimate);
    };

    // Start the recording animation loop
    this.recordingAnimationId = requestAnimationFrame(recordingAnimate);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const visualizer = new ASCIIConverter();
  const mainContentEl = document.querySelector(".main-content");
  visualizer.mainContentWidth = mainContentEl.offsetWidth;
  new ResizeObserver(() => {
    visualizer.mainContentWidth = mainContentEl.offsetWidth;
    if (visualizer.currentImage) visualizer.displayOriginalImage();
    if (visualizer.currentVideo) visualizer.displayOriginalVideoFrame();
    visualizer.redrawCurrentMedia();
  }).observe(mainContentEl);
});
