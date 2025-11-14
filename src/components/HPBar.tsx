import { useEffect, useState } from "react";
import pinkCat from "@/assets/pink-cat.png";
import blueFox from "@/assets/blue-fox.png";

interface HPBarProps {
  player: "cat" | "fox";
  score: number;
  opponentScore: number;
}

export const HPBar = ({ player, score, opponentScore }: HPBarProps) => {
  const [hp, setHp] = useState(100);
  
  useEffect(() => {
    const hpLoss = Math.min(opponentScore / 10, 100);
    setHp(Math.max(0, 100 - hpLoss));
  }, [opponentScore]);

  const isCat = player === "cat";
  const gradient = isCat ? "from-cat-pink to-cat-pink-light" : "from-fox-blue to-fox-blue-light";
  const avatar = isCat ? pinkCat : blueFox;
  const name = isCat ? "Pink Cat" : "Blue Fox";

  return (
    <div className={`flex items-center gap-4 ${isCat ? "" : "flex-row-reverse"}`}>
      <img 
        src={avatar} 
        alt={name}
        className="w-16 h-16 rounded-full border-4 border-white shadow-lg animate-float"
      />
      
      <div className={`flex-1 ${isCat ? "" : "text-right"}`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`font-bold ${isCat ? "text-gradient-pink" : "text-gradient-blue"}`}>
            {name}
          </span>
          <span className="text-sm font-semibold">{Math.round(hp)}%</span>
        </div>
        
        <div className="h-6 bg-muted rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 ease-out ${
              hp < 30 ? "animate-pulse" : ""
            }`}
            style={{ width: `${hp}%` }}
          />
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          Score: {score}
        </div>
      </div>
    </div>
  );
};
