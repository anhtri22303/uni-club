import { ReportPage as SharedReportPage } from "@/components/reportComponent/ReportPage"

export default function ReportPage() {
  return <SharedReportPage allowedRoles={["club_leader"]} />
}