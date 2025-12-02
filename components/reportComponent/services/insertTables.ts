import { toast } from "sonner"
import { getMembersByClubId, getLeaveReq, type LeaveRequest } from "@/service/membershipApi"
import { getEventByClubId, getEventCoHost } from "@/service/eventApi"
import { getProducts } from "@/service/productApi"
import { getMemberApplyByClubId } from "@/service/memberApplicationApi"
import { getClubRedeemOrders } from "@/service/redeemApi"
import { getClubWallet, getClubToMemberTransactions } from "@/service/walletApi"
import { getFeedbackByClubId, type Feedback } from "@/service/feedbackApi"
import { getClubMemberActivity, getClubActivitySummary, type MemberActivityShortItem, type ClubActivitySummary } from "@/service/memberActivityReportApi"
import { fetchClubAttendanceHistory, type FetchClubAttendanceHistoryParams } from "@/service/attendanceApi"
import { getEventStaff, getEvaluateEventStaff, type EventStaff, type StaffEvaluation } from "@/service/eventStaffApi"

type AfterChange = () => void

function append(editorRef: React.RefObject<HTMLDivElement>, html: string, afterChange: AfterChange) {
  if (!editorRef.current) return
  editorRef.current.innerHTML += html + "<p><br></p>"
  setTimeout(() => afterChange(), 50)
}

export async function insertMembersData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    toast.loading("Loading members data...")
    const members = await getMembersByClubId(clubId)
    toast.dismiss()
    if (members.length === 0) {
      toast.info("No members found for this club")
      return
    }
    const totalMembers = members.length
    const activeMembers = members.filter((m: any) => m.state === "ACTIVE").length
    const leaderCount = members.filter((m: any) => m.clubRole === "LEADER" || m.clubRole === "VICE_LEADER").length
    const staffCount = members.filter((m: any) => m.staff === true).length
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Members</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Full Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Student Code</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Role</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>
    `
    members.forEach((member: any, index: number) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 150px;">${member.fullName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${member.studentCode}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${member.clubRole}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${member.state}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Membership Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Members:</strong> ${totalMembers}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Active Members:</strong> ${activeMembers}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Leadership Team:</strong> ${leaderCount}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Staff Members:</strong> ${staffCount}</p>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
    toast.success(`${members.length} members inserted`)
  } catch (error) {
    toast.dismiss()
    toast.error("Failed to insert members data")
  }
}

export async function insertEventsData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const events = await getEventByClubId(clubId)
    const totalEvents = events.length
    const approvedEvents = events.filter((e: any) => e.status === "APPROVED").length
    const ongoingEvents = events.filter((e: any) => e.status === "ONGOING").length
    const completedEvents = events.filter((e: any) => e.status === "COMPLETED").length
    const publicEvents = events.filter((e: any) => e.type === "PUBLIC").length
    const totalBudget = events.reduce((sum: number, e: any) => sum + (e.budgetPoints || 0), 0)
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Events</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Event Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Type</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Location</th>
            </tr>
          </thead>
          <tbody>
    `
    events.forEach((event: any, index: number) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 150px;">${event.name}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${event.date}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${event.type}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${event.status}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 120px;">${event.locationName}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Event Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Events:</strong> ${totalEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Approved Events:</strong> ${approvedEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Ongoing Events:</strong> ${ongoingEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Completed Events:</strong> ${completedEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Public Events:</strong> ${publicEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Budget:</strong> ${totalBudget.toLocaleString()} points</p>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
    toast.success(`${events.length} events inserted`)
  } catch {
    toast.error("Failed to insert events data")
  }
}

export async function insertGiftsData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const products = await getProducts(clubId, { includeInactive: true })
    const totalProducts = products.length
    const activeProducts = products.filter((p: any) => p.status === "ACTIVE").length
    const totalStock = products.reduce((sum: number, p: any) => sum + p.stockQuantity, 0)
    const avgPrice = products.length > 0 ? (products.reduce((sum: number, p: any) => sum + p.pointCost, 0) / products.length).toFixed(2) : 0
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Gifts/Products</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Product Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Type</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Point Cost</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Stock</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>
    `
    products.forEach((product: any, index: number) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 150px;">${product.name}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.type}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.pointCost}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.stockQuantity}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.status}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Product Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Products:</strong> ${totalProducts}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Active Products:</strong> ${activeProducts}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Stock:</strong> ${totalStock} units</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Average Price:</strong> ${avgPrice} points</p>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
  } catch {
    toast.error("Failed to insert gifts data")
  }
}

export async function insertApplicationsData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const applications = await getMemberApplyByClubId(clubId)
    const totalApplications = applications.length
    const pendingCount = applications.filter((a: any) => a.status === "PENDING").length
    const approvedCount = applications.filter((a: any) => a.status === "APPROVED").length
    const rejectedCount = applications.filter((a: any) => a.status === "REJECTED").length
    const approvalRate = totalApplications > 0 ? ((approvedCount / totalApplications) * 100).toFixed(1) : 0
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Membership Applications</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Applicant Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Student Code</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Applied Date</th>
            </tr>
          </thead>
          <tbody>
    `
  applications.forEach((app: any, index: number) => {
    const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
    html += `
      <tr style="background-color: ${bgColor};">
        <td style="border: 1px solid #d1d5db; padding: 8px;">${index + 1}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${app.applicantName}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${app.studentCode || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${app.status}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(app.createdAt).toLocaleDateString()}</td>
      </tr>
    `
  })
  html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Application Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Applications:</strong> ${totalApplications}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Pending:</strong> ${pendingCount}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Approved:</strong> ${approvedCount}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Rejected:</strong> ${rejectedCount}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Approval Rate:</strong> ${approvalRate}%</p>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
  } catch {
    toast.error("Failed to insert applications data")
  }
}

export async function insertOrdersData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const orders = await getClubRedeemOrders(clubId)
    const totalOrders = orders.length
    const completedOrders = orders.filter((o: any) => o.status === "COMPLETED").length
    const pendingOrders = orders.filter((o: any) => o.status === "PENDING").length
    const totalPointsRedeemed = orders.reduce((sum: number, o: any) => sum + o.totalPoints, 0)
    const avgOrderValue = totalOrders > 0 ? (totalPointsRedeemed / totalOrders).toFixed(2) : 0
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Redeem Orders</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Order Code</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Product</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Member</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Quantity</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Total Points</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>
    `
    orders.forEach((order: any, index: number) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px;">${order.orderCode}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${order.productName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${order.memberName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${order.quantity}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${order.totalPoints}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${order.status}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Order Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Orders:</strong> ${totalOrders}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Completed:</strong> ${completedOrders}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Pending:</strong> ${pendingOrders}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Points Redeemed:</strong> ${totalPointsRedeemed.toLocaleString()}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Average Order Value:</strong> ${avgOrderValue} points</p>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
  } catch {
    toast.error("Failed to insert orders data")
  }
}

export async function insertWalletData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    const wallet = await getClubWallet(clubId)
    const transactions = await getClubToMemberTransactions()
    const totalTransactions = transactions.length
    const totalPointsGiven = transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    const avgTransaction = totalTransactions > 0 ? (totalPointsGiven / totalTransactions).toFixed(2) : 0
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Wallet & Transactions</h2>
        <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #000000;">Wallet Balance</h3>
          <p style="font-size: 32px; font-weight: bold; color: #000000; margin: 10px 0;">${wallet.balancePoints.toLocaleString()} points</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Wallet ID:</strong> ${wallet.walletId}</p>
        </div>
        <h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px 0;">Recent Transactions</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Transaction ID</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Type</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Amount</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Receiver</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
            </tr>
          </thead>
          <tbody>
    `
    transactions.slice(0, 10).forEach((txn: any, index: number) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px;">#${txn.id}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${txn.type}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">+${txn.amount}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${txn.receiverName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(txn.createdAt).toLocaleDateString()}</td>
        </tr>
      `
    })
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Transaction Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Transactions:</strong> ${totalTransactions}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Points Distributed:</strong> ${totalPointsGiven.toLocaleString()}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Average Transaction:</strong> ${avgTransaction} points</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Current Balance:</strong> ${wallet.balancePoints.toLocaleString()} points</p>
        </div>
      </div>
    `
    append(editorRef, html, afterChange)
  } catch {
    toast.error("Failed to insert wallet data")
  }
}

export async function insertFeedbackData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    toast.loading("Loading feedback data...")
    const feedbacks = await getFeedbackByClubId(clubId)
    toast.dismiss()
    
    if (feedbacks.length === 0) {
      toast.info("No feedback found for this club")
      return
    }
    
    // Group feedbacks by event
    const eventGroups = new Map<number, { eventName: string; feedbacks: Feedback[]; avgRating: number }>()
    feedbacks.forEach((fb) => {
      if (!eventGroups.has(fb.eventId)) {
        eventGroups.set(fb.eventId, { eventName: fb.eventName, feedbacks: [], avgRating: 0 })
      }
      eventGroups.get(fb.eventId)!.feedbacks.push(fb)
    })
    
    // Calculate averages
    eventGroups.forEach((group) => {
      const sum = group.feedbacks.reduce((acc, fb) => acc + fb.rating, 0)
      group.avgRating = sum / group.feedbacks.length
    })
    
    const totalFeedbacks = feedbacks.length
    const avgRating = (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedbacks).toFixed(1)
    const excellentCount = feedbacks.filter(fb => fb.rating >= 4).length
    const poorCount = feedbacks.filter(fb => fb.rating <= 2).length
    
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Event Feedbacks</h2>
        <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Overall Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Feedbacks:</strong> ${totalFeedbacks}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Average Rating:</strong> ${avgRating} ⭐ / 5.0</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Excellent (≥4★):</strong> ${excellentCount} (${((excellentCount/totalFeedbacks)*100).toFixed(1)}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Poor (≤2★):</strong> ${poorCount} (${((poorCount/totalFeedbacks)*100).toFixed(1)}%)</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Event</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Rating</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Comment</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Member</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
            </tr>
          </thead>
          <tbody>
    `
    
    feedbacks.slice(0, 20).forEach((fb, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const stars = "⭐".repeat(fb.rating)
      const comment = fb.comment ? fb.comment.substring(0, 100) + (fb.comment.length > 100 ? "..." : "") : "No comment"
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; max-width: 120px; word-wrap: break-word;">${fb.eventName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${stars} (${fb.rating})</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; max-width: 200px; word-wrap: break-word;">${comment}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${fb.memberName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${new Date(fb.createdAt).toLocaleDateString()}</td>
        </tr>
      `
    })
    
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">By Event</h3>
    `
    
    Array.from(eventGroups.values()).slice(0, 5).forEach((group) => {
      html += `<p style="margin: 5px 0; font-size: 14px;"><strong>${group.eventName}:</strong> ${group.avgRating.toFixed(1)} ⭐ (${group.feedbacks.length} feedbacks)</p>`
    })
    
    html += `
        </div>
      </div>
    `
    
    append(editorRef, html, afterChange)
  } catch (error) {
    console.error("Failed to insert feedback data:", error)
    toast.error("Failed to insert feedback data")
  }
}

export async function insertLeaveRequestsData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    toast.loading("Loading leave requests...")
    const requests = await getLeaveReq(clubId)
    toast.dismiss()
    
    if (requests.length === 0) {
      toast.info("No leave requests found")
      return
    }
    
    const totalRequests = requests.length
    const pendingCount = requests.filter(r => r.status === "PENDING").length
    const approvedCount = requests.filter(r => r.status === "APPROVED").length
    const rejectedCount = requests.filter(r => r.status === "REJECTED").length
    
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Leave Requests</h2>
        <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Summary</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Requests:</strong> ${totalRequests}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Pending:</strong> ${pendingCount} (${((pendingCount/totalRequests)*100).toFixed(1)}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Approved:</strong> ${approvedCount} (${((approvedCount/totalRequests)*100).toFixed(1)}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Rejected:</strong> ${rejectedCount} (${((rejectedCount/totalRequests)*100).toFixed(1)}%)</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Member</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Role</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Reason</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
            </tr>
          </thead>
          <tbody>
    `
    
    requests.forEach((req, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const statusColor = req.status === "APPROVED" ? "#10b981" : req.status === "REJECTED" ? "#ef4444" : "#f59e0b"
      const reason = req.reason.substring(0, 80) + (req.reason.length > 80 ? "..." : "")
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${req.memberName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${req.memberRole}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; max-width: 250px; word-wrap: break-word;">${reason}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap; color: ${statusColor}; font-weight: 600;">${req.status}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${new Date(req.createdAt).toLocaleDateString()}</td>
        </tr>
      `
    })
    
    html += `
          </tbody>
        </table>
      </div>
    `
    
    append(editorRef, html, afterChange)
  } catch (error) {
    console.error("Failed to insert leave requests:", error)
    toast.error("Failed to insert leave requests")
  }
}

export async function insertActivityScoresData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    toast.loading("Loading activity scores...")
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    const activities = await getClubMemberActivity({ clubId, year, month })
    const summary = await getClubActivitySummary({ clubId, year, month })
    toast.dismiss()
    
    if (activities.length === 0) {
      toast.info("No activity data found for this month")
      return
    }
    
    // Sort by total score descending
    const sortedActivities = [...activities].sort((a, b) => b.totalScore - a.totalScore)
    const avgScore = (activities.reduce((sum, a) => sum + a.totalScore, 0) / activities.length).toFixed(2)
    const topScore = sortedActivities[0]?.totalScore || 0
    
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Member Activity Scores (${month}/${year})</h2>
        <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Overall Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Members:</strong> ${activities.length}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Average Score:</strong> ${avgScore} points</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Highest Score:</strong> ${topScore} points</p>
    `
    
    if (summary.memberOfMonth) {
      html += `<p style="margin: 5px 0; font-size: 14px;"><strong>🏆 Member of Month:</strong> ${summary.memberOfMonth.fullName} (${summary.memberOfMonth.totalScore} pts)</p>`
    }
    
    html += `
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Rank</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Student Code</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Events</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Sessions</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Penalties</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Total Score</th>
            </tr>
          </thead>
          <tbody>
    `
    
    sortedActivities.slice(0, 20).forEach((activity, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; white-space: nowrap;">${medal} ${index + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; max-width: 150px; word-wrap: break-word;">${activity.fullName}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${activity.studentCode}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${activity.totalApprovedEvents}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${activity.totalAttendedSessions}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: ${activity.totalPenaltyPoints > 0 ? '#ef4444' : '#6b7280'};">${activity.totalPenaltyPoints}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 600;">${activity.totalScore.toFixed(2)}</td>
        </tr>
      `
    })
    
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Performance Distribution</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Excellent (≥80 pts):</strong> ${sortedActivities.filter(a => a.totalScore >= 80).length} members</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Good (50-79 pts):</strong> ${sortedActivities.filter(a => a.totalScore >= 50 && a.totalScore < 80).length} members</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Average (20-49 pts):</strong> ${sortedActivities.filter(a => a.totalScore >= 20 && a.totalScore < 50).length} members</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Low (&lt;20 pts):</strong> ${sortedActivities.filter(a => a.totalScore < 20).length} members</p>
        </div>
      </div>
    `
    
    append(editorRef, html, afterChange)
  } catch (error) {
    console.error("Failed to insert activity scores:", error)
    toast.error("Failed to insert activity scores")
  }
}

export async function insertCoHostEventsData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    toast.loading("Loading co-host events...")
    const coHostEvents = await getEventCoHost(clubId)
    toast.dismiss()
    
    if (coHostEvents.length === 0) {
      toast.info("No co-host events found")
      return
    }
    
    const totalEvents = coHostEvents.length
    const approvedEvents = coHostEvents.filter((e: any) => e.status === "APPROVED").length
    const completedEvents = coHostEvents.filter((e: any) => e.status === "COMPLETED").length
    const ongoingEvents = coHostEvents.filter((e: any) => e.status === "ONGOING").length
    
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Co-Host Events</h2>
        <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Summary</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Co-Host Events:</strong> ${totalEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Approved:</strong> ${approvedEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Ongoing:</strong> ${ongoingEvents}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Completed:</strong> ${completedEvents}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Event Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Location</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>
    `
    
    coHostEvents.forEach((event: any, index: number) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const statusColor = 
        event.status === "COMPLETED" ? "#10b981" :
        event.status === "ONGOING" ? "#3b82f6" :
        event.status === "APPROVED" ? "#f59e0b" : "#6b7280"
      
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; max-width: 200px; word-wrap: break-word;">${event.name}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${event.location || "N/A"}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${new Date(event.startTime).toLocaleDateString()}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap; color: ${statusColor}; font-weight: 600;">${event.status}</td>
        </tr>
      `
    })
    
    html += `
          </tbody>
        </table>
      </div>
    `
    
    append(editorRef, html, afterChange)
  } catch (error) {
    console.error("Failed to insert co-host events:", error)
    toast.error("Failed to insert co-host events")
  }
}

export async function insertAttendanceData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    toast.loading("Loading attendance history...")
    
    // Get attendance data for the last 30 days
    const promises: Promise<any>[] = []
    const dates: string[] = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD
      dates.push(dateString)
      promises.push(
        fetchClubAttendanceHistory({ clubId, date: dateString })
          .then(response => ({ date: dateString, data: response.data }))
          .catch(() => ({ date: dateString, data: null }))
      )
    }
    
    const results = await Promise.all(promises)
    const validSessions = results.filter(r => r.data !== null && r.data.records && r.data.records.length > 0)
    
    toast.dismiss()
    
    if (validSessions.length === 0) {
      toast.info("No attendance records found in the last 30 days")
      return
    }
    
    // Calculate statistics
    let totalSessions = validSessions.length
    let totalRecords = 0
    let presentCount = 0
    let lateCount = 0
    let absentCount = 0
    let excusedCount = 0
    
    validSessions.forEach(session => {
      if (session.data && session.data.records) {
        session.data.records.forEach((record: any) => {
          totalRecords++
          if (record.status === "PRESENT") presentCount++
          else if (record.status === "LATE") lateCount++
          else if (record.status === "ABSENT") absentCount++
          else if (record.status === "EXCUSED") excusedCount++
        })
      }
    })
    
    const presentRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0"
    const lateRate = totalRecords > 0 ? ((lateCount / totalRecords) * 100).toFixed(1) : "0"
    const absentRate = totalRecords > 0 ? ((absentCount / totalRecords) * 100).toFixed(1) : "0"
    
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Attendance History (Last 30 Days)</h2>
        <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Overall Statistics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Sessions:</strong> ${totalSessions}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Records:</strong> ${totalRecords}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Present:</strong> ${presentCount} (${presentRate}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Late:</strong> ${lateCount} (${lateRate}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Absent:</strong> ${absentCount} (${absentRate}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Excused:</strong> ${excusedCount}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Present</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Late</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Absent</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Excused</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
    `
    
    validSessions.slice(0, 15).forEach((session, index) => {
      const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const records = session.data.records || []
      const present = records.filter((r: any) => r.status === "PRESENT").length
      const late = records.filter((r: any) => r.status === "LATE").length
      const absent = records.filter((r: any) => r.status === "ABSENT").length
      const excused = records.filter((r: any) => r.status === "EXCUSED").length
      const total = records.length
      
      const dateObj = new Date(session.date)
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      
      html += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${formattedDate}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #10b981; font-weight: 600;">${present}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #f59e0b;">${late}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #ef4444;">${absent}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; color: #6b7280;">${excused}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: 600;">${total}</td>
        </tr>
      `
    })
    
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Attendance Rate</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>🟢 On-Time Rate:</strong> ${presentRate}% (Present)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>🟡 Late Rate:</strong> ${lateRate}%</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>🔴 Absence Rate:</strong> ${absentRate}%</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Overall Participation:</strong> ${((presentCount + lateCount + excusedCount) / totalRecords * 100).toFixed(1)}%</p>
        </div>
      </div>
    `
    
    append(editorRef, html, afterChange)
  } catch (error) {
    console.error("Failed to insert attendance data:", error)
    toast.error("Failed to insert attendance data")
  }
}

export async function insertEventStaffData(clubId: number, editorRef: React.RefObject<HTMLDivElement>, afterChange: AfterChange) {
  try {
    toast.loading("Loading event staff data...")
    
    // Get all events for this club
    const events = await getEventByClubId(clubId)
    
    if (events.length === 0) {
      toast.dismiss()
      toast.info("No events found to get staff data")
      return
    }
    
    // Get staff and evaluations for each event
    const staffPromises = events.map((event: any) => 
      getEventStaff(event.id)
        .then(staff => ({ eventId: event.id, eventName: event.name, staff }))
        .catch(() => ({ eventId: event.id, eventName: event.name, staff: [] }))
    )
    
    const evaluationPromises = events.map((event: any) =>
      getEvaluateEventStaff(event.id)
        .then(evals => ({ eventId: event.id, evaluations: evals }))
        .catch(() => ({ eventId: event.id, evaluations: [] }))
    )
    
    const [staffResults, evaluationResults] = await Promise.all([
      Promise.all(staffPromises),
      Promise.all(evaluationPromises)
    ])
    
    toast.dismiss()
    
    // Filter events that have staff
    const eventsWithStaff = staffResults.filter(r => r.staff.length > 0)
    
    if (eventsWithStaff.length === 0) {
      toast.info("No staff assignments found for events")
      return
    }
    
    // Create evaluation map
    const evaluationMap = new Map<number, StaffEvaluation[]>()
    evaluationResults.forEach(r => {
      evaluationMap.set(r.eventId, r.evaluations)
    })
    
    // Calculate statistics
    const totalStaffAssignments = eventsWithStaff.reduce((sum, e) => sum + e.staff.length, 0)
    const totalEvaluations = evaluationResults.reduce((sum, r) => sum + r.evaluations.length, 0)
    const excellentCount = evaluationResults.reduce((sum, r) => 
      sum + r.evaluations.filter(e => e.performance === "EXCELLENT").length, 0
    )
    const goodCount = evaluationResults.reduce((sum, r) => 
      sum + r.evaluations.filter(e => e.performance === "GOOD").length, 0
    )
    const averageCount = evaluationResults.reduce((sum, r) => 
      sum + r.evaluations.filter(e => e.performance === "AVERAGE").length, 0
    )
    const poorCount = evaluationResults.reduce((sum, r) => 
      sum + r.evaluations.filter(e => e.performance === "POOR").length, 0
    )
    
    let html = `
      <div style="margin: 20px 0; page-break-inside: avoid;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Event Staff & Evaluations</h2>
        <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Overall Metrics</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Events with Staff:</strong> ${eventsWithStaff.length}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Staff Assignments:</strong> ${totalStaffAssignments}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Total Evaluations:</strong> ${totalEvaluations}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Event</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Staff Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Duty</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Performance</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">State</th>
            </tr>
          </thead>
          <tbody>
    `
    
    let rowIndex = 0
    eventsWithStaff.slice(0, 10).forEach(eventData => {
      const eventEvals = evaluationMap.get(eventData.eventId) || []
      const evalMap = new Map<number, StaffEvaluation>()
      eventEvals.forEach(ev => evalMap.set(ev.membershipId, ev))
      
      eventData.staff.forEach((staff: EventStaff) => {
        const bgColor = rowIndex % 2 === 0 ? "#ffffff" : "#f9fafb"
        const evaluation = evalMap.get(staff.membershipId)
        const performance = evaluation?.performance || "N/A"
        const performanceColor = 
          performance === "EXCELLENT" ? "#10b981" :
          performance === "GOOD" ? "#3b82f6" :
          performance === "AVERAGE" ? "#f59e0b" :
          performance === "POOR" ? "#ef4444" : "#6b7280"
        const stateColor = staff.state === "ACTIVE" ? "#10b981" : "#6b7280"
        
        html += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px; max-width: 150px; word-wrap: break-word;">${eventData.eventName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${staff.memberName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; max-width: 120px; word-wrap: break-word;">${staff.duty}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap; color: ${performanceColor}; font-weight: 600;">${performance}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap; color: ${stateColor};">${staff.state}</td>
          </tr>
        `
        rowIndex++
      })
    })
    
    html += `
          </tbody>
        </table>
        <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Performance Distribution</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>🌟 Excellent:</strong> ${excellentCount} (${totalEvaluations > 0 ? ((excellentCount/totalEvaluations)*100).toFixed(1) : 0}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>👍 Good:</strong> ${goodCount} (${totalEvaluations > 0 ? ((goodCount/totalEvaluations)*100).toFixed(1) : 0}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>👌 Average:</strong> ${averageCount} (${totalEvaluations > 0 ? ((averageCount/totalEvaluations)*100).toFixed(1) : 0}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>👎 Poor:</strong> ${poorCount} (${totalEvaluations > 0 ? ((poorCount/totalEvaluations)*100).toFixed(1) : 0}%)</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Evaluation Rate:</strong> ${totalStaffAssignments > 0 ? ((totalEvaluations/totalStaffAssignments)*100).toFixed(1) : 0}% (${totalEvaluations}/${totalStaffAssignments})</p>
        </div>
      </div>
    `
    
    append(editorRef, html, afterChange)
  } catch (error) {
    console.error("Failed to insert event staff data:", error)
    toast.error("Failed to insert event staff data")
  }
}




