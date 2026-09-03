import React, { useRef, useEffect, useCallback } from 'react';
import { UIState } from '../hooks/useGameEngine';
import { TILE_SIZE } from '../utils/gameMath';
import { TOWERS } from '../data/towers';
import { EnemyInstance, TowerInstance } from '../types/game';

interface Props {
  getState: () => { enemies: EnemyInstance[]; towers: TowerInstance[]; projectiles: unknown[]; particles: unknown[]; floatingTexts: unknown[]; map: { cols: number; rows: number; tiles: string[][] } } | null;
  ui: UIState;
  placingTowerId: string | null;
  onSelectTower: (id: string | null) => void;
  onBuild: (typeId: string, col: number, row: number) => boolean;
  onUpdate: (dt: number) => void;
}

export const GameCanvas: React.FC<Props> = ({ getState, ui, placingTowerId, onSelectTower, onBuild, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ col: -1, row: -1 });

  const cols = 18;
  const rows = 11;
  const W = cols * TILE_SIZE;
  const H = rows * TILE_SIZE;

  const getTileColor = useCallback((type: string, age: string) => {
    switch (type) {
      case 'grass':
        if (age === 'stone') return '#3f6212';
        if (age === 'medieval') return '#14532d';
        if (age === 'modern') return '#0f172a';
        return '#1e1b4b';
      case 'path':
        if (age === 'stone') return '#a16207';
        if (age === 'medieval') return '#92400e';
        if (age === 'modern') return '#334155';
        return '#312e81';
      case 'water': return '#0369a1';
      case 'rock':
        if (age === 'stone') return '#57534e';
        if (age === 'medieval') return '#475569';
        if (age === 'modern') return '#64748b';
        return '#4c1d95';
      case 'spawner': return '#dc2626';
      case 'base': return '#16a34a';
      default: return '#1a1a1a';
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      onUpdate(dt);

      const s = getState();
      if (!s) { raf = requestAnimationFrame(loop); return; }

      const age = ui.currentAge;

      ctx.clearRect(0, 0, W, H);

      // Tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tile = s.map.tiles[r]?.[c] ?? 'grass';
          ctx.fillStyle = getTileColor(tile, age);
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }

      // Hover
      const { col: hCol, row: hRow } = mouseRef.current;
      if (placingTowerId && hCol >= 0 && hRow >= 0) {
        const def = TOWERS[placingTowerId];
        const can = def && s.map.tiles[hRow]?.[hCol] === 'grass' && !s.towers.find((t) => t.col === hCol && t.row === hRow);
        ctx.fillStyle = can ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';
        ctx.fillRect(hCol * TILE_SIZE, hRow * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        if (can && def) {
          ctx.strokeStyle = 'rgba(34,197,94,0.6)';
          ctx.beginPath();
          ctx.arc(hCol * TILE_SIZE + TILE_SIZE / 2, hRow * TILE_SIZE + TILE_SIZE / 2, def.baseRange, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Selected tower range
      if (ui.selectedTowerId) {
        const st = s.towers.find((t) => t.id === ui.selectedTowerId);
        if (st) {
          const def = TOWERS[st.typeId];
          if (def) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(st.x, st.y, def.baseRange * (1 + 0.25 * st.rangeLevel), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // Towers
      for (const t of s.towers) {
        const def = TOWERS[t.typeId];
        if (!def) continue;
        const cx = t.x; const cy = t.y; const sz = TILE_SIZE * 0.7;
        ctx.fillStyle = def.color;
        ctx.strokeStyle = def.accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        // Level dots
        ctx.fillStyle = '#fff';
        for (let i = 0; i < Math.min(t.level, 5); i++) {
          ctx.beginPath();
          ctx.arc(cx - 10 + i * 5, cy + sz / 2 - 4, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Barrel
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t.angle);
        ctx.fillStyle = def.accentColor;
        ctx.fillRect(0, -2, sz * 0.55, 4);
        ctx.restore();
        // Selection
        if (ui.selectedTowerId === t.id) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, sz / 2 + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Enemies
      for (const e of s.enemies) {
        const hp = e.currentHealth / e.maxHealth;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = e.color;
        ctx.strokeStyle = e.outlineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (e.shape === 'circle') ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        else if (e.shape === 'square') ctx.rect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
        else if (e.shape === 'triangle') {
          ctx.moveTo(0, -e.radius); ctx.lineTo(e.radius, e.radius); ctx.lineTo(-e.radius, e.radius); ctx.closePath();
        } else if (e.shape === 'rhombus') {
          ctx.moveTo(0, -e.radius); ctx.lineTo(e.radius, 0); ctx.lineTo(0, e.radius); ctx.lineTo(-e.radius, 0); ctx.closePath();
        } else if (e.shape === 'star') {
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? e.radius : e.radius * 0.5;
            const a = (Math.PI * i) / 5 - Math.PI / 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
        }
        ctx.fill(); ctx.stroke();
        if (e.isBoss) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(-6, -e.radius - 6); ctx.lineTo(-3, -e.radius - 12);
          ctx.lineTo(0, -e.radius - 8); ctx.lineTo(3, -e.radius - 12);
          ctx.lineTo(6, -e.radius - 6); ctx.closePath(); ctx.fill();
        }
        // HP bar
        const bw = e.radius * 2.2;
        ctx.fillStyle = '#333';
        ctx.fillRect(-bw / 2, -e.radius - 10, bw, 4);
        ctx.fillStyle = hp > 0.5 ? '#22c55e' : hp > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(-bw / 2, -e.radius - 10, bw * hp, 4);
        ctx.restore();
      }

      // Projectiles
      for (const p of (s as { projectiles: { x: number; y: number; color: string; radius: number; splashRadius: number }[] }).projectiles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        if (p.splashRadius > 0) {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.splashRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // Particles
      for (const pt of (s as { particles: { x: number; y: number; color: string; size: number; life: number; shape: string }[] }).particles) {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Floating texts
      for (const ft of (s as { floatingTexts: { x: number; y: number; text: string; color: string; life: number; isCritical?: boolean }[] }).floatingTexts) {
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.font = (ft.isCritical ? 'bold 16px' : '14px') + ' ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getState, onUpdate, ui, placingTowerId, getTileColor]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    mouseRef.current = { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE) };
  }, [W, H]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);

    if (placingTowerId) {
      onBuild(placingTowerId, c, r);
      return;
    }
    const s = getState();
    if (!s) return;
    const clicked = s.towers.find((t) => Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) < TILE_SIZE / 2);
    onSelectTower(clicked ? clicked.id : null);
  }, [W, H, placingTowerId, onBuild, onSelectTower, getState]);

  const handleCtx = useCallback((e: React.MouseEvent) => { e.preventDefault(); onSelectTower(null); }, [onSelectTower]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onContextMenu={handleCtx}
      style={{ width: '100%', height: 'auto', maxWidth: W, imageRendering: 'auto' }}
      className="rounded-lg border border-slate-800 shadow-2xl"
    />
  );
};
