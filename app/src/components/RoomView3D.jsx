import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const ROOM_W = 6.5;
const ROOM_D = 4;
const ROOM_H = 2.8;

const PALETTE = {
  wall: '#f5efe6',
  wallAccent: '#e8ddd0',
  floor: '#c4a882',
  floorDark: '#a88e6e',
  ceiling: '#faf6f0',
  trim: '#e0d5c5',
  furniture: '#f0e8dc',
  furnitureDark: '#d4c5b0',
  bed: '#ede5d8',
  bedFabric: '#e8dfd2',
  pillow: '#f5f0ea',
  wcTile: '#dce8e8',
  metal: '#c8b898',
  chrome: '#e0dcd5',
  glass: '#e8eff5',
  grass: '#7cb860',
  grassDark: '#5a9040',
  road: '#8a8a8a',
  sky: '#b8d4e8',
  tree: '#5a8a3a',
  treeTrunk: '#8B6842',
};

// =================== WALLS ===================
function WallPanel({ position, rotation, width, height, hasHole, holeX: rawHoleX, holeW: rawHoleW, holeH, holeY0 }) {
  if (hasHole) {
    // Clamp hole to wall bounds to prevent overflow
    const holeLeft = Math.max(-width / 2, rawHoleX);
    const holeRight = Math.min(width / 2, rawHoleX + rawHoleW);
    const holeX = holeLeft;
    const holeW = holeRight - holeLeft;
    return (
      <group position={position} rotation={rotation}>
        {/* Wall segments around the hole */}
        {/* Left of hole */}
        {holeX > -width / 2 + 0.01 && (
          <mesh position={[(-width / 2 + holeX) / 2, height / 2, 0]}>
            <boxGeometry args={[holeX + width / 2, height, 0.05]} />
            <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
          </mesh>
        )}
        {/* Right of hole */}
        {holeX + holeW < width / 2 - 0.01 && (
          <mesh position={[(holeX + holeW + width / 2) / 2, height / 2, 0]}>
            <boxGeometry args={[width / 2 - holeX - holeW, height, 0.05]} />
            <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
          </mesh>
        )}
        {/* Above hole */}
        <mesh position={[holeX + holeW / 2, (holeY0 + holeH + height) / 2, 0]}>
          <boxGeometry args={[holeW, height - holeY0 - holeH, 0.05]} />
          <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
        </mesh>
        {/* Below hole */}
        {holeY0 > 0.01 && (
          <mesh position={[holeX + holeW / 2, holeY0 / 2, 0]}>
            <boxGeometry args={[holeW, holeY0, 0.05]} />
            <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
          </mesh>
        )}
        {/* Baseboard & crown */}
        <mesh position={[0, 0.06, 0.03]}>
          <boxGeometry args={[width, 0.12, 0.03]} />
          <meshStandardMaterial color={PALETTE.trim} roughness={0.6} />
        </mesh>
        <mesh position={[0, height - 0.06, 0.03]}>
          <boxGeometry args={[width, 0.12, 0.03]} />
          <meshStandardMaterial color={PALETTE.trim} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
      </mesh>
      {Array.from({ length: Math.max(1, Math.floor(width / 2)) }, (_, i) => {
        const n = Math.max(1, Math.floor(width / 2));
        const panelW = (width / n) - 0.3;
        const cx = -width / 2 + (i + 0.5) * (width / n);
        return (
          <group key={i}>
            <mesh position={[cx, height * 0.55, 0.03]}>
              <boxGeometry args={[panelW, height * 0.5, 0.02]} />
              <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.7} />
            </mesh>
            <mesh position={[cx, 0.06, 0.03]}>
              <boxGeometry args={[panelW + 0.15, 0.12, 0.03]} />
              <meshStandardMaterial color={PALETTE.trim} roughness={0.6} />
            </mesh>
            <mesh position={[cx, height - 0.06, 0.03]}>
              <boxGeometry args={[panelW + 0.15, 0.12, 0.03]} />
              <meshStandardMaterial color={PALETTE.trim} roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// =================== FLOOR ===================
function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color={PALETTE.floor} roughness={0.6} metalness={0.05} />
      </mesh>
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-ROOM_W / 2 + (i + 0.5) * (ROOM_W / 20), 0.001, 0]}>
          <planeGeometry args={[0.005, ROOM_D]} />
          <meshStandardMaterial color={PALETTE.floorDark} roughness={0.7} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.005, 0]}>
        <planeGeometry args={[3, 2.5]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Ceiling() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color={PALETTE.ceiling} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {[[-1.5, 0], [1.5, 0], [-1.5, -1.2], [1.5, -1.2], [0, 1.2]].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, ROOM_H - 0.02, z]}>
            <cylinderGeometry args={[0.08, 0.1, 0.04, 16]} />
            <meshStandardMaterial color="#f0ece5" roughness={0.3} />
          </mesh>
          <pointLight position={[x, ROOM_H - 0.1, z]} intensity={0.4} color="#fff5e6" distance={4} />
        </group>
      ))}
    </group>
  );
}

// =================== BED ===================
function Bed({ position, width = 2, depth = 1.8 }) {
  const bh = 0.45;
  const headH = 0.9;
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.08, depth]} position={[0, bh, 0]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </RoundedBox>
      {[[-width/2+0.08, 0, -depth/2+0.08], [width/2-0.08, 0, -depth/2+0.08],
        [-width/2+0.08, 0, depth/2-0.08], [width/2-0.08, 0, depth/2-0.08]].map(([x, _, z], i) => (
        <mesh key={i} position={[x, bh/2, z]}>
          <cylinderGeometry args={[0.03, 0.03, bh, 8]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
      <RoundedBox args={[width - 0.1, 0.2, depth - 0.1]} position={[0, bh + 0.12, 0]} radius={0.04} smoothness={4}>
        <meshStandardMaterial color={PALETTE.bedFabric} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[width, headH, 0.08]} position={[0, bh + headH/2, -depth/2 + 0.04]} radius={0.03} smoothness={4}>
        <meshStandardMaterial color={PALETTE.bedFabric} roughness={0.8} />
      </RoundedBox>
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => (
          <mesh key={`tuft-${row}-${col}`} position={[-width/2+0.3+col*((width-0.6)/4), bh+0.2+row*0.25, -depth/2+0.09]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={PALETTE.furnitureDark} roughness={0.6} />
          </mesh>
        ))
      )}
      {[-0.4, 0.4].map((x, i) => (
        <RoundedBox key={i} args={[0.55, 0.12, 0.35]} position={[x, bh + 0.28, -depth/2 + 0.3]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={PALETTE.pillow} roughness={0.9} />
        </RoundedBox>
      ))}
      <RoundedBox args={[width - 0.15, 0.08, depth * 0.55]} position={[0, bh + 0.24, depth * 0.15]} radius={0.03} smoothness={4}>
        <meshStandardMaterial color={PALETTE.pillow} roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

// =================== DESK ===================
function Desk({ position, width, depth, height = 0.75 }) {
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.04, depth]} position={[0, height, 0]} radius={0.01} smoothness={4}>
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </RoundedBox>
      {[[-width/2+0.05, 0, -depth/2+0.05], [width/2-0.05, 0, -depth/2+0.05],
        [-width/2+0.05, 0, depth/2-0.05], [width/2-0.05, 0, depth/2-0.05]].map(([x, _, z], i) => (
        <mesh key={i} position={[x, height/2, z]}>
          <boxGeometry args={[0.04, height, 0.04]} />
          <meshStandardMaterial color={PALETTE.furnitureDark} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// =================== WORK STATION (DESK + PC + LAPTOP) ===================
function WorkStation3D({ position, width = 0.6, depth = 2, height = 0.75 }) {
  return (
    <group position={position}>
      {/* Desk surface */}
      <RoundedBox args={[width, 0.04, depth]} position={[0, height, 0]} radius={0.01} smoothness={4}>
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </RoundedBox>
      {/* Legs */}
      {[[-width/2+0.04, 0, -depth/2+0.04], [width/2-0.04, 0, -depth/2+0.04],
        [-width/2+0.04, 0, depth/2-0.04], [width/2-0.04, 0, depth/2-0.04]].map(([x, _, z], i) => (
        <mesh key={i} position={[x, height/2, z]}>
          <boxGeometry args={[0.04, height, 0.04]} />
          <meshStandardMaterial color={PALETTE.furnitureDark} roughness={0.5} />
        </mesh>
      ))}
      {/* Monitor + stand */}
      <group position={[0, height, -depth * 0.3]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.5, 0.3, 0.02]} />
          <meshStandardMaterial color="#222" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.25, 0.011]}>
          <planeGeometry args={[0.46, 0.26]} />
          <meshStandardMaterial color="#1a2a3a" roughness={0.1} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.01, 0.03]}>
          <boxGeometry args={[0.15, 0.01, 0.12]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
      {/* Keyboard */}
      <mesh position={[0, height + 0.02, -depth * 0.15]}>
        <boxGeometry args={[0.35, 0.01, 0.12]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      {/* Mouse */}
      <mesh position={[0.22, height + 0.02, -depth * 0.15]}>
        <boxGeometry args={[0.05, 0.015, 0.08]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
      </mesh>
      {/* PC tower under desk */}
      <RoundedBox args={[0.18, 0.4, 0.4]} position={[-width/2 + 0.12, 0.2, -depth * 0.3]} radius={0.01} smoothness={2}>
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
      </RoundedBox>
      {/* Laptop next to monitor, also back to wall, screen faces out */}
      <group position={[width * 0.25, height, -depth * 0.15]}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.22]} />
          <meshStandardMaterial color="#555" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 0.1]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.005]} />
          <meshStandardMaterial color="#444" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 0.097]} rotation={[0.3, 0, 0]}>
          <planeGeometry args={[0.27, 0.17]} />
          <meshStandardMaterial color="#1a2a3a" roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// =================== CHAIR ===================
function Chair3D({ position, width = 0.45, depth = 0.45 }) {
  const seatH = 0.45;
  const backH = 0.4;
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.04, depth]} position={[0, seatH, 0]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[width - 0.05, backH, 0.03]} position={[0, seatH + backH / 2, -depth / 2 + 0.02]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
      </RoundedBox>
      {[[-width/2+0.05, 0, -depth/2+0.05], [width/2-0.05, 0, -depth/2+0.05],
        [-width/2+0.05, 0, depth/2-0.05], [width/2-0.05, 0, depth/2-0.05]].map(([x, _, z], i) => (
        <mesh key={i} position={[x, seatH/2, z]}>
          <cylinderGeometry args={[0.015, 0.015, seatH, 8]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// =================== NIGHTSTAND ===================
function Nightstand3D({ position, width = 0.4, depth = 0.4, height = 0.55 }) {
  return (
    <group position={position}>
      <RoundedBox args={[width, height, depth]} position={[0, height / 2, 0]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, height + 0.005, 0]}>
        <boxGeometry args={[width + 0.02, 0.01, depth + 0.02]} />
        <meshStandardMaterial color={PALETTE.furnitureDark} roughness={0.5} />
      </mesh>
      <mesh position={[0, height * 0.65, depth / 2 + 0.005]}>
        <boxGeometry args={[width - 0.06, height * 0.35, 0.01]} />
        <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
      </mesh>
      <mesh position={[0, height * 0.65, depth / 2 + 0.02]}>
        <boxGeometry args={[0.06, 0.015, 0.015]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, height * 0.25, depth / 2 + 0.005]}>
        <boxGeometry args={[width - 0.06, height * 0.35, 0.01]} />
        <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
      </mesh>
      <mesh position={[0, height * 0.25, depth / 2 + 0.02]}>
        <boxGeometry args={[0.06, 0.015, 0.015]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// =================== CABINET TABLE (small desk + cabinet like Image 2 right side) ===================
function CabinetTable3D({ position, width = 0.4, depth = 1.3, height = 0.75 }) {
  return (
    <group position={position}>
      {/* Cabinet body */}
      <RoundedBox args={[width, height, depth]} position={[0, height / 2, 0]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </RoundedBox>
      {/* Countertop */}
      <mesh position={[0, height + 0.01, 0]}>
        <boxGeometry args={[width + 0.02, 0.02, depth + 0.02]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.15} metalness={0.05} />
      </mesh>
      {/* Cabinet doors */}
      {Array.from({ length: Math.max(1, Math.round(depth / 0.5)) }, (_, i) => {
        const n = Math.max(1, Math.round(depth / 0.5));
        const dz = -depth / 2 + (i + 0.5) * (depth / n);
        return (
          <group key={i}>
            <mesh position={[width / 2 + 0.005, height / 2, dz]}>
              <boxGeometry args={[0.01, height - 0.08, depth / n - 0.04]} />
              <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
            </mesh>
            <mesh position={[width / 2 + 0.02, height / 2, dz]}>
              <boxGeometry args={[0.015, 0.05, 0.015]} />
              <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
      {/* Small table lamp */}
      <group position={[0, height + 0.02, -depth * 0.3]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.1, 8]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 0.08, 8]} />
          <meshStandardMaterial color="#fff8ee" roughness={0.3} transparent opacity={0.9} />
        </mesh>
        <pointLight position={[0, 0.2, 0]} intensity={0.15} color="#fff5e0" distance={1.5} />
      </group>
      {/* Decorative items */}
      <mesh position={[0.05, height + 0.04, depth * 0.2]}>
        <cylinderGeometry args={[0.025, 0.02, 0.06, 8]} />
        <meshStandardMaterial color="#e0d0c0" roughness={0.4} />
      </mesh>
      <mesh position={[-0.05, height + 0.05, depth * 0.1]}>
        <boxGeometry args={[0.08, 0.08, 0.06]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
    </group>
  );
}

// =================== GLASS WARDROBE WITH CLOTHES ===================
function GlassWardrobe({ position, width, depth, height = 2.2 }) {
  const numDoors = Math.max(2, Math.round(width / 0.6));
  const doorW = width / numDoors;
  return (
    <group position={position}>
      <group rotation={[0, Math.PI, 0]}>
      {/* Back panel */}
      <mesh position={[0, height / 2, -depth / 2 + 0.01]}>
        <boxGeometry args={[width - 0.02, height - 0.02, 0.02]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      {/* Top */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[width, 0.03, depth]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      {/* Side panels */}
      <mesh position={[-width / 2 + 0.015, height / 2, 0]}>
        <boxGeometry args={[0.03, height, depth]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[width / 2 - 0.015, height / 2, 0]}>
        <boxGeometry args={[0.03, height, depth]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>

      {/* Glass doors */}
      {Array.from({ length: numDoors }, (_, i) => {
        const cx = -width / 2 + (i + 0.5) * doorW;
        return (
          <group key={`door-${i}`}>
            {/* Glass panel */}
            <mesh position={[cx, height / 2, depth / 2 - 0.005]}>
              <boxGeometry args={[doorW - 0.04, height - 0.15, 0.01]} />
              <meshStandardMaterial
                color="#d8e8f0"
                transparent
                opacity={0.18}
                roughness={0.05}
                metalness={0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {/* Door frame */}
            <mesh position={[cx, height / 2, depth / 2]}>
              <boxGeometry args={[doorW - 0.02, height - 0.1, 0.005]} />
              <meshStandardMaterial color={PALETTE.chrome} roughness={0.2} metalness={0.4} wireframe />
            </mesh>
            {/* Handle */}
            <mesh position={[cx + doorW * 0.35, height * 0.5, depth / 2 + 0.02]}>
              <capsuleGeometry args={[0.008, 0.08, 4, 8]} />
              <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.2} />
            </mesh>
            {/* Divider between doors */}
            {i < numDoors - 1 && (
              <mesh position={[cx + doorW / 2, height / 2, 0]}>
                <boxGeometry args={[0.02, height, depth]} />
                <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Shelves */}
      {[0.4, 1.0, 1.6].map((sh, i) => (
        <mesh key={`shelf-${i}`} position={[0, sh, 0]}>
          <boxGeometry args={[width - 0.08, 0.02, depth - 0.04]} />
          <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
        </mesh>
      ))}

      {/* Hanging rod */}
      <mesh position={[0, height * 0.82, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, width - 0.1, 8]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Clothes on hangers */}
      {Array.from({ length: Math.floor(width / 0.15) }, (_, i) => {
        const cx = -width / 2 + 0.12 + i * 0.15;
        const colors = ['#c9b8a8', '#a8b8c8', '#d4c0a8', '#b8a898', '#c8c0b8', '#e0d0c0'];
        const col = colors[i % colors.length];
        const clothH = 0.4 + Math.random() * 0.2;
        return (
          <group key={`cloth-${i}`} position={[cx, height * 0.82 - 0.02, 0]}>
            {/* Hanger */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.005, 0.005]} />
              <meshStandardMaterial color={PALETTE.chrome} metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.04, 6]} />
              <meshStandardMaterial color={PALETTE.chrome} metalness={0.4} roughness={0.3} />
            </mesh>
            {/* Garment */}
            <mesh position={[0, -clothH / 2 - 0.01, 0]}>
              <boxGeometry args={[0.1, clothH, depth * 0.35]} />
              <meshStandardMaterial color={col} roughness={0.85} />
            </mesh>
          </group>
        );
      })}

      {/* Folded items on shelves */}
      {[0.42, 1.02].map((sh, si) =>
        Array.from({ length: 3 }, (_, i) => {
          const colors = ['#d4c8b8', '#c0b8a8', '#e0d4c4'];
          return (
            <RoundedBox key={`fold-${si}-${i}`} args={[0.25, 0.08, depth * 0.4]}
              position={[-width / 3 + i * (width / 3), sh + 0.04, 0]} radius={0.01} smoothness={2}>
              <meshStandardMaterial color={colors[i % 3]} roughness={0.9} />
            </RoundedBox>
          );
        })
      )}
      </group>
    </group>
  );
}

// =================== TV DESK ===================
function TVDesk({ position, width, depth, height = 0.5 }) {
  return (
    <group position={position}>
      <RoundedBox args={[width, height, depth]} position={[0, height / 2, 0]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, height + 0.35, -depth * 0.2]}>
        <boxGeometry args={[width * 0.7, 0.55, 0.03]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} />
      </mesh>
      <mesh position={[0, height + 0.35, -depth * 0.2 + 0.016]}>
        <planeGeometry args={[width * 0.65, 0.5]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.1} />
      </mesh>
      <mesh position={[0, height + 0.04, -depth * 0.2]}>
        <boxGeometry args={[0.15, 0.08, 0.1]} />
        <meshStandardMaterial color="#333" roughness={0.4} />
      </mesh>
    </group>
  );
}

// =================== VANITY ===================
function VanityDesk({ position, width, depth, height = 0.75 }) {
  return (
    <group position={position}>
      <Desk position={[0, 0, 0]} width={width} depth={depth} height={height} />
      <mesh position={[0, height + 0.4, -depth / 2 + 0.05]}>
        <circleGeometry args={[0.25, 32, 0, Math.PI]} />
        <meshStandardMaterial color="#e8e4dc" metalness={0.4} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height + 0.15, -depth / 2 + 0.05]}>
        <planeGeometry args={[0.5, 0.35]} />
        <meshStandardMaterial color="#e8e4dc" metalness={0.4} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, height + 0.3, -depth / 2 + 0.04]}>
        <ringGeometry args={[0.28, 0.32, 32]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// =================== WC ROOM WITH FIXTURES ===================
function WCRoom({ position, width = 2, depth = 2, doorOpeningX = -0.2, doorOpeningW = 0.6 }) {
  const h = ROOM_H;
  const doorH = 2.0;
  // Front wall segments around door opening
  const leftW = width / 2 + doorOpeningX - doorOpeningW / 2;
  const rightW = width / 2 - doorOpeningX - doorOpeningW / 2;
  return (
    <group position={position}>
      {/* Tile floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={PALETTE.wcTile} roughness={0.4} />
      </mesh>
      {/* Tile grid on floor */}
      {Array.from({ length: Math.floor(width / 0.3) }, (_, i) => (
        <mesh key={`ft-x-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-width/2 + (i+1)*0.3, 0.006, 0]}>
          <planeGeometry args={[0.005, depth]} />
          <meshStandardMaterial color="#c8dada" />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(depth / 0.3) }, (_, i) => (
        <mesh key={`ft-y-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -depth/2 + (i+1)*0.3]}>
          <planeGeometry args={[width, 0.005]} />
          <meshStandardMaterial color="#c8dada" />
        </mesh>
      ))}

      {/* Right internal wall (separating WC from bedroom) */}
      <mesh position={[width / 2, h / 2, 0]}>
        <boxGeometry args={[0.1, h, depth]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
      </mesh>
      {/* Front internal wall with door opening */}
      {leftW > 0.02 && (
        <mesh position={[-width / 2 + leftW / 2, h / 2, depth / 2]}>
          <boxGeometry args={[leftW, h, 0.1]} />
          <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
        </mesh>
      )}
      {rightW > 0.02 && (
        <mesh position={[width / 2 - rightW / 2, h / 2, depth / 2]}>
          <boxGeometry args={[rightW, h, 0.1]} />
          <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
        </mesh>
      )}
      {/* Above door opening */}
      <mesh position={[doorOpeningX, (doorH + h) / 2, depth / 2]}>
        <boxGeometry args={[doorOpeningW + 0.08, h - doorH, 0.1]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
      </mesh>
      {/* WC ceiling light */}
      <pointLight position={[0, h - 0.2, 0]} intensity={0.5} color="#fff" distance={3} />
    </group>
  );
}

// =================== TOILET (BỒN CẦU) ===================
function Toilet3D({ position, width = 0.4, depth = 0.6 }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[width * 0.45, width * 0.5, 0.3, 16]} />
        <meshStandardMaterial color="white" roughness={0.2} />
      </mesh>
      {/* Bowl */}
      <mesh position={[0, 0.32, depth * 0.1]}>
        <sphereGeometry args={[width * 0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="white" roughness={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0.33, depth * 0.1]}>
        <torusGeometry args={[width * 0.35, 0.02, 8, 16]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.1} />
      </mesh>
      {/* Tank */}
      <RoundedBox args={[width * 0.7, 0.35, depth * 0.3]} position={[0, 0.35, -depth * 0.3]} radius={0.03} smoothness={4}>
        <meshStandardMaterial color="white" roughness={0.2} />
      </RoundedBox>
      {/* Lid */}
      <RoundedBox args={[width * 0.72, 0.03, depth * 0.32]} position={[0, 0.53, -depth * 0.3]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color="#f8f8f8" roughness={0.15} />
      </RoundedBox>
      {/* Flush button */}
      <mesh position={[0, 0.55, -depth * 0.3]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.6} roughness={0.15} />
      </mesh>
    </group>
  );
}

// =================== SINK WITH CABINET + MIRROR ===================
function Sink3D({ position, width = 0.5, depth = 0.4, sinkMode = 'single' }) {
  const isDouble = sinkMode === 'double';
  const cabinetH = 0.65;
  return (
    <group position={position}>
      {/* Vanity cabinet */}
      <RoundedBox args={[width, cabinetH, depth]} position={[0, cabinetH / 2, 0]} radius={0.02} smoothness={4}>
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </RoundedBox>
      {/* Cabinet door(s) */}
      {isDouble ? (
        <>
          <mesh position={[-width * 0.25, cabinetH / 2, depth / 2 + 0.005]}>
            <boxGeometry args={[width * 0.45, cabinetH - 0.08, 0.01]} />
            <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
          </mesh>
          <mesh position={[width * 0.25, cabinetH / 2, depth / 2 + 0.005]}>
            <boxGeometry args={[width * 0.45, cabinetH - 0.08, 0.01]} />
            <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
          </mesh>
          <mesh position={[-width * 0.25, cabinetH / 2, depth / 2 + 0.02]}>
            <boxGeometry args={[0.05, 0.015, 0.015]} />
            <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[width * 0.25, cabinetH / 2, depth / 2 + 0.02]}>
            <boxGeometry args={[0.05, 0.015, 0.015]} />
            <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, cabinetH / 2, depth / 2 + 0.005]}>
            <boxGeometry args={[width - 0.06, cabinetH - 0.08, 0.01]} />
            <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
          </mesh>
          <mesh position={[0, cabinetH / 2, depth / 2 + 0.02]}>
            <boxGeometry args={[0.05, 0.015, 0.015]} />
            <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
          </mesh>
        </>
      )}
      {/* Countertop */}
      <mesh position={[0, cabinetH + 0.015, 0]}>
        <boxGeometry args={[width + 0.02, 0.03, depth + 0.02]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.15} metalness={0.05} />
      </mesh>
      {/* Basin(s) */}
      {isDouble ? (
        <>
          <mesh position={[-width * 0.25, cabinetH + 0.02, 0]}>
            <cylinderGeometry args={[width * 0.18, width * 0.2, 0.05, 16]} />
            <meshStandardMaterial color="#e8f0f5" roughness={0.1} />
          </mesh>
          <mesh position={[width * 0.25, cabinetH + 0.02, 0]}>
            <cylinderGeometry args={[width * 0.18, width * 0.2, 0.05, 16]} />
            <meshStandardMaterial color="#e8f0f5" roughness={0.1} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, cabinetH + 0.02, 0]}>
          <cylinderGeometry args={[width * 0.25, width * 0.3, 0.05, 16]} />
          <meshStandardMaterial color="#e8f0f5" roughness={0.1} />
        </mesh>
      )}
      {/* Faucet(s) */}
      {(isDouble ? [-width * 0.25, width * 0.25] : [0]).map((fx, fi) => (
        <group key={fi} position={[fx, 0, 0]}>
          <mesh position={[0, cabinetH + 0.08, -depth * 0.35]}>
            <cylinderGeometry args={[0.012, 0.015, 0.08, 8]} />
            <meshStandardMaterial color={PALETTE.chrome} metalness={0.7} roughness={0.1} />
          </mesh>
          <mesh position={[0, cabinetH + 0.14, -depth * 0.2]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.01, 0.15, 8]} />
            <meshStandardMaterial color={PALETTE.chrome} metalness={0.7} roughness={0.1} />
          </mesh>
          <mesh position={[0, cabinetH + 0.16, -depth * 0.08]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color={PALETTE.chrome} metalness={0.7} roughness={0.1} />
          </mesh>
        </group>
      ))}
      {/* Long mirror above */}
      <mesh position={[0, 1.35, -depth / 2 + 0.02]}>
        <boxGeometry args={[width * 1.2, 0.7, 0.02]} />
        <meshStandardMaterial color="#e0e8ec" metalness={0.5} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.35, -depth / 2 + 0.01]}>
        <boxGeometry args={[width * 1.25, 0.75, 0.01]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.4} roughness={0.2} />
      </mesh>
    </group>
  );
}

// =================== SHOWER (KHUNG TẮM ĐỨNG) ===================
function Shower3D({ position, width = 0.9, depth = 0.8 }) {
  return (
    <group position={position}>
      {/* Glass walls */}
      <mesh position={[width / 2 - 0.005, ROOM_H * 0.38, 0]}>
        <boxGeometry args={[0.01, ROOM_H * 0.75, depth]} />
        <meshPhysicalMaterial color={PALETTE.glass} transparent opacity={0.15} roughness={0.05} transmission={0.7} />
      </mesh>
      <mesh position={[0, ROOM_H * 0.38, depth / 2 - 0.005]}>
        <boxGeometry args={[width, ROOM_H * 0.75, 0.01]} />
        <meshPhysicalMaterial color={PALETTE.glass} transparent opacity={0.15} roughness={0.05} transmission={0.7} />
      </mesh>
      {/* Glass door frame */}
      <mesh position={[width / 2 - 0.005, ROOM_H * 0.38, 0]}>
        <boxGeometry args={[0.02, ROOM_H * 0.75, depth]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.5} roughness={0.2} wireframe />
      </mesh>
      {/* Shower tray */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[width - 0.02, 0.06, depth - 0.02]} />
        <meshStandardMaterial color="white" roughness={0.2} />
      </mesh>
      {/* Drain */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 12]} />
        <meshStandardMaterial color="#bbb" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Shower arm (wall mount) */}
      <mesh position={[-width / 2 + 0.05, 2.0, -depth / 2 + 0.08]}>
        <cylinderGeometry args={[0.012, 0.012, 0.25, 8]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.7} roughness={0.1} />
      </mesh>
      {/* Shower arm horizontal */}
      <mesh position={[-width / 2 + 0.05, 2.12, -depth / 2 + 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.2, 8]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.7} roughness={0.1} />
      </mesh>
      {/* Shower head (vòi sen) */}
      <mesh position={[-width / 2 + 0.05, 2.12, -depth / 2 + 0.32]}>
        <cylinderGeometry args={[0.06, 0.04, 0.02, 16]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.7} roughness={0.1} />
      </mesh>
      {/* Shower head holes */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[-width / 2 + 0.05 + (i - 2) * 0.02, 2.11, -depth / 2 + 0.32]}>
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshStandardMaterial color="#999" roughness={0.3} />
        </mesh>
      ))}
      {/* Mixer valve */}
      <mesh position={[-width / 2 + 0.05, 1.2, -depth / 2 + 0.06]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 12]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.7} roughness={0.1} />
      </mesh>
      <mesh position={[-width / 2 + 0.05, 1.2, -depth / 2 + 0.1]}>
        <boxGeometry args={[0.06, 0.015, 0.015]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.6} roughness={0.15} />
      </mesh>
      {/* Handheld shower holder */}
      <mesh position={[-width / 2 + 0.05, 1.5, -depth / 2 + 0.06]}>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color={PALETTE.chrome} metalness={0.6} roughness={0.15} />
      </mesh>
    </group>
  );
}

// =================== DOOR ===================
function Door3D({ position, width = 0.9, height: doorH = 2.1 }) {
  const doorRef = useRef();
  const [open, setOpen] = useState(true);
  const targetAngle = open ? 1.3 : 0;

  useFrame(() => {
    if (doorRef.current) {
      const cur = doorRef.current.rotation.y;
      const diff = targetAngle - cur;
      if (Math.abs(diff) > 0.005) {
        doorRef.current.rotation.y += diff * 0.06;
      }
    }
  });

  return (
    <group position={position}>
      {/* Door frame */}
      <mesh position={[-width / 2 - 0.03, doorH / 2, 0]}>
        <boxGeometry args={[0.06, doorH + 0.06, 0.12]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[width / 2 + 0.03, doorH / 2, 0]}>
        <boxGeometry args={[0.06, doorH + 0.06, 0.12]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[0, doorH + 0.03, 0]}>
        <boxGeometry args={[width + 0.12, 0.06, 0.12]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>

      {/* Door panel — click to open/close */}
      <group position={[-width / 2, 0, 0]} ref={doorRef} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <RoundedBox args={[width, doorH, 0.04]} position={[width / 2, doorH / 2, 0]} radius={0.01} smoothness={4}>
          <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
        </RoundedBox>
        {/* Door panel detail */}
        <mesh position={[width / 2, doorH * 0.65, 0.022]}>
          <boxGeometry args={[width * 0.6, doorH * 0.35, 0.01]} />
          <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
        </mesh>
        <mesh position={[width / 2, doorH * 0.25, 0.022]}>
          <boxGeometry args={[width * 0.6, doorH * 0.25, 0.01]} />
          <meshStandardMaterial color={PALETTE.wallAccent} roughness={0.6} />
        </mesh>
        {/* Handle */}
        <mesh position={[width * 0.85, doorH * 0.48, 0.04]}>
          <boxGeometry args={[0.1, 0.02, 0.02]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[width * 0.85, doorH * 0.48, 0.06]}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.2} />
        </mesh>
      </group>

      {/* Hallway floor visible through door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 1.2]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial color="#d4c5b0" roughness={0.7} />
      </mesh>
      {/* Hallway wall hint */}
      <mesh position={[0, ROOM_H / 2, 2.2]}>
        <planeGeometry args={[3, ROOM_H]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.8} />
      </mesh>
      <pointLight position={[0, 2, 1]} intensity={0.2} color="#fff5e6" distance={3} />
    </group>
  );
}

// =================== WC DOOR ===================
function WCDoor3D({ position, width = 0.6 }) {
  const doorH = 2.0;
  const doorRef = useRef();
  const [open, setOpen] = useState(false);
  const targetAngle = open ? 1.2 : 0;

  useFrame(() => {
    if (doorRef.current) {
      const cur = doorRef.current.rotation.y;
      const diff = targetAngle - cur;
      if (Math.abs(diff) > 0.005) {
        doorRef.current.rotation.y += diff * 0.06;
      }
    }
  });

  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[-width / 2 - 0.02, doorH / 2, 0]}>
        <boxGeometry args={[0.04, doorH, 0.1]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[width / 2 + 0.02, doorH / 2, 0]}>
        <boxGeometry args={[0.04, doorH, 0.1]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[0, doorH + 0.02, 0]}>
        <boxGeometry args={[width + 0.08, 0.04, 0.1]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      {/* Door panel — click to open/close */}
      <group position={[-width / 2, 0, 0]} ref={doorRef} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <mesh position={[width / 2, doorH / 2, 0]}>
          <boxGeometry args={[width, doorH, 0.03]} />
          <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
        </mesh>
        {/* Handle */}
        <mesh position={[width * 0.85, doorH * 0.48, 0.03]}>
          <boxGeometry args={[0.06, 0.015, 0.015]} />
          <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// =================== OUTDOOR SCENERY ===================
function OutdoorScenery({ windowPos, windowW, windowH }) {
  return (
    <group position={[ROOM_W / 2 + 2, 0, windowPos[2]]}>
      {/* Sky backdrop — faces toward window (-X), not visible from above */}
      <mesh position={[4, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color={PALETTE.sky} roughness={1} />
      </mesh>
      {/* Sun glow */}
      <pointLight position={[5, 5, -2]} intensity={1.5} color="#fff8e0" distance={15} />

      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.01, 0]}>
        <planeGeometry args={[3, 8]} />
        <meshStandardMaterial color={PALETTE.road} roughness={0.9} />
      </mesh>
      {/* Road center line */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`lane-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.015, -3.5 + i * 1]}>
          <planeGeometry args={[0.08, 0.5]} />
          <meshStandardMaterial color="#e8e4a0" roughness={0.8} />
        </mesh>
      ))}

      {/* Sidewalk (near) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, 0.02, 0]}>
        <planeGeometry args={[0.8, 8]} />
        <meshStandardMaterial color="#c8c0b4" roughness={0.8} />
      </mesh>

      {/* Garden across the road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.01, 0]}>
        <planeGeometry args={[4, 8]} />
        <meshStandardMaterial color={PALETTE.grass} roughness={0.95} />
      </mesh>

      {/* Garden fence */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`fence-${i}`} position={[2, 0.25, -3 + i * 0.55]}>
          <boxGeometry args={[0.03, 0.5, 0.04]} />
          <meshStandardMaterial color="#e0d0b8" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[2, 0.4, 0]}>
        <boxGeometry args={[0.02, 0.04, 7]} />
        <meshStandardMaterial color="#e0d0b8" roughness={0.7} />
      </mesh>

      {/* Trees */}
      {[[3, 0, -2], [4.5, 0, 0.5], [3.5, 0, 2.5], [5, 0, -0.8]].map(([x, y, z], i) => (
        <group key={`tree-${i}`} position={[x, y, z]}>
          {/* Trunk */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 1.6, 8]} />
            <meshStandardMaterial color={PALETTE.treeTrunk} roughness={0.9} />
          </mesh>
          {/* Canopy layers */}
          <mesh position={[0, 2.0, 0]}>
            <sphereGeometry args={[0.6, 12, 10]} />
            <meshStandardMaterial color={PALETTE.tree} roughness={0.95} />
          </mesh>
          <mesh position={[0.2, 2.3, 0.15]}>
            <sphereGeometry args={[0.45, 10, 8]} />
            <meshStandardMaterial color={PALETTE.grassDark} roughness={0.95} />
          </mesh>
          <mesh position={[-0.15, 2.4, -0.1]}>
            <sphereGeometry args={[0.35, 10, 8]} />
            <meshStandardMaterial color={PALETTE.tree} roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Flower bushes */}
      {[[2.8, 0, 1.5], [4, 0, -1.5], [3, 0, 0]].map(([x, y, z], i) => (
        <group key={`bush-${i}`} position={[x, y, z]}>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.3, 10, 8]} />
            <meshStandardMaterial color="#6a9a48" roughness={0.95} />
          </mesh>
          {/* Flowers */}
          {[[-0.12, 0.4, 0.1], [0.1, 0.45, -0.05], [0, 0.38, 0.15]].map(([fx, fy, fz], fi) => (
            <mesh key={fi} position={[fx, fy, fz]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={['#e8a0a0', '#e0c0a0', '#a0c0e0'][fi]} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// =================== WINDOW WITH FRAME (OPEN/CLOSE TOGGLE) ===================
function WindowWithView({ position, width, height }) {
  const leftPaneRef = useRef();
  const rightPaneRef = useRef();
  const [open, setOpen] = useState(false);
  const targetAngle = open ? Math.PI / 3 : 0;

  useFrame(() => {
    [leftPaneRef, rightPaneRef].forEach((ref) => {
      if (ref.current) {
        const cur = ref.current.rotation.y;
        const diff = targetAngle * (ref === leftPaneRef ? 1 : -1) - cur;
        if (Math.abs(diff) > 0.005) {
          ref.current.rotation.y += diff * 0.06;
        }
      }
    });
  });

  const paneW = width / 2 - 0.03;
  const glassMat = (
    <meshPhysicalMaterial
      color="#f0f5fa"
      transparent
      opacity={0.08}
      roughness={0.02}
      metalness={0.0}
      transmission={0.95}
      thickness={0.02}
      ior={1.5}
      envMapIntensity={0.3}
    />
  );

  return (
    <group position={position}>
      {/* Outer frame */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.07, 0.04, width + 0.08]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[0, -height / 2, 0]}>
        <boxGeometry args={[0.07, 0.04, width + 0.08]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, width / 2]}>
        <boxGeometry args={[0.07, height + 0.08, 0.04]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -width / 2]}>
        <boxGeometry args={[0.07, height + 0.08, 0.04]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      {/* Center vertical divider */}
      <mesh>
        <boxGeometry args={[0.06, height, 0.03]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>

      {/* Left glass pane — hinged on left edge, click to open/close */}
      <group position={[0, 0, -width / 4 - 0.015]} ref={leftPaneRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <group position={[0, 0, -paneW / 2]}>
          <mesh>
            <boxGeometry args={[0.02, height - 0.06, paneW]} />
            {glassMat}
          </mesh>
          {/* Pane frame */}
          <mesh>
            <boxGeometry args={[0.025, height - 0.04, paneW + 0.02]} />
            <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} wireframe />
          </mesh>
          {/* Handle */}
          <mesh position={[0.02, 0, paneW / 2 - 0.06]}>
            <boxGeometry args={[0.02, 0.08, 0.015]} />
            <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* Right glass pane — hinged on right edge */}
      <group position={[0, 0, width / 4 + 0.015]} ref={rightPaneRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <group position={[0, 0, paneW / 2]}>
          <mesh>
            <boxGeometry args={[0.02, height - 0.06, paneW]} />
            {glassMat}
          </mesh>
          <mesh>
            <boxGeometry args={[0.025, height - 0.04, paneW + 0.02]} />
            <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} wireframe />
          </mesh>
          <mesh position={[0.02, 0, -paneW / 2 + 0.06]}>
            <boxGeometry args={[0.02, 0.08, 0.015]} />
            <meshStandardMaterial color={PALETTE.metal} metalness={0.6} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* Window sill */}
      <mesh position={[0.06, -height / 2 - 0.02, 0]}>
        <boxGeometry args={[0.15, 0.04, width + 0.15]} />
        <meshStandardMaterial color={PALETTE.trim} roughness={0.5} />
      </mesh>
      {/* Curtains */}
      <mesh position={[0.06, 0.15, -width / 2 - 0.2]}>
        <boxGeometry args={[0.04, height + 0.5, 0.3]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.9} />
      </mesh>
      <mesh position={[0.06, 0.15, width / 2 + 0.2]}>
        <boxGeometry args={[0.04, height + 0.5, 0.3]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.9} />
      </mesh>
      {/* Curtain rod */}
      <mesh position={[0.08, height / 2 + 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, width + 0.8, 8]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// =================== DECORATIONS ===================
function WallArt({ position }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.8, 0.6, 0.03]} />
        <meshStandardMaterial color={PALETTE.furniture} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.05, 0.02]}>
        <circleGeometry args={[0.12, 12]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.05, 0.022]}>
        <circleGeometry args={[0.08, 12]} />
        <meshStandardMaterial color="#d4c5b0" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.2, 0.02]}>
        <boxGeometry args={[0.01, 0.15, 0.005]} />
        <meshStandardMaterial color="#8B7355" roughness={0.7} />
      </mesh>
    </group>
  );
}

function SconceLights({ position }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.04, 0.06, 0.15, 8]} />
        <meshStandardMaterial color={PALETTE.metal} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.1, 8]} />
        <meshStandardMaterial color="#fff8ee" roughness={0.3} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 0.15, 0.1]} intensity={0.3} color="#fff5e0" distance={2} />
    </group>
  );
}

// =================== TYPE TO 3D COMPONENT MAP ===================
const TYPE_TO_COMPONENT = {
  toilet: Toilet3D,
  sink: Sink3D,
  shower: Shower3D,
  bed: Bed,
  workStation: WorkStation3D,
  wardrobe: GlassWardrobe,
  tvDesk: TVDesk,
  vanity: VanityDesk,
  chair: Chair3D,
  nightstand: Nightstand3D,
  cabinetTable: CabinetTable3D,
};

// =================== MAIN 3D VIEW ===================
export default function RoomView3D({ furniture, onBack }) {
  const [showCeiling, setShowCeiling] = useState(false);

  const items3d = useMemo(() =>
    furniture.map((f) => ({
      ...f,
      pos3d: [
        f.x + f.width / 2 - ROOM_W / 2,
        0,
        f.y + f.height / 2 - ROOM_D / 2,
      ],
      rot3d: (f.rotation || 0) * Math.PI / 180,
    })),
  [furniture]);

  // Find structural items
  const windowItem = items3d.find(f => f.type === 'window');
  const doorItems = items3d.filter(f => f.type === 'door');
  const leftDoor = doorItems.find(f => f.wallMounted === 'left');
  const bottomDoor = doorItems.find(f => f.wallMounted === 'bottom');
  const wcZone = items3d.find(f => f.type === 'zone');
  const wcDoorItem = items3d.find(f => f.type === 'wcDoor');

  // Window 3D center on right wall
  const winCenter3d = windowItem ? [
    ROOM_W / 2,
    1.2,
    windowItem.y + windowItem.height / 2 - ROOM_D / 2,
  ] : null;

  // Furniture items (rendered via generic loop)
  const furnitureItems = items3d.filter(f =>
    !f.isZone && !['door', 'window', 'wcDoor', 'zone'].includes(f.type)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0d6cc]">
        <div>
          <h2 className="text-lg font-semibold text-[#4a3f35]">Bedroom 2 — 3D View</h2>
          <p className="text-sm text-[#8a7d72]">
            Neoclassical cream style • Orbit to explore • Scroll to zoom • Click doors/window to open
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCeiling(!showCeiling)}
            className={`px-4 py-2.5 font-medium rounded-lg shadow-sm border transition cursor-pointer ${
              showCeiling
                ? 'bg-[#8B7355] text-white border-[#8B7355]'
                : 'bg-white hover:bg-[#f5f0eb] text-[#4a3f35] border-[#d4c5b0]'
            }`}
          >
            {showCeiling ? '🏠 Show Ceiling' : '👁 Hide Ceiling'}
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-white hover:bg-[#f5f0eb] text-[#4a3f35] font-medium rounded-lg shadow-sm border border-[#d4c5b0] transition cursor-pointer"
          >
            ← Back to Floor Plan
          </button>
        </div>
      </div>

      <div className="flex-1">
        <Canvas
          camera={{ position: [2, 1.7, 5], fov: 60 }}
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        >
          <color attach="background" args={['#c8dae8']} />
          <ambientLight intensity={0.4} color="#fff5e6" />
          <directionalLight position={[5, 6, 3]} intensity={0.6} color="#fff8ee" castShadow />

          <OrbitControls
            target={[0, 1.0, 0]}
            maxPolarAngle={Math.PI * 0.85}
            minDistance={1}
            maxDistance={15}
            enableDamping
          />

          <Floor />
          {showCeiling && <Ceiling />}

          {/* Back wall */}
          <WallPanel position={[0, 0, -ROOM_D / 2]} rotation={[0, 0, 0]} width={ROOM_W} height={ROOM_H} />

          {/* Front wall */}
          {bottomDoor ? (
            <WallPanel
              position={[0, 0, ROOM_D / 2]}
              rotation={[0, Math.PI, 0]}
              width={ROOM_W}
              height={ROOM_H}
              hasHole
              holeX={-(bottomDoor.x + bottomDoor.width - ROOM_W / 2)}
              holeW={bottomDoor.width}
              holeH={2.1}
              holeY0={0}
            />
          ) : (
            <WallPanel position={[0, 0, ROOM_D / 2]} rotation={[0, Math.PI, 0]} width={ROOM_W} height={ROOM_H} />
          )}

          {/* Left wall (with door hole if door is on left wall) */}
          {leftDoor ? (
            <WallPanel
              position={[-ROOM_W / 2, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              width={ROOM_D}
              height={ROOM_H}
              hasHole
              holeX={leftDoor.y - ROOM_D / 2}
              holeW={leftDoor.height}
              holeH={2.1}
              holeY0={0}
            />
          ) : (
            <WallPanel position={[-ROOM_W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} width={ROOM_D} height={ROOM_H} />
          )}

          {/* Right wall (with window hole) */}
          {windowItem ? (
            <WallPanel
              position={[ROOM_W / 2, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              width={ROOM_D}
              height={ROOM_H}
              hasHole
              holeX={-(windowItem.y + windowItem.height - ROOM_D / 2)}
              holeW={windowItem.height}
              holeH={1.5}
              holeY0={0.5}
            />
          ) : (
            <WallPanel position={[ROOM_W / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} width={ROOM_D} height={ROOM_H} />
          )}

          {/* Window */}
          {winCenter3d && (
            <>
              <WindowWithView
                position={winCenter3d}
                width={windowItem.height}
                height={1.5}
              />
              <OutdoorScenery windowPos={winCenter3d} windowW={windowItem.height} windowH={1.5} />
            </>
          )}

          {/* Bedroom door on left wall */}
          {leftDoor && (
            <group
              position={[-ROOM_W / 2, 0, leftDoor.y + leftDoor.height / 2 - ROOM_D / 2]}
              rotation={[0, -Math.PI / 2, 0]}
            >
              <Door3D position={[0, 0, 0]} width={leftDoor.height} />
            </group>
          )}

          {/* Bedroom door on bottom wall */}
          {bottomDoor && (
            <Door3D
              position={[bottomDoor.x + bottomDoor.width / 2 - ROOM_W / 2, 0, ROOM_D / 2]}
              width={bottomDoor.width}
            />
          )}

          {/* WC Room */}
          {wcZone && (
            <WCRoom
              position={wcZone.pos3d}
              width={wcZone.width}
              depth={wcZone.height}
              doorOpeningX={wcDoorItem ? (wcDoorItem.x + wcDoorItem.width / 2) - (wcZone.x + wcZone.width / 2) : -0.2}
              doorOpeningW={wcDoorItem ? wcDoorItem.width : 0.6}
            />
          )}

          {/* WC Door */}
          {wcDoorItem && wcZone && (
            <WCDoor3D
              position={[
                wcDoorItem.x + wcDoorItem.width / 2 - ROOM_W / 2,
                0,
                wcZone.y + wcZone.height - ROOM_D / 2,
              ]}
              width={wcDoorItem.width}
            />
          )}

          {/* All furniture — generic type-based rendering */}
          {furnitureItems.map((item) => {
            const Component = TYPE_TO_COMPONENT[item.type];
            if (!Component) return null;
            const extraProps = {};
            if (item.type === 'sink') extraProps.sinkMode = item.sinkMode || 'single';
            return (
              <group key={item.id} position={item.pos3d} rotation={[0, item.rot3d, 0]}>
                <Component position={[0, 0, 0]} width={item.width} depth={item.height} {...extraProps} />
              </group>
            );
          })}

          {/* Wall art */}
          <WallArt position={[0, 1.8, -ROOM_D / 2 + 0.04]} />
          <SconceLights position={[-1.2, 1.5, -ROOM_D / 2 + 0.06]} />
          <SconceLights position={[1.2, 1.5, -ROOM_D / 2 + 0.06]} />

        </Canvas>
      </div>
    </div>
  );
}
