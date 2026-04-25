import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// ─── Constants ──────────────────────────────────────────────────────────────
// formations.js coordinate system:
//   relativeX = goal-to-goal direction (GK ~8, forwards ~75) → maps to Z depth
//   relativeY = touchline-to-touchline direction (left ~15, right ~85) → maps to X width
const PITCH_LEN = 30;  // world units along Z axis (goal to goal)
const PITCH_WID = 20;  // world units along X axis (touchline to touchline)

// Convert relative % coords → world coords
const toWorld = (relX, relY) => ({
  x: (relY / 100) * PITCH_WID - PITCH_WID / 2,   // relY  → X (left–right / touchlines)
  z: (relX / 100) * PITCH_LEN - PITCH_LEN / 2,   // relX  → Z (depth / goal-to-goal)
});

// ─── Stripe ground ───────────────────────────────────────────────────────────
function PitchGround({ color1, color2 }) {
  const stripes = 10;
  const stripeLen = PITCH_LEN / stripes; // stripes run across the width, repeat along length

  return (
    <group>
      {/* Base plane (slightly larger for border effect) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[PITCH_WID + 4, PITCH_LEN + 4]} />
        <meshStandardMaterial color="#1a5c2b" />
      </mesh>

      {/* Alternating stripes — bands run left-right, repeat goal-to-goal */}
      {Array.from({ length: stripes }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, -PITCH_LEN / 2 + stripeLen * i + stripeLen / 2]}
          receiveShadow
        >
          <planeGeometry args={[PITCH_WID, stripeLen]} />
          <meshStandardMaterial color={i % 2 === 0 ? color1 : color2} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Pitch Lines ─────────────────────────────────────────────────────────────
function Line3D({ points, color = '#ffffff', lineWidth = 0.07 }) {
  return (
    <>
      {points.map(([ax, az, bx, bz], i) => {
        const cx = (ax + bx) / 2;
        const cz = (az + bz) / 2;
        const len = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2);
        const angle = Math.atan2(bx - ax, bz - az);
        return (
          <mesh key={i} position={[cx, 0.01, cz]} rotation={[0, angle, 0]}>
            <boxGeometry args={[lineWidth, 0.02, len]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </>
  );
}

function PitchMarkings({ lineColor }) {
  const hw = PITCH_WID / 2;   // half-width  (X axis)
  const hh = PITCH_LEN / 2;   // half-length (Z axis)
  const lw = 0.07;

  // Penalty box proportions relative to pitch dimensions
  const penBoxW = PITCH_WID * 0.55;   // spans ~55% of width
  const penBoxH = PITCH_LEN * 0.17;   // depth into pitch
  const gkBoxW = PITCH_WID * 0.32;
  const gkBoxH = PITCH_LEN * 0.06;

  const lines = [
    // Perimeter
    [-hw, -hh, hw, -hh],
    [hw, -hh, hw, hh],
    [hw, hh, -hw, hh],
    [-hw, hh, -hw, -hh],
    // Halfway line
    [-hw, 0, hw, 0],
    // Top penalty box
    [-penBoxW / 2, -hh, -penBoxW / 2, -hh + penBoxH],
    [-penBoxW / 2, -hh + penBoxH, penBoxW / 2, -hh + penBoxH],
    [penBoxW / 2, -hh + penBoxH, penBoxW / 2, -hh],
    // Top GK box
    [-gkBoxW / 2, -hh, -gkBoxW / 2, -hh + gkBoxH],
    [-gkBoxW / 2, -hh + gkBoxH, gkBoxW / 2, -hh + gkBoxH],
    [gkBoxW / 2, -hh + gkBoxH, gkBoxW / 2, -hh],
    // Bottom penalty box
    [-penBoxW / 2, hh, -penBoxW / 2, hh - penBoxH],
    [-penBoxW / 2, hh - penBoxH, penBoxW / 2, hh - penBoxH],
    [penBoxW / 2, hh - penBoxH, penBoxW / 2, hh],
    // Bottom GK box
    [-gkBoxW / 2, hh, -gkBoxW / 2, hh - gkBoxH],
    [-gkBoxW / 2, hh - gkBoxH, gkBoxW / 2, hh - gkBoxH],
    [gkBoxW / 2, hh - gkBoxH, gkBoxW / 2, hh],
  ];

  return (
    <group>
      <Line3D points={lines} color={lineColor} lineWidth={lw} />

      {/* Centre circle */}
      <CentreCircle color={lineColor} />

      {/* Centre dot */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
        <meshStandardMaterial color={lineColor} />
      </mesh>

      {/* Penalty spots */}
      <mesh position={[0, 0.02, -hh + PITCH_LEN * 0.12]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
        <meshStandardMaterial color={lineColor} />
      </mesh>
      <mesh position={[0, 0.02, hh - PITCH_LEN * 0.12]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
        <meshStandardMaterial color={lineColor} />
      </mesh>
    </group>
  );
}

function CentreCircle({ color, radius = 3, segments = 64 }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 1) / segments) * Math.PI * 2;
      pts.push([
        Math.sin(a1) * radius, Math.cos(a1) * radius,
        Math.sin(a2) * radius, Math.cos(a2) * radius,
      ]);
    }
    return pts;
  }, [radius, segments]);

  return <Line3D points={points} color={color} lineWidth={0.06} />;
}

// ─── Goal Posts ───────────────────────────────────────────────────────────────
function GoalPost({ z }) {
  const goalW = PITCH_WID * 0.22;  // goal width proportional to pitch width
  const postH = 1.0;
  const postR = 0.07;
  const flip = z < 0 ? 1 : -1;

  return (
    <group position={[0, 0, z]}>
      {/* Left post */}
      <mesh position={[-goalW / 2, postH / 2, 0]}>
        <cylinderGeometry args={[postR, postR, postH, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Right post */}
      <mesh position={[goalW / 2, postH / 2, 0]}>
        <cylinderGeometry args={[postR, postR, postH, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, postH, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[postR, postR, goalW, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Net (back plane) */}
      <mesh position={[0, postH / 2, flip * 0.6]}>
        <boxGeometry args={[goalW, postH, 0.04]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} wireframe />
      </mesh>
    </group>
  );
}

// ─── Player Token ─────────────────────────────────────────────────────────────
function PlayerToken({ player, teamColor, isSelected }) {
  const meshRef = useRef();
  const { x, z } = toWorld(player.relativeX, player.relativeY);

  // Skip bench / subs area (relativeY > 90)
  if (player.relativeY > 90) return null;

  // Bobbing animation for selected player
  useFrame((state) => {
    if (!meshRef.current) return;
    if (isSelected) {
      meshRef.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 4) * 0.08;
    } else {
      meshRef.current.position.y = 0.6;
    }
  });

  const jersey = teamColor || '#E63946';
  const isGK = player.positionStr === 'GK' || player.name === 'GK';
  const bodyColor = isGK ? '#f59e0b' : jersey;

  const shortName = player.name
    ? player.name.split(' ').pop().substring(0, 8).toUpperCase()
    : '';

  return (
    <group position={[x, 0, z]}>
      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color="#000000" transparent opacity={isSelected ? 0.35 : 0.2} />
      </mesh>

      {/* Body (capsule-style) */}
      <group ref={meshRef} position={[0, 0.6, 0]}>
        {/* Torso — jersey */}
        <RoundedBox args={[0.75, 0.9, 0.45]} radius={0.15} castShadow>
          <meshStandardMaterial color={bodyColor} metalness={0.1} roughness={0.7} />
        </RoundedBox>

        {/* Jersey number — on the front face of the shirt, always readable */}
        <Text
          position={[0, 0, 0.23]}
          rotation={[0, 0, 0]}
          fontSize={0.28}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.02}
          outlineColor="#00000066"
        >
          {player.number || ''}
        </Text>

        {/* Head */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshStandardMaterial color="#f5c9a0" roughness={0.8} />
        </mesh>

        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.55, 0.06, 8, 32]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
          </mesh>
        )}
      </group>

      {/* Name label */}
      <Text
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.03}
        outlineColor="#000000aa"
        maxWidth={2}
      >
        {shortName}
      </Text>
    </group>
  );
}

// ─── Ball ─────────────────────────────────────────────────────────────────────
function Ball({ ball }) {
  const ref = useRef();
  const { x, z } = toWorld(ball.relativeX, ball.relativeY);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 0.2 + Math.abs(Math.sin(state.clock.elapsedTime * 1.5)) * 0.08;
    }
  });

  return (
    <mesh ref={ref} position={[x, 0.2, z]} castShadow>
      <sphereGeometry args={[0.22, 24, 24]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} />
    </mesh>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ players, teamColors, uiConfig, selectedPlayerIds }) {
  const pitchColor1 = uiConfig.pitchColor1 || '#28803d';
  const pitchColor2 = uiConfig.pitchColor2 || '#2c8a42';
  const lineColor = uiConfig.pitchLineColor || '#ffffff';

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[8, 18, 8]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-6, 10, -8]} intensity={0.4} />

      {/* Pitch */}
      <PitchGround color1={pitchColor1} color2={pitchColor2} />
      <PitchMarkings lineColor={lineColor} />

      {/* Goals — placed at both ends of the Z (goal-to-goal) axis */}
      <GoalPost z={-PITCH_LEN / 2} />
      <GoalPost z={PITCH_LEN / 2} />

      {/* Players */}
      {players.map((p) => (
        <PlayerToken
          key={p.id}
          player={p}
          teamColor={p.team === 'away' ? teamColors.away : teamColors.home}
          isSelected={selectedPlayerIds.includes(p.id)}
        />
      ))}

      {/* Ball */}
      {uiConfig.showBall && <Ball ball={{ relativeX: 50, relativeY: 50 }} />}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={8}
        maxDistance={45}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Pitch3D({ players, teamColors, uiConfig, selectedPlayerIds }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a' }}>
      <Canvas
        shadows
        camera={{ position: [0, 22, 24], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <Scene
            players={players}
            teamColors={teamColors}
            uiConfig={uiConfig}
            selectedPlayerIds={selectedPlayerIds}
          />
        </Suspense>
      </Canvas>

      {/* Overlay hint */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '11px',
        fontWeight: '700',
        padding: '5px 14px',
        borderRadius: '20px',
        pointerEvents: 'none',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap'
      }}>
        🖱 Drag to orbit · Scroll to zoom · Right-drag to pan
      </div>
    </div>
  );
}
