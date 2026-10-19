// Web Audio API Sound Synthesizer
// Hoạt động 100% không phụ thuộc file mp3 ngoài, không lo 404, âm thanh trong trẻo, tức thì.

class SoundService {
  constructor() {
    this.ctx = null;
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        const ctx = this.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      };
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
    }
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 1. ÂM THANH CHUÔNG THÔNG BÁO HỆ THỐNG / NGƯỜI DÙNG GỬI ĐẾN (3 nốt ngân vang keng-keng)
  playNotificationBell() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 880, start: 0, dur: 0.25 },     // A5
        { freq: 1174.66, start: 0.1, dur: 0.35 },// D6
        { freq: 1760, start: 0.22, dur: 0.6 }    // A6
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.28, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } catch (e) {
      console.warn('Không thể phát âm thanh chuông:', e);
    }
  }

  // 2. ÂM THANH HÀNH ĐỘNG THÀNH CÔNG (Chuông hòa âm 2 nốt trong trẻo C6 - G6)
  playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 1046.50, start: 0, dur: 0.28 }, // C6
        { freq: 1567.98, start: 0.12, dur: 0.55 } // G6
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.22, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } catch (e) {
      console.warn('Không thể phát âm thanh thành công:', e);
    }
  }

  // 3. ÂM THANH HÀNH ĐỘNG THẤT BẠI / CẢNH BÁO (Âm trầm giảm nhẹ)
  playErrorChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {
      console.warn('Không thể phát âm thanh cảnh báo:', e);
    }
  }
}

export const soundService = new SoundService();
export default soundService;
