import { toast } from "sonner"
import { getMembersByClubId } from "@/service/membershipApi"
import { getEventByClubId } from "@/service/eventApi"
import { getMemberApplyByClubId } from "@/service/memberApplicationApi"
import { getProducts } from "@/service/productApi"
import { getClubRedeemOrders } from "@/service/redeemApi"
import { generatePieChartSVG, generateBarChartSVG } from "@/components/reportComponent/utils/charts"

type AfterChange = () => void

function append(editorRef: React.RefObject<HTMLDivElement>, html: string, afterChange: AfterChange) {
  if (!editorRef.current) return
  editorRef.current.innerHTML += html + "<p><br></p>"
  setTimeout(() => afterChange(), 50)
}

export async function insertMembersChart(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const members = await getMembersByClubId(clubId)
    const leaderCount = members.filter((m: any) => m.clubRole === "LEADER").length
    const viceLeaderCount = members.filter((m: any) => m.clubRole === "VICE_LEADER").length
    const regularMembers = members.filter((m: any) => m.clubRole === "MEMBER").length
    const staffMembers = members.filter((m: any) => m.staff === true).length
    const chartData = [
      { name: "Leaders", value: leaderCount + viceLeaderCount, color: "#8b5cf6" },
      { name: "Members", value: regularMembers, color: "#22c55e" },
      { name: "Staff", value: staffMembers, color: "#3b82f6" },
    ].filter((item) => item.value > 0)
    const html = `
      <div style="margin: 25px 0; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Member Distribution by Role</h2>
        ${generatePieChartSVG(chartData)}
        <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Members:</strong> ${members.length}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Leadership:</strong> ${leaderCount + viceLeaderCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Regular:</strong> ${regularMembers}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Staff:</strong> ${staffMembers}</p>
          </div>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
    toast.success("Members chart inserted")
  } catch {
    toast.error("Failed to insert members chart")
  }
}

export async function insertEventsChart(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const events = await getEventByClubId(clubId)
    const approvedCount = events.filter((e: any) => e.status === "APPROVED").length
    const pendingCount = events.filter((e: any) => e.status === "PENDING_UNISTAFF" || e.status === "PENDING_COCLUB").length
    const rejectedCount = events.filter((e: any) => e.status === "REJECTED").length
    const chartData = [
      { name: "Approved", value: approvedCount, color: "#22c55e" },
      { name: "Pending", value: pendingCount, color: "#eab308" },
      { name: "Rejected", value: rejectedCount, color: "#ef4444" },
    ].filter((item) => item.value > 0)
    const html = `
      <div style="margin: 25px 0; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Events Overview</h2>
        ${generateBarChartSVG(chartData)}
        <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Events:</strong> ${events.length}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Approved:</strong> ${approvedCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Pending:</strong> ${pendingCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Rejected:</strong> ${rejectedCount}</p>
          </div>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
    toast.success("Events chart inserted")
  } catch {
    toast.error("Failed to insert events chart")
  }
}

export async function insertApplicationsChart(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const applications = await getMemberApplyByClubId(clubId)
    const approvedCount = applications.filter((a: any) => a.status === "APPROVED").length
    const pendingCount = applications.filter((a: any) => a.status === "PENDING").length
    const rejectedCount = applications.filter((a: any) => a.status === "REJECTED").length
    const approvalRate = applications.length > 0 ? ((approvedCount / applications.length) * 100).toFixed(1) : 0
    const chartData = [
      { name: "Approved", value: approvedCount, color: "#22c55e" },
      { name: "Pending", value: pendingCount, color: "#eab308" },
      { name: "Rejected", value: rejectedCount, color: "#ef4444" },
    ].filter((item) => item.value > 0)
    const html = `
      <div style="margin: 25px 0; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Application Status Distribution</h2>
        ${generatePieChartSVG(chartData)}
        <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total:</strong> ${applications.length}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Approved:</strong> ${approvedCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Pending:</strong> ${pendingCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Rejected:</strong> ${rejectedCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151; grid-column: 1 / -1;"><strong>Approval Rate:</strong> ${approvalRate}%</p>
          </div>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
    toast.success("Applications chart inserted")
  } catch {
    toast.error("Failed to insert applications chart")
  }
}

export async function insertGiftsChart(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const products = await getProducts(clubId, { includeInactive: true })
    const activeCount = products.filter((p: any) => p.status === "ACTIVE").length
    const inactiveCount = products.filter((p: any) => p.status === "INACTIVE").length
    const totalStock = products.reduce((sum: number, p: any) => sum + p.stockQuantity, 0)
    const avgPrice = products.length > 0 ? (products.reduce((sum: number, p: any) => sum + p.pointCost, 0) / products.length).toFixed(2) : 0
    const chartData = [
      { name: "Active", value: activeCount, color: "#22c55e" },
      { name: "Inactive", value: inactiveCount, color: "#94a3b8" },
    ].filter((item) => item.value > 0)
    const html = `
      <div style="margin: 25px 0; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Products Status Overview</h2>
        ${generatePieChartSVG(chartData)}
        <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Products:</strong> ${products.length}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Active:</strong> ${activeCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Inactive:</strong> ${inactiveCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Stock:</strong> ${totalStock}</p>
            <p style="margin: 0; font-size: 13px; color: #374151; grid-column: 1 / -1;"><strong>Avg Price:</strong> ${avgPrice} points</p>
          </div>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
    toast.success("Products chart inserted")
  } catch {
    toast.error("Failed to insert products chart")
  }
}

export async function insertOrdersChart(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const orders = await getClubRedeemOrders(clubId)
    const completedCount = orders.filter((o: any) => o.status === "COMPLETED").length
    const pendingCount = orders.filter((o: any) => o.status === "PENDING").length
    const cancelledCount = orders.filter((o: any) => o.status === "CANCELLED").length
    const totalPointsRedeemed = orders.reduce((sum: number, o: any) => sum + o.totalPoints, 0)
    const avgOrderValue = orders.length > 0 ? (totalPointsRedeemed / orders.length).toFixed(2) : 0
    const chartData = [
      { name: "Completed", value: completedCount, color: "#22c55e" },
      { name: "Pending", value: pendingCount, color: "#eab308" },
      { name: "Cancelled", value: cancelledCount, color: "#ef4444" },
    ].filter((item) => item.value > 0)
    const html = `
      <div style="margin: 25px 0; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Redeem Orders Status</h2>
        ${generatePieChartSVG(chartData)}
        <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Orders:</strong> ${orders.length}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Completed:</strong> ${completedCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Pending:</strong> ${pendingCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Cancelled:</strong> ${cancelledCount}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Points Redeemed:</strong> ${totalPointsRedeemed.toLocaleString()}</p>
            <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Avg Value:</strong> ${avgOrderValue} pts</p>
          </div>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
    toast.success("Orders chart inserted")
  } catch {
    toast.error("Failed to insert orders chart")
  }
}


