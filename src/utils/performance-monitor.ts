/**
 * Performance Monitor - Lightweight system to detect memory issues
 * 
 * Usage in components:
 * import { useRenderTracker } from '../utils/performance-monitor';
 * useRenderTracker('ComponentName');
 */

import { useEffect, useRef } from 'react';

// Track render counts per component
const renderCounts = new Map<string, number>();
const renderTimestamps = new Map<string, number[]>();

// Configuration
const RENDER_THRESHOLD = 50; // Warn if a component renders more than this
const TIME_WINDOW = 10000; // 10 seconds window for tracking
const ENABLE_MONITORING = process.env.NODE_ENV === 'development';

/**
 * Hook to track component renders and detect potential issues
 */
export function useRenderTracker(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    if (!ENABLE_MONITORING) return;

    renderCount.current++;
    const count = (renderCounts.get(componentName) || 0) + 1;
    renderCounts.set(componentName, count);

    // Track timestamp
    const timestamps = renderTimestamps.get(componentName) || [];
    const now = Date.now();
    
    // Remove old timestamps outside the time window
    const recentTimestamps = timestamps.filter(ts => now - ts < TIME_WINDOW);
    recentTimestamps.push(now);
    renderTimestamps.set(componentName, recentTimestamps);

    // Check for excessive renders in time window
    if (recentTimestamps.length > RENDER_THRESHOLD) {
      console.warn(
        `⚠️ PERFORMANCE WARNING: ${componentName} rendered ${recentTimestamps.length} times in ${TIME_WINDOW / 1000}s`
      );
    }

    // Log every 10 renders for visibility
    if (count % 10 === 0) {
      console.log(`📊 ${componentName} render count: ${count}`);
    }
  });
}

/**
 * Get render statistics for debugging
 */
export function getRenderStats() {
  const stats: Record<string, { total: number; recent: number }> = {};
  
  renderCounts.forEach((total, component) => {
    const timestamps = renderTimestamps.get(component) || [];
    const now = Date.now();
    const recent = timestamps.filter(ts => now - ts < TIME_WINDOW).length;
    
    stats[component] = { total, recent };
  });

  return stats;
}

/**
 * Reset all statistics (useful for testing)
 */
export function resetRenderStats() {
  renderCounts.clear();
  renderTimestamps.clear();
}

/**
 * Print render statistics to console
 */
export function printRenderStats() {
  const stats = getRenderStats();
  console.log('📊 Render Statistics:');
  console.table(stats);
}

// Make stats accessible in browser console
if (typeof window !== 'undefined') {
  (window as any).fluxPerformance = {
    getStats: getRenderStats,
    printStats: printRenderStats,
    reset: resetRenderStats,
  };
}

/**
 * Hook to track expensive calculations
 */
export function useCalculationTracker(calculationName: string) {
  const startTime = useRef(0);

  const start = () => {
    if (!ENABLE_MONITORING) return;
    startTime.current = performance.now();
  };

  const end = () => {
    if (!ENABLE_MONITORING) return;
    const duration = performance.now() - startTime.current;
    
    if (duration > 16) { // Longer than 1 frame (16.67ms)
      console.warn(
        `⏱️ SLOW CALCULATION: ${calculationName} took ${duration.toFixed(2)}ms`
      );
    }
  };

  return { start, end };
}

/**
 * Measure memory usage (if available)
 */
export function logMemoryUsage() {
  if (!ENABLE_MONITORING) return;
  
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
    const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
    const limit = Math.round(memory.jsHeapSizeLimit / 1048576); // MB
    
    console.log(`💾 Memory: ${used}MB / ${total}MB (limit: ${limit}MB)`);
    
    // Warn if we're using more than 80% of available memory
    if (used > limit * 0.8) {
      console.error(`🚨 MEMORY WARNING: Using ${((used / limit) * 100).toFixed(1)}% of available memory!`);
    }
  }
}

// Auto-log memory every 30 seconds in development
if (ENABLE_MONITORING && typeof window !== 'undefined') {
  setInterval(logMemoryUsage, 30000);
}
