import React, { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { cn } from "@/shared/utils";

interface DraggableExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  persistenceKey?: string;
}

export const DraggableExportButton: React.FC<DraggableExportButtonProps> = ({
  onClick,
  disabled = false,
  persistenceKey = "draggable-csv-btn-pos"
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startDragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Position loading from sessionStorage
  useEffect(() => {
    const savedPos = sessionStorage.getItem(persistenceKey);
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos);
        setPosition(parsed);
      } catch {
        // Fallback to default
        setDefaultPosition();
      }
    } else {
      setDefaultPosition();
    }

    const handleResize = () => {
      setPosition(prev => {
        const newX = Math.min(window.innerWidth - 120, Math.max(20, prev.x));
        const newY = Math.min(window.innerHeight - 80, Math.max(20, prev.y));
        return { x: newX, y: newY };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [persistenceKey]);

  const setDefaultPosition = () => {
    // Default to bottom right
    const x = window.innerWidth - 160;
    const y = window.innerHeight - 100;
    setPosition({ x, y });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    isDragging.current = true;
    hasMoved.current = false;
    startDragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging.current) return;
    
    const newX = e.clientX - startDragOffset.current.x;
    const newY = e.clientY - startDragOffset.current.y;
    
    // Bounds checking: keep fully within viewport margins
    const buttonWidth = buttonRef.current?.offsetWidth || 130;
    const buttonHeight = buttonRef.current?.offsetHeight || 44;
    const boundedX = Math.min(window.innerWidth - buttonWidth - 20, Math.max(20, newX));
    const boundedY = Math.min(window.innerHeight - buttonHeight - 20, Math.max(20, newY));

    // Determine if drag has actually occurred (threshold of 4px)
    if (Math.abs(boundedX - position.x) > 4 || Math.abs(boundedY - position.y) > 4) {
      hasMoved.current = true;
    }

    setPosition({ x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Save position to sessionStorage
    sessionStorage.setItem(persistenceKey, JSON.stringify(position));

    // If it was just a click, trigger onClick
    if (!hasMoved.current) {
      onClick();
    }
  };

  return (
    <button
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      disabled={disabled}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        zIndex: 9999
      }}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 bg-[#2B317A] text-white hover:bg-[#2B317A]/90 active:scale-95 transition-all rounded-full shadow-lg font-bold text-xs select-none border border-white/10 backdrop-blur-md cursor-grab active:cursor-grabbing",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
      title="Drag to reposition, tap to download CSV data"
    >
      <Download className="w-4 h-4 text-white" />
      <span>Export CSV</span>
    </button>
  );
};
