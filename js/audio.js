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
        "assets/tang-em-doa-hoa-hong.mp3?v=43"
      ).trim();

      if (!el) {
        el = new Audio(cfgSrc);
        el.loop = true;
        el.preload = "auto";
        el.setAttribute("playsinline", "");
        el.setAttribute("webkit-playsinline", "");
      } else if (cfgSrc && el.getAttribute("src") !== cfgSrc) {
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

    /* Envelope chime sound effects disabled per user preference (only background song plays) */
    playFlipChime() {}

    playOpenChime() {}
  }

  window.weddingMusic = new WeddingMusicBox();
})();
