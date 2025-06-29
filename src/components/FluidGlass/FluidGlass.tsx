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

interface FluidGlassOverlayProps {
  isActive?: boolean
  className?: string
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

// 覆盖层背景组件
function OverlayBackground() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -2]} scale={5}>
      <planeGeometry />
      <meshBasicMaterial 
        color="#3b82f6" 
        transparent 
        opacity={0.05}
      />
    </mesh>
  )
}

// 覆盖层包装器
const OverlayWrapper = memo(function OverlayWrapper({
  children
}: {
  children: React.ReactNode
}) {
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
    const v = viewport.getCurrentViewport(camera, [0, 0, 10])

    if (ref.current) {
      // 轻微的鼠标跟随效果
      const destX = (mousePos.current.x * v.width) / 8
      const destY = (mousePos.current.y * v.height) / 8
      
      easing.damp3(ref.current.position, [destX, destY, 0], 0.1, delta)
      
      // 缓慢旋转
      ref.current.rotation.z += delta * 0.1
      
      // 轻微浮动
      ref.current.position.z = Math.sin(state.clock.elapsedTime * 2) * 0.2
    }

    gl.setRenderTarget(buffer)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
  })

  const geometry = new THREE.PlaneGeometry(3, 1, 32, 32)

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent opacity={0.6} />
      </mesh>
      <mesh
        ref={ref}
        scale={1.2}
        geometry={geometry}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={1.2}
          thickness={0.5}
          anisotropy={0.1}
          chromaticAberration={0.02}
          transmission={0.95}
          roughness={0.1}
          color="#ffffff"
        />
      </mesh>
    </>
  )
})

// 覆盖层场景组件
const OverlayScene = memo(function OverlayScene() {
  return (
    <OverlayWrapper>
      <OverlayBackground />
    </OverlayWrapper>
  )
})

// 用于菜单项覆盖的FluidGlass组件
export function FluidGlassOverlay({
  isActive = false,
  className = ''
}: FluidGlassOverlayProps) {
  if (!isActive) return null

  return (
    <div className={`absolute inset-0 overflow-hidden rounded-lg ${className}`}>
      {/* 3D Canvas 覆盖层 */}
      <div className="absolute inset-0 z-10">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 20 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: 'transparent' }}
        >
          <OverlayScene />
        </Canvas>
      </div>
      
      {/* 粒子效果 */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-blue-400/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random() * 1}s`,
            }}
          />
        ))}
      </div>
      
      {/* 毛玻璃背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/15 to-blue-600/10 backdrop-blur-[2px] rounded-lg" />
    </div>
  )
}

// 主背景组件
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

// 主要的ModeWrapper组件
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

// 几何形状组件
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

// 主场景组件
const FluidGlassScene = memo(function FluidGlassScene({ mode = 'lens', modeProps = {} }: { 
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

// 主要的FluidGlass组件
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