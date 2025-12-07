// src/components/features/MarketHeatmap/MarketHeatmap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useSWR from 'swr';
import styles from './MarketHeatmap.module.css';

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  changePercent: number;
  price: number;
}

interface HierarchyData extends d3.HierarchyRectangularNode<any> {
  data: {
    name: string;
    value?: number;
    changePercent?: number;
    children?: any[];
    details?: any;
  }
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to fetch');
  return r.json();
});

export function MarketHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<any>(null);
  const [filter, setFilter] = useState<'1D' | '1W' | '1M'>('1D');
  
  const { data, error } = useSWR<StockData[]>(
    `/api/markets/heatmap?range=${filter}`, 
    fetcher,
    { 
      refreshInterval: 60000,
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  );

  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0 || !svgRef.current || !containerRef.current) {
      return;
    }

    console.log('🎨 Rendering heatmap with', data.length, 'stocks');

    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll('*').remove();

    const width = containerRef.current.clientWidth || 800;
    const height = 600;

    // Agrupa por setor
    const grouped = d3.group(data, d => d.sector || 'Other');
    
    const hierarchyData = {
      name: 'Market',
      children: Array.from(grouped, ([sector, stocks]) => ({
        name: sector,
        children: stocks.map(s => ({
          name: s.symbol,
          value: s.marketCap || 1000000,
          changePercent: s.changePercent || 0,
          details: s
        }))
      }))
    };

    const root = d3.hierarchy(hierarchyData)
      .sum(d => (d as any).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3.treemap()
      .size([width, height])
      .paddingInner(2)
      .paddingTop(22)
      .paddingOuter(2)
      .round(true);

    treemapLayout(root as unknown as d3.HierarchyNode<unknown>);
    const nodes = root.leaves() as unknown as HierarchyData[];

    const svg = svgEl
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'var(--font-sans)');

    // Tooltip
    if (!tooltipRef.current) {
      tooltipRef.current = d3.select(containerRef.current)
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'var(--color-bg-elevated)')
        .style('border', '1px solid var(--color-border)')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('pointer-events', 'none')
        .style('z-index', '10')
        .style('font-size', '14px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');
    }

    const tooltip = tooltipRef.current;

    // Escala de cores melhorada
    const colorScale = d3.scaleLinear<string>()
      .domain([-5, -2, -0.5, 0, 0.5, 2, 5])
      .range([
        '#7f1d1d',
        '#dc2626',
        '#ef4444',
        '#6b7280',
        '#22c55e',
        '#16a34a',
        '#14532d'
      ])
      .clamp(true);

    const cell = svg.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cell.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => colorScale(d.data.changePercent || 0))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('transition', 'opacity 0.2s')
      .on('mouseover', function(event: any, d: any) {
        d3.select(this).attr('opacity', 0.8);
        
        const details = d.data.details || {};
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="font-weight: bold; margin-bottom: 4px; color: var(--color-text-primary);">
              ${d.data.name}
            </div>
            <div style="color: var(--color-text-secondary); font-size: 12px; margin-bottom: 8px;">
              ${details.sector || 'Unknown'}
            </div>
            <div style="color: var(--color-text-primary);">
              Price: <strong>$${(details.price || 0).toFixed(2)}</strong>
            </div>
            <div style="color: ${d.data.changePercent >= 0 ? '#22c55e' : '#ef4444'}; font-weight: 600;">
              ${d.data.changePercent >= 0 ? '+' : ''}${(d.data.changePercent || 0).toFixed(2)}%
            </div>
          `);
      })
      .on('mousemove', function(event: any) {
        tooltip
          .style('top', (event.pageY - 100) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        tooltip.style('visibility', 'hidden');
      })
      .on('click', (e: any, d: any) => {
        window.location.href = `/dashboard/markets/${d.data.name}`;
      });

    // Labels
    cell.each(function(d: any) {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      
      if (width > 50 && height > 30) {
        const g = d3.select(this);
        
        g.append('text')
          .attr('x', 4)
          .attr('y', 16)
          .text(d.data.name)
          .attr('fill', 'white')
          .attr('font-size', width > 100 ? '13px' : '11px')
          .attr('font-weight', 'bold')
          .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');
        
        if (height > 45) {
          g.append('text')
            .attr('x', 4)
            .attr('y', 32)
            .text(`${d.data.changePercent >= 0 ? '+' : ''}${(d.data.changePercent || 0).toFixed(2)}%`)
            .attr('fill', 'white')
            .attr('font-size', '11px')
            .attr('font-weight', 'normal')
            .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');
        }
      }
    });

  }, [data]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          {(['1D', '1W', '1M'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`${styles.filterBtn} ${filter === t ? styles.active : ''}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      {error ? (
        <div className={styles.error}>
          <span style={{ fontSize: '48px' }}>⚠️</span>
          <div>Failed to load market data</div>
        </div>
      ) : !data ? (
        <div className={styles.loading}>Loading Heatmap...</div>
      ) : (
        <svg ref={svgRef} className={styles.svg} />
      )}
    </div>
  );
}