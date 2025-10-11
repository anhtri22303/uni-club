"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AttendanceSession = {
  id: number
  name: string
  description: string
  startTime: string
  endTime: string
}

export default function AttendanceSessionPage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState("create")

  const handleCreateSession = () => {
    if (!name || !startTime || !endTime) return
    setCreating(true)
    setTimeout(() => {
      setSessions([
        ...sessions,
        {
          id: Date.now(),
          name,
          description,
          startTime,
          endTime,
        },
      ])
      setName("")
      setDescription("")
      setStartTime("")
      setEndTime("")
      setCreating(false)
    }, 600)
  }

  // Thống kê tổng số phiên và tổng thời lượng
  const totalSessions = sessions.length
  const totalDuration = sessions.reduce((sum, s) => {
    const start = new Date(s.startTime).getTime()
    const end = new Date(s.endTime).getTime()
    return sum + (end > start ? end - start : 0)
  }, 0)
  const totalDurationHours = Math.floor(totalDuration / (1000 * 60 * 60))
  const totalDurationMinutes = Math.floor((totalDuration / (1000 * 60)) % 60)

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Quản lý phiên chấm công</h1>
            <p className="text-muted-foreground">Tạo mới và xem thống kê các phiên chấm công cho sự kiện hoặc buổi học.</p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="create">Tạo phiên</TabsTrigger>
              <TabsTrigger value="stats">Thống kê</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <Card>
                <CardContent className="py-6 space-y-4">
                  <div>
                    <Label htmlFor="name">Tên phiên *</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên phiên chấm công" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả ngắn về phiên này (tuỳ chọn)" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="start">Bắt đầu *</Label>
                      <Input id="start" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="end">Kết thúc *</Label>
                      <Input id="end" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                    </div>
                  </div>
                  <Button onClick={handleCreateSession} disabled={creating || !name || !startTime || !endTime}>
                    {creating ? "Đang tạo..." : "Tạo phiên chấm công"}
                  </Button>
                </CardContent>
              </Card>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Danh sách phiên đã tạo</h2>
                {sessions.length === 0 ? (
                  <div className="text-muted-foreground">Chưa có phiên nào.</div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <Card key={session.id}>
                        <CardContent className="py-3">
                          <div className="font-medium">{session.name}</div>
                          <div className="text-sm text-muted-foreground">{session.description}</div>
                          <div className="text-xs mt-1">
                            <span>Bắt đầu: {new Date(session.startTime).toLocaleString()}</span> <br />
                            <span>Kết thúc: {new Date(session.endTime).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <Card>
                <CardContent className="py-6 space-y-4">
                  <div className="text-lg font-semibold">Tóm tắt chấm công</div>
                  <div className="flex gap-8 mb-4">
                    <div>
                      <div className="text-2xl font-bold">{totalSessions}</div>
                      <div className="text-muted-foreground">Tổng số phiên</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{totalDurationHours}h {totalDurationMinutes}m</div>
                      <div className="text-muted-foreground">Tổng thời lượng</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Danh sách phiên</div>
                    {sessions.length === 0 ? (
                      <div className="text-muted-foreground">Chưa có phiên nào.</div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.map(session => (
                          <div key={session.id} className="border rounded px-3 py-2">
                            <div className="font-semibold">{session.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
