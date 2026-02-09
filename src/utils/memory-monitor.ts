/**
 * 🛠️ MEMORY MONITOR - VERSION R.A.S.P STABILISÉE
 * Outil de diagnostic pour détecter les fuites de mémoire et les boucles infinies d'API.
 * * Usage en console :
 * - window.__memoryMonitor.status()      -> Stats rapides
 * - window.__memoryMonitor.startTracking() -> Activer la surveillance
 * - window.__memoryMonitor.report()      -> Rapport détaillé
 * - window.__memoryMonitor.checkLeaks()  -> Analyse automatique des fuites
 */

interface ApiCallRecord {
  timestamp: number;
  endpoint: string;
  duration?: number;
}

class MemoryMonitor {
  private componentMounts: Map<string, number> = new Map();
  private eventListeners: Map<string, number> = new Map();
  private apiCalls: ApiCallRecord[] = [];
  private tracking = false;
  private maxApiCallsHistory = 100;

  /**
   * Track component mount
   */
  trackMount(componentName: string): void {
    if (!this.tracking) return;
    
    const count = this.componentMounts.get(componentName) || 0;
    this.componentMounts.set(componentName, count + 1);
    
    console.log(`📦 Mount: ${componentName} (total active: ${count + 1})`);
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
      console.warn(`⚠️ Unmount appelé pour ${componentName} sans mount préalable !`);
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
      console.log(`🎧 Listener ajouté: ${eventName} (total: ${count + 1})`);
    } else {
      if (count > 0) {
        this.eventListeners.set(eventName, count - 1);
        console.log(`🔇 Listener retiré: ${eventName} (restant: ${count - 1})`);
      } else {
        console.warn(`⚠️ Retrait de listener pour ${eventName} mais aucun n'est enregistré !`);
      }
    }
  }

  /**
   * Track API call avec gestion de la durée (Correction du Type Error)
   */
  trackApiCall(endpoint: string): { end: () => void } {
    if (!this.tracking) return { end: () => {} };
    
    const timestamp = Date.now();
    // On crée l'objet avec le type explicite pour autoriser l'ajout de duration plus tard
    const call: ApiCallRecord = { timestamp, endpoint };
    
    this.apiCalls.push(call);
    
    if (this.apiCalls.length > this.maxApiCallsHistory) {
      this.apiCalls.shift(); // Plus performant que slice(-N) pour un singleton
    }
    
    console.log(`🌐 API Call: ${endpoint}`);
    
    return {
      end: () => {
        const duration = Date.now() - timestamp;
        call.duration = duration; // ✅ Plus d'erreur TS ici
        console.log(`✅ API Terminée: ${endpoint} (${duration}ms)`);
      }
    };
  }

  /**
   * Get API call statistics
   */
  getApiStats() {
    const now = Date.now();
    const last10s = this.apiCalls.filter(c => now - c.timestamp < 10000).length;
    
    const endpoints: Record<string, number> = {};
    this.apiCalls.forEach(call => {
      endpoints[call.endpoint] = (endpoints[call.endpoint] || 0) + 1;
    });
    
    const slowest = [...this.apiCalls]
      .filter(c => c.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5);
    
    return { total: this.apiCalls.length, last10s, slowest, endpoints };
  }

  startTracking(): void {
    this.tracking = true;
    console.log('🔍 Memory Monitor: ACTIVÉ');
  }

  stopTracking(): void {
    this.tracking = false;
    console.log('🛑 Memory Monitor: DÉSACTIVÉ');
  }

  /**
   * Affichage formatté dans la console
   */
  status(): void {
    console.log('\n📊 --- ÉTAT DU MONITEUR DE MÉMOIRE ---');
    
    console.log('\n🏗️ Composants actifs :');
    if (this.componentMounts.size === 0) {
      console.log('  Aucun');
    } else {
      this.componentMounts.forEach((count, name) => {
        const prefix = count > 1 ? '⚠️ [FUITE POSSIBLE]' : '✅';
        if (count > 0) console.log(`  ${prefix} ${name}: ${count} instance(s)`);
      });
    }
    
    console.log('\n🎧 Listeners actifs :');
    this.eventListeners.forEach((count, name) => {
      if (count > 0) console.log(`  ${count > 5 ? '⚠️' : '✅'} ${name}: ${count}`);
    });
    
    const stats = this.getApiStats();
    console.log(`\n🌐 API : ${stats.last10s} appels/10s (Total historisé: ${stats.total})`);
    
    if (stats.slowest.length > 0) {
      console.log('⏱️ Plus lents :');
      stats.slowest.forEach(s => console.log(`  - ${s.endpoint}: ${s.duration}ms`));
    }
    console.log('\n--------------------------------------\n');
  }

  report(): string {
    const lines = ['--- RAPPORT MÉMOIRE ---'];
    this.componentMounts.forEach((count, name) => {
      if (count > 0) lines.push(`COMP: ${name} -> ${count}`);
    });
    const stats = this.getApiStats();
    lines.push(`API_10S: ${stats.last10s}`);
    return lines.join('\n');
  }

  reset(): void {
    this.componentMounts.clear();
    this.eventListeners.clear();
    this.apiCalls = [];
    console.log('🔄 Données réinitialisées');
  }

  /**
   * Analyse automatique
   */
  checkLeaks(): { hasLeaks: boolean; issues: string[] } {
    const issues: string[] = [];
    
    this.componentMounts.forEach((count, name) => {
      if (count > 3) issues.push(`Fuite probable : ${name} a ${count} instances actives.`);
    });
    
    this.eventListeners.forEach((count, name) => {
      if (count > 10) issues.push(`Trop de listeners : ${name} (${count})`);
    });
    
    const stats = this.getApiStats();
    if (stats.last10s > 20) issues.push(`Boucle API suspecte : ${stats.last10s} appels en 10s`);

    if (issues.length > 0) {
      console.warn('🚨 PROBLÈMES DÉTECTÉS :', issues);
    } else {
      console.log('✅ Santé du système : Optimale');
    }
    
    return { hasLeaks: issues.length > 0, issues };
  }
}

export const memoryMonitor = new MemoryMonitor();

// Exposition globale
if (typeof window !== 'undefined') {
  (window as any).__memoryMonitor = {
    status: () => memoryMonitor.status(),
    startTracking: () => memoryMonitor.startTracking(),
    stopTracking: () => memoryMonitor.stopTracking(),
    report: () => console.log(memoryMonitor.report()),
    reset: () => memoryMonitor.reset(),
    checkLeaks: () => memoryMonitor.checkLeaks(),
  };
}