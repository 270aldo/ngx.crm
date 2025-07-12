/**
 * NGX Performance Optimizer Service
 * 
 * Servicio integral para optimización de performance y experiencia móvil
 * Incluye lazy loading, caching, compression y métricas de rendimiento
 */

// Performance Observer para métricas Core Web Vitals
class NGXPerformanceMonitor {
  private metrics: Record<string, number> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.fid = entry.processingStart - entry.startTime;
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }

    // Navigation Timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
        this.metrics.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
      }
    });
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reportToNGXAnalytics() {
    // Enviar métricas a servicio de analytics NGX
    console.log('NGX Performance Metrics:', this.metrics);
    
    // Aquí se podría integrar con el MCP bridge para enviar métricas
    return this.metrics;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
  }
}

// Image Optimization Service
class NGXImageOptimizer {
  private imageCache = new Map<string, string>();
  private observer?: IntersectionObserver;

  constructor() {
    this.initializeLazyLoading();
  }

  private initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
            }
          });
        },
        { rootMargin: '50px' }
      );
    }
  }

  observeImage(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  private async loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (!src) return;

    try {
      // Check cache first
      if (this.imageCache.has(src)) {
        img.src = this.imageCache.get(src)!;
        return;
      }

      // Load and potentially compress image
      const optimizedSrc = await this.optimizeImage(src);
      this.imageCache.set(src, optimizedSrc);
      img.src = optimizedSrc;
      
      img.classList.add('ngx-image-loaded');
    } catch (error) {
      console.error('Error loading image:', error);
      img.src = src; // Fallback to original
    }
  }

  private async optimizeImage(src: string): Promise<string> {
    // For WebP support detection and conversion
    if (this.supportsWebP() && !src.includes('.webp')) {
      // In a real implementation, this would convert to WebP
      // For now, return original
      return src;
    }
    return src;
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
}

// Component Lazy Loading Service
class NGXComponentLoader {
  private componentCache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  async loadComponent(componentName: string): Promise<any> {
    // Check cache first
    if (this.componentCache.has(componentName)) {
      return this.componentCache.get(componentName);
    }

    // Check if already loading
    if (this.loadingPromises.has(componentName)) {
      return this.loadingPromises.get(componentName);
    }

    // Load component dynamically
    const loadPromise = this.dynamicImport(componentName);
    this.loadingPromises.set(componentName, loadPromise);

    try {
      const component = await loadPromise;
      this.componentCache.set(componentName, component);
      this.loadingPromises.delete(componentName);
      return component;
    } catch (error) {
      this.loadingPromises.delete(componentName);
      throw error;
    }
  }

  private async dynamicImport(componentName: string) {
    switch (componentName) {
      case 'NGX3DPipeline':
        return (await import('../components/NGX3DPipeline')).default;
      case 'NGXVoiceInterface':
        return (await import('../components/NGXVoiceInterface')).default;
      case 'AutoTierDetectionWidget':
        return (await import('../components/AutoTierDetectionWidget')).default;
      case 'NGXMCPIntegration':
        return (await import('../components/NGXMCPIntegration')).default;
      default:
        throw new Error(`Component ${componentName} not found`);
    }
  }

  preloadComponent(componentName: string) {
    // Preload component without waiting
    this.loadComponent(componentName).catch(console.error);
  }

  preloadCriticalComponents() {
    // Preload components that are likely to be needed
    const criticalComponents = [
      'AutoTierDetectionWidget',
      'NGXMCPIntegration'
    ];

    criticalComponents.forEach(component => {
      this.preloadComponent(component);
    });
  }
}

// Mobile Experience Optimizer
class NGXMobileOptimizer {
  private isMobile: boolean;
  private touchStartY: number = 0;

  constructor() {
    this.isMobile = this.detectMobile();
    this.initializeMobileOptimizations();
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  private initializeMobileOptimizations() {
    if (this.isMobile) {
      // Add mobile-specific CSS class
      document.body.classList.add('ngx-mobile');

      // Optimize touch interactions
      this.optimizeTouchInteractions();

      // Reduce animations on mobile
      this.optimizeAnimations();

      // Optimize viewport
      this.optimizeViewport();
    }
  }

  private optimizeTouchInteractions() {
    // Add touch feedback to buttons
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        target.classList.add('ngx-touch-active');
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        setTimeout(() => {
          target.classList.remove('ngx-touch-active');
        }, 150);
      }
    }, { passive: true });

    // Improve scrolling performance
    document.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const touchDiff = this.touchStartY - touchY;
      
      // Add momentum scrolling hint
      if (Math.abs(touchDiff) > 10) {
        document.body.style.setProperty('--scroll-momentum', touchDiff > 0 ? 'up' : 'down');
      }
    }, { passive: true });
  }

  private optimizeAnimations() {
    // Reduce motion for mobile users or those who prefer reduced motion
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (reduceMotion || this.isMobile) {
      document.body.classList.add('ngx-reduce-motion');
    }
  }

  private optimizeViewport() {
    // Ensure proper viewport scaling
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
  }

  getMobileMetrics() {
    return {
      isMobile: this.isMobile,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pixelRatio: window.devicePixelRatio,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    };
  }
}

// Resource Optimizer
class NGXResourceOptimizer {
  private prefetchedResources = new Set<string>();

  constructor() {
    this.preloadCriticalResources();
    this.setupResourceHints();
  }

  private preloadCriticalResources() {
    // Preload critical CSS
    this.preloadResource('/src/styles/ngx-design-tokens.css', 'style');
    
    // Preload fonts
    this.preloadResource('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap', 'style');
    this.preloadResource('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap', 'style');
  }

  private setupResourceHints() {
    // DNS prefetch for external domains
    this.addDnsPrefetch('https://fonts.googleapis.com');
    this.addDnsPrefetch('https://fonts.gstatic.com');
  }

  preloadResource(href: string, as: string) {
    if (this.prefetchedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    this.prefetchedResources.add(href);
  }

  prefetchResource(href: string) {
    if (this.prefetchedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    
    this.prefetchedResources.add(href);
  }

  private addDnsPrefetch(domain: string) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  }
}

// Memory Management
class NGXMemoryManager {
  private memoryWatchers = new Map<string, () => void>();
  private memoryLimit = 50 * 1024 * 1024; // 50MB

  constructor() {
    this.monitorMemoryUsage();
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > this.memoryLimit) {
          this.triggerCleanup();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  registerCleanup(key: string, cleanup: () => void) {
    this.memoryWatchers.set(key, cleanup);
  }

  unregisterCleanup(key: string) {
    this.memoryWatchers.delete(key);
  }

  private triggerCleanup() {
    console.log('NGX: Triggering memory cleanup');
    this.memoryWatchers.forEach(cleanup => cleanup());
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }
}

// Main Performance Optimizer
export class NGXPerformanceOptimizer {
  private performanceMonitor: NGXPerformanceMonitor;
  private imageOptimizer: NGXImageOptimizer;
  private componentLoader: NGXComponentLoader;
  private mobileOptimizer: NGXMobileOptimizer;
  private resourceOptimizer: NGXResourceOptimizer;
  private memoryManager: NGXMemoryManager;

  constructor() {
    this.performanceMonitor = new NGXPerformanceMonitor();
    this.imageOptimizer = new NGXImageOptimizer();
    this.componentLoader = new NGXComponentLoader();
    this.mobileOptimizer = new NGXMobileOptimizer();
    this.resourceOptimizer = new NGXResourceOptimizer();
    this.memoryManager = new NGXMemoryManager();

    this.initialize();
  }

  private initialize() {
    // Preload critical components
    this.componentLoader.preloadCriticalComponents();

    // Register cleanup for memory management
    this.memoryManager.registerCleanup('componentCache', () => {
      // Clear component cache if memory pressure
      this.componentLoader = new NGXComponentLoader();
    });

    // Setup performance reporting
    window.addEventListener('beforeunload', () => {
      this.reportPerformanceMetrics();
    });
  }

  // Public API methods
  optimizeImage(img: HTMLImageElement) {
    this.imageOptimizer.observeImage(img);
  }

  async loadComponent(componentName: string) {
    return this.componentLoader.loadComponent(componentName);
  }

  preloadComponent(componentName: string) {
    this.componentLoader.preloadComponent(componentName);
  }

  getPerformanceMetrics() {
    return {
      coreWebVitals: this.performanceMonitor.getMetrics(),
      mobile: this.mobileOptimizer.getMobileMetrics(),
      memory: this.memoryManager.getMemoryUsage()
    };
  }

  reportPerformanceMetrics() {
    const metrics = this.getPerformanceMetrics();
    this.performanceMonitor.reportToNGXAnalytics();
    return metrics;
  }

  cleanup() {
    this.performanceMonitor.cleanup();
    this.memoryManager.unregisterCleanup('componentCache');
  }
}

// Export singleton instance
export const ngxPerformanceOptimizer = new NGXPerformanceOptimizer();

// React Hook for performance optimization
export const useNGXPerformance = () => {
  return {
    optimizeImage: (img: HTMLImageElement) => ngxPerformanceOptimizer.optimizeImage(img),
    loadComponent: (componentName: string) => ngxPerformanceOptimizer.loadComponent(componentName),
    preloadComponent: (componentName: string) => ngxPerformanceOptimizer.preloadComponent(componentName),
    getMetrics: () => ngxPerformanceOptimizer.getPerformanceMetrics(),
    reportMetrics: () => ngxPerformanceOptimizer.reportPerformanceMetrics()
  };
};

export default NGXPerformanceOptimizer;