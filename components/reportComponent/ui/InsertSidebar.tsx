"use client"

import type { ElementType } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, BarChart3, Users, Calendar, Gift, ShoppingCart, UserCheck, Wallet, PieChart as PieChartIcon, CheckCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

type SidebarIcon = ElementType

type CustomSidebarItem = {
  label: string
  icon: SidebarIcon
  onClick: () => void
  disabled?: boolean
}

type CustomSidebarSection = {
  title: string
  items: CustomSidebarItem[]
}

type CustomSidebarContent = {
  tables: CustomSidebarSection[]
  charts: CustomSidebarSection[]
  hideTips?: boolean
}

type Props = {
  disabled?: boolean
  customContent?: CustomSidebarContent
  onMembersTable?: () => void
  onEventsTable?: () => void
  onGiftsTable?: () => void
  onOrdersTable?: () => void
  onApplicationsTable?: () => void
  onWalletTable?: () => void
  onFeedbackTable?: () => void
  onLeaveRequestsTable?: () => void
  onActivityScoresTable?: () => void
  onCoHostEventsTable?: () => void
  onAttendanceTable?: () => void
  onEventStaffTable?: () => void
  onMembersChart?: () => void
  onEventsChart?: () => void
  onGiftsChart?: () => void
  onOrdersChart?: () => void
  onApplicationsChart?: () => void
  onWalletChart?: () => void
}

function renderCustomSections(sections: CustomSidebarSection[], disabled?: boolean) {
  return sections.map((section, sectionIndex) => (
    <div key={section.title + sectionIndex} className="space-y-2 mb-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{section.title}</p>
      {section.items.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.label}
            type="button"
            variant="outline"
            className="w-full justify-start text-sm"
            disabled={disabled || item.disabled}
            onClick={item.onClick}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        )
      })}
      {sectionIndex < sections.length - 1 && <Separator className="my-2" />}
    </div>
  ))
}

export function InsertSidebar(props: Props) {
  const {
    disabled,
    customContent,
    onMembersTable,
    onEventsTable,
    onGiftsTable,
    onOrdersTable,
    onApplicationsTable,
    onWalletTable,
    onFeedbackTable,
    onLeaveRequestsTable,
    onActivityScoresTable,
    onCoHostEventsTable,
    onAttendanceTable,
    onEventStaffTable,
    onMembersChart,
    onEventsChart,
    onGiftsChart,
    onOrdersChart,
    onApplicationsChart,
    onWalletChart,
  } = props

  if (customContent) {
    return (
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-20 z-10">
          <Card className="p-4 shadow-lg max-h-[calc(100vh-100px)] overflow-y-auto">
            <h3 className="font-semibold mb-3 text-sm">Insert Data</h3>
            <Tabs defaultValue="tables" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="tables" className="text-xs">
                  <ClipboardList className="h-3 w-3 mr-1" />
                  Tables
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Charts
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tables" className="mt-0">
                {customContent.tables.length > 0 ? (
                  renderCustomSections(customContent.tables, disabled)
                ) : (
                  <p className="text-xs text-muted-foreground">No table data available.</p>
                )}
              </TabsContent>
              <TabsContent value="charts" className="mt-0">
                {customContent.charts.length > 0 ? (
                  renderCustomSections(customContent.charts, disabled)
                ) : (
                  <p className="text-xs text-muted-foreground">No chart data available.</p>
                )}
              </TabsContent>
            </Tabs>
            {!customContent.hideTips && (
              <>
                <Separator className="my-2" />
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Tips:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Click on pages to edit text directly</li>
                    <li>Select text & use toolbar to format</li>
                    <li>Use Ctrl+B/I/U for formatting</li>
                    <li>Auto-repaginates after editing</li>
                    <li>Download as PDF when ready</li>
                  </ul>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    )
  }

  if (
    !onMembersTable ||
    !onEventsTable ||
    !onGiftsTable ||
    !onOrdersTable ||
    !onApplicationsTable ||
    !onWalletTable ||
    !onMembersChart ||
    !onEventsChart ||
    !onGiftsChart ||
    !onOrdersChart ||
    !onApplicationsChart ||
    !onWalletChart
  ) {
    console.warn("InsertSidebar: default handlers are missing")
    return null
  }

  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-20 z-10">
        <Card className="p-4 shadow-lg max-h-[calc(100vh-100px)] overflow-y-auto">
          <h3 className="font-semibold mb-3 text-sm">Insert Data</h3>
          <Tabs defaultValue="tables" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="tables" className="text-xs">
                <ClipboardList className="h-3 w-3 mr-1" />
                Tables
              </TabsTrigger>
              <TabsTrigger value="charts" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Charts
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tables" className="mt-0">
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Core</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onMembersTable}>
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onEventsTable}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Products & Orders</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onGiftsTable}>
                  <Gift className="h-4 w-4 mr-2" />
                  Gifts/Products
                </Button>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onOrdersTable}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Redeem Orders
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Recruitment</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onApplicationsTable}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Applications
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Financial</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onWalletTable}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet & Points
                </Button>
              </div>
              {(onFeedbackTable || onLeaveRequestsTable || onActivityScoresTable || onCoHostEventsTable || onAttendanceTable || onEventStaffTable) && (
                <>
                  <Separator className="my-2" />
                  <div className="space-y-2 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Analytics</p>
                    {onFeedbackTable && (
                      <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onFeedbackTable}>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Feedbacks
                      </Button>
                    )}
                    {onActivityScoresTable && (
                      <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onActivityScoresTable}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Activity Scores
                      </Button>
                    )}
                    {onAttendanceTable && (
                      <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onAttendanceTable}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Attendance
                      </Button>
                    )}
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-2 mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Management</p>
                    {onLeaveRequestsTable && (
                      <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onLeaveRequestsTable}>
                        <Users className="h-4 w-4 mr-2" />
                        Leave Requests
                      </Button>
                    )}
                    {onCoHostEventsTable && (
                      <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onCoHostEventsTable}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Co-Host Events
                      </Button>
                    )}
                    {onEventStaffTable && (
                      <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onEventStaffTable}>
                        <Users className="h-4 w-4 mr-2" />
                        Event Staff
                      </Button>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
            <TabsContent value="charts" className="mt-0">
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Core</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onMembersChart}>
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Members Chart
                </Button>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onEventsChart}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Events Chart
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Products & Orders</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onGiftsChart}>
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Products Chart
                </Button>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onOrdersChart}>
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Orders Chart
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Recruitment</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onApplicationsChart}>
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Applications Chart
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Financial</p>
                <Button type="button" variant="outline" className="w-full justify-start text-sm" disabled={disabled} onClick={onWalletChart}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Wallet Chart
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          <Separator className="my-2" />
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Click on pages to edit text directly</li>
              <li>Select text & use toolbar to format</li>
              <li>Use Ctrl+B/I/U for formatting</li>
              <li>Auto-repaginates after editing</li>
              <li>Download as PDF when ready</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}


