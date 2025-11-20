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
        

        // Fetch data based on role
        const promises: Promise<any>[] = []

        // STUDENT role - load events and clubs
        if (auth.role === "student") {
          promises.push(
            fetchEvent()
              .then((data: any) => {
                if (!mounted) return
                const events = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                
                updateEvents(events)
              })
              .catch((err) => console.error("  Failed to load events:", err))
          )

          // Không fetch clubs nếu đang ở trang /profile
          if (pathname !== "/profile") {
            promises.push(
              fetchClub({ page: 0, size: 70, sort: ["name"] })
                .then((res: any) => {
                  if (!mounted) return
                  const clubs = res?.data?.content ?? []
                  
                  updateClubs(clubs)
                })
                .catch((err) => console.error("  Failed to load clubs:", err))
            )
          } else {
            
          }
        }

        // CLUB_LEADER role - load events and clubs only
        if (auth.role === "club_leader") {
          promises.push(
            fetchEvent()
              .then((data: any) => {
                if (!mounted) return
                const events = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                
                updateEvents(events)
              })
              .catch((err) => console.error("  Failed to load events:", err))
          )

          promises.push(
            fetchClub({ page: 0, size: 70, sort: ["name"] })
              .then((res: any) => {
                if (!mounted) return
                const clubs = res?.data?.content ?? []
                
                updateClubs(clubs)
              })
              .catch((err) => console.error("  Failed to load clubs:", err))
          )
        }

        // UNI_STAFF role - load everything
        if (auth.role === "uni_staff") {
          promises.push(
            fetchEvent()
              .then((data: any) => {
                if (!mounted) return
                const events = Array.isArray(data) ? data : (data?.content ?? data?.events ?? [])
                
                updateEvents(events)
              })
              .catch((err) => console.error("  Failed to load events:", err))
          )

          promises.push(
            fetchClub({ page: 0, size: 70, sort: ["name"] })
              .then((res: any) => {
                if (!mounted) return
                const clubs = res?.data?.content ?? []
                
                updateClubs(clubs)
              })
              .catch((err) => console.error("  Failed to load clubs:", err))
          )

          promises.push(
            fetchPolicies()
              .then((policies: any) => {
                if (!mounted) return
                
                updatePolicies(policies)
              })
              .catch((err) => console.error("  Failed to load policies:", err))
          )

          promises.push(
            getClubApplications()
              .then((applications: any) => {
                if (!mounted) return
                
                updateClubApplications(applications)
              })
              .catch((err) => console.error("  Failed to load club applications:", err))
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
               
                updateEvents(events)
              })
              .catch((err) => console.error("  Failed to load events:", err))
          )

          promises.push(
            fetchClub({ page: 0, size: 70, sort: ["name"] })
              .then((res: any) => {
                if (!mounted) return
                const clubs = res?.data?.content ?? []
                
                updateClubs(clubs)
              })
              .catch((err) => console.error("  Failed to load clubs:", err))
          )

          promises.push(
            fetchUser()
              .then((users: any) => {
                if (!mounted) return
                
                updateUsers(users)
              })
              .catch((err) => console.error(" Failed to load users:", err))
          )

          promises.push(
            fetchPolicies()
              .then((policies: any) => {
                if (!mounted) return
                
                updatePolicies(policies)
              })
              .catch((err) => console.error(" Failed to load policies:", err))
          )
        }

        // Wait for all promises to complete
        await Promise.allSettled(promises)
        
      } catch (err) {
        console.error(" useDataLoader: Error loading data:", err)
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

