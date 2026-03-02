import { useState, useCallback } from 'react';
import FloorPlanEditor, { INITIAL_FURNITURE } from './components/FloorPlanEditor';
import RoomView3D from './components/RoomView3D';

const STORAGE_KEY = 'house-viz-furniture';

function loadSavedFurniture() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch { /* ignore corrupt data */ }
  return INITIAL_FURNITURE;
}

function App() {
  const [furniture, setFurniture] = useState(loadSavedFurniture);
  const [view, setView] = useState('2d'); // '2d' or '3d'

  const saveFurniture = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(furniture));
  }, [furniture]);

  const resetFurniture = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFurniture(INITIAL_FURNITURE);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#f5f0eb]">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-[#e0d6cc] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8B7355] flex items-center justify-center text-white font-bold text-sm">
            H
          </div>
          <h1 className="text-lg font-bold text-[#4a3f35] tracking-tight">House Viz</h1>
        </div>
        <span className="text-sm text-[#b0a599]">|</span>
        <span className="text-sm text-[#8a7d72]">Interactive Room Planner & 3D Visualizer</span>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 bg-[#f5f0eb] rounded-lg p-1">
          <button
            onClick={() => setView('2d')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition cursor-pointer ${
              view === '2d'
                ? 'bg-white text-[#4a3f35] shadow-sm'
                : 'text-[#8a7d72] hover:text-[#4a3f35]'
            }`}
          >
            2D Plan
          </button>
          <button
            onClick={() => setView('3d')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition cursor-pointer ${
              view === '3d'
                ? 'bg-white text-[#4a3f35] shadow-sm'
                : 'text-[#8a7d72] hover:text-[#4a3f35]'
            }`}
          >
            3D View
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === '2d' ? (
          <FloorPlanEditor
            furniture={furniture}
            setFurniture={setFurniture}
            onGenerate={() => setView('3d')}
            onSave={saveFurniture}
            onReset={resetFurniture}
          />
        ) : (
          <RoomView3D
            furniture={furniture}
            onBack={() => setView('2d')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
