import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Landmark } from '../gestures/GestureTypes'
import { useGameStore } from '../store/gameStore'
import * as THREE from 'three'

interface EnergyOrbProps {
  landmarks: Landmark[]
  pinchPower?: number
}

// Map normalized MediaPipe coords → Three.js world space
function mapLandmark(lm: Landmark) {
  const x = ((1 - lm.x) - 0.5) * 10
  const y = -(lm.y - 0.5) * 8
  return new THREE.Vector3(x, y, 0)
}

export function EnergyOrb({ landmarks, pinchPower = 0 }: EnergyOrbProps) {
  const orbRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Points>(null)
  const posRef = useRef(new THREE.Vector3(0, 0, 0))
  const trailIndex = useRef(0)
  const { settings } = useGameStore()
  const isLight = settings.theme === 'light'
  const trailGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3))
    return g
  }, [])

  // Colors based on theme
  const coreColor = isLight ? '#0077ff' : '#00e5ff'
  const glowColor = isLight ? '#5b21b6' : '#7c4dff'
  const trailColor = isLight ? '#60a5fa' : '#00ffb3'

  useFrame((_, delta) => {
    if (!orbRef.current || !glowRef.current) return

    let targetPos = posRef.current.clone()

    if (landmarks.length > 0) {
      // Use middle MCP (landmark 9) as the control point
      targetPos = mapLandmark(landmarks[9])
    }

    // LERP position – smooth damped movement (feel 'weighty' but responsive)
    const smoothing = 8 - (useGameStore.getState().settings.trackingSmoothing / 100) * 5
    posRef.current.lerp(targetPos, delta * smoothing)

    // Set orb position
    orbRef.current.position.copy(posRef.current)

    // Pulsing scale based on pinch power
    const baseScale = 1 + pinchPower * 0.6
    const pulse = Math.sin(Date.now() * 0.005) * 0.05 + 1
    orbRef.current.scale.setScalar(baseScale * pulse)
    glowRef.current.position.copy(posRef.current)
    glowRef.current.scale.setScalar(baseScale * pulse * 2.2)

    // Rotate
    orbRef.current.rotation.x += delta * 1.2
    orbRef.current.rotation.y += delta * 0.8

    // Trail: write current position into circular buffer
    const idx = (trailIndex.current % 60) * 3
    const pos = trailGeom.attributes.position as THREE.BufferAttribute
    pos.array[idx]     = posRef.current.x
    pos.array[idx + 1] = posRef.current.y
    pos.array[idx + 2] = posRef.current.z
    trailIndex.current++
    pos.needsUpdate = true
  })

  return (
    <group>
      {/* Orb core sphere */}
      <mesh ref={orbRef}>
        <icosahedronGeometry args={[0.35, 4]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={2 + pinchPower * 3}
          roughness={0}
          metalness={0.5}
          wireframe={pinchPower > 0.5}
        />
      </mesh>

      {/* Outer glow sphere (transparent) */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={1}
          transparent
          opacity={0.12 + pinchPower * 0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Energy trail particles */}
      <points ref={trailRef} geometry={trailGeom}>
        <pointsMaterial
          color={trailColor}
          size={0.06}
          sizeAttenuation
          transparent
          opacity={0.6}
        />
      </points>

      {/* Orb point light for scene illumination */}
      <pointLight
        position={posRef.current}
        color={coreColor}
        intensity={2 + pinchPower * 4}
        distance={6}
        decay={2}
      />
    </group>
  )
}
