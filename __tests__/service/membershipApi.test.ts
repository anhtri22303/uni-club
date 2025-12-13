import axiosInstance from '@/lib/axiosInstance'
import {
  getMyClubs,
  getMembersByClubId,
  getPendingMembers,
  getClubStaff,
  joinClub,
  approveMembership,
  rejectMembership,
  kickMember,
  updateMemberRole,
  postLeaveReq,
  deleteMember,
} from '@/service/membershipApi'

jest.mock('@/lib/axiosInstance')

describe('MembershipApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMyClubs', () => {
    it('should fetch user clubs', async () => {
      const mockResponse = {
        success: true,
        data: [
          { membershipId: 1, clubId: 1, clubName: 'Tech Club', clubRole: 'MEMBER' },
          { membershipId: 2, clubId: 2, clubName: 'Music Club', clubRole: 'MEMBER' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMyClubs()

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/me/clubs')
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('clubName')
    })

    it('should handle empty clubs list', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMyClubs()

      expect(result).toEqual([])
    })
  })

  describe('getMembersByClubId', () => {
    it('should fetch club members', async () => {
      const mockResponse = {
        success: true,
        data: [
          { membershipId: 1, userId: 1, fullName: 'User 1', clubRole: 'MEMBER' },
          { membershipId: 2, userId: 2, fullName: 'User 2', clubRole: 'LEADER' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getMembersByClubId(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/members')
      expect(result).toHaveLength(2)
    })

    it('should handle club not found', async () => {
      ;(axiosInstance.get as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Club not found' },
        },
      })

      await expect(getMembersByClubId(999)).rejects.toBeTruthy()
    })
  })

  describe('getPendingMembers', () => {
    it('should fetch pending members', async () => {
      const mockResponse = {
        success: true,
        data: [
          { membershipId: 1, userId: 1, fullName: 'Pending User', state: 'PENDING' },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getPendingMembers(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/members/pending')
      expect(result).toHaveLength(1)
      expect(result[0].state).toBe('PENDING')
    })

    it('should handle empty pending list', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getPendingMembers(1)

      expect(result).toEqual([])
    })
  })

  describe('getClubStaff', () => {
    it('should fetch club staff members', async () => {
      const mockResponse = {
        success: true,
        data: [
          { membershipId: 1, fullName: 'Staff 1', staff: true },
          { membershipId: 2, fullName: 'Staff 2', staff: true },
        ],
      }
      ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await getClubStaff(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/clubs/1/staff')
      expect(result).toHaveLength(2)
    })
  })

  describe('joinClub', () => {
    it('should join club successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Join request sent',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await joinClub(1)

      expect(axiosInstance.post).toHaveBeenCalledWith('/api/clubs/1/join')
      expect(result.success).toBe(true)
    })

    it('should handle already member error', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Already a member' },
        },
      })

      await expect(joinClub(1)).rejects.toBeTruthy()
    })

    it('should handle club full error', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Club is full' },
        },
      })

      await expect(joinClub(1)).rejects.toBeTruthy()
    })
  })

  describe('approveMembership', () => {
    it('should approve membership successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Membership approved',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await approveMembership(1, 123)

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/clubs/1/members/123/approve'
      )
      expect(result.success).toBe(true)
    })

    it('should handle unauthorized approval', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Unauthorized' },
        },
      })

      await expect(approveMembership(1, 123)).rejects.toBeTruthy()
    })
  })

  describe('rejectMembership', () => {
    it('should reject membership with reason', async () => {
      const mockResponse = {
        success: true,
        message: 'Membership rejected',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await rejectMembership(1, 123, 'Not qualified')

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/clubs/1/members/123/reject',
        { reason: 'Not qualified' }
      )
      expect(result.success).toBe(true)
    })

    it('should handle rejection errors', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Membership not found' },
        },
      })

      await expect(rejectMembership(1, 999, 'reason')).rejects.toBeTruthy()
    })
  })

  describe('kickMember', () => {
    it('should kick member with reason', async () => {
      const mockResponse = {
        success: true,
        message: 'Member kicked',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await kickMember(1, 123, 'Violated rules')

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/clubs/1/members/123/kick',
        { reason: 'Violated rules' }
      )
      expect(result.success).toBe(true)
    })
  })

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Role updated',
      }
      ;(axiosInstance.put as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await updateMemberRole(1, 123, 'VICE_LEADER')

      expect(axiosInstance.put).toHaveBeenCalledWith(
        '/api/clubs/1/members/123/role',
        { newRole: 'VICE_LEADER' }
      )
      expect(result.success).toBe(true)
    })

    it('should handle invalid role', async () => {
      ;(axiosInstance.put as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid role' },
        },
      })

      await expect(updateMemberRole(1, 123, 'INVALID_ROLE')).rejects.toBeTruthy()
    })
  })

  describe('postLeaveReq', () => {
    it('should submit leave request', async () => {
      const mockResponse = {
        success: true,
        message: 'Leave request submitted',
      }
      ;(axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await postLeaveReq(1, 'Personal reasons')

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/clubs/1/leave-requests',
        { reason: 'Personal reasons' }
      )
      expect(result.success).toBe(true)
    })

    it('should require reason', async () => {
      ;(axiosInstance.post as jest.Mock).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Reason is required' },
        },
      })

      await expect(postLeaveReq(1, '')).rejects.toBeTruthy()
    })
  })

  describe('deleteMember', () => {
    it('should delete member successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Member deleted',
      }
      ;(axiosInstance.delete as jest.Mock).mockResolvedValue({ data: mockResponse })

      const result = await deleteMember(1, 123)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/api/clubs/1/members/123')
      expect(result.success).toBe(true)
    })

    it('should handle delete errors', async () => {
      ;(axiosInstance.delete as jest.Mock).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Cannot delete member' },
        },
      })

      await expect(deleteMember(1, 123)).rejects.toBeTruthy()
    })
  })
})
