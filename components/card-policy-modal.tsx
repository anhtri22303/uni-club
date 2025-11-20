"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CardPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CardPolicyModal({ isOpen, onClose }: CardPolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">🎨 Card Design Policy & Guidelines</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Card Design Guidelines */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
                🎯 Design Guidelines
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Cards should maintain a professional appearance while reflecting your club's identity.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Ensure QR codes are clearly visible and scannable for event check-ins.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Use high contrast colors to ensure text readability.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Club logo should be clear and centered for easy identification.</span>
                </p>
              </div>
            </section>

            {/* AI Assistant Usage */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">
                🤖 AI Design Assistant
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Use natural language to describe your design preferences (e.g., "Make it pink and orange").</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Quick suggestions provide instant design transformations.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>AI understands color names, patterns, styles, and layout preferences.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Experiment freely - you can always reset to default design.</span>
                </p>
              </div>
            </section>

            {/* Card Elements */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">
                📋 Card Elements
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Student Information:</strong> Name, student code, email, major, and role are displayed automatically.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>QR Code:</strong> Unique identifier for event check-ins and verification.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Club Logo:</strong> Represents club branding and identity.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span><strong>Background Pattern:</strong> Visual enhancement without compromising readability.</span>
                </p>
              </div>
            </section>

            {/* Customization Options */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-orange-600 dark:text-orange-400">
                🎨 Customization Options
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Colors:</strong> Choose from gradients or solid colors to match your club theme.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Patterns:</strong> Select from circles, hexagons, or waves for visual appeal.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Border Radius:</strong> Adjust card corners from sharp to fully rounded.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>QR Customization:</strong> Size and style options for optimal scanning.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Opacity Controls:</strong> Fine-tune transparency for patterns and background.</span>
                </p>
              </div>
            </section>

            {/* Best Practices */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">
                   Best Practices
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Test QR code scanning before finalizing design.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Save your design regularly to avoid losing changes.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Download high-quality versions for printing.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Maintain consistent branding across all club materials.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Use mobile preview to ensure cards look good on all devices.</span>
                </p>
              </div>
            </section>

            {/* Download & Share */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
                📥 Download & Share
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Standard Quality:</strong> Good for digital use and quick sharing.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>High Quality:</strong> Recommended for most purposes, balanced quality and size.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Ultra Quality:</strong> Best for printing and archival purposes.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>Share directly to social media or save to device.</span>
                </p>
              </div>
            </section>

            {/* Support */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-pink-600 dark:text-pink-400">
                💬 Support & Help
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">•</span>
                  <span>Need help? Use the AI Design Assistant for instant guidance.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">•</span>
                  <span>Contact technical support: support@uniclub.edu.vn</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">•</span>
                  <span>Report design issues or suggest improvements through the feedback system.</span>
                </p>
              </div>
            </section>

            {/* Version Info */}
            <section className="pt-4 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Card Designer v1.0 • AI-Powered Design • Last Updated: November 2025
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
