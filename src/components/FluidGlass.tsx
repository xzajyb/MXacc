/* eslint-disable react/no-unknown-property */
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

interface FluidGlassProps {
  mode?: 'lens' | 'bar' | 'cube'
  height?: number
  navItems?: Array<{ label: string; link: string }>
}

export default function FluidGlass({
  mode = 'lens',
  height = 200,
  navItems = [
    { label: '首页', link: '#home' },
    { label: '社交', link: '#social' },
    { label: '设置', link: '#settings' },
  ]
}: FluidGlassProps) {
  return (
    <div style={{ height: `${height}px`, position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <FluidGlassEffect mode={mode} navItems={navItems} />
      </Canvas>
    </div>
  )
}

function FluidGlassEffect({ mode, navItems }: { mode: string; navItems: Array<{ label: string; link: string }> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state, delta) => {
    if (meshRef.current) {
      // 跟随鼠标移动的玻璃效果
      meshRef.current.position.x = mousePosition.x * 2
      meshRef.current.position.y = mousePosition.y * 1
      
      // 旋转动画
      meshRef.current.rotation.x += delta * 0.1
      meshRef.current.rotation.y += delta * 0.15
    }
    
    if (groupRef.current) {
      // 轻微的上下浮动
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  const handleNavigate = (link: string) => {
    if (link.startsWith('#')) {
      const element = document.querySelector(link)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      window.location.href = link
    }
  }

  return (
    <group ref={groupRef}>
      {/* 主要的玻璃效果网格 */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        {mode === 'cube' ? (
          <boxGeometry args={[2, 2, 2]} />
        ) : mode === 'bar' ? (
          <boxGeometry args={[6, 0.8, 0.5]} />
        ) : (
          <cylinderGeometry args={[1, 1, 0.3, 32]} />
        )}
                 <meshPhysicalMaterial
           transmission={0.9}
           thickness={0.2}
           roughness={0}
           ior={1.5}
           clearcoat={1}
           clearcoatRoughness={0}
           color="#ffffff"
           transparent
           opacity={0.8}
         />
      </mesh>

      {/* 背景粒子效果 */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4 - 2
        ]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial 
            color={`hsl(${220 + Math.random() * 60}, 70%, 60%)`}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* 导航文字 */}
      {mode === 'bar' && navItems.map((item, index) => (
        <Text
          key={item.label}
          position={[
            (index - (navItems.length - 1) / 2) * 2,
            -2,
            1
          ]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          onClick={() => handleNavigate(item.link)}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          {item.label}
        </Text>
      ))}

      {/* 中心文字 */}
      <Text
        position={[0, 0, 2]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        MX Account
      </Text>
    </group>
  )
} 