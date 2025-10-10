"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Mail, MessageCircle } from "lucide-react"

const faqs = [
  {
    question: "How do I earn loyalty points?",
    answer:
      "You can earn loyalty points by attending club events, participating in activities, and completing challenges. Each event has a specific point value that you'll receive upon attendance.",
  },
    {
    question: "How do I join a club?",
    answer:
      "Navigate to the Clubs page, browse available clubs, and click 'Apply' on any club you're interested in. You'll need to provide a brief explanation of why you want to join. Club leaders will review and approve applications.",
  },
  {
    question: "What are the different membership tiers?",
    answer:
      "There are three tiers: Bronze (0-199 points), Silver (200-499 points), and Gold (500+ points). Higher tiers may unlock exclusive offers and benefits.",
  },
  {
    question: "How do I redeem vouchers?",
    answer:
      "Go to the Offers page, select an offer you can afford with your points, and click 'Redeem'. You'll receive a voucher code that you can use at the partner store. The code will be saved in your Wallet.",
  },
  {
    question: "Can I switch between different roles?",
    answer:
      "If you have multiple roles assigned to your account, you can switch between them using the role switcher in your profile menu or by visiting the Role Switcher page.",
  },
  {
    question: "How do I check my application status?",
    answer:
      "You can view all your club applications and their current status in the Activity History page. You'll also see when applications are approved or rejected.",
  },
]

export default function HelpPage() {
  return (
  <ProtectedRoute allowedRoles={["member", "club_leader", "uni_admin", "admin", "staff"]}>
      <AppShell>
        <div className="space-y-6 max-w-4xl">
          <div>
            <h1 className="text-3xl font-bold">Help & FAQ</h1>
            <p className="text-muted-foreground">Find answers to common questions about UniClub</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>Common questions and answers about using UniClub</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Need more help? Contact our support team:</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Email:</strong>
                      <br />
                      support@uniclub.uit.edu.vn
                    </div>
                    <div>
                      <strong>Hours:</strong>
                      <br />
                      Mon-Fri, 9:00 AM - 5:00 PM
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Check your Activity History to track progress</li>
                    <li>• Join multiple clubs to earn more points</li>
                    <li>• Redeem vouchers before they expire</li>
                    <li>• Keep your profile information updated</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
