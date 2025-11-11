import { toast } from "sonner"
import { getMembersByClubId } from "@/service/membershipApi"
import { getEventByClubId } from "@/service/eventApi"
import { getProducts } from "@/service/productApi"
import { getMemberApplyByClubId } from "@/service/memberApplicationApi"
import { getClubRedeemOrders } from "@/service/redeemApi"
import { getClubWallet, getClubToMemberTransactions } from "@/service/walletApi"

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


