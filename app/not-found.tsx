"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoverEffect, setHoverEffect] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [floatingIcons, setFloatingIcons] = useState<Array<{ id: number; icon: string; x: number; y: number; rotation: number; scale: number; delay: number }>>([])

  useEffect(() => {
    // Generate floating 3D club icons
    const clubIcons = ['🎨', '⚽', '🎵', '💻', '📚', '🎭', '🎮', '📷', '🏀', '🎸', '🎯', '🎪']
    const newIcons = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      icon: clubIcons[Math.floor(Math.random() * clubIcons.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.5,
      delay: Math.random() * 5,
    }))
    setFloatingIcons(newIcons)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const funnyMessages = [
    "Even our GPS can't find this page! 🗺️",
    "This club meeting was cancelled... permanently! 😅",
    "404: Club not found in the directory! 🔍",
    "Looks like this page joined the 'Hide & Seek' club! 🙈"
  ]

  const [message] = useState(funnyMessages[Math.floor(Math.random() * funnyMessages.length)])

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1)
    setHoverEffect(true)
    setTimeout(() => setHoverEffect(false), 500)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center">
      {/* Floating 3D club icons background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item) => (
          <div
            key={item.id}
            className="absolute text-6xl animate-float-3d opacity-30 dark:opacity-20"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `perspective(1000px) rotateX(${item.rotation}deg) rotateY(${item.rotation}deg) scale(${item.scale})`,
              animationDelay: `${item.delay}s`,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Animated gradient orbs for depth */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse-slower"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl animate-rotate-slow"></div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-6xl">
        {/* Giant 3D rotating "404" with club mascot */}
        <div 
          className="relative inline-block mb-12"
          style={{
            transform: `perspective(1500px) rotateX(${mousePosition.y * 8}deg) rotateY(${mousePosition.x * 8}deg)`,
            transition: "transform 0.2s ease-out",
          }}
        >
          {/* 3D "404" Number */}
          <div className="relative">
            <h1 
              className="text-[180px] md:text-[240px] font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 select-none leading-none"
              style={{
                textShadow: '8px 8px 0px rgba(37, 99, 235, 0.4), 16px 16px 0px rgba(8, 145, 178, 0.3), 24px 24px 0px rgba(16, 185, 129, 0.2)',
                filter: 'drop-shadow(0 25px 50px rgba(37, 99, 235, 0.5))',
              }}
            >
              404
            </h1>
            
            {/* Confused mascot sitting on "0" */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              onClick={handleLogoClick}
              style={{
                transform: `scale(${hoverEffect ? 1.2 : 1}) rotate(${clickCount * 360}deg)`,
                transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              }}
            >
              <div className="relative w-32 h-32 animate-bounce-gentle">
                {/* Mascot body */}
                <div className="relative w-full h-full">
                  {/* Head */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-2xl">
                    {/* Eyes - dizzy/confused */}
                    <div className="absolute top-6 left-4 text-2xl animate-spin-slow">✖️</div>
                    <div className="absolute top-6 right-4 text-2xl animate-spin-slow" style={{ animationDelay: "0.5s" }}>✖️</div>
                    {/* Mouth - wavy confused */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xl animate-wiggle">〰️</div>
                  </div>
                  {/* Body - UniClub shirt */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6">
                      <Image 
                        src="/images/logo_web.png" 
                        alt="UniClub" 
                        width={24} 
                        height={24}
                        className="opacity-90"
                      />
                    </div>
                  </div>
                  {/* Arms waving */}
                  <div className="absolute top-16 -left-8 w-6 h-12 bg-cyan-400 rounded-full transform -rotate-45 animate-wave-left"></div>
                  <div className="absolute top-16 -right-8 w-6 h-12 bg-cyan-400 rounded-full transform rotate-45 animate-wave-right"></div>
                </div>
                {/* Speech bubble */}
                {clickCount > 0 && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-xl border-2 border-blue-500 animate-pop-in">
                    <p className="text-sm font-bold text-blue-600 dark:text-cyan-400">
                      {clickCount === 1 && "Ouch! 😵"}
                      {clickCount === 2 && "Stop spinning me! 🌀"}
                      {clickCount === 3 && "I'm getting dizzy! 😵‍💫"}
                      {clickCount >= 4 && "WHEEEEEE! 🎢"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating question marks around */}
          <div className="absolute -top-10 -left-10 text-7xl animate-float-diagonal opacity-60">❓</div>
          <div className="absolute -top-10 -right-10 text-7xl animate-float-diagonal opacity-60" style={{ animationDelay: "0.7s" }}>❓</div>
          <div className="absolute -bottom-10 left-10 text-6xl animate-float-up opacity-50" style={{ animationDelay: "0.3s" }}>❓</div>
          <div className="absolute -bottom-10 right-10 text-6xl animate-float-up opacity-50" style={{ animationDelay: "1s" }}>❓</div>
        </div>

        {/* Humorous text content */}
        <div className="space-y-6">
          <h2 
            className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white mb-4 animate-slide-in-up"
            style={{
              textShadow: '3px 3px 0px rgba(37, 99, 235, 0.2)',
            }}
          >
            Whoops! Page Not Found! 🎯
          </h2>
          
          <p className="text-2xl md:text-3xl text-blue-600 dark:text-cyan-400 mb-2 animate-slide-in-up font-bold" style={{ animationDelay: "0.1s" }}>
            {message}
          </p>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            <p className="text-lg md:text-xl text-slate-700 dark:text-gray-300 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              Looks like this page decided to join the <span className="text-cyan-600 dark:text-cyan-400 font-bold">"Disappearing Acts"</span> club! 🎩✨
            </p>
            
            <p className="text-base md:text-lg text-slate-600 dark:text-gray-400 animate-slide-in-up italic" style={{ animationDelay: "0.3s" }}>
              We've sent our confused mascot to search everywhere - the library, cafeteria, even the secret gaming room... but no luck! 😅
            </p>
            
            <p className="text-sm md:text-base text-slate-500 dark:text-gray-500 animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
              💡 <span className="font-semibold">Pro tip:</span> Click on the confused mascot above to make them even more dizzy! 😵‍💫
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in-up mt-8" style={{ animationDelay: "0.5s" }}>
            <Link href="/">
              <Button 
                size="lg" 
                className="group text-lg px-12 py-8 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:from-blue-700 hover:via-cyan-600 hover:to-emerald-600 transform hover:scale-110 hover:-rotate-3 transition-all duration-300 shadow-2xl hover:shadow-blue-500/60 font-black text-white border-4 border-white/30"
              >
                <span className="flex items-center gap-2">
                  🏠 Take Me Home!
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Button>
            </Link>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.history.back()}
              className="text-lg px-12 py-8 border-4 border-cyan-500 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 transform hover:scale-110 hover:rotate-3 transition-all duration-300 shadow-xl font-black backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                ← Escape!
              </span>
            </Button>
          </div>

          {/* Fun club-themed info cards */}
          <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Fun fact card */}
            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 backdrop-blur-md rounded-3xl border-2 border-blue-300 dark:border-blue-500/40 animate-slide-in-up shadow-xl transform hover:scale-105 transition-all duration-300" style={{ animationDelay: "0.6s" }}>
              <div className="text-5xl mb-4 animate-bounce-gentle">🎓</div>
              <p className="text-lg font-bold text-blue-600 dark:text-cyan-400 mb-2">Did You Know?</p>
              <p className="text-sm text-slate-700 dark:text-gray-300">
                The first 404 error originated at CERN! Tim Berners-Lee's office (the inventor of the Web) was in room 404! 🏢
              </p>
            </div>

            {/* Club suggestion card */}
            <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:to-cyan-500/20 backdrop-blur-md rounded-3xl border-2 border-emerald-300 dark:border-emerald-500/40 animate-slide-in-up shadow-xl transform hover:scale-105 transition-all duration-300" style={{ animationDelay: "0.7s" }}>
              <div className="text-5xl mb-4 animate-wiggle">🎪</div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">Lost & Confused?</p>
              <p className="text-sm text-slate-700 dark:text-gray-300">
                No worries! Head back to our Club Hub and discover amazing student clubs waiting for you! 🚀
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-3d {
          0%, 100% { 
            transform: perspective(1000px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg);
          }
          25% { 
            transform: perspective(1000px) translateY(-30px) translateZ(50px) rotateX(15deg) rotateY(15deg);
          }
          50% { 
            transform: perspective(1000px) translateY(-50px) translateZ(100px) rotateX(0deg) rotateY(30deg);
          }
          75% { 
            transform: perspective(1000px) translateY(-30px) translateZ(50px) rotateX(-15deg) rotateY(15deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }

        @keyframes rotate-slow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg) translateX(0px); }
          25% { transform: rotate(-5deg) translateX(-3px); }
          75% { transform: rotate(5deg) translateX(3px); }
        }

        @keyframes wave-left {
          0%, 100% { transform: rotate(-45deg); }
          50% { transform: rotate(-25deg); }
        }

        @keyframes wave-right {
          0%, 100% { transform: rotate(45deg); }
          50% { transform: rotate(65deg); }
        }

        @keyframes pop-in {
          0% { 
            opacity: 0; 
            transform: translate(-50%, 10px) scale(0.5); 
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, 0) scale(1); 
          }
        }

        @keyframes float-diagonal {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.6;
          }
          50% { 
            transform: translate(-20px, -20px) rotate(10deg);
            opacity: 1;
          }
        }

        @keyframes float-up {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg);
            opacity: 0.5;
          }
          50% { 
            transform: translateY(-30px) rotate(-10deg);
            opacity: 1;
          }
        }

        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float-3d {
          animation: float-3d 8s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }

        .animate-rotate-slow {
          animation: rotate-slow 30s linear infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }

        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }

        .animate-wave-left {
          animation: wave-left 1.5s ease-in-out infinite;
        }

        .animate-wave-right {
          animation: wave-right 1.5s ease-in-out infinite 0.2s;
        }

        .animate-pop-in {
          animation: pop-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        .animate-float-diagonal {
          animation: float-diagonal 4s ease-in-out infinite;
        }

        .animate-float-up {
          animation: float-up 3s ease-in-out infinite;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

