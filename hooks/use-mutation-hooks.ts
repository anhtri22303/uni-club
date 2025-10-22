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

// ============================================
// CLUB MUTATIONS
// ============================================

/**
 * Hook to create a new club
 */
export function useCreateClubMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (clubData: { name: string; description: string; majorPolicyId?: number; majorName?: string }) => {
      const { createClub } = await import("@/service/clubApi")
      return await createClub(clubData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      toast({ title: "Success", description: "Club created successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to create club",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to update a club
 */
export function useUpdateClubMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const { updateClub } = await import("@/service/clubApi")
      return await updateClub(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      queryClient.invalidateQueries({ queryKey: queryKeys.clubDetail(Number(variables.id)) })
      toast({ title: "Success", description: "Club updated successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to update club",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to delete a club
 */
export function useDeleteClubMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string | number) => {
      const { deleteClub } = await import("@/service/clubApi")
      return await deleteClub(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      toast({ title: "Success", description: "Club deleted successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to delete club",
        variant: "destructive" 
      })
    },
  })
}

// ============================================
// USER MUTATIONS
// ============================================

/**
 * Hook to update user profile
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const { editProfile } = await import("@/service/userApi")
      return await editProfile(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      toast({ title: "Success", description: "Profile updated successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to update profile",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatarMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (file: File) => {
      const { uploadAvatar } = await import("@/service/userApi")
      return await uploadAvatar(file)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      toast({ title: "Success", description: "Avatar uploaded successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to upload avatar",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to update user by ID (admin)
 */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      const { updateUserById } = await import("@/service/userApi")
      return await updateUserById(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(variables.id) })
      toast({ title: "Success", description: "User updated successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to update user",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to delete user by ID (admin)
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string | number) => {
      const { deleteUserById } = await import("@/service/userApi")
      return await deleteUserById(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast({ title: "Success", description: "User deleted successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to delete user",
        variant: "destructive" 
      })
    },
  })
}

// ============================================
// POLICY MUTATIONS
// ============================================

/**
 * Hook to create a policy
 */
export function useCreatePolicyMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const { createPolicy } = await import("@/service/policyApi")
      return await createPolicy(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies })
      toast({ title: "Success", description: "Policy created successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to create policy",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to update a policy
 */
export function useUpdatePolicyMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { updatePolicyById } = await import("@/service/policyApi")
      return await updatePolicyById(id, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies })
      queryClient.invalidateQueries({ queryKey: queryKeys.policyDetail(variables.id) })
      toast({ title: "Success", description: "Policy updated successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to update policy",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to delete a policy
 */
export function useDeletePolicyMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: number) => {
      const { deletePolicyById } = await import("@/service/policyApi")
      return await deletePolicyById(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies })
      toast({ title: "Success", description: "Policy deleted successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to delete policy",
        variant: "destructive" 
      })
    },
  })
}

// ============================================
// PRODUCT MUTATIONS
// ============================================

/**
 * Hook to create a product
 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const { addProduct } = await import("@/service/productApi")
      return await addProduct(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products })
      toast({ title: "Success", description: "Product created successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to create product",
        variant: "destructive" 
      })
    },
  })
}

// ============================================
// WALLET MUTATIONS
// ============================================

/**
 * Hook to reward points to member
 */
export function useRewardPointsMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ membershipId, points, reason }: { membershipId: string | number; points: number; reason?: string }) => {
      const { rewardPointsToMember } = await import("@/service/walletApi")
      return await rewardPointsToMember(membershipId, points, reason)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
      toast({ title: "Success", description: "Points rewarded successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to reward points",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to distribute points to clubs
 */
export function useDistributePointsMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ clubIds, points, reason }: { clubIds: (string | number)[]; points: number; reason?: string }) => {
      const { distributePointsToClubs } = await import("@/service/walletApi")
      return await distributePointsToClubs(clubIds, points, reason)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      toast({ title: "Success", description: "Points distributed successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to distribute points",
        variant: "destructive" 
      })
    },
  })
}

// ============================================
// MEMBER APPLICATION MUTATIONS
// ============================================

/**
 * Hook to approve member application
 */
export function useApproveMemberApplicationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (applicationId: number | string) => {
      const { approveMemberApplication } = await import("@/service/memberApplicationApi")
      return await approveMemberApplication(applicationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memberApplications })
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      toast({ title: "Success", description: "Application approved successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to approve application",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to reject member application
 */
export function useRejectMemberApplicationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: number | string; reason: string }) => {
      const { rejectMemberApplication } = await import("@/service/memberApplicationApi")
      return await rejectMemberApplication(applicationId, reason)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memberApplications })
      toast({ title: "Success", description: "Application rejected successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to reject application",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to delete member application
 */
export function useDeleteMemberApplicationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (applicationId: number | string) => {
      const { deleteMemberApplication } = await import("@/service/memberApplicationApi")
      return await deleteMemberApplication(applicationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.memberApplications })
      toast({ title: "Success", description: "Application deleted successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to delete application",
        variant: "destructive" 
      })
    },
  })
}

// ============================================
// CLUB APPLICATION MUTATIONS
// ============================================

/**
 * Hook to create club application
 */
export function useCreateClubApplicationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { clubName: string; description: string; majorId: number; proposerReason: string }) => {
      const { postClubApplication } = await import("@/service/clubApplicationAPI")
      return await postClubApplication(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubApplications })
      toast({ title: "Success", description: "Club application submitted successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to submit club application",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to process club application (approve/reject)
 */
export function useProcessClubApplicationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ applicationId, approve, rejectReason }: { applicationId: number; approve: boolean; rejectReason?: string }) => {
      const { processClubApplication } = await import("@/service/clubApplicationAPI")
      return await processClubApplication(applicationId, { approve, rejectReason })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubApplications })
      toast({ title: "Success", description: "Club application processed successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to process club application",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to finalize club application
 */
export function useFinalizeClubApplicationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (applicationId: number) => {
      const { finalizeClubApplication } = await import("@/service/clubApplicationAPI")
      return await finalizeClubApplication(applicationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubApplications })
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs })
      toast({ title: "Success", description: "Club application finalized successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to finalize club application",
        variant: "destructive" 
      })
    },
  })
}

// ============================================
// ATTENDANCE MUTATIONS
// ============================================

/**
 * Hook to save attendance record
 */
export function useSaveAttendanceMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (records: any[]) => {
      const { saveAttendanceRecord } = await import("@/service/attendanceApi")
      return await saveAttendanceRecord(records)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendances })
      toast({ title: "Success", description: "Attendance saved successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.response?.data?.message || "Failed to save attendance",
        variant: "destructive" 
      })
    },
  })
}

/**
 * Hook to check in to event
 */
export function useCheckinMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (token: string) => {
      const { checkin } = await import("@/service/checkinApi")
      return await checkin(token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendances })
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet })
      toast({ title: "Success", description: "Checked in successfully" })
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to check in",
        variant: "destructive" 
      })
    },
  })
}