import { RefObject } from "react"
import {
  getClubMemberActivity,
  getClubMemberActivityLive,
  getClubActivitySummary,
  MemberActivityShortItem,
  MemberActivityFullScore,
  ClubActivitySummary,
} from "@/service/memberActivityReportApi"

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const getClubIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem("accessToken")
    if (!token) return null
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.clubId || null
  } catch (error) {
    console.error("Error getting club ID from token:", error)
    return null
  }
}

const getCurrentYearMonth = () => {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

const insertContentToEditor = (
  editorRef: RefObject<HTMLDivElement>,
  content: string,
  afterChange?: () => void
) => {
  if (!editorRef.current) {
    console.error("❌ editorRef.current is null!")
    return
  }

  console.log("📌 Appending content to editorRef.innerHTML...")
  // Append content directly to innerHTML instead of using execCommand
  editorRef.current.innerHTML += content

  console.log("📌 Current editorRef.innerHTML length:", editorRef.current.innerHTML.length)

  if (afterChange) {
    console.log("📌 Calling afterChange callback...")
    afterChange()
  }
}

// ==========================================
// TABLE 1: Member Activity History (Short)
// ==========================================

export const insertMemberActivityHistoryTable = async (
  clubId: number,
  editorRef: RefObject<HTMLDivElement>,
  afterChange?: () => void
) => {
  const { year, month } = getCurrentYearMonth()

  try {
    const data: MemberActivityShortItem[] = await getClubMemberActivity({
      clubId,
      year,
      month,
    })

    if (!data || data.length === 0) {
      insertContentToEditor(
        editorRef,
        `<p><em>No member activity data found for ${month}/${year}.</em></p>`,
        afterChange
      )
      return
    }

    const tableHTML = `
      <h3 style="margin-bottom: 12px; color: #000;">Member Activity Report - ${month}/${year}</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; border: 2px solid #000;">
        <thead style="background-color: #333; color: white;">
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #000;">No.</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #000;">Full Name</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #000;">Student Code</th>
            <th style="text-align: center; padding: 8px; border: 1px solid #000;">Events Registered</th>
            <th style="text-align: center; padding: 8px; border: 1px solid #000;">Events Attended</th>
            <th style="text-align: center; padding: 8px; border: 1px solid #000;">Penalty Points</th>
            <th style="text-align: center; padding: 8px; border: 1px solid #000;">Staff Count</th>
            <th style="text-align: center; padding: 8px; border: 1px solid #000;">Sessions Present</th>
            <th style="text-align: center; padding: 8px; border: 1px solid #000;">Final Score</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (item, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#f5f5f5' : 'white'};">
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;">${index + 1}</td>
              <td style="padding: 5px; border: 1px solid #ccc;">${item.fullName}</td>
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;">${item.studentCode}</td>
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;">${item.totalEventRegistered}</td>
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;">${item.totalEventAttended}</td>
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;">${item.totalPenaltyPoints}</td>
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;">${item.totalStaffCount}</td>
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;">${item.totalClubPresent}/${item.totalClubSessions}</td>
              <td style="text-align: center; padding: 5px; border: 1px solid #ccc;"><strong>${item.finalScore.toFixed(0)}</strong></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <p style="font-size: 9pt; color: #333;"><em>Total Members: ${data.length}</em></p>
    `

    insertContentToEditor(editorRef, tableHTML, afterChange)
  } catch (error: any) {
    console.error("Error inserting member activity history:", error)
    alert(`Failed to load member activity data: ${error.message}`)
  }
}

// ==========================================
// TABLE 2: Live Member Activity (Full Score Details)
// ==========================================

export const insertMemberActivityLiveTable = async (
  clubId: number,
  editorRef: RefObject<HTMLDivElement>,
  afterChange?: () => void
) => {
  try {
    console.log("🔍 Calling getClubMemberActivityLive with clubId:", clubId)
    const data: MemberActivityFullScore[] = await getClubMemberActivityLive({
      clubId,
      attendanceBase: 100, // Default base scores
      staffBase: 100,
    })

    console.log("📊 Received data:", data)

    if (!data || data.length === 0) {
      console.warn("⚠️ No data available")
      insertContentToEditor(
        editorRef,
        `<p><em>No live activity data available.</em></p>`,
        afterChange
      )
      return
    }

    const { year, month } = data[0] || getCurrentYearMonth()
    console.log("📅 Year/Month:", year, month)

    const tableHTML = `
      <h3 style="margin-bottom: 12px; color: #000;">Live Member Activity Report - ${month}/${year}</h3>
      <table border="1" cellpadding="4" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; border: 2px solid #000;">
        <thead>
          <tr style="background-color: #333; color: white;">
            <th rowspan="2" style="width: 4%; text-align: center; padding: 6px; border: 1px solid #000;">No.</th>
            <th rowspan="2" style="width: 15%; text-align: left; padding: 6px; border: 1px solid #000;">Full Name</th>
            <th rowspan="2" style="width: 8%; text-align: center; padding: 6px; border: 1px solid #000;">Code</th>
            <th colspan="4" style="text-align: center; padding: 6px; border: 1px solid #000;">Attendance</th>
            <th colspan="4" style="text-align: center; padding: 6px; border: 1px solid #000;">Staff</th>
            <th rowspan="2" style="width: 6%; text-align: center; padding: 6px; border: 1px solid #000;">Final</th>
          </tr>
          <tr style="background-color: #666; color: white;">
            <th style="width: 5%; text-align: center; padding: 5px; border: 1px solid #000;">Base</th>
            <th style="width: 5%; text-align: center; padding: 5px; border: 1px solid #000;">Multi</th>
            <th style="width: 5%; text-align: center; padding: 5px; border: 1px solid #000;">Total</th>
            <th style="width: 6%; text-align: center; padding: 5px; border: 1px solid #000;">Level</th>
            <th style="width: 5%; text-align: center; padding: 5px; border: 1px solid #000;">Base</th>
            <th style="width: 5%; text-align: center; padding: 5px; border: 1px solid #000;">Multi</th>
            <th style="width: 5%; text-align: center; padding: 5px; border: 1px solid #000;">Total</th>
            <th style="width: 6%; text-align: center; padding: 5px; border: 1px solid #000;">Eval</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (item, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#f5f5f5' : 'white'};">
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;">${index + 1}</td>
              <td style="padding: 4px; border: 1px solid #ccc;">${item.fullName}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;">${item.studentCode || "-"}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;">${item.attendanceBaseScore}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;">${item.attendanceMultiplier.toFixed(1)}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;"><strong>${item.attendanceTotalScore}</strong></td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc; font-size: 8pt;">${item.activityLevel}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;">${item.staffBaseScore}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;">${item.staffMultiplier.toFixed(1)}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;"><strong>${item.staffTotalScore}</strong></td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc; font-size: 8pt;">${item.staffEvaluation || "-"}</td>
              <td style="text-align: center; padding: 4px; border: 1px solid #ccc;"><strong>${item.finalScore}</strong></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <p style="font-size: 9pt; color: #333;"><em>Total: ${data.length} members | Attendance Rate: ${(data.reduce((sum, m) => sum + m.eventAttendanceRate, 0) / data.length).toFixed(1)}% | Session Rate: ${(data.reduce((sum, m) => sum + m.sessionAttendanceRate, 0) / data.length).toFixed(1)}%</em></p>
    `

    console.log("📝 Generated table HTML length:", tableHTML.length)
    console.log("🎯 Inserting to editor...")
    insertContentToEditor(editorRef, tableHTML, afterChange)
    console.log("✅ Table inserted successfully")
  } catch (error: any) {
    console.error("❌ Error inserting live member activity:", error)
    alert(`Failed to load live activity data: ${error.message}`)
  }
}

// ==========================================
// TABLE 3: Club Activity Summary
// ==========================================

export const insertClubActivitySummaryTable = async (
  clubId: number,
  editorRef: RefObject<HTMLDivElement>,
  afterChange?: () => void
) => {
  const { year, month } = getCurrentYearMonth()

  try {
    console.log("🔍 Calling getClubActivitySummary with clubId:", clubId)
    const data: ClubActivitySummary = await getClubActivitySummary({
      clubId,
      year,
      month,
    })

    console.log("📊 Received club summary:", data)

    const memberOfMonth = data.memberOfMonth

    const tableHTML = `
      <h3 style="margin-bottom: 12px; color: #000;">Club Activity Summary - ${month}/${year}</h3>
      <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; border: 2px solid #000;">
        <tbody>
          <tr style="background-color: #333; color: white;">
            <td style="width: 40%; font-weight: bold; padding: 8px; border: 1px solid #000;">Club Name</td>
            <td style="width: 60%; padding: 8px; border: 1px solid #000;">${data.clubName}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Total Events Completed</td>
            <td style="padding: 6px; border: 1px solid #ccc;">${data.totalEventsCompleted}</td>
          </tr>
          <tr style="background-color: white;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Total Members</td>
            <td style="padding: 6px; border: 1px solid #ccc;">${data.memberCount}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Full Members (≥70 pts)</td>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>${data.fullMembersCount}</strong></td>
          </tr>
          <tr style="background-color: white;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Club Multiplier</td>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>${data.clubMultiplier.toFixed(2)}x</strong></td>
          </tr>
          <tr style="background-color: #666; color: white;">
            <td colspan="2" style="text-align: center; font-weight: bold; padding: 10px; font-size: 11pt; border: 1px solid #000;">MEMBER OF THE MONTH</td>
          </tr>
          ${
            memberOfMonth
              ? `
          <tr style="background-color: #f5f5f5;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Name</td>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>${memberOfMonth.fullName}</strong></td>
          </tr>
          <tr style="background-color: white;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Student Code</td>
            <td style="padding: 6px; border: 1px solid #ccc;">${memberOfMonth.studentCode}</td>
          </tr>
          <tr style="background-color: #e5e5e5;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Final Score</td>
            <td style="font-weight: bold; padding: 6px; font-size: 13pt; border: 1px solid #ccc;">${memberOfMonth.finalScore.toFixed(0)} pts</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Events Attended</td>
            <td style="padding: 6px; border: 1px solid #ccc;">${memberOfMonth.totalEventAttended}/${memberOfMonth.totalEventRegistered}</td>
          </tr>
          <tr style="background-color: white;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Staff Evaluation</td>
            <td style="padding: 6px; border: 1px solid #ccc;">${memberOfMonth.staffEvaluation || "N/A"} (×${memberOfMonth.staffMultiplier.toFixed(2)})</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="font-weight: bold; padding: 6px; border: 1px solid #ccc;">Activity Level</td>
            <td style="padding: 6px; border: 1px solid #ccc;"><strong>${memberOfMonth.activityLevel}</strong></td>
          </tr>
          `
              : `
          <tr style="background-color: #f5f5f5;">
            <td colspan="2" style="text-align: center; padding: 10px; font-style: italic; border: 1px solid #ccc;">No member of the month assigned yet</td>
          </tr>
          `
          }
        </tbody>
      </table>
      <p style="font-size: 9pt; color: #333;"><em>Summary for ${data.clubName} - ${month}/${year}</em></p>
    `

    console.log("📝 Generated summary table HTML length:", tableHTML.length)
    console.log("🎯 Inserting to editor...")
    insertContentToEditor(editorRef, tableHTML, afterChange)
    console.log("✅ Summary table inserted successfully")
  } catch (error: any) {
    console.error("❌ Error inserting club activity summary:", error)
    alert(`Failed to load club summary: ${error.message}`)
  }
}
