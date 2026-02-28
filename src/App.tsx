import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Circle, Triangle, Square, Hexagon, Diamond, Cloud, Sun, Moon, Heart,
  Zap, Flame, Droplet, Leaf, Snowflake, Play, RotateCcw, Home as HomeIcon, Check, X, BarChart2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const ALL_SYMBOLS = [
  Star, Circle, Triangle, Square, Hexagon, Diamond, Cloud, Sun, Moon, Heart,
  Zap, Flame, Droplet, Leaf, Snowflake
];

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

type Screen = 'home' | 'symbol-match' | 'coding' | 'result' | 'stats';
type GameType = 'symbol-match' | 'coding' | null;
type TimeLimit = 30 | 60 | 120 | 'endless';

type StatEntry = {
  id: string;
  date: number;
  gameType: GameType;
  pri: number;
  score: number;
  mistakes: number;
  timeLimit: TimeLimit;
  elapsed: number;
};

const calculatePRI = (score: number, mistakes: number, elapsedSeconds: number, gameType: GameType) => {
  if (elapsedSeconds < 10) return 0;
  const rawScore = Math.max(0, score - (mistakes * 1.0));
  const ratePerMinute = (rawScore / elapsedSeconds) * 60;
  const mean = gameType === 'symbol-match' ? 45 : 30;
  const sd = gameType === 'symbol-match' ? 12 : 8;
  let pri = 100 + ((ratePerMinute - mean) / sd) * 15;
  return Math.max(40, Math.min(160, Math.round(pri)));
};

function useGameTimer(timeLimit: TimeLimit, onEnd: (elapsed: number) => void) {
  const [timeDisplay, setTimeDisplay] = useState(timeLimit === 'endless' ? 0 : timeLimit);
  const elapsedRef = useRef(0);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const timer = setInterval(() => {
      elapsedRef.current += 1;
      if (timeLimit !== 'endless') {
        setTimeDisplay(t => (t as number) - 1);
      } else {
        setTimeDisplay(elapsedRef.current);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit]);

  useEffect(() => {
    if (timeLimit !== 'endless' && timeDisplay <= 0) {
      onEndRef.current(elapsedRef.current);
    }
  }, [timeDisplay, timeLimit]);

  const stop = useCallback(() => onEndRef.current(elapsedRef.current), []);

  return { timeDisplay, stop };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameType, setGameType] = useState<GameType>(null);
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(60);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [currentPri, setCurrentPri] = useState(0);
  const [currentElapsed, setCurrentElapsed] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pri_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('pri_theme', darkMode ? 'dark' : 'white');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    const saved = localStorage.getItem('pri_stats');
    if (saved) {
      try { setStats(JSON.parse(saved)); } catch (e) { }
    }
  }, []);

  const startGame = (type: GameType) => {
    setGameType(type);
    setScore(0);
    setMistakes(0);
    setScreen(type as Screen);
  };

  const endGame = useCallback((finalElapsed: number) => {
    const pri = calculatePRI(score, mistakes, finalElapsed, gameType);
    setCurrentPri(pri);
    setCurrentElapsed(finalElapsed);

    if (finalElapsed >= 10) {
      const newStat: StatEntry = {
        id: Date.now().toString(),
        date: Date.now(),
        gameType,
        pri,
        score,
        mistakes,
        timeLimit,
        elapsed: finalElapsed
      };
      const updatedStats = [...stats, newStat];
      setStats(updatedStats);
      localStorage.setItem('pri_stats', JSON.stringify(updatedStats));
    }
    setScreen('result');
  }, [gameType, score, mistakes, timeLimit, stats]);

  return (
    <div className={`${darkMode ? 'dark' : ''} w-full min-h-screen`}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col items-center justify-center p-2 sm:p-4 select-none overflow-hidden transition-colors duration-300">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <HomeScreen
              key="home"
              onStart={startGame}
              timeLimit={timeLimit}
              setTimeLimit={setTimeLimit}
              onStats={() => setScreen('stats')}
              darkMode={darkMode}
              onToggleDark={toggleDarkMode}
            />
          )}
          {screen === 'symbol-match' && (
            <SymbolMatchGame
              key="symbol-match"
              timeLimit={timeLimit}
              score={score}
              setScore={setScore}
              mistakes={mistakes}
              setMistakes={setMistakes}
              onEnd={endGame}
            />
          )}
          {screen === 'coding' && (
            <CodingGame
              key="coding"
              timeLimit={timeLimit}
              score={score}
              setScore={setScore}
              mistakes={mistakes}
              setMistakes={setMistakes}
              onEnd={endGame}
            />
          )}
          {screen === 'result' && (
            <ResultScreen
              key="result"
              score={score}
              mistakes={mistakes}
              pri={currentPri}
              elapsed={currentElapsed}
              gameType={gameType}
              onRetry={() => startGame(gameType)}
              onHome={() => setScreen('home')}
            />
          )}
          {screen === 'stats' && (
            <StatsScreen
              key="stats"
              stats={stats}
              onHome={() => setScreen('home')}
              darkMode={darkMode}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HomeScreen({ onStart, timeLimit, setTimeLimit, onStats, darkMode, onToggleDark }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 text-center relative"
    >
      <button
        onClick={onToggleDark}
        className="absolute top-6 right-6 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 dark:text-white">PRI Training</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          科学的に処理速度（Processing Speed Index）を鍛える認知トレーニングゲーム
        </p>
      </div>

      <div className="mb-6 text-left">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 font-medium px-1">制限時間</p>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          {([30, 60, 120, 'endless'] as TimeLimit[]).map(t => (
            <button
              key={t}
              onClick={() => setTimeLimit(t)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${timeLimit === t ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              {t === 'endless' ? '∞' : `${t}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onStart('symbol-match')}
          className="w-full group relative flex items-center justify-between p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left"
        >
          <div>
            <h2 className="font-semibold text-lg group-hover:text-indigo-700 dark:text-zinc-200 dark:group-hover:text-indigo-400">記号探し (Symbol Search)</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600/80 dark:group-hover:text-indigo-400/80">ターゲット記号がリストにあるか素早く判断します。</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0 ml-4">
            <Play className="w-5 h-5 ml-1" />
          </div>
        </button>

        <button
          onClick={() => onStart('coding')}
          className="w-full group relative flex items-center justify-between p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all text-left"
        >
          <div>
            <h2 className="font-semibold text-lg group-hover:text-emerald-700 dark:text-zinc-200 dark:group-hover:text-emerald-400">符号 (Coding)</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600/80 dark:group-hover:text-emerald-400/80">数字に対応する記号を素早く入力します。</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-4">
            <Play className="w-5 h-5 ml-1" />
          </div>
        </button>
      </div>

      <button
        onClick={onStats}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold transition-colors"
      >
        <BarChart2 className="w-5 h-5" />
        統計データを見る
      </button>
    </motion.div>
  );
}

function SymbolMatchGame({ timeLimit, score, setScore, mistakes, setMistakes, onEnd }: any) {
  const { timeDisplay, stop } = useGameTimer(timeLimit, onEnd);
  const [round, setRound] = useState(0);
  const [targets, setTargets] = useState<any[]>([]);
  const [searchGroup, setSearchGroup] = useState<any[]>([]);
  const [isMatch, setIsMatch] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    generateRound();
  }, [round]);

  const generateRound = () => {
    const shuffled = shuffleArray([...ALL_SYMBOLS]);
    const newTargets = shuffled.slice(0, 2);
    const match = Math.random() > 0.5;
    let newSearchGroup = [];

    if (match) {
      const targetToInclude = newTargets[Math.floor(Math.random() * 2)];
      const others = shuffled.slice(2, 6);
      newSearchGroup = shuffleArray([targetToInclude, ...others]);
    } else {
      newSearchGroup = shuffled.slice(2, 7);
    }

    setTargets(newTargets);
    setSearchGroup(newSearchGroup);
    setIsMatch(match);
    setFeedback(null);
  };

  const handleAnswer = (userSaysMatch: boolean) => {
    if (userSaysMatch === isMatch) {
      setScore((s: number) => s + 1);
      setFeedback('correct');
    } else {
      setMistakes((m: number) => m + 1);
      setFeedback('incorrect');
    }
    setTimeout(() => {
      setRound((r) => r + 1);
    }, 150);
  };

  return (
    <GameContainer timeLimit={timeLimit} timeDisplay={timeDisplay} score={score} mistakes={mistakes} title="記号探し" onStop={stop}>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={round}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.15 }}
            className="w-full flex flex-col items-center"
          >
            {/* Targets */}
            <div className="mb-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 text-center font-medium">ターゲット</p>
              <div className="flex gap-4 p-4 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                {targets.map((Icon, i) => (
                  <Icon key={i} className="w-10 h-10 text-zinc-800 dark:text-zinc-100" strokeWidth={2.5} />
                ))}
              </div>
            </div>

            {/* Search Group */}
            <div className="mb-12 w-full">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 text-center font-medium">検索リスト</p>
              <div className="flex justify-center gap-3 sm:gap-6 p-6 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 shadow-sm w-full">
                {searchGroup.map((Icon, i) => (
                  <Icon key={i} className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-800 dark:text-zinc-100" strokeWidth={2.5} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 w-full max-w-xs">
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-colors active:scale-95 shadow-sm"
              >
                あり
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-lg transition-colors active:scale-95 shadow-sm"
              >
                なし
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 pointer-events-none ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
              }`}
          />
        )}
      </AnimatePresence>
    </GameContainer>
  );
}

function CodingGame({ timeLimit, score, setScore, mistakes, setMistakes, onEnd }: any) {
  const { timeDisplay, stop } = useGameTimer(timeLimit, onEnd);
  const [round, setRound] = useState(0);
  const [map, setMap] = useState<Map<number, any>>(new Map());
  const [buttonOrder, setButtonOrder] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Regenerate every time the round changes
  useEffect(() => {
    generateRound();
  }, [round]);

  const generateRound = () => {
    // Reshuffle map and button order every round for higher difficulty
    const shuffled = shuffleArray([...ALL_SYMBOLS]);
    const newMap = new Map();
    for (let i = 1; i <= 5; i++) {
      newMap.set(i, shuffled[i - 1]);
    }
    setMap(newMap);
    setButtonOrder(shuffleArray([1, 2, 3, 4, 5]));

    // Avoid repeating the same number
    let nextNum;
    do {
      nextNum = Math.floor(Math.random() * 5) + 1;
    } while (nextNum === currentNumber);

    setCurrentNumber(nextNum);
    setFeedback(null);
  };

  const handleAnswer = (num: number) => {
    if (num === currentNumber) {
      setScore((s: number) => s + 1);
      setFeedback('correct');
    } else {
      setMistakes((m: number) => m + 1);
      setFeedback('incorrect');
    }
    setTimeout(() => {
      setRound((r) => r + 1);
    }, 100);
  };

  if (map.size === 0) return null;

  return (
    <GameContainer timeLimit={timeLimit} timeDisplay={timeDisplay} score={score} mistakes={mistakes} title="符号" onStop={stop}>
      <div className="flex-1 flex flex-col items-center justify-between w-full py-4">

        {/* Key Map */}
        <div className="w-full mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 text-center font-medium">対応表</p>
          <div className="flex justify-center gap-2 sm:gap-4 p-4 bg-white dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
            {[1, 2, 3, 4, 5].map((num) => {
              const Icon = map.get(num);
              return (
                <div key={num} className="flex flex-col items-center">
                  <span className="text-xl font-mono font-bold text-zinc-400 dark:text-zinc-500 mb-2">{num}</span>
                  <div className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <Icon className="w-6 h-6 text-zinc-800 dark:text-zinc-100" strokeWidth={2.5} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Target */}
        <div className="flex-1 flex items-center justify-center w-full">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={round}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.15 }}
              className="text-8xl font-mono font-bold text-zinc-900 dark:text-white"
            >
              {currentNumber}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Input Buttons */}
        <div className="w-full mt-8">
          <div className="flex justify-center gap-2 sm:gap-4">
            {buttonOrder.map((num) => {
              const Icon = map.get(num);
              return (
                <button
                  key={num}
                  onClick={() => handleAnswer(num)}
                  className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-2xl transition-all active:scale-90 shadow-sm"
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-800 dark:text-zinc-100" strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 pointer-events-none ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'
              }`}
          />
        )}
      </AnimatePresence>
    </GameContainer>
  );
}

function GameContainer({ children, timeLimit, timeDisplay, score, mistakes, title, onStop }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl h-[90vh] sm:h-[80vh] min-h-[500px] bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</div>
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <span className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">Time</span>
            <span className={`font-mono font-bold text-lg ${timeLimit !== 'endless' && timeDisplay <= 10 ? 'text-red-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
              {timeLimit === 'endless' ? timeDisplay : timeDisplay}s
            </span>
            {timeLimit === 'endless' && (
              <button onClick={onStop} className="ml-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 px-3 py-0.5 rounded-full text-xs font-bold transition-colors">
                終了
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-green-600">
            <Check className="w-4 h-4" />
            <span className="font-mono font-bold">{score}</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-500">
            <X className="w-4 h-4" />
            <span className="font-mono font-bold">{mistakes}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

function ResultScreen({ score, mistakes, pri, elapsed, gameType, onRetry, onHome }: any) {
  const total = score + mistakes;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 text-center"
    >
      <div className="mb-8">
        <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
          Processing Speed Index
        </h2>
        {elapsed < 10 ? (
          <div className="text-2xl font-bold text-zinc-500 mb-2 py-4">測定不能<br /><span className="text-sm font-normal">（プレイ時間が短すぎます）</span></div>
        ) : (
          <>
            <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-2">{pri}</div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">推定PRI (平均100)</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 mb-1">{score}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">正解数</div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-2xl font-mono font-bold text-red-500 dark:text-red-400 mb-1">{mistakes}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">ミス</div>
        </div>
        <div className="col-span-2 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">正答率</div>
          <div className="text-xl font-mono font-bold text-zinc-800 dark:text-zinc-100">{accuracy}%</div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white rounded-2xl font-bold transition-colors active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          もう一度プレイ
        </button>
        <button
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-2xl font-bold transition-colors active:scale-95"
        >
          <HomeIcon className="w-5 h-5" />
          ホームに戻る
        </button>
      </div>
    </motion.div>
  );
}

function StatsScreen({ stats, onHome, darkMode }: { stats: StatEntry[], onHome: () => void, darkMode: boolean, key?: React.Key }) {
  const data = stats.map((s, i) => ({
    name: `${new Date(s.date).getMonth() + 1}/${new Date(s.date).getDate()}`,
    pri: s.pri,
    game: s.gameType === 'symbol-match' ? '記号探し' : '符号'
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white">トレーニング統計</h2>
        <button onClick={onHome} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-zinc-600 dark:text-zinc-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {stats.length === 0 ? (
        <div className="text-center text-zinc-500 dark:text-zinc-400 py-12">データがありません。プレイして記録を残しましょう！</div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#3f3f46' : '#e4e4e7'} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: darkMode ? '#a1a1aa' : '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 160]} tick={{ fontSize: 12, fill: darkMode ? '#a1a1aa' : '#71717a' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: darkMode ? '#18181b' : '#fff',
                  color: darkMode ? '#f4f4f5' : '#18181b'
                }}
                itemStyle={{ color: darkMode ? '#f4f4f5' : '#18181b' }}
              />
              <ReferenceLine y={100} stroke={darkMode ? '#52525b' : '#a1a1aa'} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="pri" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: darkMode ? '#18181b' : '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
