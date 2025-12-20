import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type ColorBendsProps = {
  className?: string
  style?: React.CSSProperties
  speed?: number
  colors?: string[]
  mouseInfluence?: number
}

// Prism-like rainbow shader with clean light refraction bands
const frag = `
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;

varying vec2 vUv;

// HSV to RGB conversion for smooth rainbow
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed;
  
  // Mouse influence for subtle light beam shift
  vec2 mouseOffset = (uMouse - 0.5) * uMouseInfluence * 0.15;
  
  // Create clean diagonal prism bands (like light through a prism)
  // Diagonal from top-left to bottom-right
  float diagonal = uv.x * 0.7 + uv.y * 0.3;
  
  // Add very subtle wave motion
  diagonal += sin(uv.y * 2.0 + t * 0.5) * 0.03;
  diagonal += cos(uv.x * 1.5 - t * 0.3) * 0.02;
  
  // Mouse shifts the light angle
  diagonal += mouseOffset.x * 0.5 + mouseOffset.y * 0.3;
  
  // Slow rotation of the spectrum
  float hue = fract(diagonal * 1.2 + t * 0.05);
  
  // Clean, vibrant colors
  float saturation = 0.9;
  float brightness = 0.95;
  
  vec3 color = hsv2rgb(vec3(hue, saturation, brightness));
  
  gl_FragColor = vec4(color, 1.0);
}
`

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

export default function ColorBends({
  className,
  style,
  speed = 0.2,
  mouseInfluence = 0.5,
}: ColorBendsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(0.5, 0.5))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const geometry = new THREE.PlaneGeometry(2, 2)

    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseInfluence: { value: mouseInfluence },
      },
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const clock = new THREE.Clock()

    const handleResize = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      renderer.setSize(w, h, false)
      material.uniforms.uResolution.value.set(w, h)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = 1 - (e.clientY - rect.top) / rect.height
      mouseRef.current.set(x, y)
    }
    container.addEventListener('mousemove', handleMouseMove)

    const loop = () => {
      const elapsed = clock.getElapsedTime()
      material.uniforms.uTime.value = elapsed

      // Smooth mouse interpolation
      const currentMouse = material.uniforms.uMouse.value as THREE.Vector2
      currentMouse.lerp(mouseRef.current, 0.05)

      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousemove', handleMouseMove)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (
        renderer.domElement &&
        renderer.domElement.parentElement === container
      ) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [speed, mouseInfluence])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className || ''}`}
      style={style}
    />
  )
}
