# Lessons Learned

## 3D Material Transparency
- `meshPhysicalMaterial` with `transmission` conflicts with `transparent` + `opacity`. Use one approach or the other.
- For simple see-through glass: `meshStandardMaterial` with `transparent`, low `opacity`, `depthWrite={false}`, `side={THREE.DoubleSide}`.

## 3D Plane Visibility from Top-Down
- Large planes with `side={THREE.DoubleSide}` are visible from all angles including unexpected top-down views.
- Sky backdrops should face the viewing direction only (single-side rendering) and be rotated to face the room.

## Furniture Orientation in 3D
- When furniture is against a wall, its "front" (user-facing side) must face the room interior, not the wall.
- Convention: 3D models have front at +z by default. Items against the south/bottom wall need π rotation.
- Use a rotation wrapper `<group rotation={[0, Math.PI, 0]}>` inside the component for consistent flipping.

## 2D → 3D Coordinate Mapping
- 2D (x, y) maps to 3D (x - ROOM_W/2, 0, y - ROOM_D/2) for centering.
- Wall-mounted items (door, window) need their 3D z/x clamped to the wall surface, not derived from 2D position directly.

## Rotation System
- Track `rotation` property (any angle) on each item.
- In 2D: use SVG `transform="rotate(deg, cx, cy)"` for visual rotation. Do NOT swap width/height — let the transform handle appearance.
- In 3D: apply `rotation={[0, rot3d, 0]}` via a wrapper group around each furniture component.
- Rotate around item center by using outer group for position+rotation, inner component at [0,0,0].
- Drag offset must be center-based (not top-left) for correct behavior with rotated items.
- Disable resize handles when rotation ≠ 0 (resize at arbitrary angles is ambiguous).

## Type-Based 3D Rendering
- Add a `type` field to every furniture item for generic 3D component dispatch.
- Use a `TYPE_TO_COMPONENT` mapping object to map types → React Three Fiber components.
- Render all furniture in a single generic loop: `furnitureItems.map(item => <Component .../>)`.
- This pattern automatically supports duplicated items without any extra 3D code.
- Structural items (doors, windows, zones) are handled separately since they affect walls.

## Duplication
- Clone items with unique IDs (`${type}_${Date.now()}`), offset position slightly.
- Exclude structural types (door, window, wcDoor, zone) from duplication.
- Type-based rendering means duplicates automatically render in 3D.

## 3D Component Orientation Convention
- Components with a "long" and "short" dimension: basins/items should be arranged along the LONG axis, not the short one.
- For wall-mounted items (sink, shower), identify which wall the item is pushed against in 2D, then orient mirror/plumbing on that wall side (-x or -z).
- Shower glass walls should face the bathroom INTERIOR (where user walks in), not the room walls.
- When `width` (x) is short and `depth` (z) is long, arrange sub-elements along z-axis.

## 2D Drag Bounds with Rotation
- When items are rotated, the axis-aligned bounding box (AABB) changes. Use `effW = w*|cos(θ)| + h*|sin(θ)|` for clamping.
- Without this, a 3m×0.6m wardrobe rotated 90° can't reach the rightmost wall because constraints still use the original 3m width.

## Wall Door/Window Holes
- `WallPanel` `holeX` must be the LEFT EDGE of the hole in wall-local coordinates, NOT the center.
- For right wall (rotation -π/2): `local_x = -world_z` → `holeX = -(item.y + item.height - ROOM_D/2)`.
- For left wall (rotation +π/2): `local_x = +world_z` → `holeX = item.y - ROOM_D/2`.
- For front wall (rotation π): `local_x = -world_x` → `holeX = -(item.x + item.width - ROOM_W/2)`.
- Always clamp hole bounds to wall width to prevent overflow: `Math.max(-width/2, holeX)` / `Math.min(width/2, holeX+holeW)`.
- Find doors by `wallMounted` property, not by ID, to support multiple doors on different walls.
