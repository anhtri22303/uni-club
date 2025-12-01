import type { RefObject } from "react"
import { toast } from "sonner"
import { fetchClub } from "@/service/clubApi"
import { fetchEvent, getEventSettle } from "@/service/eventApi"
import { fetchLocation } from "@/service/locationApi"
import { fetchMajors } from "@/service/majorApi"
import { fetchPolicies } from "@/service/policyApi"
import { fetchAllPointRequests, PointRequest } from "@/service/pointRequestsApi"
import { getClubApplications } from "@/service/clubApplicationAPI"
import {
  fetchUniversityPoints,
  fetchAttendanceSummary,
  fetchAttendanceRanking,
  fetchClubOverview,
  fetchClubOverviewByMonth,
} from "@/service/universityApi"
import { getUniToClubTransactions, getUniToEventTransactions } from "@/service/walletApi"
import { generatePieChartSVG, generateBarChartSVG } from "@/components/reportComponent/utils/charts"
import { getTags } from "@/service/tagApi"
import { getMutiplierPolicy } from "@/service/multiplierPolicyApi"
import { getAllPenaltyRules } from "@/service/disciplineApi"
import { getAllStudentRegistry } from "@/service/studentCodeApi"
import { fetchAdminProducts } from "@/service/adminApi/adminProductApi"
import { getFeedbackByClubId } from "@/service/feedbackApi"

type AfterChange = () => void

type EditorRef = RefObject<HTMLDivElement>

type AnyRecord = Record<string, any>

function append(editorRef: EditorRef, html: string, afterChange: AfterChange) {
  if (!editorRef.current) return
  editorRef.current.innerHTML += html + "<p><br></p>"
  setTimeout(() => afterChange(), 50)
}

function normalizeContent<T = AnyRecord>(raw: any): T[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw

  if (raw.data) {
    if (Array.isArray(raw.data)) return raw.data
    if (raw.data && Array.isArray(raw.data.content)) return raw.data.content
  }

  if (Array.isArray(raw.content)) return raw.content

  return []
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function pluralLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export async function insertStaffClubsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading university clubs...")
  try {
    const response = await fetchClub({ page: 0, size: 200, sort: ["name"] })
    toast.dismiss()
    const clubs = normalizeContent(response)
    if (clubs.length === 0) {
      toast.info("No clubs found")
      return
    }

    const majorsCount = new Map<string, number>()
    clubs.forEach((club: AnyRecord) => {
      const major = club.majorName || club.majorPolicyName || "Unassigned"
      majorsCount.set(major, (majorsCount.get(major) || 0) + 1)
    })

    const leaderCount = clubs.filter((club: AnyRecord) => !!club.leaderName).length

    const summaryRows = Array.from(majorsCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([major, count]) => `<li>${major}: <strong>${count}</strong></li>`)
      .join("")

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          University Clubs Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(clubs.length, "club", "clubs")} mapped across ${majorsCount.size} majors. ${pluralLabel(
            leaderCount,
            "club has",
            "clubs have",
          )} an assigned leader.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Major</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Leader</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Description</th>
            </tr>
          </thead>
          <tbody>
    `

    clubs.forEach((club: AnyRecord, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${club.name || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${club.majorName || club.majorPolicyName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${club.leaderName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${club.description || "-"}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #2563eb; background: #eff6ff;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1d4ed8;">
            Major Distribution
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            ${summaryRows}
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${clubs.length} clubs`)
  } catch (error) {
    console.error("Failed to insert staff clubs table", error)
    toast.dismiss()
    toast.error("Failed to insert university clubs data")
  }
}

export async function insertStaffEventsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Fetching events overview...")
  try {
    const response = await fetchEvent()
    toast.dismiss()
    const events = normalizeContent(response)
    if (events.length === 0) {
      toast.info("No events available")
      return
    }

    const statusMap = new Map<string, number>()
    const typeMap = new Map<string, number>()

    events.forEach((event: AnyRecord) => {
      const status = (event.status || "UNKNOWN").toUpperCase()
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
      const type = (event.type || event.category || "UNDEFINED").toUpperCase()
      typeMap.set(type, (typeMap.get(type) || 0) + 1)
    })

    const statusSummary = Array.from(statusMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => `<li>${status}: <strong>${count}</strong></li>`)
      .join("")

    const typeSummary = Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `<li>${type}: <strong>${count}</strong></li>`)
      .join("")

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          University Event Requests
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(events.length, "event", "events")} tracked across ${statusMap.size} statuses and ${typeMap.size} event types.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Event Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Date</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Status</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Type</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Host Club</th>
            </tr>
          </thead>
          <tbody>
    `

    events.forEach((event: AnyRecord, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const hostName = event.hostClub?.name || event.clubName || "-"
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${event.name || event.title || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDate(event.date)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${(event.status || "-").toUpperCase()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${(event.type || event.category || "-").toUpperCase()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${hostName}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div style="padding: 16px; border-left: 4px solid #16a34a; background: #ecfdf5;">
            <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #047857;">
              Status Distribution
            </h3>
            <ul style="margin: 0; padding-left: 18px; color: #064e3b; font-size: 13px;">
              ${statusSummary}
            </ul>
          </div>
          <div style="padding: 16px; border-left: 4px solid #7c3aed; background: #f5f3ff;">
            <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #5b21b6;">
              Event Types
            </h3>
            <ul style="margin: 0; padding-left: 18px; color: #4c1d95; font-size: 13px;">
              ${typeSummary}
            </ul>
          </div>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${events.length} events`)
  } catch (error) {
    console.error("Failed to insert staff events table", error)
    toast.dismiss()
    toast.error("Failed to insert events data")
  }
}

export async function insertStaffSettledEventsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Fetching settled events...")
  try {
    const events = await getEventSettle()
    toast.dismiss()
    if (!events || events.length === 0) {
      toast.info("No settled events recorded")
      return
    }

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Settled Events Ledger
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(events.length, "settled event", "settled events")} with final budget reconciliation.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Event</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Date</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Budget Points</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Host Club</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Location</th>
            </tr>
          </thead>
          <tbody>
    `

    let totalBudget = 0
    events.forEach((event: AnyRecord, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      totalBudget += Number(event.budgetPoints || 0)
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${event.name || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDate(event.date)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${(event.budgetPoints || 0).toLocaleString()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${event.hostClub?.name || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${event.locationName || "-"}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="margin-top: 16px; padding: 16px; border-left: 4px solid #2563eb; background: #eff6ff;">
          <p style="margin: 0; font-size: 14px; color: #1d4ed8;">
            <strong>Total budget distributed:</strong> ${totalBudget.toLocaleString()} points
          </p>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${events.length} settled events`)
  } catch (error) {
    console.error("Failed to insert settled events table", error)
    toast.dismiss()
    toast.error("Failed to insert settled events data")
  }
}

export async function insertStaffLocationsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading campus locations...")
  try {
    const response = await fetchLocation({ page: 0, size: 100, sort: ["name,asc"] })
    toast.dismiss()
    const locations = normalizeContent(response)
    if (locations.length === 0) {
      toast.info("No locations available")
      return
    }

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Event Locations Directory
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(locations.length, "location", "locations")} available for scheduling events.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Location</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Address</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Capacity</th>
            </tr>
          </thead>
          <tbody>
    `

    let totalCapacity = 0
    locations.forEach((location: AnyRecord, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      totalCapacity += Number(location.capacity || 0)
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${location.name || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${location.address || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${location.capacity || 0}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="margin-top: 16px; padding: 16px; border-left: 4px solid #0f766e; background: #ecfeff;">
          <p style="margin: 0; font-size: 14px; color: #0f172a;">
            <strong>Total combined capacity:</strong> ${totalCapacity.toLocaleString()} seats
          </p>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${locations.length} locations`)
  } catch (error) {
    console.error("Failed to insert locations table", error)
    toast.dismiss()
    toast.error("Failed to insert locations data")
  }
}

export async function insertStaffClubApplicationsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading club applications...")
  try {
    const applications = await getClubApplications()
    toast.dismiss()
    if (!applications || applications.length === 0) {
      toast.info("No club applications recorded")
      return
    }

    const statusMap = new Map<string, number>()
    applications.forEach((app: AnyRecord) => {
      const status = (app.status || "UNKNOWN").toUpperCase()
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    const statusSummary = Array.from(statusMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => `<li>${status}: <strong>${count}</strong></li>`)
      .join("")

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Club Formation Applications
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(applications.length, "application", "applications")} submitted by students across the university.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Major</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Status</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Submitted</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Reviewer</th>
            </tr>
          </thead>
          <tbody>
    `

    applications.forEach((app: AnyRecord, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const reviewer = app.reviewedBy?.fullName || "-"
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${app.clubName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${app.majorName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${(app.status || "-").toUpperCase()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDate(app.submittedAt)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${reviewer}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="margin-top: 16px; padding: 16px; border-left: 4px solid #ea580c; background: #fff7ed;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #c2410c;">
            Status Snapshot
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #7c2d12; font-size: 13px;">
            ${statusSummary}
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${applications.length} club applications`)
  } catch (error) {
    console.error("Failed to insert club applications table", error)
    toast.dismiss()
    toast.error("Failed to insert club application data")
  }
}

export async function insertStaffPointRequestsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Gathering point requests...")
  try {
    const response = await fetchAllPointRequests()
    toast.dismiss()
    const requests: PointRequest[] = response?.data || []
    if (requests.length === 0) {
      toast.info("No point requests yet")
      return
    }

    const statusMap = new Map<string, number>()
    let totalRequested = 0

    requests.forEach((req) => {
      const status = (req.status || "UNKNOWN").toUpperCase()
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
      totalRequested += Number(req.requestedPoints || 0)
    })

    const statusSummary = Array.from(statusMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => `<li>${status}: <strong>${count}</strong></li>`)
      .join("")

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Reward Point Requests
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(requests.length, "request", "requests")} submitted with a total of ${totalRequested.toLocaleString()} points requested.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Requested Points</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Status</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Created At</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Reviewed At</th>
            </tr>
          </thead>
          <tbody>
    `

    requests.forEach((req, index) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${req.clubName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${req.requestedPoints.toLocaleString()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${(req.status || "-").toUpperCase()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDate(req.createdAt)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDate(req.reviewedAt)}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="margin-top: 16px; padding: 16px; border-left: 4px solid #14b8a6; background: #ecfdf5;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #0f766e;">
            Approval Pipeline
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #0f172a; font-size: 13px;">
            ${statusSummary}
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${requests.length} point requests`)
  } catch (error) {
    console.error("Failed to insert point requests table", error)
    toast.dismiss()
    toast.error("Failed to insert point request data")
  }
}

export async function insertStaffUniversityPointsSummary(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Collecting university points analytics...")
  try {
    const data = await fetchUniversityPoints()
    toast.dismiss()

    if (!data) {
      toast.info("No university points data available")
      return
    }

    const topRankings = (data.clubRankings || []).slice(0, 10)
    const totalClubs = data.clubRankings?.length || 0

    const rankingRows = topRankings
      .map(
        (item, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.rank}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.clubName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.totalPoints.toLocaleString()}</td>
          </tr>
        `,
      )
      .join("")

    const html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          University Points Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          Total accumulated university points: <strong>${(data.totalUniversityPoints || 0).toLocaleString()}</strong>
          across ${totalClubs} ranked clubs.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Rank</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Points</th>
            </tr>
          </thead>
          <tbody>
            ${rankingRows}
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #9333ea; background: #f5f3ff;">
          <p style="margin: 0; font-size: 14px; color: #4c1d95;">
            <strong>Insight:</strong> Top clubs continue to drive engagement and point accumulation.
          </p>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted university points summary")
  } catch (error) {
    console.error("Failed to insert university points summary", error)
    toast.dismiss()
    toast.error("Failed to insert university points data")
  }
}

export async function insertStaffAttendanceSummary(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Fetching attendance summary...")
  try {
    const year = new Date().getFullYear()
    const summary = await fetchAttendanceSummary(year)
    toast.dismiss()
    if (!summary || !Array.isArray(summary.monthlySummary) || summary.monthlySummary.length === 0) {
      toast.info("No attendance summary available")
      return
    }

    const rows = summary.monthlySummary
      .map(
        (item) => `
          <tr style="background-color: ${parseInt(item.month, 10) % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.month}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.participantCount.toLocaleString()}</td>
          </tr>
        `,
      )
      .join("")

    const totalParticipants = summary.monthlySummary.reduce(
      (acc, item) => acc + Number(item.participantCount || 0),
      0,
    )

    const html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Attendance Summary (${summary.year})
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          Total recorded participants: <strong>${totalParticipants.toLocaleString()}</strong>.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Month</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Participants</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted attendance summary")
  } catch (error) {
    console.error("Failed to insert attendance summary", error)
    toast.dismiss()
    toast.error("Failed to insert attendance summary data")
  }
}

export async function insertStaffAttendanceRankingTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Collecting attendance ranking...")
  try {
    const ranking = await fetchAttendanceRanking()
    toast.dismiss()
    const rows = ranking?.clubRankings || []
    if (rows.length === 0) {
      toast.info("No attendance ranking available")
      return
    }

    const tableRows = rows
      .map(
        (item, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.rank}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.clubName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.attendanceCount.toLocaleString()}</td>
          </tr>
        `,
      )
      .join("")

    const html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Attendance Ranking
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(rows.length, "club", "clubs")} ranked by total attendance engagement.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Rank</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Attendance Count</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted attendance ranking")
  } catch (error) {
    console.error("Failed to insert attendance ranking", error)
    toast.dismiss()
    toast.error("Failed to insert attendance ranking data")
  }
}

export async function insertStaffMajorsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading majors directory...")
  try {
    const majors = await fetchMajors()
    toast.dismiss()
    if (!majors || majors.length === 0) {
      toast.info("No majors available")
      return
    }

    const rows = majors
      .map(
        (major, index) => `
          <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${major.majorCode}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${major.name}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${major.description || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${major.active ? "Active" : "Inactive"}</td>
          </tr>
        `,
      )
      .join("")

    const html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          University Majors Catalog
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(majors.length, "major", "majors")} currently managed by the university.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Code</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Major</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted majors table")
  } catch (error) {
    console.error("Failed to insert majors table", error)
    toast.dismiss()
    toast.error("Failed to insert majors data")
  }
}

export async function insertStaffPoliciesTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading university policies...")
  try {
    const policies = await fetchPolicies()
    toast.dismiss()
    if (!policies || policies.length === 0) {
      toast.info("No policies found")
      return
    }

    const rows = policies
      .map(
        (policy, index) => `
          <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${policy.policyName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${policy.majorName || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${policy.description || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${policy.active ? "Active" : "Inactive"}</td>
          </tr>
        `,
      )
      .join("")

    const html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Major Policy Register
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(policies.length, "policy", "policies")} governing club operations by major.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Policy</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Major</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted policies table")
  } catch (error) {
    console.error("Failed to insert policies table", error)
    toast.dismiss()
    toast.error("Failed to insert policy data")
  }
}

export async function insertStaffUniToClubTransactionsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading university-to-club transactions...")
  try {
    const transactions = await getUniToClubTransactions()
    toast.dismiss()
    if (!transactions || transactions.length === 0) {
      toast.info("No transactions recorded")
      return
    }

    const rows = transactions
      .map(
        (txn, index) => `
          <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.id}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.receiverName || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.amount.toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.description || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDateTime(txn.createdAt)}</td>
          </tr>
        `,
      )
      .join("")

    const totalAmount = transactions.reduce((acc, txn) => acc + Number(txn.amount || 0), 0)

    const html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          University-to-Club Point Distributions
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(transactions.length, "transaction", "transactions")} processed totaling
          <strong>${totalAmount.toLocaleString()}</strong> points.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Transaction ID</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Points</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted transactions table")
  } catch (error) {
    console.error("Failed to insert uni-to-club transactions table", error)
    toast.dismiss()
    toast.error("Failed to insert transaction data")
  }
}

// --------------------
// Chart generators
// --------------------

export async function insertStaffClubsByMajorChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Preparing clubs by major chart...")
  try {
    const response = await fetchClub({ page: 0, size: 200, sort: ["name"] })
    toast.dismiss()
    const clubs = normalizeContent(response)
    if (clubs.length === 0) {
      toast.info("No clubs to chart")
      return
    }

    const majorsCount = new Map<string, number>()
    clubs.forEach((club: AnyRecord) => {
      const major = club.majorName || club.majorPolicyName || "Unassigned"
      majorsCount.set(major, (majorsCount.get(major) || 0) + 1)
    })

    const chartData = Array.from(majorsCount.entries()).map(([name, value], index) => ({
      name,
      value,
      color: ["#1d4ed8", "#9333ea", "#10b981", "#f97316", "#ef4444", "#0ea5e9", "#6366f1", "#f59e0b"][index % 8],
    }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Clubs by Major Distribution
        </h2>
        ${generatePieChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted clubs by major chart")
  } catch (error) {
    console.error("Failed to insert clubs by major chart", error)
    toast.dismiss()
    toast.error("Failed to generate clubs chart")
  }
}

export async function insertStaffEventStatusChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Building event status chart...")
  try {
    const response = await fetchEvent()
    toast.dismiss()
    const events = normalizeContent(response)
    if (events.length === 0) {
      toast.info("No events to chart")
      return
    }

    const statusMap = new Map<string, number>()
    events.forEach((event: AnyRecord) => {
      const status = (event.status || "UNKNOWN").toUpperCase()
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    const chartData = Array.from(statusMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: ["#22c55e", "#f97316", "#ef4444", "#6366f1", "#0ea5e9", "#facc15"][index % 6],
    }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Event Status Overview
        </h2>
        ${generateBarChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted event status chart")
  } catch (error) {
    console.error("Failed to insert event status chart", error)
    toast.dismiss()
    toast.error("Failed to generate event status chart")
  }
}

export async function insertStaffClubApplicationChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Preparing club applications chart...")
  try {
    const applications = await getClubApplications()
    toast.dismiss()
    if (!applications || applications.length === 0) {
      toast.info("No club applications to chart")
      return
    }

    const statusMap = new Map<string, number>()
    applications.forEach((app: AnyRecord) => {
      const status = (app.status || "UNKNOWN").toUpperCase()
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    const chartData = Array.from(statusMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: ["#22c55e", "#f97316", "#ef4444", "#6366f1", "#0ea5e9"][index % 5],
    }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Club Application Status
        </h2>
        ${generatePieChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted club application chart")
  } catch (error) {
    console.error("Failed to insert club application chart", error)
    toast.dismiss()
    toast.error("Failed to generate club application chart")
  }
}

export async function insertStaffPointRequestChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Preparing point requests chart...")
  try {
    const response = await fetchAllPointRequests()
    toast.dismiss()
    const requests: PointRequest[] = response?.data || []
    if (requests.length === 0) {
      toast.info("No point requests to chart")
      return
    }

    const statusMap = new Map<string, number>()
    requests.forEach((req) => {
      const status = (req.status || "UNKNOWN").toUpperCase()
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    const chartData = Array.from(statusMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: ["#0ea5e9", "#22d3ee", "#818cf8", "#fda4af", "#fb7185"][index % 5],
    }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Point Request Pipeline
        </h2>
        ${generatePieChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted point request chart")
  } catch (error) {
    console.error("Failed to insert point request chart", error)
    toast.dismiss()
    toast.error("Failed to generate point request chart")
  }
}

export async function insertStaffUniversityPointsChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Preparing university points chart...")
  try {
    const data = await fetchUniversityPoints()
    toast.dismiss()
    if (!data || !Array.isArray(data.clubRankings) || data.clubRankings.length === 0) {
      toast.info("No ranking data to chart")
      return
    }

    const chartData = data.clubRankings.slice(0, 8).map((item, index) => ({
      name: `${item.rank}. ${item.clubName}`,
      value: item.totalPoints,
      color: ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#0ea5e9", "#14b8a6", "#9333ea"][index % 8],
    }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Top Clubs by University Points
        </h2>
        ${generateBarChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted university points chart")
  } catch (error) {
    console.error("Failed to insert university points chart", error)
    toast.dismiss()
    toast.error("Failed to generate university points chart")
  }
}

export async function insertStaffAttendanceSummaryChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Preparing attendance chart...")
  try {
    const year = new Date().getFullYear()
    const summary = await fetchAttendanceSummary(year)
    toast.dismiss()
    if (!summary || !Array.isArray(summary.monthlySummary) || summary.monthlySummary.length === 0) {
      toast.info("No attendance data to chart")
      return
    }

    const chartData = summary.monthlySummary.map((item) => ({
      name: item.month,
      value: item.participantCount,
      color: "#1d4ed8",
    }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Monthly Attendance (${summary.year})
        </h2>
        ${generateBarChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted attendance summary chart")
  } catch (error) {
    console.error("Failed to insert attendance summary chart", error)
    toast.dismiss()
    toast.error("Failed to generate attendance chart")
  }
}

export async function insertStaffAttendanceRankingChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Preparing attendance ranking chart...")
  try {
    const ranking = await fetchAttendanceRanking()
    toast.dismiss()
    if (!ranking || !Array.isArray(ranking.clubRankings) || ranking.clubRankings.length === 0) {
      toast.info("No ranking data to chart")
      return
    }

    const chartData = ranking.clubRankings.slice(0, 8).map((item, index) => ({
      name: `${item.rank}. ${item.clubName}`,
      value: item.attendanceCount,
      color: ["#ef4444", "#f97316", "#facc15", "#22c55e", "#14b8a6", "#0ea5e9", "#6366f1", "#8b5cf6"][index % 8],
    }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Club Attendance Leaders
        </h2>
        ${generateBarChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted attendance ranking chart")
  } catch (error) {
    console.error("Failed to insert attendance ranking chart", error)
    toast.dismiss()
    toast.error("Failed to generate attendance ranking chart")
  }
}

// New function: Insert Uni to Event Transactions Table
export async function insertStaffUniToEventTransactionsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading university-to-event transactions...")
  try {
    const transactions = await getUniToEventTransactions()
    toast.dismiss()
    if (!transactions || transactions.length === 0) {
      toast.info("No event transactions recorded")
      return
    }

    const rows = transactions
      .map(
        (txn, index) => `
          <tr style="background-color: ${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.id}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.receiverName || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.signedAmount || txn.amount.toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${txn.description || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDateTime(txn.createdAt)}</td>
          </tr>
        `,
      )
      .join("")

    const totalAmount = transactions.reduce((acc, txn) => acc + Math.abs(Number(txn.amount || 0)), 0)

    const html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          University-to-Event Budget Allocations
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(transactions.length, "transaction", "transactions")} tracked totaling
          <strong>${totalAmount.toLocaleString()}</strong> budget points.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Transaction ID</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Event</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Points</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted event transactions table")
  } catch (error) {
    console.error("Failed to insert uni-to-event transactions table", error)
    toast.dismiss()
    toast.error("Failed to insert event transaction data")
  }
}

// New function: Insert Uni to Event Transactions Chart
export async function insertStaffUniToEventTransactionsChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Preparing event transactions chart...")
  try {
    const transactions = await getUniToEventTransactions()
    toast.dismiss()
    if (!transactions || transactions.length === 0) {
      toast.info("No event transactions to chart")
      return
    }

    // Group transactions by event name
    const eventMap = new Map<string, number>()
    transactions.forEach((txn) => {
      const eventName = txn.receiverName || "Unknown Event"
      const amount = Math.abs(Number(txn.amount || 0))
      eventMap.set(eventName, (eventMap.get(eventName) || 0) + amount)
    })

    const chartData = Array.from(eventMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], index) => ({
        name,
        value,
        color: ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#0ea5e9", "#14b8a6", "#f59e0b"][index % 8],
      }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Top Events by Budget Allocation
        </h2>
        ${generateBarChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted event transactions chart")
  } catch (error) {
    console.error("Failed to insert event transactions chart", error)
    toast.dismiss()
    toast.error("Failed to generate event transactions chart")
  }
}

// ============================================
// NEW INSERT FUNCTIONS (6 ADDITIONS)
// ============================================

/**
 * Insert Tags Table
 * Shows all system tags with core/custom classification
 */
export async function insertStaffTagsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading tags...")
  try {
    const tags = await getTags()
    toast.dismiss()
    
    if (!tags || tags.length === 0) {
      toast.info("No tags found")
      return
    }

    const coreTags = tags.filter((tag) => tag.core)
    const customTags = tags.filter((tag) => !tag.core)

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          System Tags Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(tags.length, "tag", "tags")} available: <strong>${coreTags.length}</strong> core tags and <strong>${customTags.length}</strong> custom tags.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Tag Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Type</th>
            </tr>
          </thead>
          <tbody>
    `

    tags.forEach((tag: any, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const tagType = tag.core 
        ? '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">CORE</span>'
        : '<span style="background: #f3f4f6; color: #4b5563; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">CUSTOM</span>'
      
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${tag.tagId}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${tag.name || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${tag.description || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${tagType}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #8b5cf6; background: #faf5ff;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #6b21a8;">
            Tag Statistics
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            <li>Core Tags (System-defined): <strong>${coreTags.length}</strong></li>
            <li>Custom Tags (User-created): <strong>${customTags.length}</strong></li>
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${tags.length} tags`)
  } catch (error) {
    console.error("Failed to insert tags table", error)
    toast.dismiss()
    toast.error("Failed to load tags")
  }
}

/**
 * Insert Multiplier Policies Table
 * Shows point multiplier rules for clubs and members
 */
export async function insertStaffMultiplierPoliciesTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading multiplier policies...")
  try {
    const policies = await getMutiplierPolicy()
    toast.dismiss()
    
    if (!policies || policies.length === 0) {
      toast.info("No multiplier policies found")
      return
    }

    const clubPolicies = policies.filter((p) => p.targetType === "CLUB")
    const memberPolicies = policies.filter((p) => p.targetType === "MEMBER")
    const avgMultiplier = policies.reduce((sum, p) => sum + p.multiplier, 0) / policies.length

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Multiplier Policies Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(policies.length, "policy", "policies")} configured: <strong>${clubPolicies.length}</strong> for clubs, <strong>${memberPolicies.length}</strong> for members. Average multiplier: <strong>${avgMultiplier.toFixed(2)}x</strong>
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Rule Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Activity Type</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Target</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Multiplier</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Min-Max</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
    `

    policies.forEach((policy: any, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      const multiplierColor = policy.multiplier > 1 ? "#10b981" : policy.multiplier < 1 ? "#f97316" : "#6b7280"
      const targetBadge = policy.targetType === "CLUB"
        ? '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">CLUB</span>'
        : '<span style="background: #fce7f3; color: #be185d; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">MEMBER</span>'
      const statusBadge = policy.active
        ? '<span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">ACTIVE</span>'
        : '<span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">INACTIVE</span>'
      
      const thresholdRange = policy.minThreshold !== null && policy.maxThreshold !== null
        ? `${policy.minThreshold}-${policy.maxThreshold}`
        : "N/A"
      
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${policy.ruleName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${policy.activityType || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${targetBadge}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: 700; color: ${multiplierColor};">${policy.multiplier}x</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${thresholdRange}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${statusBadge}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #10b981; background: #ecfdf5;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #065f46;">
            Policy Impact Summary
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            <li>Club Policies: <strong>${clubPolicies.length}</strong></li>
            <li>Member Policies: <strong>${memberPolicies.length}</strong></li>
            <li>Average Multiplier: <strong>${avgMultiplier.toFixed(2)}x</strong></li>
            <li>Active Policies: <strong>${policies.filter(p => p.active).length}</strong></li>
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${policies.length} multiplier policies`)
  } catch (error) {
    console.error("Failed to insert multiplier policies table", error)
    toast.dismiss()
    toast.error("Failed to load multiplier policies")
  }
}

/**
 * Insert Penalty Rules Table
 * Shows discipline violation rules with penalty points
 */
export async function insertStaffPenaltyRulesTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading penalty rules...")
  try {
    const rules = await getAllPenaltyRules()
    toast.dismiss()
    
    if (!rules || rules.length === 0) {
      toast.info("No penalty rules found")
      return
    }

    const levelCounts = {
      MINOR: rules.filter((r) => r.level === "MINOR").length,
      NORMAL: rules.filter((r) => r.level === "NORMAL").length,
      MAJOR: rules.filter((r) => r.level === "MAJOR").length,
      SEVERE: rules.filter((r) => r.level === "SEVERE").length,
    }

    const totalPenaltyPoints = rules.reduce((sum, r) => sum + (r.penaltyPoints || 0), 0)

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Penalty Rules Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(rules.length, "rule", "rules")} configured with total penalty capacity of <strong>${totalPenaltyPoints.toLocaleString()}</strong> points.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">#</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Rule Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Level</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Penalty Points</th>
            </tr>
          </thead>
          <tbody>
    `

    rules.forEach((rule: any, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      
      let levelBadge = ""
      switch (rule.level) {
        case "MINOR":
          levelBadge = '<span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">MINOR</span>'
          break
        case "NORMAL":
          levelBadge = '<span style="background: #fed7aa; color: #9a3412; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">NORMAL</span>'
          break
        case "MAJOR":
          levelBadge = '<span style="background: #fecaca; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">MAJOR</span>'
          break
        case "SEVERE":
          levelBadge = '<span style="background: #fecaca; color: #7f1d1d; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">SEVERE</span>'
          break
        default:
          levelBadge = '<span style="background: #f3f4f6; color: #4b5563; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">UNKNOWN</span>'
      }
      
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${rule.id}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${rule.name || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${rule.description || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${levelBadge}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-weight: 700; color: #dc2626;">-${(rule.penaltyPoints || 0).toLocaleString()}</td>
        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #dc2626; background: #fef2f2;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #991b1b;">
            Violation Level Distribution
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            <li>Minor Violations: <strong>${levelCounts.MINOR}</strong></li>
            <li>Normal Violations: <strong>${levelCounts.NORMAL}</strong></li>
            <li>Major Violations: <strong>${levelCounts.MAJOR}</strong></li>
            <li>Severe Violations: <strong>${levelCounts.SEVERE}</strong></li>
            <li>Total Penalty Points: <strong>${totalPenaltyPoints.toLocaleString()}</strong></li>
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${rules.length} penalty rules`)
  } catch (error) {
    console.error("Failed to insert penalty rules table", error)
    toast.dismiss()
    toast.error("Failed to load penalty rules")
  }
}

/**
 * Insert Student Registry Table
 * Shows registered student codes
 */
export async function insertStaffStudentRegistryTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading student registry...")
  try {
    const students = await getAllStudentRegistry()
    toast.dismiss()
    
    if (!students || students.length === 0) {
      toast.info("No students found in registry")
      return
    }

    const majorCounts = new Map<string, number>()
    students.forEach((student: any) => {
      const major = student.major || "Unassigned"
      majorCounts.set(major, (majorCounts.get(major) || 0) + 1)
    })

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Student Registry Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(students.length, "student", "students")} registered across ${majorCounts.size} majors.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Student Code</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Full Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Major</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Class</th>
            </tr>
          </thead>
          <tbody>
    `

    students.forEach((student: any, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${student.studentCode || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${student.fullName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${student.major || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${student.className || "-"}</td>
        </tr>
      `
    })

    const majorRows = Array.from(majorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([major, count]) => `<li>${major}: <strong>${count}</strong></li>`)
      .join("")

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #3b82f6; background: #eff6ff;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #1e40af;">
            Major Distribution
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            ${majorRows}
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${students.length} student records`)
  } catch (error) {
    console.error("Failed to insert student registry table", error)
    toast.dismiss()
    toast.error("Failed to load student registry")
  }
}

/**
 * Insert Products Table
 * Shows gift/product inventory across all clubs
 */
export async function insertStaffProductsTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading products...")
  try {
    const response = await fetchAdminProducts({ page: 0, size: 200 })
    toast.dismiss()
    
    const products = response?.content || []
    
    if (products.length === 0) {
      toast.info("No products found")
      return
    }

    const clubCounts = new Map<string, number>()
    const statusCounts = {
      AVAILABLE: 0,
      OUT_OF_STOCK: 0,
      INACTIVE: 0,
    }
    let totalStock = 0
    let totalValue = 0

    products.forEach((product: any) => {
      const clubName = product.clubName || "Unknown Club"
      clubCounts.set(clubName, (clubCounts.get(clubName) || 0) + 1)
      
      if (product.status === "AVAILABLE") statusCounts.AVAILABLE++
      else if (product.status === "OUT_OF_STOCK") statusCounts.OUT_OF_STOCK++
      else statusCounts.INACTIVE++
      
      totalStock += product.stock || 0
      totalValue += (product.price || 0) * (product.stock || 0)
    })

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Products & Gifts Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(products.length, "product", "products")} available across ${clubCounts.size} clubs. Total inventory: <strong>${totalStock.toLocaleString()}</strong> items (${totalValue.toLocaleString()} points value).
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Price</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Stock</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
    `

    products.forEach((product: any, index: number) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
      
      let statusBadge = ""
      switch (product.status) {
        case "AVAILABLE":
          statusBadge = '<span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">AVAILABLE</span>'
          break
        case "OUT_OF_STOCK":
          statusBadge = '<span style="background: #fed7aa; color: #9a3412; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">OUT OF STOCK</span>'
          break
        case "INACTIVE":
          statusBadge = '<span style="background: #f3f4f6; color: #4b5563; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">INACTIVE</span>'
          break
        default:
          statusBadge = '<span style="background: #f3f4f6; color: #4b5563; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">UNKNOWN</span>'
      }
      
      html += `
        <tr style="background-color: ${bg};">
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${product.productName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px;">${product.clubName || "-"}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(product.price || 0).toLocaleString()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(product.stock || 0).toLocaleString()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${statusBadge}</td>
        </tr>
      `
    })

    const clubRows = Array.from(clubCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([club, count]) => `<li>${club}: <strong>${count}</strong></li>`)
      .join("")

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #f59e0b; background: #fffbeb;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #92400e;">
            Product Statistics
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            <li>Available: <strong>${statusCounts.AVAILABLE}</strong></li>
            <li>Out of Stock: <strong>${statusCounts.OUT_OF_STOCK}</strong></li>
            <li>Inactive: <strong>${statusCounts.INACTIVE}</strong></li>
            <li>Total Inventory: <strong>${totalStock.toLocaleString()}</strong> items</li>
            <li>Total Value: <strong>${totalValue.toLocaleString()}</strong> points</li>
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${products.length} products`)
  } catch (error) {
    console.error("Failed to insert products table", error)
    toast.dismiss()
    toast.error("Failed to load products")
  }
}

/**
 * Insert Aggregated Feedbacks Table
 * Shows feedback summary across all clubs
 */
export async function insertStaffFeedbacksTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading feedbacks from all clubs...")
  try {
    // First get all clubs
    const clubsResponse = await fetchClub({ page: 0, size: 200, sort: ["name"] })
    const clubs = normalizeContent(clubsResponse)
    
    if (clubs.length === 0) {
      toast.dismiss()
      toast.info("No clubs found")
      return
    }

    // Fetch feedbacks for all clubs in parallel
    const feedbackPromises = clubs.map((club: any) => 
      getFeedbackByClubId(club.id).catch(() => [])
    )
    
    const feedbackArrays = await Promise.all(feedbackPromises)
    const allFeedbacks: any[] = []
    
    feedbackArrays.forEach((feedbacks, index) => {
      if (Array.isArray(feedbacks) && feedbacks.length > 0) {
        feedbacks.forEach((feedback: any) => {
          allFeedbacks.push({
            ...feedback,
            clubName: clubs[index].name,
            clubId: clubs[index].id,
          })
        })
      }
    })
    
    toast.dismiss()
    
    if (allFeedbacks.length === 0) {
      toast.info("No feedbacks found")
      return
    }

    // Calculate statistics
    const clubFeedbackCounts = new Map<string, number>()
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let totalRating = 0
    
    allFeedbacks.forEach((feedback: any) => {
      const clubName = feedback.clubName || "Unknown"
      clubFeedbackCounts.set(clubName, (clubFeedbackCounts.get(clubName) || 0) + 1)
      
      const rating = feedback.rating || 0
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating as keyof typeof ratingCounts]++
        totalRating += rating
      }
    })
    
    const avgRating = allFeedbacks.length > 0 ? (totalRating / allFeedbacks.length).toFixed(2) : "0.00"

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          University-Wide Feedback Summary
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          ${pluralLabel(allFeedbacks.length, "feedback", "feedbacks")} collected from ${clubFeedbackCounts.size} clubs. Average rating: <strong>${avgRating}/5.0</strong>
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Event</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Rating</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Comment</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Date</th>
            </tr>
          </thead>
          <tbody>
    `

    allFeedbacks
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 100) // Limit to 100 most recent feedbacks
      .forEach((feedback: any, index: number) => {
        const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        const rating = feedback.rating || 0
        const stars = "★".repeat(rating) + "☆".repeat(5 - rating)
        const ratingColor = rating >= 4 ? "#10b981" : rating >= 3 ? "#f59e0b" : "#ef4444"
        
        html += `
          <tr style="background-color: ${bg};">
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${feedback.clubName || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${feedback.eventName || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${ratingColor}; font-weight: 700;">${stars}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${feedback.comment || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatDate(feedback.createdAt)}</td>
          </tr>
        `
      })

    const clubRows = Array.from(clubFeedbackCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([club, count]) => `<li>${club}: <strong>${count}</strong> feedbacks</li>`)
      .join("")

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #f59e0b; background: #fffbeb;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #92400e;">
            Feedback Statistics
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            <li>Average Rating: <strong>${avgRating}/5.0</strong></li>
            <li>5-star: <strong>${ratingCounts[5]}</strong> | 4-star: <strong>${ratingCounts[4]}</strong> | 3-star: <strong>${ratingCounts[3]}</strong></li>
            <li>2-star: <strong>${ratingCounts[2]}</strong> | 1-star: <strong>${ratingCounts[1]}</strong></li>
            <li>Top Contributing Clubs:</li>
            <ul style="margin: 4px 0 0 0; padding-left: 18px;">${clubRows}</ul>
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${allFeedbacks.length} feedbacks from ${clubs.length} clubs`)
  } catch (error) {
    console.error("Failed to insert feedbacks table", error)
    toast.dismiss()
    toast.error("Failed to load feedbacks")
  }
}

/**
 * Insert Club Overview Table
 * Shows comprehensive metrics for all clubs
 */
export async function insertStaffClubOverviewTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading club overview...")
  try {
    const clubs = await fetchClubOverview()
    toast.dismiss()
    
    if (!clubs || clubs.length === 0) {
      toast.info("No club overview data found")
      return
    }

    // Calculate aggregated statistics
    const totalMembers = clubs.reduce((sum, c) => sum + (c.totalMember || 0), 0)
    const totalStaff = clubs.reduce((sum, c) => sum + (c.totalStaff || 0), 0)
    const totalCheckins = clubs.reduce((sum, c) => sum + (c.totalCheckin || 0), 0)
    const totalBudget = clubs.reduce((sum, c) => sum + (c.totalBudgetEvent || 0), 0)
    const avgAttendanceRate = clubs.reduce((sum, c) => sum + (c.attendanceRate || 0), 0) / clubs.length
    const avgCheckinRate = clubs.reduce((sum, c) => sum + (c.checkinRate || 0), 0) / clubs.length
    const avgRating = clubs.reduce((sum, c) => sum + (c.ratingEvent || 0), 0) / clubs.length

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Comprehensive Club Overview
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          Performance metrics for ${pluralLabel(clubs.length, "club", "clubs")} across the university.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Rating</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Members</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Staff</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Check-ins</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Attendance</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Budget</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Disciplines</th>
            </tr>
          </thead>
          <tbody>
    `

    // Sort by rating descending
    clubs
      .sort((a, b) => (b.ratingEvent || 0) - (a.ratingEvent || 0))
      .forEach((club: any, index: number) => {
        const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        const rating = club.ratingEvent || 0
        const ratingColor = rating >= 4 ? "#10b981" : rating >= 3 ? "#f59e0b" : "#ef4444"
        const attendanceColor = club.attendanceRate >= 80 ? "#10b981" : club.attendanceRate >= 60 ? "#f59e0b" : "#ef4444"
        const checkinColor = club.checkinRate >= 80 ? "#10b981" : club.checkinRate >= 60 ? "#f59e0b" : "#ef4444"
        
        html += `
          <tr style="background-color: ${bg};">
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${club.clubName || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${ratingColor}; font-weight: 700;">${rating.toFixed(1)}/5</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(club.totalMember || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(club.totalStaff || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">
              ${(club.totalCheckin || 0).toLocaleString()} 
              <span style="color: ${checkinColor}; font-size: 11px;">(${(club.checkinRate || 0).toFixed(1)}%)</span>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${attendanceColor}; font-weight: 600;">${(club.attendanceRate || 0).toFixed(1)}%</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(club.totalBudgetEvent || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${club.totalDiscipline > 0 ? '#ef4444' : '#10b981'};">${club.totalDiscipline || 0}</td>
          </tr>
        `
      })

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #8b5cf6; background: #faf5ff;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #6b21a8;">
            University-Wide Metrics
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            <li>Total Members: <strong>${totalMembers.toLocaleString()}</strong></li>
            <li>Total Staff: <strong>${totalStaff.toLocaleString()}</strong></li>
            <li>Total Check-ins: <strong>${totalCheckins.toLocaleString()}</strong></li>
            <li>Total Budget Allocated: <strong>${totalBudget.toLocaleString()}</strong> points</li>
            <li>Average Event Rating: <strong>${avgRating.toFixed(2)}/5.0</strong></li>
            <li>Average Attendance Rate: <strong>${avgAttendanceRate.toFixed(1)}%</strong></li>
            <li>Average Check-in Rate: <strong>${avgCheckinRate.toFixed(1)}%</strong></li>
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted overview for ${clubs.length} clubs`)
  } catch (error) {
    console.error("Failed to insert club overview table", error)
    toast.dismiss()
    toast.error("Failed to load club overview")
  }
}

/**
 * Insert Club Overview By Current Month Table
 * Shows comprehensive metrics for all clubs in the current month
 */
export async function insertStaffClubOverviewByMonthTable(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading monthly club overview...")
  try {
    // Get current month and year
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
    
    const clubs = await fetchClubOverviewByMonth(currentYear, currentMonth)
    toast.dismiss()
    
    if (!clubs || clubs.length === 0) {
      toast.info(`No club overview data found for ${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`)
      return
    }

    // Calculate aggregated statistics
    const totalMembers = clubs.reduce((sum, c) => sum + (c.totalMember || 0), 0)
    const totalStaff = clubs.reduce((sum, c) => sum + (c.totalStaff || 0), 0)
    const totalCheckins = clubs.reduce((sum, c) => sum + (c.totalCheckin || 0), 0)
    const totalBudget = clubs.reduce((sum, c) => sum + (c.totalBudgetEvent || 0), 0)
    const totalProducts = clubs.reduce((sum, c) => sum + (c.totalProductEvent || 0), 0)
    const avgAttendanceRate = clubs.reduce((sum, c) => sum + (c.attendanceRate || 0), 0) / clubs.length
    const avgCheckinRate = clubs.reduce((sum, c) => sum + (c.checkinRate || 0), 0) / clubs.length
    const avgRating = clubs.reduce((sum, c) => sum + (c.ratingEvent || 0), 0) / clubs.length

    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

    let html = `
      <div style="margin: 24px 0; page-break-inside: avoid;">
        <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 12px; color: #111827;">
          Club Overview - ${monthName}
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 14px;">
          Monthly performance metrics for ${pluralLabel(clubs.length, "club", "clubs")}.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left;">Club Name</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Rating</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Members</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Staff</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Check-ins</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Attendance</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Budget</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Products</th>
              <th style="border: 1px solid #d1d5db; padding: 10px; text-align: center;">Disciplines</th>
            </tr>
          </thead>
          <tbody>
    `

    // Sort by attendance rate descending
    clubs
      .sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0))
      .forEach((club: any, index: number) => {
        const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        const rating = club.ratingEvent || 0
        const ratingColor = rating >= 4 ? "#10b981" : rating >= 3 ? "#f59e0b" : "#ef4444"
        const attendanceColor = club.attendanceRate >= 80 ? "#10b981" : club.attendanceRate >= 60 ? "#f59e0b" : "#ef4444"
        const checkinColor = club.checkinRate >= 80 ? "#10b981" : club.checkinRate >= 60 ? "#f59e0b" : "#ef4444"
        
        html += `
          <tr style="background-color: ${bg};">
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 600;">${club.clubName || "-"}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${ratingColor}; font-weight: 700;">${rating.toFixed(1)}/5</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(club.totalMember || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(club.totalStaff || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">
              ${(club.totalCheckin || 0).toLocaleString()} 
              <span style="color: ${checkinColor}; font-size: 11px;">(${(club.checkinRate || 0).toFixed(1)}%)</span>
            </td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${attendanceColor}; font-weight: 600;">${(club.attendanceRate || 0).toFixed(1)}%</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(club.totalBudgetEvent || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${(club.totalProductEvent || 0).toLocaleString()}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; color: ${club.totalDiscipline > 0 ? '#ef4444' : '#10b981'};">${club.totalDiscipline || 0}</td>
          </tr>
        `
      })

    html += `
          </tbody>
        </table>
        <div style="padding: 16px; border-left: 4px solid #0ea5e9; background: #f0f9ff;">
          <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #0c4a6e;">
            ${monthName} Summary
          </h3>
          <ul style="margin: 0; padding-left: 18px; color: #1f2937; font-size: 13px;">
            <li>Total Members: <strong>${totalMembers.toLocaleString()}</strong></li>
            <li>Total Staff: <strong>${totalStaff.toLocaleString()}</strong></li>
            <li>Total Check-ins: <strong>${totalCheckins.toLocaleString()}</strong></li>
            <li>Total Budget Allocated: <strong>${totalBudget.toLocaleString()}</strong> points</li>
            <li>Total Products Distributed: <strong>${totalProducts.toLocaleString()}</strong></li>
            <li>Average Event Rating: <strong>${avgRating.toFixed(2)}/5.0</strong></li>
            <li>Average Attendance Rate: <strong>${avgAttendanceRate.toFixed(1)}%</strong></li>
            <li>Average Check-in Rate: <strong>${avgCheckinRate.toFixed(1)}%</strong></li>
          </ul>
        </div>
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${monthName} overview for ${clubs.length} clubs`)
  } catch (error) {
    console.error("Failed to insert monthly club overview table", error)
    toast.dismiss()
    toast.error("Failed to load monthly club overview")
  }
}

/**
 * Insert Club Overview Chart (All-Time)
 * Shows top clubs by attendance rate
 */
export async function insertStaffClubOverviewChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading club overview chart...")
  try {
    const clubs = await fetchClubOverview()
    toast.dismiss()
    
    if (!clubs || clubs.length === 0) {
      toast.info("No club overview data found")
      return
    }

    // Sort by attendance rate and get top 10
    const chartData = clubs
      .sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0))
      .slice(0, 10)
      .map((club, index) => ({
        name: club.clubName,
        value: Number((club.attendanceRate || 0).toFixed(1)),
        color: [
          "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", 
          "#0ea5e9", "#14b8a6", "#f59e0b", "#6366f1", "#a855f7"
        ][index % 10],
      }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Top 10 Clubs by Attendance Rate
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 13px;">
          All-time performance ranking based on attendance percentage.
        </p>
        ${generateBarChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success("Inserted club overview chart")
  } catch (error) {
    console.error("Failed to insert club overview chart", error)
    toast.dismiss()
    toast.error("Failed to generate club overview chart")
  }
}

/**
 * Insert Club Overview Chart (Current Month)
 * Shows top clubs by attendance rate for current month
 */
export async function insertStaffClubOverviewByMonthChart(editorRef: EditorRef, afterChange: AfterChange) {
  toast.loading("Loading monthly club overview chart...")
  try {
    // Get current month and year
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    
    const clubs = await fetchClubOverviewByMonth(currentYear, currentMonth)
    toast.dismiss()
    
    if (!clubs || clubs.length === 0) {
      toast.info(`No club overview data found for ${monthName}`)
      return
    }

    // Sort by attendance rate and get top 10
    const chartData = clubs
      .sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0))
      .slice(0, 10)
      .map((club, index) => ({
        name: club.clubName,
        value: Number((club.attendanceRate || 0).toFixed(1)),
        color: [
          "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", 
          "#0ea5e9", "#14b8a6", "#f59e0b", "#6366f1", "#a855f7"
        ][index % 10],
      }))

    const html = `
      <div style="margin: 32px 0; page-break-inside: avoid;">
        <h2 style="font-size: 19px; font-weight: 600; margin-bottom: 12px; color: #111827;">
          Top 10 Clubs by Attendance - ${monthName}
        </h2>
        <p style="margin-bottom: 16px; color: #4b5563; font-size: 13px;">
          Monthly performance ranking based on attendance percentage.
        </p>
        ${generateBarChartSVG(chartData)}
      </div>
    `

    append(editorRef, html, afterChange)
    toast.success(`Inserted ${monthName} club overview chart`)
  } catch (error) {
    console.error("Failed to insert monthly club overview chart", error)
    toast.dismiss()
    toast.error("Failed to generate monthly club overview chart")
  }
}

