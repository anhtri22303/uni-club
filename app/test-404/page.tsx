"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Test404Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center mb-6 text-slate-800 dark:text-white">
          404 Page Tester
        </h1>
        
        <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
          Choose a method to test the awesome 404 page:
        </p>

        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Method 1: Navigate to Non-existent Page</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Click the button below to navigate to a page that doesn't exist.
            </p>
            <Link href="/this-page-does-not-exist-at-all">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                🚀 Test 404 Page (Navigate)
              </Button>
            </Link>
          </div>

          <div className="p-6 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl border-2 border-cyan-200 dark:border-cyan-700">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Method 2: Manual URL</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Manually type any non-existent URL in the browser address bar, for example:
            </p>
            <div className="bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-300 dark:border-slate-600 mb-4">
              <code className="text-sm text-purple-600 dark:text-purple-400">
                http://localhost:3000/random-page-123
              </code>
            </div>
            <code className="text-sm text-purple-600 dark:text-purple-400 block bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-300 dark:border-slate-600">
              http://localhost:3000/space/lost-in-cosmos
            </code>
          </div>

          <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-700">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Method 3: Programmatic Navigation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Use router.push to navigate to a non-existent page.
            </p>
            <Button 
              onClick={() => router.push("/astronaut-lost-" + Math.random())}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              🌌 Random Non-existent Page
            </Button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-700">
          <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white flex items-center gap-2">
            <span>💡</span> Features to Test
          </h3>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
            <li>Floating astronaut with 3D perspective (move your mouse!)</li>
            <li>Twinkling stars in the background</li>
            <li>Floating planets with different animation speeds</li>
            <li>Animated control panel lights</li>
            <li>Blinking eyes and waving arm</li>
            <li>Gradient text animations</li>
            <li>Smooth hover effects on buttons</li>
            <li>Responsive design (try different screen sizes)</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="outline" className="border-2">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

