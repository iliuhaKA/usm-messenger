let ctx: AudioContext | null = null;

/** Вызови после любого клика пользователя — снимает блокировку AudioContext в Chrome. */
export function primeNotificationAudio(): void {
  try {
    if (typeof window === 'undefined') return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    void ctx.resume().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Short pleasant beep for incoming messages (Web Audio API). */
export function playNotificationSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    // Браузеры часто блокируют звук до жеста пользователя — пробуем resume.
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    /* ignore */
  }
}
