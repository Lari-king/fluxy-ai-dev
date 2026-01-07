/**
 * Memory Monitor - Debug tool for tracking memory leaks
 * 
 * Usage in development:
 * - window.__memoryMonitor.status() - Get current stats
 * - window.__memoryMonitor.startTracking() - Start tracking component mounts
 * - window.__memoryMonitor.stopTracking() - Stop tracking
 * - window.__memoryMonitor.report() - Generate detailed report
 */

class MemoryMonitor {
  private componentMounts: Map<string, number> = new Map();
  private eventListeners: Map<string, number> = new Map();
  private apiCalls: Array<{ timestamp: number; endpoint: string; duration?: number }> = [];
  private tracking = false;
  private maxApiCallsHistory = 100;

  /**
   * Track component mount
   */
  trackMount(componentName: string): void {
    if (!this.tracking) return;
    
    const count = this.componentMounts.get(componentName) || 0;
    this.componentMounts.set(componentName, count + 1);
    
    console.log(`📦 Mount: ${componentName} (total: ${count + 1})`);
  }

  /**
   * Track component unmount
   */
  trackUnmount(componentName: string): void {
    if (!this.tracking) return;
    
    const count = this.componentMounts.get(componentName) || 0;
    if (count > 0) {
      this.componentMounts.set(componentName, count - 1);
      console.log(`📤 Unmount: ${componentName} (remaining: ${count - 1})`);
    } else {
      console.warn(`⚠️ Unmount called for ${componentName} but no mount recorded!`);
    }
  }

  /**
   * Track event listener registration
   */
  trackEventListener(eventName: string, action: 'add' | 'remove'): void {
    if (!this.tracking) return;
    
    const count = this.eventListeners.get(eventName) || 0;
    
    if (action === 'add') {
      this.eventListeners.set(eventName, count + 1);
      console.log(`🎧 Listener added: ${eventName} (total: ${count + 1})`);
    } else {
      if (count > 0) {
        this.eventListeners.set(eventName, count - 1);
        console.log(`🔇 Listener removed: ${eventName} (remaining: ${count - 1})`);
      } else {
        console.warn(`⚠️ Listener remove called for ${eventName} but none registered!`);
      }
    }
  }

  /**
   * Track API call
   */
  trackApiCall(endpoint: string): { end: () => void } {
    if (!this.tracking) return { end: () => {} };
    
    const timestamp = Date.now();
    const call = { timestamp, endpoint };
    
    this.apiCalls.push(call);
    
    // Keep only recent calls
    if (this.apiCalls.length > this.maxApiCallsHistory) {
      this.apiCalls = this.apiCalls.slice(-this.maxApiCallsHistory);
    }
    
    console.log(`🌐 API Call: ${endpoint}`);
    
    return {
      end: () => {
        const duration = Date.now() - timestamp;
        call.duration = duration;
        console.log(`✅ API Complete: ${endpoint} (${duration}ms)`);
      }
    };
  }

  /**
   * Get API call statistics
   */
  getApiStats(): { total: number; last10s: number; slowest: any; endpoints: Record<string, number> } {
    const now = Date.now();
    const last10s = this.apiCalls.filter(c => now - c.timestamp < 10000).length;
    
    const endpoints: Record<string, number> = {};
    this.apiCalls.forEach(call => {
      endpoints[call.endpoint] = (endpoints[call.endpoint] || 0) + 1;
    });
    
    const slowest = this.apiCalls
      .filter(c => c.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5);
    
    return { total: this.apiCalls.length, last10s, slowest, endpoints };
  }

  /**
   * Start tracking
   */
  startTracking(): void {
    this.tracking = true;
    console.log('🔍 Memory Monitor: Tracking started');
  }

  /**
   * Stop tracking
   */
  stopTracking(): void {
    this.tracking = false;
    console.log('🛑 Memory Monitor: Tracking stopped');
  }

  /**
   * Get current status
   */
  status(): void {
    console.log('\n📊 MEMORY MONITOR STATUS');
    console.log('========================\n');
    
    console.log('🏗️ Component Mounts:');
    if (this.componentMounts.size === 0) {
      console.log('  No components tracked');
    } else {
      this.componentMounts.forEach((count, name) => {
        const status = count > 1 ? '⚠️ MULTIPLE' : count === 1 ? '✅ OK' : '❌ UNMOUNTED';
        console.log(`  ${status} ${name}: ${count}`);
      });
    }
    
    console.log('\n🎧 Event Listeners:');
    if (this.eventListeners.size === 0) {
      console.log('  No listeners tracked');
    } else {
      this.eventListeners.forEach((count, name) => {
        const status = count > 5 ? '⚠️ HIGH' : count > 0 ? '✅ OK' : '❌ NONE';
        console.log(`  ${status} ${name}: ${count}`);
      });
    }
    
    console.log('\n🌐 API Calls:');
    const apiStats = this.getApiStats();
    console.log(`  Total tracked: ${apiStats.total}`);
    console.log(`  Last 10s: ${apiStats.last10s}`);
    
    if (apiStats.last10s > 10) {
      console.warn('  ⚠️ HIGH API ACTIVITY - Potential issue!');
    }
    
    console.log('\n📈 Most Called Endpoints:');
    const sortedEndpoints = Object.entries(apiStats.endpoints)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    sortedEndpoints.forEach(([endpoint, count]) => {
      console.log(`  ${endpoint}: ${count}`);
    });
    
    console.log('\n⏱️ Slowest API Calls:');
    if (apiStats.slowest.length === 0) {
      console.log('  No completed calls');
    } else {
      apiStats.slowest.forEach((call: any) => {
        console.log(`  ${call.endpoint}: ${call.duration}ms`);
      });
    }
    
    console.log('\n========================\n');
  }

  /**
   * Generate detailed report
   */
  report(): string {
    const lines: string[] = [];
    
    lines.push('MEMORY MONITOR REPORT');
    lines.push('====================\n');
    
    lines.push('Components:');
    this.componentMounts.forEach((count, name) => {
      lines.push(`  ${name}: ${count} instance(s)`);
    });
    
    lines.push('\nEvent Listeners:');
    this.eventListeners.forEach((count, name) => {
      lines.push(`  ${name}: ${count} listener(s)`);
    });
    
    const apiStats = this.getApiStats();
    lines.push(`\nAPI Calls: ${apiStats.total} total, ${apiStats.last10s} in last 10s`);
    
    return lines.join('\n');
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.componentMounts.clear();
    this.eventListeners.clear();
    this.apiCalls = [];
    console.log('🔄 Memory Monitor: All data reset');
  }

  /**
   * Check for potential memory leaks
   */
  checkLeaks(): { hasLeaks: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for components that mounted but never unmounted
    this.componentMounts.forEach((count, name) => {
      if (count > 3) {
        issues.push(`Component "${name}" has ${count} instances - possible leak`);
      }
    });
    
    // Check for excessive event listeners
    this.eventListeners.forEach((count, name) => {
      if (count > 10) {
        issues.push(`Event "${name}" has ${count} listeners - possible leak`);
      }
    });
    
    // Check for excessive API calls
    const apiStats = this.getApiStats();
    if (apiStats.last10s > 20) {
      issues.push(`${apiStats.last10s} API calls in last 10s - too many!`);
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ POTENTIAL MEMORY LEAKS DETECTED:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    } else {
      console.log('✅ No obvious memory leaks detected');
    }
    
    return { hasLeaks: issues.length > 0, issues };
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__memoryMonitor = {
    status: () => memoryMonitor.status(),
    startTracking: () => memoryMonitor.startTracking(),
    stopTracking: () => memoryMonitor.stopTracking(),
    report: () => console.log(memoryMonitor.report()),
    reset: () => memoryMonitor.reset(),
    checkLeaks: () => memoryMonitor.checkLeaks(),
  };
  
  console.log('💡 Memory Monitor available: window.__memoryMonitor');
}
