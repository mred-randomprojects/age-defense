import { useState, useCallback } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { TOWERS } from './data/towers';
import { AGES, getNextAge } from './data/ages';
import { sounds } from './utils/audio';
import { formatNumber } from './utils/gameMath';
import {
  Heart, Coins, FlaskConical, Swords, Play, SkipForward,
  ArrowUpCircle, RotateCcw, Volume2, VolumeX,
  Target, Crosshair, Flame, Sparkles, Star, Info
} from 'lucide-react';

const MAPS_LIST = ['verdant_valley', 'twin_canyons', 'chrono_spiral'];
const MAP_META: Record<string, { name: string; desc: string }> = {
  verdant_valley: { name: 'Verdant Valley', desc: 'Winding riverbed with choke points.' },
  twin_canyons: { name: 'Twin Canyons', desc: 'Two paths converging into one gate.' },
  chrono_spiral: { name: 'Chrono Spiral', desc: 'Spiral maze for maximum coverage.' },
};

export default function App() {
  const [selectedMap, setSelectedMap] = useState(MAPS_LIST[0]);
  const [placingTowerId, setPlacingTowerId] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(true);

  const engine = useGameEngine(selectedMap);
  const stateRef = engine.stateRef;

  const getState = useCallback(() => stateRef.current, [stateRef]);

  const toggleMute = useCallback(() => {
    const m = sounds.toggleMute();
    setMuted(m);
  }, []);

  const ui = engine.ui;
  const ageDef = AGES[ui.currentAge];

  const towersForAge = Object.values(TOWERS).filter((t) => t.age === ui.currentAge);
  const selectedTower = ui.selectedTowerId ? ui.towers.find((t) => t.id === ui.selectedTowerId) : null;

  const startGame = (map: string) => {
    setSelectedMap(map);
    setMapPickerOpen(false);
    engine.restart();
  };

  const handleBuild = useCallback((typeId: string) => {
    setPlacingTowerId((prev) => (prev === typeId ? null : typeId));
  }, []);

  const handleCanvasBuild = useCallback((typeId: string, col: number, row: number) => {
    const ok = engine.buildTower(typeId, col, row);
    if (ok) setPlacingTowerId(null);
    return ok;
  }, [engine]);

  if (mapPickerOpen) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-2 text-emerald-400">Age Defense</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">
          An evolutionary tower defense. Advance from the Stone Age to the Cyber Future.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {MAPS_LIST.map((id) => {
            const m = MAP_META[id];
            return (
              <button key={id} onClick={() => startGame(id)} className="bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl p-6 text-left transition">
                <div className="text-lg font-semibold text-emerald-300 mb-1">{m.name}</div>
                <div className="text-sm text-slate-400">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <Heart size={18} /> {ui.lives}/{ui.maxLives}
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Coins size={18} /> {formatNumber(ui.gold)}
          </div>
          <div className="flex items-center gap-1.5 text-sky-400 font-bold">
            <FlaskConical size={18} /> {formatNumber(ui.science)}
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Swords size={18} /> Wave {ui.currentWave}/{ui.totalWaves}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400">Score: <span className="text-white font-mono">{formatNumber(ui.score)}</span></div>
          <div className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: ageDef.themeColor + '33', color: ageDef.accentColor, border: `1px solid ${ageDef.borderColor}44` }}>
            {ageDef.name}
          </div>
          <button onClick={toggleMute} className="p-1.5 rounded hover:bg-slate-800 text-slate-400">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button onClick={() => { engine.restart(); setMapPickerOpen(true); }} className="text-xs text-slate-400 hover:text-white underline">
            Exit
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-slate-950 p-2 overflow-auto">
          <GameCanvas
            getState={getState}
            ui={ui}
            placingTowerId={placingTowerId}
            onSelectTower={(id) => { engine.selectTower(id); setPlacingTowerId(null); }}
            onBuild={handleCanvasBuild}
            onUpdate={engine.update}
          />
        </div>

        {/* Right panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto shrink-0">
          {/* Wave control */}
          <div className="p-3 border-b border-slate-800">
            {ui.gameOver ? (
              <div className="text-center py-2">
                <div className="text-rose-400 font-bold text-lg mb-2">Defeat</div>
                <button onClick={() => engine.restart()} className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Retry
                </button>
              </div>
            ) : ui.won ? (
              <div className="text-center py-2">
                <div className="text-amber-400 font-bold text-lg mb-2">Victory!</div>
                <button onClick={() => engine.restart()} className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Play Again
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { if (!ui.isWaveActive) engine.startNextWave(); }}
                  disabled={ui.isWaveActive}
                  className={`flex-1 py-2 rounded font-semibold flex items-center justify-center gap-2 ${ui.isWaveActive ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                >
                  {ui.isWaveActive ? 'Wave in progress...' : <><Play size={16} /> Start Wave</>}
                </button>
                {ui.isWaveActive && ui.enemiesRemaining === 0 && (
                  <button onClick={() => engine.startNextWave()} className="px-2 rounded bg-amber-600 hover:bg-amber-500 text-white">
                    <SkipForward size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Ability */}
          <div className="p-3 border-b border-slate-800">
            <button
              onClick={() => engine.useAbility()}
              disabled={!ui.abilityReady || ui.gameOver}
              className={`w-full py-2 rounded font-semibold flex items-center justify-center gap-2 relative overflow-hidden ${ui.abilityReady ? 'bg-rose-700 hover:bg-rose-600 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              <Star size={16} />
              {ageDef.abilityName}
              {ui.abilityCooldown > 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs font-mono">
                  {Math.ceil(ui.abilityCooldown)}s
                </div>
              )}
            </button>
            <div className="text-[11px] text-slate-400 mt-1">{ageDef.abilityDescription}</div>
          </div>

          {/* Tower build or tower info */}
          <div className="p-3 border-b border-slate-800 flex-1">
            {selectedTower ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">{TOWERS[selectedTower.typeId]?.name}</div>
                  <button onClick={() => engine.selectTower(null)} className="text-slate-500 hover:text-white text-xs">Close</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center bg-slate-800 rounded p-1.5">
                    <div className="text-[10px] text-slate-400">DMG</div>
                    <div className="text-xs font-mono">Lv.{selectedTower.damageLevel}</div>
                    <button onClick={() => engine.upgradeTower(selectedTower.id, 'damage')} className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white">+</button>
                  </div>
                  <div className="text-center bg-slate-800 rounded p-1.5">
                    <div className="text-[10px] text-slate-400">RNG</div>
                    <div className="text-xs font-mono">Lv.{selectedTower.rangeLevel}</div>
                    <button onClick={() => engine.upgradeTower(selectedTower.id, 'range')} className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white">+</button>
                  </div>
                  <div className="text-center bg-slate-800 rounded p-1.5">
                    <div className="text-[10px] text-slate-400">SPD</div>
                    <div className="text-xs font-mono">Lv.{selectedTower.speedLevel}</div>
                    <button onClick={() => engine.upgradeTower(selectedTower.id, 'speed')} className="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white">+</button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Invested: {formatNumber(selectedTower.totalInvested)} | Kills: {selectedTower.totalKills} | Dmg: {formatNumber(Math.floor(selectedTower.totalDamageDealt))}
                </div>
                <button onClick={() => engine.sellTower(selectedTower.id)} className="w-full py-1.5 rounded bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold">
                  Sell (+{formatNumber(Math.floor(selectedTower.totalInvested * 0.7))} gold)
                </button>
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Build Turrets</div>
                <div className="grid grid-cols-2 gap-2">
                  {towersForAge.map((t) => {
                    const active = placingTowerId === t.id;
                    const affordable = ui.gold >= t.cost;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleBuild(t.id)}
                        disabled={!affordable || ui.gameOver}
                        className={`text-left rounded-lg border p-2 transition ${active ? 'border-emerald-500 bg-emerald-950' : affordable ? 'border-slate-700 hover:border-slate-500 bg-slate-800' : 'border-slate-800 bg-slate-800/50 opacity-50 cursor-not-allowed'}`}
                      >
                        <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                          {t.iconName === 'Target' && <Target size={14} />}
                          {t.iconName === 'Crosshair' && <Crosshair size={14} />}
                          {t.iconName === 'Flame' && <Flame size={14} />}
                          {t.iconName === 'Sparkles' && <Sparkles size={14} />}
                          {t.name}
                        </div>
                        <div className="text-xs text-amber-400 font-mono mt-0.5">{formatNumber(t.cost)} gold</div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-tight">{t.description}</div>
                      </button>
                    );
                  })}
                </div>
                {placingTowerId && (
                  <div className="mt-2 text-xs text-emerald-400 text-center">Click a grass tile to build. Right-click to cancel.</div>
                )}
              </div>
            )}
          </div>

          {/* Tech & Age */}
          <div className="p-3 border-b border-slate-800">
            <button onClick={() => setShowTech(!showTech)} className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white mb-2">
              <Info size={14} /> Tech Tree
            </button>
            {showTech && (
              <div className="space-y-2">
                {ui.techs.map((tech) => {
                  const cost = tech.costScience * (tech.currentRank + 1);
                  const can = tech.currentRank < tech.maxRank && ui.science >= cost;
                  return (
                    <div key={tech.id} className="bg-slate-800 rounded p-2">
                      <div className="text-xs font-semibold text-slate-200">{tech.name} <span className="text-slate-500">({tech.currentRank}/{tech.maxRank})</span></div>
                      <div className="text-[10px] text-slate-400">{tech.description}</div>
                      <button
                        onClick={() => engine.buyTech(tech.id)}
                        disabled={!can}
                        className={`mt-1 text-[10px] px-2 py-1 rounded ${can ? 'bg-sky-700 hover:bg-sky-600 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                      >
                        {tech.currentRank >= tech.maxRank ? 'Maxed' : `Buy (${cost} sci)`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3">
            {ui.canAdvanceAge && (
              <button
                onClick={() => engine.advanceAge()}
                className="w-full py-2 rounded font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-2"
              >
                <ArrowUpCircle size={16} /> Advance Era
                <span className="text-[10px] opacity-80 ml-1">({formatNumber(ui.advanceCostGold)} g / {formatNumber(ui.advanceCostScience)} sci)</span>
              </button>
            )}
            {!ui.canAdvanceAge && getNextAge(ui.currentAge) && (
              <div className="text-xs text-slate-500 text-center">
                Next Era: {AGES[getNextAge(ui.currentAge)!].name} — needs {formatNumber(ui.advanceCostGold)} gold / {formatNumber(ui.advanceCostScience)} science
              </div>
            )}
            {!getNextAge(ui.currentAge) && (
              <div className="text-xs text-amber-400 text-center font-semibold">Final Era Reached</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
