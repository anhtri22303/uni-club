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
} from "@/service/universityApi"
import { getUniToClubTransactions } from "@/service/walletApi"
import { generatePieChartSVG, generateBarChartSVG } from "@/components/reportComponent/utils/charts"

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

