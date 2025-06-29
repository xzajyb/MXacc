/* eslint-disable react/no-unknown-property */
import * as THREE from 'three'
import { useRef, useState, useEffect, memo } from 'react'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import {
  useFBO,
  MeshTransmissionMaterial,
} from '@react-three/drei'
import { easing } from 'maath'

interface FluidGlassProps {
  mode?: 'lens' | 'bar' | 'cube'
  height?: number
  className?: string
  modeProps?: Record<string, any>
}

interface ModeProps {
  scale?: number
  ior?: number
  thickness?: number
  anisotropy?: number
  chromaticAberration?: number
  transmission?: number
  roughness?: number
  [key: string]: any
}

interface ModeWrapperProps {
  children: React.ReactNode
  geometry: THREE.BufferGeometry
  lockToBottom?: boolean
  followPointer?: boolean
  modeProps?: ModeProps
}

export default function FluidGlass({
  mode = 'lens',
  height = 128,
  className = '',
  ...props
}: FluidGlassProps) {
  return (
    <div 
      className={`relative ${className}`} 
      style={{ height: `${height}px` }}
    >
      <Canvas
        camera={{ position: [0, 0, 20], fov: 15 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <FluidGlassScene mode={mode} {...props} />
      </Canvas>
      
      {/* 粒子背景效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-blue-600/20 backdrop-blur-sm rounded-lg" />
    </div>
  )
}

const FluidGlassScene = memo(function FluidGlassScene({ 
  mode = 'lens', 
  modeProps = {} 
}: { 
  mode?: 'lens' | 'bar' | 'cube'
  modeProps?: ModeProps 
}) {
  const Wrapper = mode === 'bar' ? Bar : mode === 'cube' ? Cube : Lens
  
  return (
    <Wrapper modeProps={modeProps}>
      <Background />
    </Wrapper>
  )
})

const ModeWrapper = memo(function ModeWrapper({
  children,
  geometry,
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  ...props
}: ModeWrapperProps) {
  const ref = useRef<THREE.Mesh>(null)
  const buffer = useFBO()
  const { viewport: vp } = useThree()
  const [scene] = useState(() => new THREE.Scene())
  const mousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePos.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state, delta) => {
    const { gl, viewport, camera } = state
    const v = viewport.getCurrentViewport(camera, [0, 0, 15])

    if (ref.current) {
      // 鼠标跟随效果
      const destX = followPointer ? (mousePos.current.x * v.width) / 4 : 0
      const destY = lockToBottom
        ? -v.height / 2 + 0.5
        : followPointer
        ? (mousePos.current.y * v.height) / 4
        : 0
      
      easing.damp3(ref.current.position, [destX, destY, 0], 0.15, delta)
      
      // 自动旋转
      ref.current.rotation.x += delta * 0.2
      ref.current.rotation.y += delta * 0.1
      
      // 浮动动画
      ref.current.position.z = Math.sin(state.clock.elapsedTime) * 0.5
    }

    gl.setRenderTarget(buffer)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
  })

  const {
    scale = 1,
    ior = 1.5,
    thickness = 2,
    anisotropy = 0.1,
    chromaticAberration = 0.05,
    transmission = 0.9,
    roughness = 0.1,
    ...extraMat
  } = modeProps

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent opacity={0.8} />
      </mesh>
      <mesh
        ref={ref}
        scale={scale}
        geometry={geometry}
        {...props}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior}
          thickness={thickness}
          anisotropy={anisotropy}
          chromaticAberration={chromaticAberration}
          transmission={transmission}
          roughness={roughness}
          color="#ffffff"
          {...extraMat}
        />
      </mesh>
    </>
  )
})

function Lens({ modeProps, children }: { modeProps?: ModeProps; children?: React.ReactNode }) {
  const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32)
  
  return (
    <ModeWrapper
      geometry={geometry}
      followPointer
      modeProps={{
        scale: 1.2,
        ior: 1.5,
        thickness: 2,
        transmission: 0.9,
        ...modeProps
      }}
    >
      {children}
    </ModeWrapper>
  )
}

function Cube({ modeProps, children }: { modeProps?: ModeProps; children?: React.ReactNode }) {
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  
  return (
    <ModeWrapper
      geometry={geometry}
      followPointer
      modeProps={{
        scale: 1,
        ior: 1.4,
        thickness: 3,
        transmission: 0.85,
        ...modeProps
      }}
    >
      {children}
    </ModeWrapper>
  )
}

function Bar({ modeProps = {}, children }: { modeProps?: ModeProps; children?: React.ReactNode }) {
  const geometry = new THREE.BoxGeometry(4, 0.5, 1)
  
  const defaultMat = {
    transmission: 1,
    roughness: 0,
    thickness: 1,
    ior: 1.15,
    scale: 1.5,
  }

  return (
    <ModeWrapper
      geometry={geometry}
      lockToBottom
      followPointer={false}
      modeProps={{ ...defaultMat, ...modeProps }}
    >
      {children}
    </ModeWrapper>
  )
}

function Background() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -5]} scale={10}>
      <planeGeometry />
      <meshBasicMaterial 
        color="#4f46e5" 
        transparent 
        opacity={0.1}
      />
    </mesh>
  )
} 