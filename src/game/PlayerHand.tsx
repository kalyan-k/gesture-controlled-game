import { useRef } from 'react'
import type { Landmark } from '../gestures/GestureTypes'
import * as THREE from 'three'

interface PlayerHandProps {
  landmarks: Landmark[]
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // Pinky & Palm base
]

export function PlayerHand({ landmarks }: PlayerHandProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Mapping MediaPipe coordinates to Three.js space
  // MP: x [0, 1] left to right, y [0, 1] top to bottom
  // 3D: We map to a viewport plane roughly z=0, x from -5 to 5, y from 4 to -4
  const mapLandmark = (lm: Landmark) => {
    // scale-x-[-1] for mirrored webcam
    const x = ((1 - lm.x) - 0.5) * 10
    const y = -(lm.y - 0.5) * 8
    const z = -lm.z * 10 // scale z depth
    return new THREE.Vector3(x, y, z)
  }

  return (
    <group ref={groupRef}>
      {landmarks.length > 0 && (
        <>
          {/* Draw joints */}
          {landmarks.map((lm, i) => {
            const pos = mapLandmark(lm)
            return (
              <mesh key={`joint-${i}`} position={pos}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color="#00ffb3" emissive="#00ffb3" emissiveIntensity={2} />
              </mesh>
            )
          })}
          
          {/* Draw bones (simplified via lines) */}
          <lineSegments>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                count={HAND_CONNECTIONS.length * 2}
                args={[
                  new Float32Array(
                    HAND_CONNECTIONS.flatMap(([start, end]) => {
                      const p1 = mapLandmark(landmarks[start])
                      const p2 = mapLandmark(landmarks[end])
                      return [p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]
                    })
                  ),
                  3
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color="#00e5ff" linewidth={2} />
          </lineSegments>
        </>
      )}
    </group>
  )
}
