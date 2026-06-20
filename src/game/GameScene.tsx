import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Landmark, GestureResult } from '../gestures/GestureTypes'
import { PlayerHand } from './PlayerHand'
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
  type: 'basic'
  active: boolean
}

export function GameScene({ landmarks, gestureResult }: GameSceneProps) {
  const targetsRef = useRef<Target[]>([])
  const { addScore, takeDamage, level } = useGameStore()
  const lastSpawnTime = useRef(0)

  // Ref to target meshes for updating transforms
  const targetMeshesRef = useRef<THREE.InstancedMesh>(null)
  const dummy = new THREE.Object3D()

  const mapLandmark = (lm: Landmark) => {
    const x = ((1 - lm.x) - 0.5) * 10
    const y = -(lm.y - 0.5) * 8
    return new THREE.Vector3(x, y, 0)
  }

  useFrame((state, delta) => {
    // Spawn logic
    const time = state.clock.getElapsedTime()
    const spawnRate = Math.max(0.5, 2 - level * 0.2) // Spawns faster at higher levels
    
    if (time - lastSpawnTime.current > spawnRate) {
      targetsRef.current.push({
        id: Math.random().toString(),
        position: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, -20),
        velocity: new THREE.Vector3(0, 0, 5 + level * 2), // Move towards camera
        type: 'basic',
        active: true,
      })
      lastSpawnTime.current = time
    }

    // Hand Center for collision
    let handCenter = new THREE.Vector3(0, 0, 100)
    if (landmarks.length > 0) {
      handCenter = mapLandmark(landmarks[9]) // Middle finger MCP
    }

    // Update targets
    for (let i = targetsRef.current.length - 1; i >= 0; i--) {
      const target = targetsRef.current[i]
      if (!target.active) continue

      target.position.addScaledVector(target.velocity, delta)

      // Collision with hand/gestures
      let hit = false

      if (gestureResult.gesture.startsWith('swipe')) {
        // Broad phase collision for swipe (very simplified)
        if (target.position.z > -5 && target.position.z < 5) {
          const dist = target.position.distanceTo(handCenter)
          if (dist < 3) {
            hit = true
            addScore(10)
            audio.playHit()
          }
        }
      } else if (gestureResult.gesture === 'smash') {
        // Screen clear or radius damage
        if (target.position.z > -10 && target.position.z < 5) {
          hit = true
          addScore(10)
          audio.playSmash()
        }
      } else if (gestureResult.gesture === 'shield') {
        // Block
        if (target.position.z > -2 && target.position.z < 2) {
          const dist = target.position.distanceTo(handCenter)
          if (dist < 4) {
            hit = true // Deflected
            addScore(5)
            audio.playShield()
          }
        }
      }

      if (hit) {
        target.active = false
        continue
      }

      // Check if missed (went past camera)
      if (target.position.z > 5) {
        target.active = false
        takeDamage(10)
        useGameStore.getState().resetCombo()
        audio.playMiss()
      }
    }

    // Clean up inactive targets
    targetsRef.current = targetsRef.current.filter(t => t.active)

    // Update instanced mesh
    if (targetMeshesRef.current) {
      targetMeshesRef.current.count = targetsRef.current.length
      targetsRef.current.forEach((target, i) => {
        dummy.position.copy(target.position)
        
        // Rotate targets for some juice
        dummy.rotation.x = time * 2
        dummy.rotation.y = time * 3
        
        dummy.updateMatrix()
        targetMeshesRef.current!.setMatrixAt(i, dummy.matrix)
      })
      targetMeshesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00e5ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c4dff" />

      {/* Grid background for depth */}
      <gridHelper args={[100, 20, '#ffffff', '#ffffff']} position={[0, -5, 0]} rotation={[0, 0, 0]} material-opacity={0.1} material-transparent />

      {/* Instanced Targets */}
      <instancedMesh ref={targetMeshesRef} args={[undefined, undefined, 100]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#ff4d6d" emissive="#ff4d6d" emissiveIntensity={1.5} wireframe={true} />
      </instancedMesh>

      {/* Player Hand */}
      <PlayerHand landmarks={landmarks} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
      </EffectComposer>
    </>
  )
}
