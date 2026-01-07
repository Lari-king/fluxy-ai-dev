/**
 * Global event lock system to prevent cascading API calls
 * 
 * This prevents the "out of memory" error caused by multiple modules
 * listening to events and triggering simultaneous API calls
 */

class GlobalEventLock {
  private isRefreshing = false;
  private pendingRefresh = false;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 500; // Increased from 300ms for better stability
  private refreshCallbacks: Set<() => Promise<void>> = new Set();

  /**
   * Register a refresh callback for a module
   */
  registerRefresh(callback: () => Promise<void>): () => void {
    this.refreshCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.refreshCallbacks.delete(callback);
    };
  }

  /**
   * Request a global refresh - will be debounced and locked
   */
  requestRefresh(): void {
    // If already refreshing, mark that we need another refresh after
    if (this.isRefreshing) {
      this.pendingRefresh = true;
      console.log('⏸️ Global refresh already in progress, will refresh again after');
      return;
    }

    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Set new debounced timer
    this.refreshTimer = setTimeout(() => {
      this.executeRefresh();
    }, this.DEBOUNCE_MS);

    console.log(`⏱️ Global refresh scheduled in ${this.DEBOUNCE_MS}ms`);
  }

  /**
   * Execute all registered refresh callbacks
   */
  private async executeRefresh(): Promise<void> {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    this.pendingRefresh = false;
    console.log('🔄 Executing global refresh for all modules...');

    try {
      // Execute all callbacks in parallel
      await Promise.all(
        Array.from(this.refreshCallbacks).map(callback => 
          callback().catch(err => {
            console.error('Error in refresh callback:', err);
          })
        )
      );
      
      console.log('✅ Global refresh completed successfully');
    } catch (error) {
      console.error('❌ Global refresh error:', error);
    } finally {
      this.isRefreshing = false;
      
      // If another refresh was requested while we were refreshing, do it now
      if (this.pendingRefresh) {
        console.log('🔁 Executing pending refresh...');
        setTimeout(() => this.executeRefresh(), 100);
      }
    }
  }

  /**
   * Check if currently refreshing
   */
  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }

  /**
   * Force cancel any pending refresh
   */
  cancelPending(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.pendingRefresh = false;
  }
}

// Singleton instance
export const globalEventLock = new GlobalEventLock();
