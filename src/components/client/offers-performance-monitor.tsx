"use client";

import { memo, useEffect, useState } from "react";

interface PerformanceMetrics {
  renderTime: number;
  dataLoadTime: number;
  mediaLoadTime: number;
  totalOffers: number;
  loadedMedia: number;
}

interface OffersPerformanceMonitorProps {
  offersCount: number;
  mediaCount: number;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const OffersPerformanceMonitor = memo(({ 
  offersCount, 
  mediaCount, 
  onMetricsUpdate 
}: OffersPerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    dataLoadTime: 0,
    mediaLoadTime: 0,
    totalOffers: offersCount,
    loadedMedia: 0,
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Measure render time
    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(measureRenderTime);

    // Monitor media loading
    const mediaElements = document.querySelectorAll('img[loading="lazy"]');
    let loadedCount = 0;

    const handleMediaLoad = () => {
      loadedCount++;
      const mediaLoadTime = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        loadedMedia: loadedCount,
        mediaLoadTime,
      }));
    };

    mediaElements.forEach(img => {
      img.addEventListener('load', handleMediaLoad);
    });

    return () => {
      mediaElements.forEach(img => {
        img.removeEventListener('load', handleMediaLoad);
      });
    };
  }, [offersCount, mediaCount]);

  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono z-50">
      <div>Offers: {metrics.totalOffers}</div>
      <div>Media: {metrics.loadedMedia}/{mediaCount}</div>
      <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
      <div>Media: {metrics.mediaLoadTime.toFixed(2)}ms</div>
    </div>
  );
});

OffersPerformanceMonitor.displayName = 'OffersPerformanceMonitor';
