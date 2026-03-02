import { useState, useRef, useCallback, useEffect } from 'react';

const SCALE = 100; // 1m = 100px
const ROOM_WIDTH = 6.5;
const ROOM_HEIGHT = 4;
const HANDLE_SIZE = 8; // px, resize handle
const MIN_SIZE = 0.3; // minimum furniture dimension in meters

const COLORS = {
  wcWall: '#a8d8ea',
  sink: '#b8e0f0',
  toilet: '#c8eaf5',
  shower: '#98c8d8',
  bed: '#c9e4ca',
  desk: '#f5d6ba',
  wardrobe: '#d4c5f9',
  tvDesk: '#f9e2ae',
  vanity: '#f7c5c5',
  door: '#c8906a',
  window: '#4a9eff',
  chair: '#e8d4b8',
  nightstand: '#d4c5b0',
  cabinetTable: '#e8ddd0',
};

const INITIAL_FURNITURE = [
  // WC boundary (the room walls) — fixed zone indicator
  { id: 'wcZone', type: 'zone', label: 'WC Zone', x: 0, y: 0, width: 2, height: 2, color: COLORS.wcWall, isZone: true, rotation: 0 },
  // WC sub-elements
  { id: 'toilet', type: 'toilet', label: 'Bồn cầu', x: 1.2, y: 0, width: 0.4, height: 0.6, color: COLORS.toilet, zone: 'wc', rotation: 0 },
  { id: 'sink', type: 'sink', label: 'Double Sink', x: 0.5, y: 0.3, width: 0.5, height: 1.4, color: COLORS.sink, zone: 'wc', sinkMode: 'double', rotation: 0 },
  { id: 'shower', type: 'shower', label: 'Shower', x: 0, y: 0.4, width: 0.9, height: 1.2, color: COLORS.shower, zone: 'wc', rotation: 0 },
  // Bedroom furniture
  { id: 'bed', type: 'bed', label: 'Bed S1', x: 3.3, y: 0, width: 2, height: 1.8, color: COLORS.bed, rotation: 0 },
  { id: 'workDesk', type: 'workStation', label: 'Work Station', x: 2.05, y: 0, width: 0.6, height: 2.0, color: COLORS.desk, rotation: 0 },
  { id: 'chair1', type: 'chair', label: 'Chair', x: 2.7, y: 0.3, width: 0.45, height: 0.45, color: COLORS.chair, rotation: 0 },
  { id: 'chair2', type: 'chair', label: 'Chair', x: 2.7, y: 1.2, width: 0.45, height: 0.45, color: COLORS.chair, rotation: 0 },
  { id: 'nightstand', type: 'nightstand', label: 'Cabinet', x: 6.1, y: 0, width: 0.4, height: 0.4, color: COLORS.nightstand, rotation: 0 },
  { id: 'cabinetTable', type: 'cabinetTable', label: 'Cabinet Table', x: 6.1, y: 0.5, width: 0.4, height: 1.3, color: COLORS.cabinetTable, rotation: 0 },
  { id: 'wardrobe', type: 'wardrobe', label: 'Wardrobe', x: 0, y: 3.4, width: 3, height: 0.6, color: COLORS.wardrobe, rotation: 0 },
  { id: 'tvDesk', type: 'tvDesk', label: 'TV Desk', x: 3.1, y: 3.4, width: 1.4, height: 0.6, color: COLORS.tvDesk, rotation: 0 },
  { id: 'vanity', type: 'vanity', label: 'Vanity Desk', x: 4.6, y: 3.4, width: 1.2, height: 0.6, color: COLORS.vanity, rotation: 0 },
  // Door (left wall)
  { id: 'door', type: 'door', label: 'Door', x: 0, y: 2.7, width: 0.12, height: 0.9, color: COLORS.door, wallMounted: 'left', rotation: 0 },
  { id: 'window', type: 'window', label: 'Window', x: 6.38, y: 1.0, width: 0.12, height: 2, color: COLORS.window, wallMounted: 'right', rotation: 0 },
  // WC door (bathroom entrance from bedroom)
  { id: 'wcDoor', type: 'wcDoor', label: 'WC Door', x: 0.5, y: 1.88, width: 0.6, height: 0.12, color: COLORS.door, zone: 'wc', rotation: 0 },
];

function getSvgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

// --- Furniture icon renderers for 2D plan ---
function renderItemIcon(item, px, py, pw, ph) {
  switch (item.type) {
    case 'toilet':
      return (
        <>
          <ellipse cx={px + pw / 2} cy={py + ph * 0.6} rx={pw * 0.38} ry={ph * 0.3} fill="white" stroke="#7ab" strokeWidth={1.5} />
          <rect x={px + pw * 0.15} y={py + 3} width={pw * 0.7} height={ph * 0.28} fill="white" stroke="#7ab" strokeWidth={1} rx={3} />
        </>
      );
    case 'sink':
      return (
        <>
          <rect x={px + pw * 0.1} y={py + ph * 0.15} width={pw * 0.8} height={ph * 0.7} fill="white" stroke="#68a" strokeWidth={1} rx={6} />
          <ellipse cx={px + pw / 2} cy={py + ph * 0.5} rx={pw * 0.22} ry={ph * 0.2} fill="#e0f0f8" stroke="#68a" strokeWidth={0.8} />
          <line x1={px + pw / 2} y1={py + ph * 0.2} x2={px + pw / 2} y2={py + ph * 0.35} stroke="#999" strokeWidth={2} />
        </>
      );
    case 'shower':
      return (
        <>
          <rect x={px + 3} y={py + 3} width={pw - 6} height={ph - 6} fill="#e8f4f8" stroke="#78b0c0" strokeWidth={1} rx={4} strokeDasharray="4,3" />
          <circle cx={px + pw / 2} cy={py + ph * 0.3} r={Math.min(pw, ph) * 0.12} fill="#aad" stroke="#78b0c0" strokeWidth={1} />
          <line x1={px + pw / 2} y1={py + ph * 0.3 + Math.min(pw, ph) * 0.12} x2={px + pw / 2} y2={py + ph * 0.6} stroke="#999" strokeWidth={1.5} />
        </>
      );
    case 'bed':
      return (
        <>
          <rect x={px + 6} y={py + 6} width={pw * 0.38} height={18} fill="white" fillOpacity={0.8} rx={4} stroke="#9c9" strokeWidth={0.5} />
          <rect x={px + pw * 0.55} y={py + 6} width={pw * 0.38} height={18} fill="white" fillOpacity={0.8} rx={4} stroke="#9c9" strokeWidth={0.5} />
        </>
      );
    case 'door':
    case 'wcDoor': {
      const arcR = Math.max(pw, ph) * 0.9;
      if (item.wallMounted === 'left') {
        return (
          <path
            d={`M ${px + pw / 2} ${py + ph} A ${arcR} ${arcR} 0 0 0 ${px + pw / 2 + arcR * 0.5} ${py + ph - arcR * 0.7}`}
            fill="none" stroke={COLORS.door} strokeWidth={1.5} strokeDasharray="4,3"
          />
        );
      }
      if (item.wallMounted === 'bottom' || item.zone === 'wc') {
        return (
          <path
            d={`M ${px} ${py + ph / 2} A ${arcR} ${arcR} 0 0 0 ${px + arcR} ${py + ph / 2 + arcR * 0.3}`}
            fill="none" stroke={COLORS.door} strokeWidth={1.5} strokeDasharray="4,3"
          />
        );
      }
      return (
        <path
          d={`M ${px + pw / 2} ${py} A ${arcR} ${arcR} 0 0 1 ${px + pw / 2 + arcR * 0.3} ${py + arcR}`}
          fill="none" stroke={COLORS.door} strokeWidth={1.5} strokeDasharray="4,3"
        />
      );
    }
    case 'chair':
      return (
        <circle cx={px + pw / 2} cy={py + ph / 2} r={Math.min(pw, ph) * 0.35}
          fill="white" fillOpacity={0.5} stroke="#a08060" strokeWidth={1} />
      );
    case 'nightstand':
      return (
        <rect x={px + 3} y={py + 3} width={pw - 6} height={ph - 6}
          fill="white" fillOpacity={0.3} stroke="#a08060" strokeWidth={0.5} rx={2} />
      );
    case 'workStation':
      return (
        <>
          <rect x={px + 2} y={py + 2} width={pw - 4} height={ph * 0.15} fill="#333" fillOpacity={0.4} rx={1} />
          <rect x={px + pw * 0.15} y={py + ph * 0.6} width={pw * 0.7} height={ph * 0.15} fill="#555" fillOpacity={0.3} rx={1} />
        </>
      );
    case 'cabinetTable':
      return (
        <>
          <rect x={px + 2} y={py + 2} width={pw - 4} height={ph - 4}
            fill="white" fillOpacity={0.3} stroke="#b0a090" strokeWidth={0.5} rx={2} />
          <line x1={px + pw * 0.3} y1={py + ph * 0.5} x2={px + pw * 0.7} y2={py + ph * 0.5}
            stroke="#a09080" strokeWidth={0.8} />
        </>
      );
    default:
      return null;
  }
}

export default function FloorPlanEditor({ furniture, setFurniture, onGenerate, onSave, onReset }) {
  const svgRef = useRef(null);
  const [interaction, setInteraction] = useState(null); // { type: 'drag'|'resize', id, edge?, offsetX?, offsetY? }
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const toPixel = (m) => m * SCALE;
  const toMeter = (px) => px / SCALE;

  const padX = 50;
  const padY = 50;
  const svgW = toPixel(ROOM_WIDTH) + padX * 2;
  const svgH = toPixel(ROOM_HEIGHT) + padY * 2;

  const snap = (v) => Math.round(v * 20) / 20; // snap to 0.05m

  const handleMouseDown = useCallback((e, item, edge = null) => {
    if (item.isZone) return;
    e.preventDefault();
    e.stopPropagation();
    const svg = svgRef.current;
    const svgP = getSvgPoint(svg, e);
    setSelectedId(item.id);

    if (edge) {
      setInteraction({ type: 'resize', id: item.id, edge, startX: svgP.x, startY: svgP.y, origItem: { ...item } });
    } else {
      setInteraction({
        type: 'drag', id: item.id,
        offsetX: svgP.x - (padX + toPixel(item.x + item.width / 2)),
        offsetY: svgP.y - (padY + toPixel(item.y + item.height / 2)),
      });
    }
  }, [padX, padY]);

  const handleMouseMove = useCallback((e) => {
    if (!interaction) return;
    const svg = svgRef.current;
    const svgP = getSvgPoint(svg, e);

    setFurniture((prev) =>
      prev.map((item) => {
        if (item.id !== interaction.id) return item;

        if (interaction.type === 'drag') {
          let cx = toMeter(svgP.x - interaction.offsetX - padX);
          let cy = toMeter(svgP.y - interaction.offsetY - padY);
          // Compute axis-aligned bounding box for rotated item
          const rot = (item.rotation || 0) * Math.PI / 180;
          const cosR = Math.abs(Math.cos(rot));
          const sinR = Math.abs(Math.sin(rot));
          const effW = item.width * cosR + item.height * sinR;
          const effH = item.width * sinR + item.height * cosR;
          // Clamp center so rotated AABB stays inside room
          cx = Math.max(effW / 2, Math.min(ROOM_WIDTH - effW / 2, cx));
          cy = Math.max(effH / 2, Math.min(ROOM_HEIGHT - effH / 2, cy));
          let newX = snap(cx - item.width / 2);
          let newY = snap(cy - item.height / 2);
          return { ...item, x: newX, y: newY };
        }

        if (interaction.type === 'resize') {
          const { edge, origItem } = interaction;
          const dx = toMeter(svgP.x - interaction.startX);
          const dy = toMeter(svgP.y - interaction.startY);
          let { x, y, width, height } = origItem;

          if (edge === 'right') { width = Math.max(MIN_SIZE, snap(width + dx)); }
          if (edge === 'bottom') { height = Math.max(MIN_SIZE, snap(height + dy)); }
          if (edge === 'left') { x = snap(x + dx); width = Math.max(MIN_SIZE, snap(origItem.width - dx)); }
          if (edge === 'top') { y = snap(y + dy); height = Math.max(MIN_SIZE, snap(origItem.height - dy)); }
          if (edge === 'bottom-right') { width = Math.max(MIN_SIZE, snap(width + dx)); height = Math.max(MIN_SIZE, snap(height + dy)); }

          // Clamp inside room
          x = Math.max(0, x);
          y = Math.max(0, y);
          if (x + width > ROOM_WIDTH) width = ROOM_WIDTH - x;
          if (y + height > ROOM_HEIGHT) height = ROOM_HEIGHT - y;

          return { ...item, x, y, width, height };
        }
        return item;
      })
    );
  }, [interaction, padX, padY, setFurniture]);

  const handleMouseUp = useCallback(() => {
    setInteraction(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const rotateFurniture = (id, direction = 1) => {
    setFurniture((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.isZone) return item;
        const newRot = ((item.rotation || 0) + 15 * direction + 360) % 360;
        return { ...item, rotation: newRot };
      })
    );
  };

  const duplicateItem = (id) => {
    setFurniture((prev) => {
      const item = prev.find((f) => f.id === id);
      if (!item || item.isZone || ['door', 'window', 'wcDoor', 'zone'].includes(item.type)) return prev;
      const newId = `${item.type}_${Date.now()}`;
      const clone = {
        ...item,
        id: newId,
        label: item.label,
        x: Math.min(item.x + 0.3, ROOM_WIDTH - item.width),
        y: Math.min(item.y + 0.3, ROOM_HEIGHT - item.height),
      };
      return [...prev, clone];
    });
  };

  const deleteItem = (id) => {
    const item = furniture.find((f) => f.id === id);
    if (!item || item.isZone || ['zone'].includes(item.type)) return;
    setFurniture((prev) => prev.filter((f) => f.id !== id));
    setSelectedId(null);
  };

  // Grid
  const gridLines = [];
  for (let x = 0; x <= ROOM_WIDTH; x += 0.5) {
    gridLines.push(
      <line key={`gx-${x}`} x1={padX + toPixel(x)} y1={padY} x2={padX + toPixel(x)} y2={padY + toPixel(ROOM_HEIGHT)}
        stroke="#e0d6cc" strokeWidth={x % 1 === 0 ? 1 : 0.5} strokeDasharray={x % 1 === 0 ? 'none' : '2,4'} />
    );
  }
  for (let y = 0; y <= ROOM_HEIGHT; y += 0.5) {
    gridLines.push(
      <line key={`gy-${y}`} x1={padX} y1={padY + toPixel(y)} x2={padX + toPixel(ROOM_WIDTH)} y2={padY + toPixel(y)}
        stroke="#e0d6cc" strokeWidth={y % 1 === 0 ? 1 : 0.5} strokeDasharray={y % 1 === 0 ? 'none' : '2,4'} />
    );
  }

  // Dimension labels
  const dimLabels = [];
  for (let x = 0; x <= ROOM_WIDTH; x += 1) {
    dimLabels.push(
      <text key={`dlx-${x}`} x={padX + toPixel(x)} y={padY - 10} textAnchor="middle" fontSize="11" fill="#8a7d72">{x}m</text>
    );
  }
  for (let y = 0; y <= ROOM_HEIGHT; y += 1) {
    dimLabels.push(
      <text key={`dly-${y}`} x={padX - 10} y={padY + toPixel(y) + 4} textAnchor="end" fontSize="11" fill="#8a7d72">{y}m</text>
    );
  }

  // Resize handles for selected item
  function renderResizeHandles(item) {
    if (item.isZone) return null;
    const px = padX + toPixel(item.x);
    const py = padY + toPixel(item.y);
    const pw = toPixel(item.width);
    const ph = toPixel(item.height);
    const hs = HANDLE_SIZE;
    const edges = [
      { edge: 'right', cx: px + pw, cy: py + ph / 2, cursor: 'ew-resize' },
      { edge: 'bottom', cx: px + pw / 2, cy: py + ph, cursor: 'ns-resize' },
      { edge: 'left', cx: px, cy: py + ph / 2, cursor: 'ew-resize' },
      { edge: 'top', cx: px + pw / 2, cy: py, cursor: 'ns-resize' },
      { edge: 'bottom-right', cx: px + pw, cy: py + ph, cursor: 'nwse-resize' },
    ];
    return edges.map(({ edge, cx, cy, cursor }) => (
      <rect
        key={`handle-${item.id}-${edge}`}
        x={cx - hs / 2} y={cy - hs / 2} width={hs} height={hs}
        fill="#8B7355" stroke="white" strokeWidth={1} rx={2}
        style={{ cursor }}
        onMouseDown={(e) => handleMouseDown(e, item, edge)}
      />
    ));
  }

  const selectedItem = furniture.find((f) => f.id === selectedId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0d6cc]">
        <div>
          <h2 className="text-lg font-semibold text-[#4a3f35]">Bedroom 2 — Floor Plan</h2>
          <p className="text-sm text-[#8a7d72]">
            {ROOM_WIDTH}m × {ROOM_HEIGHT}m • Drag to move • Edge handles to resize • Click to select
          </p>
        </div>
        <button
          onClick={onGenerate}
          className="px-6 py-2.5 bg-[#8B7355] hover:bg-[#6d5a43] text-white font-medium rounded-lg shadow-md transition-all duration-200 cursor-pointer"
        >
          Generate 3D View →
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <svg
          ref={svgRef}
          width={svgW} height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="bg-white rounded-xl shadow-lg border border-[#e0d6cc]"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          onMouseDown={() => setSelectedId(null)}
        >
          {gridLines}

          {/* Room walls */}
          <rect x={padX} y={padY} width={toPixel(ROOM_WIDTH)} height={toPixel(ROOM_HEIGHT)}
            fill="none" stroke="#4a3f35" strokeWidth={3} />

          {dimLabels}

          {/* Furniture items */}
          {furniture.map((item) => {
            const isSelected = selectedId === item.id;
            const isHovered = hoveredId === item.id;
            const px = padX + toPixel(item.x);
            const py = padY + toPixel(item.y);
            const pw = toPixel(item.width);
            const ph = toPixel(item.height);

            // WC zone: just a dashed background
            if (item.isZone) {
              return (
                <g key={item.id}>
                  <rect x={px} y={py} width={pw} height={ph}
                    fill={item.color} fillOpacity={0.2}
                    stroke="#78b0c0" strokeWidth={2} strokeDasharray="8,4" rx={4} />
                  <text x={px + pw / 2} y={py + 14} textAnchor="middle" fontSize="11" fontWeight="600" fill="#5a8a9a" pointerEvents="none">
                    {item.label} ({item.width}×{item.height}m)
                  </text>
                </g>
              );
            }

            const isDoor = item.type === 'door' || item.type === 'wcDoor';
            const isWindow = item.type === 'window';
            const rot = item.rotation || 0;

            return (
              <g key={item.id}
                transform={rot ? `rotate(${rot}, ${px + pw / 2}, ${py + ph / 2})` : undefined}
                onMouseDown={(e) => handleMouseDown(e, item)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'grab' }}
              >
                <rect x={px} y={py} width={pw} height={ph}
                  fill={item.color} fillOpacity={isDoor || isWindow ? 0.9 : 0.65}
                  stroke={isSelected ? '#4a3f35' : isHovered ? '#8B7355' : '#999'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  rx={isDoor || isWindow ? 2 : 4}
                />
                {/* Item-specific icon */}
                {renderItemIcon(item, px, py, pw, ph)}

                {/* Label */}
                <text x={px + pw / 2} y={py + ph / 2 - (ph > 30 ? 6 : 1)} textAnchor="middle"
                  fontSize={isDoor || isWindow ? '9' : '11'} fontWeight="600" fill="#4a3f35" pointerEvents="none">
                  {item.label}
                </text>
                {ph > 25 && (
                  <text x={px + pw / 2} y={py + ph / 2 + 10} textAnchor="middle"
                    fontSize="9" fill="#8a7d72" pointerEvents="none">
                    {item.width}×{item.height}m
                  </text>
                )}

                {/* Resize handles when selected and not rotated */}
                {isSelected && rot === 0 && renderResizeHandles(item)}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-[#e0d6cc] bg-white/50">
        <span className="text-sm text-[#8a7d72] mr-2">Selected:</span>
        {selectedItem ? (
          <>
            <span className="text-sm font-medium text-[#4a3f35]">{selectedItem.label}</span>
            <button onClick={() => rotateFurniture(selectedId, -1)}
              className="px-2 py-1 text-sm bg-[#f5f0eb] hover:bg-[#e8ddd2] text-[#4a3f35] rounded-md border border-[#d4c5b0] transition cursor-pointer"
              title="Rotate left 15°">
              ↺
            </button>
            <button onClick={() => rotateFurniture(selectedId, 1)}
              className="px-2 py-1 text-sm bg-[#f5f0eb] hover:bg-[#e8ddd2] text-[#4a3f35] rounded-md border border-[#d4c5b0] transition cursor-pointer"
              title="Rotate right 15°">
              ↻
            </button>
            {selectedItem.type === 'sink' && (
              <button onClick={() => {
                setFurniture((prev) => prev.map((f) => f.id !== selectedId ? f : {
                  ...f, sinkMode: f.sinkMode === 'double' ? 'single' : 'double'
                }));
              }}
                className="px-3 py-1 text-sm bg-[#d8eef8] hover:bg-[#c0dde8] text-[#4a3f35] rounded-md border border-[#a8c8d8] transition cursor-pointer"
                title="Toggle single/double sink">
                {selectedItem.sinkMode === 'double' ? '⬜ Single Sink' : '⬜⬜ Double Sink'}
              </button>
            )}
            {!selectedItem.isZone && !['door', 'window', 'wcDoor', 'zone'].includes(selectedItem.type) && (
              <button onClick={() => duplicateItem(selectedId)}
                className="px-3 py-1 text-sm bg-[#f5f0eb] hover:bg-[#e8ddd2] text-[#4a3f35] rounded-md border border-[#d4c5b0] transition cursor-pointer"
                title="Duplicate item">
                ⊕ Duplicate
              </button>
            )}
            {!selectedItem.isZone && !['zone'].includes(selectedItem.type) && (
              <button onClick={() => deleteItem(selectedId)}
                className="px-3 py-1 text-sm bg-[#fce8e8] hover:bg-[#f5cccc] text-[#a04040] rounded-md border border-[#e0a0a0] transition cursor-pointer"
                title="Delete item">
                ✕ Delete
              </button>
            )}
            <span className="text-xs text-[#8a7d72] ml-2">
              Pos: ({selectedItem.x}, {selectedItem.y})m  Size: {selectedItem.width}×{selectedItem.height}m  Rot: {selectedItem.rotation || 0}°
            </span>
          </>
        ) : (
          <span className="text-sm text-[#b0a599]">Click a furniture item to select</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {onSave && (
            <button onClick={onSave}
              className="px-3 py-1.5 text-sm font-medium bg-[#8B7355] hover:bg-[#7a6348] text-white rounded-md shadow-sm transition cursor-pointer"
              title="Save layout to browser">
              💾 Save
            </button>
          )}
          {onReset && (
            <button onClick={onReset}
              className="px-3 py-1.5 text-sm font-medium bg-white hover:bg-[#fce8e8] text-[#8a7d72] rounded-md border border-[#d4c5b0] transition cursor-pointer"
              title="Reset to default layout">
              ↩ Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { INITIAL_FURNITURE, ROOM_WIDTH, ROOM_HEIGHT };
