# House Viz - Interactive Room Planner

## Plan
- [x] Scaffold Vite + React + Tailwind project
- [x] Build 2D floor plan editor with draggable furniture for Bedroom 2
  - Room: 6.5m x 4m
  - WC: 2x2m (left side)
  - Working desk: 1.3x0.6m (along wall)
  - Bed: 1.8x2m (center-right area)
  - Wardrobe: 3x0.6m (bottom wall)
  - TV desk: 1.4x0.6m (bottom wall)
  - Vanity desk (bàn trang điểm): 1.2x0.6m (bottom wall)
- [x] Build 3D render view (Three.js) with cream/classic style from reference
- [x] Wire Generate button to switch 2D → 3D
- [x] Polish UI, verify
- [x] Build 2D floor plan editor with draggable furniture for Bedroom 2
- [x] Build 3D render view (Three.js) with cream/classic style from reference
- [x] Wire Generate button to switch 2D → 3D
- [x] WC: draggable/resizable sub-elements (bồn cầu, sink, shower) + 3D ornaments (vòi sen, vòi sink, mirror)
- [x] All elements resizable via edge handles
- [x] Wardrobe 3D: glass doors with clothes/hangers visible
- [x] Door: draggable/resizable in 2D, 3D with frame + open into hallway
- [x] Window 3D: road with garden/trees/flowers/fence outside
- [x] Polish UI, verify
- [x] Ceiling toggle in 3D (hide for top-down view)
- [x] Fix door 2D position (on wall at y=3.88) + interactive open/close in 3D
- [x] Fix wardrobe glass transparency (meshStandardMaterial with depthWrite=false)
- [x] All items rotatable in 2D with rotation respected in 3D (rot3d property)

## Prompt3: 
Refer to the workflow.md for most effective working style.
1. Make all the items in 2D rotatable and the render respected that in 3D
2. The 3d render of the wardrobe is turned into the walls why users must able to see and access the wardrobe from inside the room. 
3. Bathroom should have a door for user to walk in from the bedroom at the bottom left of the bathroom as well.
4. In the 3d render, there's a giant cyan color split the room in-half - is this intended ? 

- [x] Wardrobe glass doors flipped to face room interior (π rotation wrapper)
- [x] Bathroom door added (WC front wall split with door opening + WCDoor3D)
- [x] Giant cyan plane fixed (sky backdrop: removed DoubleSide, rotated to face window, reduced size)
- [x] OrbitControls maxPolarAngle relaxed for near-top-down view

### Prompt 4: Realism, 360° rotation, door relocation, desk+accessories, duplicate, nightstand
- [x] 3D camera at eye level (1.7m height, FOV 60) for realistic standing-person view
- [x] 360° rotation (15° increments, SVG transform, no w/h swap) for all items
- [x] Bedroom door moved to left wall, 0.4m gap from wardrobe, opens inward + left wall hole
- [x] Work station: 2m desk along WC wall with PC+monitor, laptop, keyboard, mouse
- [x] 2 chairs added near desk (draggable in 2D, Chair3D in 3D)
- [x] Bedside cabinet (nightstand) on right side of bed
- [x] Duplicate button for all furniture items (auto-generates in 3D via type-based rendering)
- [x] Type field on all items + refactored 3D to generic TYPE_TO_COMPONENT loop
- [x] Removed old ID-based 3D rendering in favor of generic loop

### Prompt 5: Layout update, sink config, orientations, window glass, hole fix
- [x] Update INITIAL_FURNITURE positions to match Image 1 (toilet→top-right, 2 sinks, shower→top-left, bed→center, cabinet+cabinetTable→right)
- [x] Sink: configurable double/single toggle, 3D vanity cabinet underneath + long mirror
- [x] Shower rotation=180 (facing south), toilet rotation=0 (already faces south)
- [x] WorkStation3D: laptop moved next to monitor, both screens face outward (+z)
- [x] Right side: CabinetTable3D replaces old work station (desk+cabinet+lamp+decor)
- [x] Window 3D: meshPhysicalMaterial with transmission=0.95, opacity=0.08 for see-through glass
- [x] Fix hole: WallPanel hole clamping + window repositioned to y=1.0 (centered on wall)
- [x] Test and verify all changes

### Prompt 6: Right wall gap fix, window glass toggle, Netlify deploy
- [x] Fix right wall empty space: holeX formula was giving hole CENTER instead of LEFT EDGE (also fixed left/front walls)
- [x] Window: two glass panes with open/close toggle animation (click to swing open like doors)
- [x] Created netlify.toml (build cmd: npm run build, publish: dist, SPA redirect)

### Prompt 7: Screen orientation, shower center, double sink, save/load, delete
- [x] WorkStation3D: monitor + laptop rotated -π/2 around Y to face bed (+x)
- [x] Shower3D: replaced corner wall-mount with centered ceiling-mount rain shower head
- [x] Default double sink 1.4m long (single item replacing two separate sinks)
- [x] Save/Load: localStorage persistence via App.jsx, Save + Reset buttons in 2D toolbar
- [x] Delete: deleteItem function + ✕ Delete button in toolbar (excludes zones only)

### Prompt 8: Sink/Shower orientation, 2D drag bounds
- [x] Sink3D: basins arranged along z-axis (1.4m long dim), mirror on -x wall spanning full counter length, faucets on wall side, cabinet doors face +x toward user
- [x] Shower3D: wall-mounted shower head on -x wall centered, glass on +x/+z facing bathroom interior, rotation changed from 180→0
- [x] 2D drag bounds: compute rotated AABB so rotated wardrobe (3m×0.6m @90°) can reach rightmost wall

## Style Reference
- Cream/beige walls with panel molding
- Warm oak wood flooring
- Light-colored classic furniture
- Recessed ceiling lights
- Elegant, neoclassical style
