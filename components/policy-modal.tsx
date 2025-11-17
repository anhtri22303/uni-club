"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PolicyModal({ isOpen, onClose }: PolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">📋 Policy & AI Usage Guide</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* AI Usage Policy */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">
                🤖 AI Chatbot Usage Policy
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>UniBot AI is designed to assist students, club leaders, and university staff in managing clubs and events within the platform.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>UniBot AI ONLY answers questions related to the university club management system and will not respond to unrelated topics.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Information provided is based on existing system data and may require additional verification.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>The AI chatbot does not store personal information from conversations.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Please do not share sensitive information or passwords with the chatbot.</span>
                </p>
              </div>
            </section>

            {/* Usage Guidelines */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
                📖 Usage Guidelines
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Students:</strong> Search for clubs by major, view club events, and browse available gifts.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Club Leaders:</strong> Get suggestions for new events, manage budgets, and view club gifts.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>University Staff:</strong> View membership statistics and evaluate club applications.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Use the suggestion menu (dropdown icon) to access common questions.</span>
                </p>
              </div>
            </section>

            {/* Data Privacy */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">
                🔒 Data Privacy
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>All data is encrypted and protected according to the highest security standards.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>Only authorized users can view information relevant to their role.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>Chat history is stored temporarily and will be deleted when the chatbot is closed.</span>
                </p>
              </div>
            </section>

            {/* Limitations */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-orange-600 dark:text-orange-400">
                ⚠️ Limitations & Notes
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>The AI chatbot may occasionally provide inaccurate or outdated information.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Always verify important information with official sources or administrators.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Response time may be slower during peak hours.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>For best results, ask clear and specific questions related to the platform.</span>
                </p>
              </div>
            </section>

            {/* Support */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">
                💬 Support & Feedback
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>If you encounter any issues, please contact technical support via email: uniclub.contacts@gmail.com</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Your feedback helps improve the service. Please submit feedback through the system.</span>
                </p>
              </div>
            </section>

            {/* Version Info */}
            <section className="pt-4 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                UniBot AI v1.0 • Powered by Groq AI • Last Updated: November 2025
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
