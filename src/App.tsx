/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  RefreshCw, Trophy, Skull, Activity, Zap, Brain, Map as MapIcon,
  Info, Settings, AlertTriangle, Sparkles
} from 'lucide-react';
import { Grid, Position, GameState, TileType, Cell, PlayerStats, AIState } from './types';
import { GRID_SIZE, generateMaze, getNextPosition, canMoveTo, calculateClassification } from './gameUtils';

const INITIAL_STATS: PlayerStats = {
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  totalMoves: 0,
  level: 1,
};

const INITIAL_AI: AIState = {
  directionFrequency: { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 },
  classification: 'NEUTRAL',
  predictionScore: 0,
  adaptationLevel: 0,
  recentMoves: [],
};

const INITIAL_STATE: GameState = {
  grid: [],
  playerPosition: { x: 0, y: 0 },
  stats: INITIAL_STATS,
  aiState: INITIAL_AI,
  status: 'MENU',
  turnCount: 0,
  message: 'Welcome to the Mind Maze Arena',
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  const startGame = useCallback(() => {
    setGameState({
      ...INITIAL_STATE,
      grid: generateMaze(1),
      status: 'PLAYING',
    });
  }, []);

  const movePlayer = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    setGameState(prev => {
      if (prev.status !== 'PLAYING') return prev;

      const nextPos = getNextPosition(prev.playerPosition, direction);
      if (!canMoveTo(prev.grid, nextPos)) {
        return { ...prev, message: "Blocked by a wall!" };
      }

      const targetTile = prev.grid[nextPos.y][nextPos.x];
      let nextStatus = prev.status;
      let nextStats = { ...prev.stats, totalMoves: prev.stats.totalMoves + 1 };
      let message = prev.message;

      // Handle Tile Effects
      if (targetTile.type === 'EXIT') {
        const nextLevel = prev.stats.level + 1;
        return {
          ...prev,
          status: nextLevel > 5 ? 'WON' : 'PLAYING',
          grid: generateMaze(nextLevel),
          playerPosition: { x: 0, y: 0 },
          stats: { ...nextStats, level: nextLevel },
          message: nextLevel > 5 ? "You've conquered the Mind Maze!" : `Level ${nextLevel} reached!`,
          turnCount: 0, // Reset turns for new level? Or keep total? Let's keep total for stats but reset for AI difficulty resets.
        };
      } else if (targetTile.type === 'TRAP') {
        nextStats.health -= 20;
        message = "Ouch! You hit a trap!";
        if (nextStats.health <= 0) {
          nextStatus = 'LOST';
          message = "The maze consumed your essence.";
        }
      } else if (targetTile.type === 'TELEPORT') {
        // Simple teleport logic
        nextPos.x = Math.floor(Math.random() * GRID_SIZE);
        nextPos.y = Math.floor(Math.random() * GRID_SIZE);
        message = "Space shifted! You've been relocated.";
      }

      // Update AI State
      const newHistory = [...prev.aiState.recentMoves, { direction, x: nextPos.x, y: nextPos.y, timestamp: Date.now() }].slice(-10);
      const newFreq = { ...prev.aiState.directionFrequency };
      newFreq[direction]++;
      
      const newClassification = calculateClassification(newHistory);
      
      const newAiState: AIState = {
        ...prev.aiState,
        recentMoves: newHistory,
        directionFrequency: newFreq,
        classification: newClassification,
      };

      // Check if trapped (all neighbors are walls)
      const neighbors = [
        getNextPosition(nextPos, 'UP'),
        getNextPosition(nextPos, 'DOWN'),
        getNextPosition(nextPos, 'LEFT'),
        getNextPosition(nextPos, 'RIGHT'),
      ];
      const isTrapped = neighbors.every(n => {
          // Check bounds
          if (n.x < 0 || n.x >= GRID_SIZE || n.y < 0 || n.y >= GRID_SIZE) return true;
          return prev.grid[n.y][n.x].type === 'WALL';
      });

      if (isTrapped && targetTile.type !== 'EXIT') {
          nextStatus = 'LOST';
          message = "No way out. You are trapped.";
      }

      const nextTurnCount = prev.turnCount + 1;
      let nextGrid = prev.grid;

      // Environment Update: Illusion tiles disappear (revert to WALL) every 4 turns
      if (nextTurnCount % 4 === 0 && nextStatus === 'PLAYING') {
          nextGrid = nextGrid.map(row => row.map(cell => {
              if (cell.type === 'ILLUSION') {
                  return { ...cell, type: 'WALL' };
              }
              return cell;
          }));
          message = "The reality shifts... illusion paths have vanished!";
      }

      // AI Modification Phase (every 3 turns)
      if (nextTurnCount % 3 === 0 && nextStatus === 'PLAYING') {
          nextGrid = [...prev.grid.map(row => [...row])];
          
          // AI logic: Based on classification
          if (newClassification === 'AGGRESSIVE') {
              // Place traps near predicted path (for now just randomly spawn traps)
              const rx = Math.floor(Math.random() * GRID_SIZE);
              const ry = Math.floor(Math.random() * GRID_SIZE);
              if (nextGrid[ry][rx].type === 'EMPTY' && (rx !== nextPos.x || ry !== nextPos.y)) {
                  nextGrid[ry][rx] = { ...nextGrid[ry][rx], type: 'TRAP' };
              }
          } else if (newClassification === 'DEFENSIVE') {
              // Close paths
              const rx = Math.floor(Math.random() * GRID_SIZE);
              const ry = Math.floor(Math.random() * GRID_SIZE);
              if (nextGrid[ry][rx].type === 'EMPTY' && (rx !== nextPos.x || ry !== nextPos.y)) {
                  nextGrid[ry][rx] = { ...nextGrid[ry][rx], type: 'WALL' };
              }
          } else {
              // Randomize some tiles
              const rx = Math.floor(Math.random() * GRID_SIZE);
              const ry = Math.floor(Math.random() * GRID_SIZE);
              if (nextGrid[ry][rx].type === 'WALL') {
                  nextGrid[ry][rx] = { ...nextGrid[ry][rx], type: 'EMPTY' };
              }
          }
      }

      return {
        ...prev,
        playerPosition: nextPos,
        stats: nextStats,
        status: nextStatus,
        message,
        aiState: newAiState,
        turnCount: nextTurnCount,
        grid: nextGrid,
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.status !== 'PLAYING') return;
      switch (e.key) {
        case 'ArrowUp': movePlayer('UP'); break;
        case 'ArrowDown': movePlayer('DOWN'); break;
        case 'ArrowLeft': movePlayer('LEFT'); break;
        case 'ArrowRight': movePlayer('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, movePlayer]);

  const tileColors: Record<TileType, string> = {
    EMPTY: 'bg-slate-800/40 border-slate-700/50',
    WALL: 'bg-indigo-900 border-indigo-700 shadow-lg shadow-indigo-900/40',
    TRAP: 'bg-rose-900/60 border-rose-500/50',
    SAFE: 'bg-emerald-900/60 border-emerald-500/50',
    TELEPORT: 'bg-purple-900/60 border-purple-500/50',
    EXIT: 'bg-amber-500 border-amber-300 shadow-lg shadow-amber-500/50',
    ILLUSION: 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/40', // Looks like empty
  };

  const getTileTitle = (type: TileType) => {
    switch (type) {
      case 'TRAP': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'EXIT': return <Trophy className="w-4 h-4 text-white" />;
      case 'TELEPORT': return <Zap className="w-4 h-4 text-purple-300" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans p-4 md:p-8 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 mb-8 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400 italic">
            MIND MAZE ARENA
          </h1>
        </motion.div>
        <p className="text-slate-400 font-medium tracking-wide">The Maze That Hunts You</p>
      </header>

      <main className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* Left Stats Column */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-72 flex flex-col gap-4"
        >
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-xl">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Activity className="w-4 h-4" /> Vitals
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-sm mb-1 font-semibold">
                  <span className="text-slate-400">Integrity</span>
                  <span className={gameState.stats.health < 30 ? "text-rose-400 animate-pulse" : "text-emerald-400"}>
                    {gameState.stats.health}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <motion.div 
                    animate={{ width: `${gameState.stats.health}%` }}
                    className={`h-full ${gameState.stats.health < 30 ? "bg-rose-500" : "bg-emerald-500"}`} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Turns</p>
                  <p className="text-xl font-bold text-indigo-300">{gameState.turnCount}</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Level</p>
                  <p className="text-xl font-bold text-amber-400">{gameState.stats.level}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-xl">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Brain className="w-4 h-4" /> AI Analysis
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                <span className="text-xs text-indigo-300 font-semibold">Strategy</span>
                <span className="text-xs font-bold text-indigo-400">{gameState.aiState.classification}</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400 italic">
                {gameState.aiState.classification === 'AGGRESSIVE' && "AI is deploying traps in your predicted path."}
                {gameState.aiState.classification === 'DEFENSIVE' && "AI is narrowing corridors to trap you."}
                {gameState.aiState.classification === 'EXPLORER' && "AI is randomizing structure to disorient you."}
                {gameState.aiState.classification === 'NEUTRAL' && "Initial surveillance active. Observing movement..."}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Center Maze Arena */}
        <div className="relative flex flex-col items-center">
            {gameState.status === 'MENU' ? (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-[360px] h-[360px] md:w-[480px] md:h-[480px] bg-slate-900/80 backdrop-blur-2xl border-2 border-indigo-500/30 rounded-[40px] flex flex-col items-center justify-center p-8 text-center shadow-3xl overflow-hidden group"
                >
                    <motion.div
                        animate={{ 
                            rotate: [0, 5, -5, 0],
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="mb-8 p-6 bg-indigo-500/20 rounded-full border border-indigo-500/40 relative"
                    >
                        <MapIcon className="w-16 h-16 text-indigo-400" />
                        <Sparkles className="absolute top-0 right-0 w-8 h-8 text-amber-400 animate-bounce" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-white uppercase tracking-tight">System Ready</h3>
                    <p className="text-slate-400 mb-10 text-sm leading-relaxed max-w-[280px]">
                        The arena will adapt to your movement in real-time. Reach the target to survive.
                    </p>
                    
                    <button 
                        onClick={startGame}
                        className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        INITIALIZE ARENA <RefreshCw className="w-5 h-5" />
                    </button>
                </motion.div>
            ) : (
                <div className="relative">
                    <motion.div 
                        layout
                        className="grid grid-cols-12 gap-1 p-3 bg-slate-900 border-4 border-slate-800 rounded-[32px] shadow-2xl relative overflow-hidden"
                        style={{ width: 'fit-content' }}
                    >
                        <AnimatePresence>
                        {gameState.grid.flatMap((row, y) => row.map((cell, x) => (
                            <motion.div
                                key={cell.id}
                                layout
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className={`w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 border rounded-lg flex items-center justify-center relative transition-colors duration-500 ${tileColors[cell.type]}`}
                            >
                                {getTileTitle(cell.type)}
                                
                                {gameState.playerPosition.x === x && gameState.playerPosition.y === y && (
                                    <motion.div 
                                        layoutId="player"
                                        className="absolute inset-0 z-20 flex items-center justify-center p-1"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <div className="w-full h-full bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-lg relative flex items-center justify-center">
                                            {/* Eye and Beak-like accent */}
                                            <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-slate-900 rounded-full flex items-center justify-center">
                                                <div className="w-0.5 h-0.5 bg-white rounded-full translate-x-[-0.5px] translate-y-[-0.5px]" />
                                            </div>
                                            <div className="absolute top-1/2 right-[-2px] w-3 h-2 bg-orange-500 rounded-r-full" />
                                            <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 opacity-50" />
                                        </div>
                                    </motion.div>
                                )}

                                {gameState.aiState.recentMoves.some(move => move.x === x && move.y === y) && (
                                    <div className="absolute inset-0 bg-indigo-500/10 rounded-lg blur-[2px] animate-pulse pointer-events-none border border-indigo-500/20" />
                                )}
                            </motion.div>
                        )))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Game End Overlays */}
                    <AnimatePresence>
                        {(gameState.status === 'WON' || gameState.status === 'LOST') && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 z-40 bg-slate-900/90 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center p-8 text-center"
                            >
                                {gameState.status === 'WON' ? (
                                    <Trophy className="w-20 h-20 text-amber-500 mb-6" />
                                ) : (
                                    <Skull className="w-20 h-20 text-rose-500 mb-6" />
                                )}
                                <h2 className="text-4xl font-black mb-2 text-white italic">
                                    {gameState.status === 'WON' ? 'PROTOCOL SUCCESS' : 'SYSTEM FAILURE'}
                                </h2>
                                <p className="text-slate-400 mb-8 font-medium">{gameState.message}</p>
                                <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
                                    <div className="bg-slate-800 p-3 rounded-2xl">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Turns</p>
                                        <p className="text-xl font-bold">{gameState.turnCount}</p>
                                    </div>
                                    <div className="bg-slate-800 p-3 rounded-2xl font-bold">
                                        <p className="text-[10px] text-slate-500 uppercase mb-1">AI Score</p>
                                        <p className="text-xl text-indigo-400">{Math.floor(gameState.turnCount * 1.5)}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={startGame}
                                    className="px-8 py-4 bg-white text-black rounded-2xl font-bold tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    REBOOT SYSTEM <RefreshCw className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            
            {/* Action Message */}
            <motion.div 
                key={gameState.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
            >
                <p className="text-xs font-bold text-indigo-300 tracking-wide flex items-center gap-2 capitalize">
                   <Info className="w-3 h-3" /> {gameState.message}
                </p>
            </motion.div>
        </div>

        {/* Right Controls/Info Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-72 flex flex-col gap-4"
        >
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-xl">
                 <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Interface
                </h2>
                <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 flex justify-center">
                        <button onClick={() => movePlayer('UP')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors border border-slate-700 active:scale-90">
                            <ChevronUp className="w-6 h-6" />
                        </button>
                    </div>
                    <button onClick={() => movePlayer('LEFT')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors border border-slate-700 active:scale-90 flex justify-center">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => movePlayer('RIGHT')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors border border-slate-700 active:scale-90 flex justify-center">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="col-span-2 flex justify-center">
                        <button onClick={() => movePlayer('DOWN')} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors border border-slate-700 active:scale-90">
                            <ChevronDown className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-xl">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Instructions</h2>
                <ul className="text-[10px] space-y-2 text-slate-400 font-medium">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Use Arrows to Navigate</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Avoid Indigo Walls</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Reach Amber Target</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Watch for AI Adaptation</li>
                </ul>
            </div>
        </motion.div>

      </main>

      <footer className="mt-auto py-6 relative z-10">
        <p className="text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase">
          Neural-Net Arena v2.4.0 // Secured Protocol Active
        </p>
      </footer>
    </div>
  );
}
