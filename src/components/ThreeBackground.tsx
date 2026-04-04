import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Animated floating particles + geometric shapes behind the hero section.
export function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0) // transparent
    mount.appendChild(renderer.domElement)

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 200)
    camera.position.z = 30

    // ── Helpers ───────────────────────────────────────────────────────────────
    const rand = (min: number, max: number) => Math.random() * (max - min) + min

    // ── Particle cloud ────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 180
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = rand(-40, 40)
      positions[i * 3 + 1] = rand(-30, 30)
      positions[i * 3 + 2] = rand(-20, 5)
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x6366f1,
      size: 0.22,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ── Floating geometric shapes ─────────────────────────────────────────────
    type ShapeObj = {
      mesh: THREE.Mesh
      rotSpeed: THREE.Vector3
      floatSpeed: number
      floatAmplitude: number
      floatOffset: number
    }

    const shapes: ShapeObj[] = []
    const palette = [0x6366f1, 0x818cf8, 0xa78bfa, 0xf472b6, 0x34d399, 0xfbbf24]

    const geometries = [
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.IcosahedronGeometry(1.0, 0),
      new THREE.TetrahedronGeometry(1.3, 0),
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.TetrahedronGeometry(1.0, 0),
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.IcosahedronGeometry(0.8, 0),
    ]

    geometries.forEach((geo, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        color: palette[idx % palette.length],
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(rand(-28, 28), rand(-18, 18), rand(-15, 0))
      mesh.rotation.set(rand(0, Math.PI), rand(0, Math.PI), rand(0, Math.PI))
      scene.add(mesh)
      shapes.push({
        mesh,
        rotSpeed: new THREE.Vector3(rand(0.002, 0.007), rand(0.002, 0.007), rand(0.001, 0.005)),
        floatSpeed: rand(0.3, 0.8),
        floatAmplitude: rand(0.4, 1.2),
        floatOffset: rand(0, Math.PI * 2),
      })
    })

    // ── Animation loop ────────────────────────────────────────────────────────
    let frameId: number
    let t = 0

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      t += 0.01

      particles.rotation.y += 0.0008
      particles.rotation.x += 0.0003

      shapes.forEach((s) => {
        s.mesh.rotation.x += s.rotSpeed.x
        s.mesh.rotation.y += s.rotSpeed.y
        s.mesh.rotation.z += s.rotSpeed.z
        s.mesh.position.y += Math.sin(t * s.floatSpeed + s.floatOffset) * 0.005
      })

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize handler ────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Mouse parallax ────────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = -(e.clientY / window.innerHeight - 0.5) * 2
      camera.position.x += (nx * 3 - camera.position.x) * 0.04
      camera.position.y += (ny * 2 - camera.position.y) * 0.04
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
