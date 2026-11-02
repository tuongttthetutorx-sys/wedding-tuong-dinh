/* ==========================================================================
   ROMANTIC WEDDING AUDIO ENGINE (iOS Safari / LINE / Zalo / Android Mobile-First)
   - Primary: Real HTML5 <audio id="wedding-bgm"> playing Studio Stereo MP3
     "Canon in D — Grand Piano, Concert Harp & Warm Strings" (assets/wedding-canon.mp3)
   - Uses HTML5 Media Playback channel + navigator.audioSession.type = "playback"
     so audio plays clearly on iPhone even when the hardware Silent Switch is ON!
   - Synchronous zero-delay .play() inside touchend / click user gesture stack.
   ========================================================================== */
(function () {
  class WeddingMusicBox {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.userPaused = false;
      this.fadeTimer = null;
      this.audioEl = null;

      this.configureAudioSession();
    }

    configureAudioSession() {
      try {
        if (typeof navigator !== "undefined" && navigator.audioSession) {
          navigator.audioSession.type = "playback";
        }
      } catch (_) {}
    }

    getAudioElement() {
      if (this.audioEl) return this.audioEl;

      let el = document.getElementById("wedding-bgm");
      const cfgSrc = (
        (window.WEDDING_CONFIG && window.WEDDING_CONFIG.customAudioSrc) ||
        "assets/wedding-canon.mp3"
      ).trim();

      if (!el) {
        el = new Audio(cfgSrc);
        el.loop = true;
        el.preload = "auto";
        el.setAttribute("playsinline", "");
        el.setAttribute("webkit-playsinline", "");
      } else if (cfgSrc && !el.getAttribute("src")) {
        el.src = cfgSrc;
      }

      el.loop = true;

      el.addEventListener("play", () => {
        this.isPlaying = true;
        this.syncButtonUI(true);
      });

      el.addEventListener("pause", () => {
        this.isPlaying = false;
        this.syncButtonUI(false);
      });

      this.audioEl = el;
      return el;
    }

    syncButtonUI(playing) {
      const btn = document.getElementById("music-toggle");
      if (btn) {
        btn.classList.toggle("is-playing", !!playing);
      }
    }

    setSafeVolume(el, vol) {
      try {
        el.volume = Math.max(0, Math.min(1, vol));
      } catch (_) {
        // iOS Safari locks volume to hardware buttons (read-only 1.0)
      }
    }

    /**
     * MUST be called SYNCHRONOUSLY inside a direct user gesture (touchend / click / keydown)
     * with ZERO await before el.play() so iOS Safari, LINE, and Zalo grant media playback!
     */
    startFromGesture(forceEvenIfPaused = false) {
      if (this.userPaused && !forceEvenIfPaused) return;
      if (this.isPlaying) return;

      this.configureAudioSession();
      const el = this.getAudioElement();
      if (!el) return;

      if (this.fadeTimer) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }

      // Gentle 0.7s fade-in on desktop/Android (graceful no-op on iOS where volume is hardware-controlled)
      let currentVol = 0.28;
      const targetVol = 0.78;
      this.setSafeVolume(el, currentVol);

      const playPromise = el.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.userPaused = false;
            this.syncButtonUI(true);

            this.fadeTimer = setInterval(() => {
              if (!this.isPlaying) {
                clearInterval(this.fadeTimer);
                this.fadeTimer = null;
                return;
              }
              currentVol = Math.min(targetVol, currentVol + 0.07);
              this.setSafeVolume(el, currentVol);
              if (currentVol >= targetVol) {
                clearInterval(this.fadeTimer);
                this.fadeTimer = null;
              }
            }, 90);
          })
          .catch(() => {
            this.isPlaying = false;
            this.syncButtonUI(false);
          });
      } else {
        this.isPlaying = true;
        this.syncButtonUI(true);
      }
    }

    async start() {
      this.startFromGesture(true);
      return this.isPlaying;
    }

    stop(byUser = false) {
      if (byUser) {
        this.userPaused = true;
      }
      if (this.fadeTimer) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
      const el = this.getAudioElement();
      if (el && !el.paused) {
        el.pause();
      }
      this.isPlaying = false;
      this.syncButtonUI(false);
    }

    toggleFromGesture() {
      const el = this.getAudioElement();
      if (this.isPlaying && el && !el.paused) {
        this.stop(true);
        return false;
      } else {
        this.userPaused = false;
        this.startFromGesture(true);
        return true;
      }
    }

    async toggle() {
      return this.toggleFromGesture();
    }

    initContext() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }

    /* Subtle D-Major Harp Harmonics synced to Canon in D key (D5 - F#5 - A5 - D6) */
    playFlipChime() {
      try {
        this.configureAudioSession();
        this.initContext();
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume();
        }
        if (!this.ctx) return;

        // Soft paper turn air brush + gentle D-major grace notes (A4 -> D5 -> F#5)
        [
          { freq: 440.0, delay: 20, gain: 0.04 },
          { freq: 587.33, delay: 115, gain: 0.045 },
          { freq: 739.99, delay: 220, gain: 0.038 }
        ].forEach(({ freq, delay, gain }) => {
          setTimeout(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(gain, t + 0.018);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.7);
          }, delay);
        });
      } catch (_) {}
    }

    playOpenChime() {
      try {
        this.configureAudioSession();
        this.initContext();
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume();
        }
        if (!this.ctx) return;
        // D Major Harp Arpeggio (D5 - F#5 - A5 - D6) in perfect harmony with Canon in D!
        const notes = [587.33, 739.99, 880.0, 1174.66];
        notes.forEach((f, idx) => {
          setTimeout(() => {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, now);
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(0.065, now + 0.018);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.0);
          }, idx * 75);
        });
      } catch (_) {}
    }
  }

  window.weddingMusic = new WeddingMusicBox();
})();
