"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { fetchClub } from "@/service/clubApi"
import { fetchEvent } from "@/service/eventApi"
import { fetchUser } from "@/service/userApi"
import { fetchPolicies } from "@/service/policyApi"
import { getClubApplications } from "@/service/clubApplicationAPI"

/**
 * Hook to automatically load data from API into DataContext after login
 * This ensures Sidebar and other components using DataContext have fresh data
 */
export function useDataLoader() {
  const { auth, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const {
    updateEvents,
    updateClubs,
    updateUsers,
    updatePolicies,
    updateClubApplications,
    updateEventRequests,
  } = useData()

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isAuthenticated || !auth.user) {
      return
    }

    let mounted = true
    const loadData = async () => {
      try {
        console.log("🔄 useDataLoader: Loading data for role:", auth.role)

        // Fetch data based on role
        const promises: Promise<any>[] = []

        // STUDENT role - load events and clubs
        if (auth.role === "student") {
          promises.push(
            fetchEvent()
              .then((data: any) => {
                if (!mounted) return
                const events = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                console.log("✅ useDataLoader: Loaded events for student:", events.length)
                updateEvents(events)
              })
              .catch((err) => console.error("❌ Failed to load events:", err))
          )

          // Không fetch clubs nếu đang ở trang /profile
          if (pathname !== "/profile") {
            promises.push(
              fetchClub({ page: 0, size: 70, sort: ["name"] })
                .then((res: any) => {
                  if (!mounted) return
                  const clubs = res?.data?.content ?? []
                  console.log("✅ useDataLoader: Loaded clubs for student:", clubs.length)
                  updateClubs(clubs)
                })
                .catch((err) => console.error("❌ Failed to load clubs:", err))
            )
          } else {
            console.log("⏭️ useDataLoader: Skipping clubs fetch on /profile page")
          }
        }

        // CLUB_LEADER role - load events and clubs only
        if (auth.role === "club_leader") {
          promises.push(
            fetchEvent()
              .then((data: any) => {
                if (!mounted) return
                const events = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                console.log("✅ useDataLoader: Loaded events for club_leader:", events.length)
                updateEvents(events)
              })
              .catch((err) => console.error("❌ Failed to load events:", err))
          )

          promises.push(
            fetchClub({ page: 0, size: 70, sort: ["name"] })
              .then((res: any) => {
                if (!mounted) return
                const clubs = res?.data?.content ?? []
                console.log("✅ useDataLoader: Loaded clubs for club_leader:", clubs.length)
                updateClubs(clubs)
              })
              .catch((err) => console.error("❌ Failed to load clubs:", err))
          )
        }

        // UNI_STAFF role - load everything
        if (auth.role === "uni_staff") {
          promises.push(
            fetchEvent()
              .then((data: any) => {
                if (!mounted) return
                const events = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                console.log("✅ useDataLoader: Loaded events for uni_staff:", events.length)
                updateEvents(events)
              })
              .catch((err) => console.error("❌ Failed to load events:", err))
          )

          promises.push(
            fetchClub({ page: 0, size: 70, sort: ["name"] })
              .then((res: any) => {
                if (!mounted) return
                const clubs = res?.data?.content ?? []
                console.log("✅ useDataLoader: Loaded clubs for uni_staff:", clubs.length)
                updateClubs(clubs)
              })
              .catch((err) => console.error("❌ Failed to load clubs:", err))
          )

          promises.push(
            fetchPolicies()
              .then((policies: any) => {
                if (!mounted) return
                console.log("✅ useDataLoader: Loaded policies for uni_staff:", policies.length)
                updatePolicies(policies)
              })
              .catch((err) => console.error("❌ Failed to load policies:", err))
          )

          promises.push(
            getClubApplications()
              .then((applications: any) => {
                if (!mounted) return
                console.log("✅ useDataLoader: Loaded club applications for uni_staff:", applications.length)
                updateClubApplications(applications)
              })
              .catch((err) => console.error("❌ Failed to load club applications:", err))
          )

          // Note: Event requests API is not yet implemented
          // TODO: Add fetchEventRequests when API is ready
        }

        // ADMIN role - load everything
        if (auth.role === "admin") {
          promises.push(
            fetchEvent()
              .then((data: any) => {
                if (!mounted) return
                const events = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                console.log("✅ useDataLoader: Loaded events for admin:", events.length)
                updateEvents(events)
              })
              .catch((err) => console.error("❌ Failed to load events:", err))
          )

          promises.push(
            fetchClub({ page: 0, size: 70, sort: ["name"] })
              .then((res: any) => {
                if (!mounted) return
                const clubs = res?.data?.content ?? []
                console.log("✅ useDataLoader: Loaded clubs for admin:", clubs.length)
                updateClubs(clubs)
              })
              .catch((err) => console.error("❌ Failed to load clubs:", err))
          )

          promises.push(
            fetchUser()
              .then((users: any) => {
                if (!mounted) return
                console.log("✅ useDataLoader: Loaded users for admin:", users.length)
                updateUsers(users)
              })
              .catch((err) => console.error("❌ Failed to load users:", err))
          )

          promises.push(
            fetchPolicies()
              .then((policies: any) => {
                if (!mounted) return
                console.log("✅ useDataLoader: Loaded policies for admin:", policies.length)
                updatePolicies(policies)
              })
              .catch((err) => console.error("❌ Failed to load policies:", err))
          )
        }

        // Wait for all promises to complete
        await Promise.allSettled(promises)
        console.log("✅ useDataLoader: Completed loading all data")
      } catch (err) {
        console.error("❌ useDataLoader: Error loading data:", err)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [isAuthenticated, auth.user, auth.role, pathname]) // Re-run when auth or pathname changes

  // This hook doesn't return anything, it just loads data into context
  return null
}

