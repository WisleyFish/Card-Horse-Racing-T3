
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameConfig, GameState, Horse, GameStatus, PendingTurn } from './types';
import { HORSE_NAMES, COMMENTARY_TEMPLATES, FINISH_COMMENTARY, HORSE_COLOR_CONFIGS, HorseColorConfig } from './constants';
import { HorseIcon } from './components/HorseIcon';

interface DustParticle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  size: number;
}

const App: React.FC = () => {
  const [config, setConfig] = useState<GameConfig>({
    horseCount: 6,
    trackLength: 15,
    cardsPerHorse: 20,
    drawCount: 1,
    mode: 'tournament',
    totalRounds: 3,
  });

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [commentary, setCommentary] = useState<string>("等待馬匹入場...");
  const [autoDraw, setAutoDraw] = useState(false);
  const [autoInterval, setAutoInterval] = useState(2);
  const [dust, setDust] = useState<DustParticle[]>([]);
  const autoTimerRef = useRef<number | null>(null);

  // Responsive sizing logic
  const totalLanes = gameState ? gameState.horses.length + 1 : config.horseCount + 1;
  const viewportHeightFactor = typeof window !== 'undefined' ? window.innerHeight / 900 : 1;
  const horseSize = gameState ? Math.max(24, Math.min(55, (450 / totalLanes) * 0.9 * viewportHeightFactor)) : 48;
  const fontSize = gameState ? Math.max(10, Math.min(18, (450 / totalLanes) * 0.4)) : 16;

  useEffect(() => {
    const min = config.trackLength;
    const max = config.trackLength * 2;
    if (config.cardsPerHorse < min || config.cardsPerHorse > max) {
      setConfig(prev => ({
        ...prev,
        cardsPerHorse: Math.max(min, Math.min(max, prev.cardsPerHorse))
      }));
    }
  }, [config.trackLength]);

  const spawnDust = useCallback((x: number, y: number) => {
    const newDust: DustParticle[] = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + Math.random(),
      x: x + (Math.random() - 0.5) * 5,
      y: y + (Math.random() - 0.5) * 5,
      opacity: 0.6,
      size: 4 + Math.random() * 6,
    }));
    setDust(prev => [...prev, ...newDust]);
    setTimeout(() => {
      setDust(prev => prev.filter(p => !newDust.find(nd => nd.id === p.id)));
    }, 800);
  }, []);

  const generateLocalCommentary = (drawnIds: number[], horses: Horse[], finishers: number[], trackLength: number, isRoundEnd: boolean = false) => {
    if (isRoundEnd && finishers.length >= 1) {
      const podium = finishers.slice(0, 3).map(id => horses.find(h => h.id === id)?.name || "???");
      if (podium.length === 3) return `精彩的比賽！前三名揭曉：${podium[0]}、${podium[1]}、${podium[2]}！恭喜獲勝者！`;
      if (podium.length === 2) return `比賽結束！冠亞軍為 ${podium[0]} 與 ${podium[1]}！`;
      return `恭喜 ${podium[0]} 奪得冠軍！`;
    }
    if (drawnIds.length === 0) return "比賽正在進行中...";
    const recentlyFinished = horses.filter(h => h.position >= trackLength && !finishers.includes(h.id));
    if (recentlyFinished.length > 0) {
      const h = recentlyFinished[0];
      return FINISH_COMMENTARY[Math.floor(Math.random() * FINISH_COMMENTARY.length)].replace("{name}", h.name);
    }
    const primaryId = drawnIds[0];
    const horse = horses.find(h => h.id === primaryId);
    if (!horse) return "賽場上一陣騷動！";
    const template = COMMENTARY_TEMPLATES[Math.floor(Math.random() * COMMENTARY_TEMPLATES.length)];
    return template.replace("{name}", horse.name);
  };

  const prepareNextTurn = (currentState: GameState) => {
    const minFinishersNeeded = Math.min(3, currentState.horses.length);
    if (currentState.deck.length === 0 || currentState.finishers.length >= minFinishersNeeded) return;
    const tempDeck = [...currentState.deck];
    const drawnIds: number[] = [];
    for (let i = 0; i < currentState.config.drawCount; i++) {
      const id = tempDeck.pop();
      if (id !== undefined) drawnIds.push(id);
    }
    const nextCommentary = generateLocalCommentary(drawnIds, currentState.horses, currentState.finishers, currentState.config.trackLength);
    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, pendingTurn: { drawnIds, commentary: nextCommentary } };
    });
  };

  const startRound = (roundNum: number, existingHorses?: Horse[]) => {
    const horses: Horse[] = existingHorses ? existingHorses.map(h => ({
      ...h,
      position: 0,
      drawnCards: [],
      finishRank: undefined,
    })) : Array.from({ length: config.horseCount }, (_, i) => {
      const name = HORSE_NAMES[i % HORSE_NAMES.length];
      return {
        id: i,
        name,
        color: HORSE_COLOR_CONFIGS[name].body,
        position: 0,
        drawnCards: [],
        tournamentPoints: 0,
      };
    });
    const deck: number[] = [];
    horses.forEach((horse) => {
      for (let j = 0; j < config.cardsPerHorse; j++) deck.push(horse.id);
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const newState: GameState = {
      config,
      horses,
      deck,
      currentTurn: 0,
      currentRound: roundNum,
      status: 'playing',
      finishers: [],
      lastDrawn: [],
      pendingTurn: null,
    };
    setGameState(newState);
    setCommentary(`第 ${roundNum} 輪比賽開始！馬匹就位...`);
    prepareNextTurn(newState);
  };

  const drawCards = useCallback(() => {
    setGameState(prev => {
      if (!prev || !prev.pendingTurn || prev.status !== 'playing') return prev;
      const { drawnIds, commentary: nextCommentary } = prev.pendingTurn;
      const newDeck = [...prev.deck];
      for (let i = 0; i < drawnIds.length; i++) newDeck.pop();
      const newFinishers = [...prev.finishers];
      const updatedHorses = prev.horses.map((horse, idx) => {
        if (horse.finishRank) return horse;
        const moves = drawnIds.filter(id => id === horse.id).length;
        if (moves === 0) return horse;
        const oldPos = horse.position;
        const newPos = Math.min(oldPos + moves, prev.config.trackLength);
        if (newPos !== oldPos) {
          const laneH = 100 / (prev.horses.length + 1);
          const yPercent = ((idx + 1) * laneH) + (laneH / 2);
          const xPercent = (newPos / prev.config.trackLength) * 100;
          spawnDust(xPercent, yPercent);
        }
        let rank = horse.finishRank;
        if (newPos >= prev.config.trackLength && !rank) {
          if (newFinishers.length < 3) {
            newFinishers.push(horse.id);
            rank = newFinishers.length;
          }
        }
        return { ...horse, position: newPos, finishRank: rank, drawnCards: [...horse.drawnCards, ...Array(moves).fill(horse.id)] };
      });
      const minFinishersNeeded = Math.min(3, prev.horses.length);
      let nextStatus: GameStatus = 'playing';
      let finalCommentary = nextCommentary;
      if (newFinishers.length >= minFinishersNeeded || newDeck.length === 0) {
        nextStatus = 'round_finished';
        setAutoDraw(false);
        finalCommentary = generateLocalCommentary([], updatedHorses, newFinishers, prev.config.trackLength, true);
      }
      setCommentary(finalCommentary);
      const nextState: GameState = {
        ...prev,
        deck: newDeck,
        horses: updatedHorses,
        finishers: newFinishers,
        lastDrawn: drawnIds,
        currentTurn: prev.currentTurn + 1,
        status: nextStatus,
        pendingTurn: null,
      };
      if (nextStatus === 'round_finished') {
        const pointsMap: Record<number, number> = { 1: 10, 2: 5, 3: 2 };
        nextState.horses = nextState.horses.map(h => ({
          ...h,
          tournamentPoints: h.tournamentPoints + (h.finishRank ? pointsMap[h.finishRank] || 0 : 0)
        }));
        if (prev.config.mode === 'tournament' && prev.currentRound === prev.config.totalRounds) {
          nextState.status = 'tournament_finished';
        }
      } else {
        prepareNextTurn(nextState);
      }
      return nextState;
    });
  }, [spawnDust]);

  useEffect(() => {
    if (autoDraw && gameState?.status === 'playing' && gameState.pendingTurn) {
      autoTimerRef.current = window.setTimeout(() => {
        drawCards();
      }, autoInterval * 1000);
    }
    return () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current); };
  }, [autoDraw, gameState?.status, gameState?.pendingTurn, autoInterval, drawCards]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg">
          <h1 className="text-3xl font-racing text-center mb-6 text-emerald-600">紙牌賽馬 錦標賽</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500">模式</label>
                <div className="flex gap-1">
                  {(['single', 'tournament'] as const).map(m => (
                    <button key={m} onClick={() => setConfig({...config, mode: m})}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${config.mode === m ? 'bg-emerald-500 text-white font-bold border-emerald-500 shadow-sm' : 'border-slate-300 text-slate-400 hover:bg-slate-50'}`}>
                      {m === 'single' ? '單場' : '錦標賽'}
                    </button>
                  ))}
                </div>
              </div>
              {config.mode === 'tournament' && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-500">總輪數: {config.totalRounds}</label>
                  <input type="range" min="2" max="10" value={config.totalRounds} onChange={(e) => setConfig({...config, totalRounds: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500">馬匹數量: {config.horseCount}</label>
                <input type="range" min="2" max="10" value={config.horseCount} onChange={(e) => setConfig({...config, horseCount: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500">賽道長度: {config.trackLength}</label>
                <input type="range" min="5" max="30" value={config.trackLength} onChange={(e) => setConfig({...config, trackLength: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500">每匹馬牌數: {config.cardsPerHorse}</label>
                <input type="range" min={config.trackLength} max={config.trackLength * 2} value={config.cardsPerHorse} onChange={(e) => setConfig({...config, cardsPerHorse: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500">單次抽牌: {config.drawCount}</label>
                <input type="range" min="1" max="5" value={config.drawCount} onChange={(e) => setConfig({...config, drawCount: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
            </div>
          </div>
          <button onClick={() => startRound(1)} className="w-full mt-8 py-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all hover:bg-emerald-700">開始比賽</button>
        </div>
      </div>
    );
  }

  const lanePercentageHeight = 100 / (gameState.horses.length + 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-2 md:p-3 overflow-hidden text-slate-800">
      <style>
        {`
          @keyframes fadeOutUp {
            from { opacity: 0.6; transform: scale(1) translateY(0); }
            to { opacity: 0; transform: scale(0.5) translateY(-20px); }
          }
          .dust-particle {
            animation: fadeOutUp 0.8s forwards ease-out;
            pointer-events: none;
          }
        `}
      </style>
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <button onClick={() => setGameState(null)} className="px-3 py-1 bg-white text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 shadow-sm hover:bg-slate-100">回設定</button>
          <div className="text-emerald-700 text-[11px] font-black uppercase bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
            {config.mode === 'tournament' ? `第 ${gameState.currentRound}/${config.totalRounds} 輪` : '單場賽事'}
          </div>
          <div className="flex gap-1 ml-2">
            {gameState.lastDrawn.map((id, i) => {
              const horse = gameState.horses.find(h => h.id === id);
              if (!horse) return null;
              return (
                <div key={i} className="w-7 h-9 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center animate-in zoom-in duration-200 shadow-sm" style={{ borderColor: HORSE_COLOR_CONFIGS[horse.name].body }}>
                  <HorseIcon config={HORSE_COLOR_CONFIGS[horse.name]} name={horse.name} size={18} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-[11px] text-slate-600 font-black bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm font-mono whitespace-pre">
          剩餘牌卡:{gameState.deck.length.toString().padStart(3, ' ')}
        </div>
      </div>

      <div className="w-full bg-white mb-2 p-1.5 rounded-2xl border border-slate-200 text-center shadow-sm h-14 flex items-center justify-center overflow-hidden">
        <span className="text-emerald-600 font-bold text-sm md:text-base italic leading-tight px-4 drop-shadow-sm">
          "{commentary}"
        </span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 relative overflow-hidden flex flex-col shadow-lg">
          <div className="flex-1 relative flex">
            {/* Lane Names Panel */}
            <div className="w-28 flex flex-col relative z-20 border-r border-slate-200 bg-slate-50/20">
              <div style={{ height: `${lanePercentageHeight}%` }} className="flex items-center justify-start border-b border-slate-200 px-1 bg-amber-50/30">
                <span className="font-black text-amber-600 uppercase text-[10px] tracking-tighter">Referee</span>
              </div>
              {gameState.horses.map((h) => (
                <div key={h.id} style={{ height: `${lanePercentageHeight}%` }} className="flex items-center justify-start border-b border-slate-100 last:border-b-0 px-1">
                  <span className="font-black text-slate-700 whitespace-nowrap text-left w-full" style={{ fontSize: `${fontSize}px` }}>
                    {h.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Track Surface */}
            <div className="flex-1 relative overflow-hidden bg-emerald-50">
              <div className="absolute inset-0 flex" style={{ paddingRight: '2.2rem' }}>
                <div className="flex-1 relative">
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {dust.map(p => (
                      <div key={p.id} className="dust-particle absolute rounded-full bg-orange-200/40"
                        style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, marginTop: `-${p.size/2}px`, marginLeft: `-${p.size/2}px` }}
                      />
                    ))}
                  </div>

                  <div className="absolute inset-0 flex">
                    {Array.from({ length: config.trackLength }).map((_, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: i % 2 === 0 ? '#CCFFCC' : '#A3FFA3' }} />
                    ))}
                  </div>

                  {/* Flag on Right */}
                  <div className="absolute z-30 flex items-center justify-center" 
                    style={{ 
                      top: `${lanePercentageHeight / 2}%`, 
                      right: '0%', 
                      height: `${lanePercentageHeight}%`,
                      width: '40px',
                      transform: 'translateY(-50%)' 
                    }}>
                    <div className="text-3xl">🚩</div>
                  </div>

                  {Array.from({ length: config.trackLength + 1 }).map((_, i) => {
                    const leftPercent = (i / config.trackLength) * 100;
                    return (
                      <div key={i} className={`absolute top-0 bottom-0 border-l ${i === config.trackLength ? 'border-red-500 border-2 z-10' : 'border-black/5'}`} style={{ left: `${leftPercent}%` }}>
                        {i === 0 && <span className="absolute -top-4 left-0 text-[9px] text-slate-400 font-black">START</span>}
                        {i === config.trackLength && <span className="absolute -top-4 right-0 text-[9px] text-red-600 font-black">FINISH</span>}
                      </div>
                    );
                  })}
                  
                  <div className="absolute top-0 bottom-0 z-40 flex flex-col pointer-events-none" style={{ left: `${(0.5 / config.trackLength) * 100}%`, transform: 'translateX(-50%)' }}>
                    <div style={{ height: `${lanePercentageHeight}%` }} />
                    {gameState.horses.map((h) => (
                      <div key={h.id} style={{ height: `${lanePercentageHeight}%` }} className="flex items-center justify-center">
                        {h.finishRank && (
                          <div className={`rounded-full flex items-center justify-center font-black text-white shadow-lg border-2 border-white animate-in zoom-in duration-300
                            ${h.finishRank === 1 ? 'bg-yellow-400 scale-150' : h.finishRank === 2 ? 'bg-slate-300 scale-125' : 'bg-orange-400'}`}
                            style={{ width: `${Math.max(26, horseSize * 0.7)}px`, height: `${Math.max(26, horseSize * 0.7)}px`, fontSize: `${Math.max(12, fontSize)}px` }}>
                            {h.finishRank}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {Array.from({ length: gameState.horses.length + 1 }).map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 border-b border-black/5" style={{ top: `${((i + 1) / (gameState.horses.length + 1)) * 100}%` }}></div>
                  ))}

                  {gameState.horses.map((horse, idx) => {
                    const laneH = 100 / (gameState.horses.length + 1);
                    const topPos = ((idx + 1) * laneH) + (laneH / 2);
                    const leftPos = (horse.position / config.trackLength) * 100;
                    return (
                      <div key={horse.id} className="absolute transition-all duration-700 ease-out z-30"
                        style={{ top: `${topPos}%`, left: `${leftPos}%`, transform: 'translate(-50%, -50%)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}>
                        <div className="animate-bounce" style={{ animationDuration: `${0.8 + (horse.id * 0.04)}s` }}>
                          <HorseIcon config={HORSE_COLOR_CONFIGS[horse.name]} name={horse.name} size={horseSize} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {config.mode === 'tournament' && (
          <div className="w-full lg:w-48 bg-white p-3 rounded-3xl border border-slate-200 flex flex-col shadow-lg">
            <h3 className="text-xs font-black text-slate-500 uppercase pb-2 border-b border-slate-100 mb-2 text-center">🏆 錦標賽積分榜</h3>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="text-[10px] text-slate-400">
                    <th className="py-1 px-1 border-b border-slate-50 font-bold">#</th>
                    <th className="py-1 px-1 border-b border-slate-50 font-bold">馬名</th>
                    <th className="py-1 px-1 border-b border-slate-50 text-right font-bold">分</th>
                  </tr>
                </thead>
                <tbody>
                  {[...gameState.horses].sort((a, b) => b.tournamentPoints - a.tournamentPoints).map((h, i) => (
                    <tr key={h.id} className="text-[11px] hover:bg-emerald-50 transition-colors">
                      <td className="py-2 px-1 border-b border-slate-50 text-slate-400">{i + 1}</td>
                      <td className="py-2 px-1 border-b border-slate-50 text-slate-700 font-black">{h.name}</td>
                      <td className="py-2 px-1 border-b border-slate-50 text-right text-emerald-600 font-black">{h.tournamentPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 bg-white p-3 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase mb-1">抽牌間隔: {autoInterval}秒</span>
            <input type="range" min="0.5" max="5" step="0.5" value={autoInterval} onChange={(e) => setAutoInterval(parseFloat(e.target.value))} className="w-24 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          <button onClick={() => setAutoDraw(!autoDraw)} className={`px-5 py-2 rounded-xl font-black text-xs shadow-sm transition-all active:scale-95 ${autoDraw ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {autoDraw ? '⏹️ 停止' : '▶️ 自動抽牌'}
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          {gameState.status === 'playing' ? (
            <button disabled={!gameState.pendingTurn} onClick={drawCards}
              className={`px-12 py-3 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 border-b-4 ${!gameState.pendingTurn ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-wait' : 'bg-emerald-500 text-white border-emerald-700 hover:bg-emerald-400 hover:-translate-y-0.5'}`}>
              抽牌 <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>🏃</span>
            </button>
          ) : (
            <div className="flex gap-3">
              {(gameState.status === 'round_finished' || gameState.status === 'tournament_finished') && (
                <>
                  {gameState.status !== 'tournament_finished' && (
                    <button onClick={() => startRound(gameState.currentRound + 1, gameState.horses)} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-emerald-500">下一輪</button>
                  )}
                  <button onClick={() => setGameState(null)} className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-black text-sm shadow-lg hover:bg-slate-700">回設定</button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="w-24 hidden md:block"></div>
      </div>
    </div>
  );
};

export default App;
