/**
 * Refresh Rate Detection Utility
 * 
 * Detects the current browser rendering refresh rate using requestAnimationFrame.
 * Note: Cannot detect dynamic refresh rate capabilities (ProMotion, Adaptive Sync, etc.)
 * but can measure actual current rendering rate.
 */

export interface RefreshRateInfo {
  /** Detected refresh rate in Hz */
  rate: number;
  /** Frame duration in milliseconds */
  frameDuration: number;
  /** Whether the detected rate is considered high (>60Hz) */
  isHighRefreshRate: boolean;
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
}

/**
 * Detects the current refresh rate of the display.
 * Uses requestAnimationFrame to measure frame timing.
 * 
 * @param sampleDuration - Duration in ms to sample (default: 500ms)
 * @returns Promise<RefreshRateInfo>
 */
export async function detectRefreshRate(sampleDuration: number = 500): Promise<RefreshRateInfo> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = 0;
    
    const countFrame = (timestamp: number) => {
      if (startTime === 0) {
        startTime = timestamp;
      }
      
      frameCount++;
      
      const elapsed = timestamp - startTime;
      if (elapsed < sampleDuration) {
        requestAnimationFrame(countFrame);
      } else {
        // Calculate refresh rate
        const rate = Math.round((frameCount / elapsed) * 1000);
        const frameDuration = elapsed / frameCount;
        
        resolve({
          rate,
          frameDuration,
          isHighRefreshRate: rate > 65, // Allow some margin
          prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        });
      }
    };
    
    requestAnimationFrame(countFrame);
  });
}

/**
 * Get optimal animation duration based on refresh rate.
 * Higher refresh rates can support slightly longer animations
 * while still feeling snappy because more frames are shown.
 * 
 * @param baseMs - Base animation duration in ms for 60Hz displays
 * @param refreshRate - Current refresh rate
 */
export function getOptimalAnimationDuration(baseMs: number, refreshRate: number): number {
  // For high refresh rates, we can afford slightly longer animations
  // because they appear smoother. But keep it subtle.
  if (refreshRate >= 120) {
    return baseMs * 1.1; // 10% longer for 120Hz+
  }
  if (refreshRate >= 90) {
    return baseMs * 1.05; // 5% longer for 90Hz
  }
  return baseMs;
}

/**
 * CSS custom properties that can be set based on detected refresh rate
 */
export function applyRefreshRateCSS(info: RefreshRateInfo): void {
  const root = document.documentElement;
  
  // Set CSS custom properties for use in stylesheets
  root.style.setProperty('--detected-refresh-rate', `${info.rate}`);
  root.style.setProperty('--frame-duration', `${info.frameDuration.toFixed(2)}ms`);
  root.style.setProperty('--is-high-refresh', info.isHighRefreshRate ? '1' : '0');
  
  // Adjust animation timing based on refresh rate
  const transitionBase = 200; // base 200ms for 60Hz
  const optimalDuration = getOptimalAnimationDuration(transitionBase, info.rate);
  root.style.setProperty('--page-transition-duration', `${optimalDuration}ms`);
  
  // Respect reduced motion preference
  if (info.prefersReducedMotion) {
    root.style.setProperty('--page-transition-duration', '0ms');
    root.classList.add('reduced-motion');
  }
  

}

/**
 * Initialize refresh rate detection on app startup.
 * Call this once during app initialization.
 */
export async function initRefreshRateDetection(): Promise<RefreshRateInfo> {
  const info = await detectRefreshRate();
  applyRefreshRateCSS(info);
  
  // Listen for reduced motion preference changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    const root = document.documentElement;
    if (e.matches) {
      root.style.setProperty('--page-transition-duration', '0ms');
      root.classList.add('reduced-motion');
    } else {
      const duration = getOptimalAnimationDuration(200, info.rate);
      root.style.setProperty('--page-transition-duration', `${duration}ms`);
      root.classList.remove('reduced-motion');
    }
  });
  
  return info;
}

// ============================================================================
// FPS Monitoring & Frame Drop Detection
// ============================================================================

interface FrameStats {
  frameCount: number;
  totalTime: number;
  avgFps: number;
  minFps: number;
  maxFrameTime: number;
  droppedFrames: number;
  targetFps: number;
}

let isMonitoring = false;
let monitoringData: {
  startTime: number;
  lastFrameTime: number;
  frameTimes: number[];
  targetFrameTime: number;
} | null = null;

/**
 * Start monitoring FPS for a transition.
 * Call this when a page transition begins.
 */
export function startTransitionMonitor(label: string = 'transition'): void {
  if (isMonitoring) {
    console.warn('[FPS] Already monitoring, stopping previous monitor');
    stopTransitionMonitor();
  }
  
  const now = performance.now();
  const estimatedRefreshRate = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--detected-refresh-rate') || '60');
  
  monitoringData = {
    startTime: now,
    lastFrameTime: now,
    frameTimes: [],
    targetFrameTime: 1000 / estimatedRefreshRate, // e.g., 6.06ms for 165Hz
  };
  
  isMonitoring = true;
  
  monitorFrames(label);
}

function monitorFrames(label: string): void {
  if (!isMonitoring || !monitoringData) return;
  
  const now = performance.now();
  const frameTime = now - monitoringData.lastFrameTime;
  monitoringData.frameTimes.push(frameTime);
  monitoringData.lastFrameTime = now;
  
  // Detect significant frame drops (>50% longer than target)
  if (frameTime > monitoringData.targetFrameTime * 1.5) {
     // Frame drop detected - silent monitoring
  }
  
  requestAnimationFrame(() => monitorFrames(label));
}

/**
 * Stop monitoring and log the results.
 * Call this when the transition ends.
 */
export function stopTransitionMonitor(): FrameStats | null {
  if (!isMonitoring || !monitoringData) {
    console.warn('[FPS] Not currently monitoring');
    return null;
  }
  
  isMonitoring = false;
  
  const totalTime = performance.now() - monitoringData.startTime;
  const frameTimes = monitoringData.frameTimes;
  const frameCount = frameTimes.length;
  
  if (frameCount < 2) {
    monitoringData = null;
    return null;
  }
  
  const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameCount;
  const maxFrameTime = Math.max(...frameTimes);
  const avgFps = 1000 / avgFrameTime;
  const minFps = 1000 / maxFrameTime;
  const targetFps = 1000 / monitoringData.targetFrameTime;
  
  const data = monitoringData;
  const droppedFrames = frameTimes.filter(t => t > data.targetFrameTime * 1.5).length;
  
  const stats: FrameStats = {
    frameCount,
    totalTime,
    avgFps: Math.round(avgFps),
    minFps: Math.round(minFps),
    maxFrameTime,
    droppedFrames,
    targetFps: Math.round(targetFps),
  };
  
  monitoringData = null;
  return stats;
}

/**
 * Utility to measure a specific code block's performance
 */
export function measureBlock(label: string, fn: () => void): void {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  
  if (duration > 16.67) { // Longer than 60fps frame
    console.warn(`[Perf] ⚠️ "${label}" took ${duration.toFixed(2)}ms (blocks main thread)`);
  }
}

export default {
  detectRefreshRate,
  getOptimalAnimationDuration,
  applyRefreshRateCSS,
  initRefreshRateDetection,
  startTransitionMonitor,
  stopTransitionMonitor,
  measureBlock,
};
