/**
 * useNGXOptimization Hook
 * 
 * Hook para integrar optimizaciones de performance y mobile en componentes React
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useNGXPerformance } from '../services/performance-optimizer';

export const useNGXOptimization = () => {
  const { optimizeImage, loadComponent, preloadComponent, getMetrics } = useNGXPerformance();
  const [isLoading, setIsLoading] = useState(false);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);

  // Auto-optimize images
  const optimizeImagesInContainer = useCallback((container: HTMLElement) => {
    const images = container.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      optimizeImage(img as HTMLImageElement);
    });
  }, [optimizeImage]);

  // Lazy load component with performance monitoring
  const loadComponentOptimized = useCallback(async (componentName: string) => {
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      const component = await loadComponent(componentName);
      const loadTime = performance.now() - startTime;
      
      // Log performance metrics
      console.log(`NGX: Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      
      return component;
    } finally {
      setIsLoading(false);
    }
  }, [loadComponent]);

  // Monitor performance metrics
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = getMetrics();
      
      // Calculate simple performance score (0-100)
      let score = 100;
      
      if (metrics.coreWebVitals.lcp > 2500) score -= 20; // Poor LCP
      if (metrics.coreWebVitals.fid > 100) score -= 20;  // Poor FID
      if (metrics.coreWebVitals.cls > 0.1) score -= 20;  // Poor CLS
      
      if (metrics.memory && metrics.memory.percentage > 80) score -= 20; // High memory usage
      
      setPerformanceScore(Math.max(0, score));
    };

    // Update metrics every 10 seconds
    const interval = setInterval(updateMetrics, 10000);
    updateMetrics(); // Initial measurement

    return () => clearInterval(interval);
  }, [getMetrics]);

  return {
    optimizeImagesInContainer,
    loadComponentOptimized,
    preloadComponent,
    isLoading,
    performanceScore,
    getMetrics
  };
};

// Hook específico para mobile
export const useNGXMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      if (mobile) {
        document.body.classList.add('ngx-mobile');
      } else {
        document.body.classList.remove('ngx-mobile');
      }
    };

    const checkOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };

    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkMobile();
    checkOrientation();
    checkTouch();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return {
    isMobile,
    orientation,
    isTouch,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait'
  };
};

// Hook para lazy loading de imágenes
export const useLazyImage = (src: string, options?: IntersectionObserverInit) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      {
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [options]);

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = imgRef.current;
      if (img) {
        img.src = src;
        img.onload = () => setIsLoaded(true);
      }
    }
  }, [isInView, isLoaded, src]);

  return {
    imgRef,
    isLoaded,
    isInView
  };
};

// Hook para gestos touch
export const useNGXTouch = () => {
  const [touchState, setTouchState] = useState({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0
    }));
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchState.isActive) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: touch.clientX - prev.startX,
      deltaY: touch.clientY - prev.startY
    }));
  }, [touchState.isActive]);

  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  return {
    touchState,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};

// Hook para optimización de memoria
export const useNGXMemory = () => {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  const cleanupCallbacks = useRef<(() => void)[]>([]);

  const registerCleanup = useCallback((cleanup: () => void) => {
    cleanupCallbacks.current.push(cleanup);
  }, []);

  const runCleanup = useCallback(() => {
    cleanupCallbacks.current.forEach(cleanup => cleanup());
    cleanupCallbacks.current = [];
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }, []);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });

        // Auto cleanup if memory usage is high
        if ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) > 0.8) {
          console.log('NGX: High memory usage detected, running cleanup');
          runCleanup();
        }
      }
    };

    const interval = setInterval(updateMemoryUsage, 30000); // Check every 30 seconds
    updateMemoryUsage(); // Initial check

    return () => clearInterval(interval);
  }, [runCleanup]);

  return {
    memoryUsage,
    registerCleanup,
    runCleanup
  };
};

export default useNGXOptimization;