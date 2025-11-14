import { useEffect, useState } from "react";

interface ComboEffectProps {
  show: boolean;
  combo: number;
}

export const ComboEffect = ({ show, combo }: ComboEffectProps) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (show && combo > 2) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
      }));
      setParticles(newParticles);
      
      setTimeout(() => setParticles([]), 1000);
    }
  }, [show, combo]);

  if (!show || combo <= 2) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="animate-in zoom-in-50 fade-in duration-300">
        <div className="text-6xl font-black text-gradient-pink drop-shadow-lg animate-bounce">
          {combo}x COMBO!
        </div>
      </div>
      
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-4 h-4 bg-accent rounded-full animate-ping"
          style={{
            left: `calc(50% + ${particle.x}px)`,
            top: `calc(50% + ${particle.y}px)`,
          }}
        />
      ))}
    </div>
  );
};
