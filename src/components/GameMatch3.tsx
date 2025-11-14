import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";

type GemType = "purple" | "yellow" | "green" | "orange" | "pink" | "blue";

interface Gem {
  id: number;
  type: GemType;
  row: number;
  col: number;
  isMatched?: boolean;
}

interface GameMatch3Props {
  onScoreChange: (score: number) => void;
}

const GEM_TYPES: GemType[] = ["purple", "yellow", "green", "orange", "pink", "blue"];

export const GameMatch3 = ({ onScoreChange }: GameMatch3Props) => {
  const [gems, setGems] = useState<Gem[]>([]);
  const [score, setScore] = useState(0);
  const [selectedGem, setSelectedGem] = useState<{ row: number; col: number } | null>(null);

  const getGemColor = (type: GemType) => {
    const colors: Record<GemType, string> = {
      purple: "bg-game-purple",
      yellow: "bg-game-yellow",
      green: "bg-game-green",
      orange: "bg-game-orange",
      pink: "bg-cat-pink",
      blue: "bg-fox-blue",
    };
    return colors[type];
  };

  const initializeBoard = useCallback(() => {
    let id = 0;
    const newGems: Gem[] = [];
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        newGems.push({
          id: id++,
          type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
          row,
          col,
        });
      }
    }
    
    setGems(newGems);
    setScore(0);
  }, []);

  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  useEffect(() => {
    onScoreChange(score);
  }, [score, onScoreChange]);

  const findMatches = useCallback((currentGems: Gem[]) => {
    const grid: (Gem | null)[][] = Array(6).fill(null).map(() => Array(6).fill(null));
    currentGems.forEach((gem) => {
      grid[gem.row][gem.col] = gem;
    });

    const matched = new Set<number>();

    // Check horizontal matches
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const gem1 = grid[row][col];
        const gem2 = grid[row][col + 1];
        const gem3 = grid[row][col + 2];
        
        if (gem1 && gem2 && gem3 && gem1.type === gem2.type && gem2.type === gem3.type) {
          matched.add(gem1.id);
          matched.add(gem2.id);
          matched.add(gem3.id);
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row < 4; row++) {
        const gem1 = grid[row][col];
        const gem2 = grid[row + 1][col];
        const gem3 = grid[row + 2][col];
        
        if (gem1 && gem2 && gem3 && gem1.type === gem2.type && gem2.type === gem3.type) {
          matched.add(gem1.id);
          matched.add(gem2.id);
          matched.add(gem3.id);
        }
      }
    }

    return matched;
  }, []);

  const handleGemClick = (row: number, col: number) => {
    if (!selectedGem) {
      setSelectedGem({ row, col });
    } else {
      const rowDiff = Math.abs(selectedGem.row - row);
      const colDiff = Math.abs(selectedGem.col - col);
      
      // Check if adjacent
      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Swap gems
        setGems((currentGems) => {
          const newGems = currentGems.map((gem) => {
            if (gem.row === selectedGem.row && gem.col === selectedGem.col) {
              return { ...gem, row, col };
            }
            if (gem.row === row && gem.col === col) {
              return { ...gem, row: selectedGem.row, col: selectedGem.col };
            }
            return gem;
          });

          // Check for matches
          const matches = findMatches(newGems);
          
          if (matches.size > 0) {
            setScore((s) => s + matches.size * 10);
            
            // Remove matched gems and fill from top
            setTimeout(() => {
              setGems((current) => {
                const remaining = current.filter((gem) => !matches.has(gem.id));
                const grid: (Gem | null)[][] = Array(6).fill(null).map(() => Array(6).fill(null));
                
                remaining.forEach((gem) => {
                  grid[gem.row][gem.col] = gem;
                });

                // Drop gems down
                for (let col = 0; col < 6; col++) {
                  const column = grid.map((row) => row[col]).filter((g) => g !== null) as Gem[];
                  const emptyCount = 6 - column.length;
                  
                  // Add new gems at top
                  for (let i = 0; i < emptyCount; i++) {
                    column.unshift({
                      id: Date.now() + Math.random(),
                      type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)],
                      row: i,
                      col,
                    });
                  }
                  
                  // Update positions
                  column.forEach((gem, idx) => {
                    gem.row = idx;
                  });
                  
                  for (let row = 0; row < 6; row++) {
                    grid[row][col] = column[row];
                  }
                }

                return grid.flat().filter((g) => g !== null) as Gem[];
              });
            }, 300);
          }

          return newGems;
        });
      }
      
      setSelectedGem(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <h3 className="text-2xl font-bold text-gradient-blue">Match-3</h3>
        <button
          onClick={initializeBoard}
          className="px-4 py-2 rounded-xl bg-fox-blue text-white font-semibold hover:scale-105 transition-transform"
        >
          New Game
        </button>
      </div>
      
      <Card className="w-[280px] h-[280px] bg-muted p-2 rounded-2xl">
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 36 }).map((_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const gem = gems.find((g) => g.row === row && g.col === col);
            const isSelected = selectedGem?.row === row && selectedGem?.col === col;
            
            return (
              <button
                key={i}
                onClick={() => handleGemClick(row, col)}
                className={`aspect-square rounded-lg transition-all ${
                  gem ? `${getGemColor(gem.type)} hover:scale-110` : "bg-background"
                } ${isSelected ? "ring-2 ring-white scale-110" : ""}`}
              />
            );
          })}
        </div>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        Click gems to swap
      </div>
    </div>
  );
};
