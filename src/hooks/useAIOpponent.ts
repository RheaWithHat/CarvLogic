import { useState, useEffect } from 'react';

export const useAIOpponent = (isActive: boolean) => {
  const [aiScore, setAiScore] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setAiScore(0);
      return;
    }

    // AI makes random scoring moves at intervals
    const interval = setInterval(() => {
      const randomScoreIncrease = Math.floor(Math.random() * 40) + 20; // 20-60 points per move
      setAiScore(prev => prev + randomScoreIncrease);
    }, 2000 + Math.random() * 2000); // Random interval between 2-4 seconds

    return () => clearInterval(interval);
  }, [isActive]);

  const resetAiScore = () => {
    setAiScore(0);
  };

  return { aiScore, resetAiScore };
};
