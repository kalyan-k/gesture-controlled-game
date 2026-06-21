import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Landmark, GestureResult } from '../gestures/GestureTypes'
import { EnergyOrb } from './EnergyOrb'
import { useGameStore } from '../store/gameStore'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { audio } from '../hooks/useAudio'

interface GameSceneProps {
  landmarks: Landmark[]
  gestureResult: GestureResult
}

interface Target {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  active: boolean
}

const orbPos = new THREE.Vector3()

function mapLandmark(lm: Landmark) {
  const x = ((1 - lm.x) - 0.5) * 10
  const y = -(lm.y - 0.5) * 8
  return new THREE.Vector3(x, y, 0)
}

export function GameScene({ landmarks, gestureResult }: GameSceneProps) {
  const targetsRef = useRef<Target[]>([])
  const { addScore, takeDamage, level, chargeEnergy, recordSwipe } = useGameStore()
  const lastSpawnTime = useRef(0)
  const targetMeshesRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useRef(new THREE.Object3D())

  useFrame((state, delta) => {
    const gameState = useGameStore.getState().gameState

    // Only spawn and process targets while actively playing
    if (gameState !== 'playing') return

    const time = state.clock.getElapsedTime()
    const spawnRate = Math.max(0.5, 2 - level * 0.2)

    if (time - lastSpawnTime.current > spawnRate) {
      targetsRef.current.push({
        id: Math.random().toString(),
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          -20
        ),
        velocity: new THREE.Vector3(0, 0, 5 + level * 2),
        active: true,
      })
      lastSpawnTime.current = time
    }

    // Orb position (approximated; actual LERP lives in EnergyOrb)
    if (landmarks.length > 0) {
      const p = mapLandmark(landmarks[9])
      orbPos.copy(p)
    }

    for (let i = targetsRef.current.length - 1; i >= 0; i--) {
      const target = targetsRef.current[i]
      if (!target.active) continue

      target.position.addScaledVector(target.velocity, delta)

      let hit = false

      if (gestureResult.gesture.startsWith('swipe')) {
        if (target.position.z > -5 && target.position.z < 5) {
          const dist = target.position.distanceTo(orbPos)
          if (dist < 4) {
            hit = true
            addScore(10)
            recordSwipe(true)
            audio.playHit()
          }
        }
      } else if (gestureResult.gesture === 'smash') {
        if (target.position.z > -10 && target.position.z < 5) {
          hit = true
          addScore(10)
          audio.playSmash()
        }
      } else if (gestureResult.gesture === 'shield') {
        if (target.position.z > -2 && target.position.z < 2) {
          const dist = target.position.distanceTo(orbPos)
          if (dist < 5) {
            hit = true
            addScore(5)
            audio.playShield()
          }
        }
      }

      if (hit) {
        target.active = false
        continue
      }

      if (target.position.z > 5) {
        target.active = false
        takeDamage(10)
        useGameStore.getState().resetCombo()
        audio.playMiss()
      }
    }

    if (gestureResult.gesture === 'pinch') {
      chargeEnergy(delta * 20)
    }

    targetsRef.current = targetsRef.current.filter((t) => t.active)

    if (targetMeshesRef.current) {
      targetMeshesRef.current.count = targetsRef.current.length
      targetsRef.current.forEach((target, i) => {
        dummy.current.position.copy(target.position)
        dummy.current.rotation.x = time * 2
        dummy.current.rotation.y = time * 3
        dummy.current.updateMatrix()
        targetMeshesRef.current!.setMatrixAt(i, dummy.current.matrix)
      })
      targetMeshesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#00e5ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#7c4dff" />

      {/* Grid floor */}
      <gridHelper
        args={[100, 20, '#ffffff', '#ffffff']}
        position={[0, -5, 0]}
        material-opacity={0.05}
        material-transparent
      />

      {/* Targets */}
      <instancedMesh ref={targetMeshesRef} args={[undefined, undefined, 100]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color="#ff4d6d"
          emissive="#ff4d6d"
          emissiveIntensity={1.5}
          wireframe
        />
      </instancedMesh>

      {/* Energy Orb – replaces PlayerHand in gameplay */}
      <EnergyOrb landmarks={landmarks} pinchPower={gestureResult.pinchPower ?? 0} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.9} height={300} intensity={1.8} />
      </EffectComposer>
    </>
  )
}
