// src/components/features/MarketHeatmap/MarketHeatmap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useSWR from 'swr';
import styles from './MarketHeatmap.module.css';

// Interface estendida para suportar propriedades extras
interface StockData {
  symbol: string;
  name: string;
  sector: string;
  marketCap: number;
  changePercent: number;
}

// Interface para o nodo processado pelo Treemap
interface HierarchyData extends d3.HierarchyRectangularNode<any> {
  data: {
    name: string;
    value?: number;
    changePercent?: number;
    children?: any[];
  }
}

export function MarketHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'1D' | '1W' | '1M'>('1D');
  
  // URL dinâmica baseada no filtro (Requisito do PDF)
  const { data, error } = useSWR<StockData[]>(`/api/markets/heatmap?range=${filter}`);

  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    // Limpar SVG
    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll('*').remove();

    // Dimensões responsivas
    const width = containerRef.current.clientWidth || 800;
    const height = 600;

    // 1. Processamento dos dados
    const grouped = d3.group(data, d => d.sector);
    const hierarchyData = {
      name: 'Market',
      children: Array.from(grouped, ([sector, stocks]) => ({
        name: sector,
        children: stocks.map(s => ({
          name: s.symbol,
          value: s.marketCap,
          changePercent: s.changePercent,
          details: s // Guarda dados completos para tooltip
        }))
      }))
    };

    // 2. Setup do Treemap
    const root = d3.hierarchy(hierarchyData)
      .sum(d => (d as any).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3.treemap()
      .size([width, height])
      .paddingInner(1)
      .paddingTop(20) // Espaço para título do setor
      .paddingOuter(1);

    // Casting explícito aqui resolve o erro de 'x0' missing
    treemapLayout(root as unknown as d3.HierarchyNode<unknown>);
    const nodes = root.leaves() as unknown as HierarchyData[];

    // 3. Renderização
    const svg = svgEl
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'var(--font-sans)');

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'var(--color-bg-elevated)')
      .style('border', '1px solid var(--color-border)')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('z-index', '10');

    // Escala de Cores (Usando design tokens se possível, ou hex similar)
    const colorScale = d3.scaleThreshold<number, string>()
      .domain([-3, -1, 0, 1, 3])
      .range(['#991b1b', '#ef4444', '#4b5563', '#4b5563', '#10b981', '#065f46']);

    // Renderizar Células
    const cell = svg.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    cell.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => colorScale(d.data.changePercent || 0))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.data.name}</strong><br/>
            Price: $${(d.data as any).details?.price || '0.00'}<br/>
            Change: ${(d.data.changePercent || 0).toFixed(2)}%
          `);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 100) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        tooltip.style('visibility', 'hidden');
      })
      .on('click', (e, d) => window.location.href = `/markets/${d.data.name}`);

    // Textos
    cell.append('text')
      .selectAll('tspan')
      .data(d => [d.data.name, `${(d.data.changePercent || 0).toFixed(2)}%`])
      .join('tspan')
      .attr('x', 4)
      .attr('y', (d, i) => 15 + i * 14)
      .text(d => d as string)
      .attr('fill', 'white')
      .attr('font-size', '11px')
      .attr('font-weight', (d, i) => i === 0 ? 'bold' : 'normal')
      .style('display', function(d) { 
        // Esconder texto se a célula for muito pequena
        // Lógica simplificada, idealmente checa width do parent
        return 'block'; 
      });

  }, [data]);

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Filtros exigidos pelo PDF */}
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
        <div className={styles.error}>Failed to load market data</div>
      ) : !data ? (
        <div className={styles.loading}>Loading Heatmap...</div>
      ) : (
        <svg ref={svgRef} className={styles.svg} />
      )}
    </div>
  );
}