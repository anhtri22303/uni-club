import axiosInstance from "@/lib/axiosInstance"

export interface Location {
  id: number
  name: string
  address: string
  capacity: number
}

export interface Pageable {
  pageNumber: number
  pageSize: number
  sort: {
    sorted: boolean
    empty: boolean
    unsorted: boolean
  }
  offset: number
  paged: boolean
  unpaged: boolean
}

export interface LocationsApiResponse {
  content: Location[]
  pageable: Pageable
  last: boolean
  totalPages: number
  totalElements: number
  first: boolean
  size: number
  number: number
  sort: {
    sorted: boolean
    empty: boolean
    unsorted: boolean
  }
  numberOfElements: number
  empty: boolean
}

export const fetchLocation = async (pageable: { page?: number; size?: number; sort?: string[] } = { page: 0, size: 70, sort: ["capacity"] }) => {
  try {
    const response = await axiosInstance.get<LocationsApiResponse>("api/locations", {
      params: {
        pageable: JSON.stringify({
          page: pageable.page ?? 0,
          size: pageable.size ?? 70,
          sort: pageable.sort ?? ["capacity"],
        }),
      },
    })

    console.log("Fetched locations:", response.data)
    return response.data
  } catch (error) {
    console.error("Error fetching locations:", error)
    throw error
  }
}

export const getLocationById = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`api/locations/${id}`)
    console.log("Fetched location by id:", response.data)
    return response.data
  } catch (error) {
    console.error(`Error fetching location ${id}:`, error)
    throw error
  }
}

export interface CreateLocationRequest {
  name: string
  address: string
  capacity: number
}

export const postLocation = async (data: CreateLocationRequest): Promise<Location> => {
  try {
    const response = await axiosInstance.post<Location>("api/locations", data)
    console.log("Created location response:", response.data)
    return response.data
  } catch (error) {
    console.error("Error creating location:", error)
    throw error
  }
}

export interface DeleteLocationApiResponse {
  success: boolean
  message: string
  data: string
}

export const deleteLocation = async (locationId: number): Promise<string> => {
  try {
    const response = await axiosInstance.delete<DeleteLocationApiResponse>(`api/locations/${locationId}`)
    console.log("Deleted location response:", response.data)
    
    if (response.data.success) {
      return response.data.data
    }
    
    throw new Error(response.data.message || "Failed to delete location")
  } catch (error) {
    console.error("Error deleting location:", error)
    throw error
  }
}
