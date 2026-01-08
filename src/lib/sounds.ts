// Notification sound using Web Audio API
// Creates a pleasant "ding" sound without external files

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export type NotificationSoundType = 'success' | 'error' | 'warning' | 'info';

const soundConfigs: Record<NotificationSoundType, { frequency: number; duration: number; type: OscillatorType }> = {
  success: { frequency: 880, duration: 0.15, type: 'sine' },
  error: { frequency: 220, duration: 0.3, type: 'square' },
  warning: { frequency: 440, duration: 0.2, type: 'triangle' },
  info: { frequency: 660, duration: 0.12, type: 'sine' },
};

export const playNotificationSound = (type: NotificationSoundType = 'info') => {
  try {
    const ctx = getAudioContext();
    const config = soundConfigs[type];
    
    // Create oscillator for the tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
    
    // Add a second harmonic for richer sound
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(config.frequency * 1.5, ctx.currentTime);
    
    // Volume envelope - fade in and out for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);
    
    gainNode2.gain.setValueAtTime(0, ctx.currentTime);
    gainNode2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);
    oscillator2.stop(ctx.currentTime + config.duration);
  } catch (error) {
    // Silently fail if audio is not supported or blocked
    console.debug('Audio playback failed:', error);
  }
};
