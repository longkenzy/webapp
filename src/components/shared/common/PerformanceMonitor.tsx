"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  lastUpdate: string;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    lastUpdate: new Date().toISOString(),
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const startTime = performance.now();
      
      // Get memory usage if available
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;
      
      // Count React components (approximate)
      const componentCount = document.querySelectorAll('[data-reactroot]').length;
      
      const endTime = performance.now();
      const renderTime = Math.round(endTime - startTime);

      setMetrics({
        renderTime,
        memoryUsage,
        componentCount,
        lastUpdate: new Date().toISOString(),
      });
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Performance Monitor</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="space-y-1">
        <div>Render: {metrics.renderTime}ms</div>
        <div>Memory: {metrics.memoryUsage}MB</div>
        <div>Components: {metrics.componentCount}</div>
        <div className="text-gray-400">
          {new Date(metrics.lastUpdate).toLocaleTimeString()}
        </div>
      </div>
      <div className="mt-2 text-gray-400 text-xs">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}
