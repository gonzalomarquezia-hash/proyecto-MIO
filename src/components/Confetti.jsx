import { useEffect, useRef } from 'react'

const COLORS = ['#7c3aed', '#a78bfa', '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#c4b5fd']
const PARTICLE_COUNT = 80

export default function Confetti({ active, onComplete }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!active) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const particles = []
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -10 - Math.random() * 100,
                w: 6 + Math.random() * 6,
                h: 4 + Math.random() * 4,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: 2 + Math.random() * 4,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 8,
                opacity: 1
            })
        }

        let frame = 0
        const maxFrames = 150

        function animate() {
            frame++
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            let allDone = true
            particles.forEach(p => {
                p.x += p.vx
                p.vy += 0.05
                p.y += p.vy
                p.vx *= 0.99
                p.rotation += p.rotSpeed

                if (frame > maxFrames * 0.6) {
                    p.opacity = Math.max(0, p.opacity - 0.02)
                }

                if (p.opacity > 0 && p.y < canvas.height + 20) {
                    allDone = false
                    ctx.save()
                    ctx.globalAlpha = p.opacity
                    ctx.translate(p.x, p.y)
                    ctx.rotate((p.rotation * Math.PI) / 180)
                    ctx.fillStyle = p.color
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
                    ctx.restore()
                }
            })

            if (!allDone && frame < maxFrames) {
                requestAnimationFrame(animate)
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                onComplete?.()
            }
        }

        animate()
    }, [active, onComplete])

    if (!active) return null

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999
            }}
        />
    )
}
