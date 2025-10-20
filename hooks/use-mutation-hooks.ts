"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-query-hooks"
import { postMemAppli } from "@/service/memberApplicationApi"
import { useToast } from "@/hooks/use-toast"

// ============================================
// MEMBERSHIP APPLICATION MUTATIONS
// ============================================

/**
 * Hook to apply for club membership with optimistic updates
 */
export function useApplyToClub() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { clubId: string; userId: string; applicationText: string }) => {
      const response = await postMemAppli({
        clubId: data.clubId,
        message: data.applicationText,
      })
      return response
    },

    // Optimistic update - UI updates immediately before API response
    onMutate: async (newApplication) => {
      // Cancel any outgoing refetches (so they don't overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.clubs })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKeys.clubsList({ page: 0, size: 20, sort: ["name"] }))

      // Optimistically update UI - show as "pending" immediately
      toast({
        title: "Application Submitted",
        description: `Your application to join the club is being processed...`,
      })

      // Return context with previous data for rollback
      return { previousData }
    },

    // On success - refetch to get real data
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      toast({
        title: "Success!",
        description: "Your application has been submitted successfully.",
      })
    },

    // On error - rollback optimistic update
    onError: (error, newApplication, context) => {
      // Rollback to previous data
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.clubsList({ page: 0, size: 20, sort: ["name"] }), context.previousData)
      }

      toast({
        title: "Application Failed",
        description: (error as any)?.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
    },
  })
}

// ============================================
// EXAMPLE: CREATE CLUB MUTATION
// ============================================

/**
 * Hook to create a new club with optimistic updates
 * (Example for future implementation)
 */
export function useCreateClub() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (clubData: any) => {
      // TODO: Replace with actual API call
      // const response = await createClub(clubData)
      // return response
      throw new Error("Not implemented yet")
    },

    onMutate: async (newClub) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clubs })

      const previousClubs = queryClient.getQueryData(queryKeys.clubsList({ page: 0, size: 20, sort: ["name"] }))

      // Optimistically add the new club to the list
      queryClient.setQueryData(queryKeys.clubsList({ page: 0, size: 20, sort: ["name"] }), (old: any) => {
        if (!old) return [newClub]
        return [...old, { ...newClub, id: "temp-" + Date.now(), status: "pending" }]
      })

      toast({
        title: "Creating Club...",
        description: `Creating ${newClub.name}...`,
      })

      return { previousClubs }
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      toast({
        title: "Club Created!",
        description: "Your club has been created successfully.",
      })
    },

    onError: (error, newClub, context) => {
      if (context?.previousClubs) {
        queryClient.setQueryData(queryKeys.clubsList({ page: 0, size: 20, sort: ["name"] }), context.previousClubs)
      }

      toast({
        title: "Creation Failed",
        description: (error as any)?.message || "Failed to create club.",
        variant: "destructive",
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
    },
  })
}

// ============================================
// EXAMPLE: UPDATE USER MUTATION
// ============================================

/**
 * Hook to update user with optimistic updates
 * (Example for future implementation)
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string | number; updates: any }) => {
      // TODO: Replace with actual API call
      // const response = await updateUser(userId, updates)
      // return response
      throw new Error("Not implemented yet")
    },

    onMutate: async ({ userId, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.userDetail(userId) })

      const previousUser = queryClient.getQueryData(queryKeys.userDetail(userId))

      // Optimistically update user data
      queryClient.setQueryData(queryKeys.userDetail(userId), (old: any) => {
        if (!old) return updates
        return { ...old, ...updates }
      })

      return { previousUser }
    },

    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.usersList() })
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    },

    onError: (error, { userId }, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.userDetail(userId), context.previousUser)
      }

      toast({
        title: "Update Failed",
        description: (error as any)?.message || "Failed to update profile.",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// EXAMPLE: DELETE MUTATION
// ============================================

/**
 * Hook to delete item with optimistic updates
 * (Example pattern for any delete operation)
 */
export function useDeleteItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: string; itemId: string | number }) => {
      // TODO: Replace with actual API call based on itemType
      // if (itemType === 'club') return await deleteClub(itemId)
      // if (itemType === 'event') return await deleteEvent(itemId)
      throw new Error("Not implemented yet")
    },

    onMutate: async ({ itemType, itemId }) => {
      // Determine which query to update based on itemType
      let queryKey: any
      if (itemType === "club") queryKey = queryKeys.clubsList({ page: 0, size: 20, sort: ["name"] })
      else if (itemType === "event") queryKey = queryKeys.eventsList()
      else if (itemType === "user") queryKey = queryKeys.usersList()

      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData(queryKey)

      // Optimistically remove the item from the list
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!Array.isArray(old)) return old
        return old.filter((item: any) => String(item.id) !== String(itemId))
      })

      toast({
        title: "Deleting...",
        description: `Removing ${itemType}...`,
      })

      return { previousData, queryKey }
    },

    onSuccess: (data, { itemType }) => {
      toast({
        title: "Deleted!",
        description: `${itemType} has been removed successfully.`,
      })
    },

    onError: (error, variables, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData)
      }

      toast({
        title: "Delete Failed",
        description: (error as any)?.message || "Failed to delete item.",
        variant: "destructive",
      })
    },

    onSettled: (data, error, { itemType }) => {
      // Refetch all related queries
      if (itemType === "club") queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      else if (itemType === "event") queryClient.invalidateQueries({ queryKey: queryKeys.events })
      else if (itemType === "user") queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

// ============================================
// UTILITY: Manual Cache Updates
// ============================================

/**
 * Manually update cache without API call
 * Useful for instant UI updates
 */
export function useManualCacheUpdate() {
  const queryClient = useQueryClient()

  return {
    updateClub: (clubId: number, updates: any) => {
      queryClient.setQueryData(queryKeys.clubDetail(clubId), (old: any) => ({
        ...old,
        ...updates,
      }))
    },

    updateUser: (userId: string | number, updates: any) => {
      queryClient.setQueryData(queryKeys.userDetail(userId), (old: any) => ({
        ...old,
        ...updates,
      }))
    },

    invalidateAll: () => {
      queryClient.invalidateQueries()
    },

    resetCache: () => {
      queryClient.clear()
    },
  }
}
