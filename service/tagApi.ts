import axiosInstance from "@/lib/axiosInstance"

export interface Tag {
  tagId: number
  name: string
}

export interface TagsApiResponse {
  success: boolean
  message: string
  data: Tag[]
}

export interface TagApiResponse {
  success: boolean
  message: string
  data: Tag
}

export const getTags = async (): Promise<Tag[]> => {
  try {
    const response = await axiosInstance.get<TagsApiResponse>("/api/tags")
    console.log("Fetched tags response:", response.data)
    
    if (response.data.success) {
      return response.data.data
    }
    
    return []
  } catch (error) {
    console.error("Error fetching tags:", error)
    throw error
  }
}

export const postTag = async (name: string): Promise<Tag> => {
  try {
    const response = await axiosInstance.post<TagApiResponse>("/api/tags", { name })
    console.log("Created tag response:", response.data)
    
    if (response.data.success) {
      return response.data.data
    }
    
    throw new Error(response.data.message || "Failed to create tag")
  } catch (error) {
    console.error("Error creating tag:", error)
    throw error
  }
}

export interface DeleteTagApiResponse {
  success: boolean
  message: string
  data: string
}

export const deleteTag = async (tagId: number): Promise<string> => {
  try {
    const response = await axiosInstance.delete<DeleteTagApiResponse>(`/api/tags/${tagId}`)
    console.log("Deleted tag response:", response.data)
    
    if (response.data.success) {
      return response.data.data
    }
    
    throw new Error(response.data.message || "Failed to delete tag")
  } catch (error) {
    console.error("Error deleting tag:", error)
    throw error
  }
}

