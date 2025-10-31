import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for tags (for demo purposes)
let tags = [
  { tagId: 1, name: "event" },
  { tagId: 2, name: "club" },
  { tagId: 3, name: "reward" },
  { tagId: 4, name: "gift" },
  { tagId: 5, name: "voucher" },
  { tagId: 6, name: "souvenir" },
  { tagId: 7, name: "collectible" },
  { tagId: 8, name: "new" },
  { tagId: 9, name: "hot" },
  { tagId: 10, name: "trending" },
  { tagId: 11, name: "favorite" },
  { tagId: 12, name: "best_seller" },
  { tagId: 13, name: "exclusive" },
  { tagId: 14, name: "limited" },
  { tagId: 15, name: "limited_time" },
  { tagId: 16, name: "shirt" },
  { tagId: 17, name: "cap" },
  { tagId: 18, name: "bottle" },
  { tagId: 19, name: "bag" },
  { tagId: 20, name: "sticker" },
  { tagId: 21, name: "badge" },
  { tagId: 22, name: "lanyard" },
  { tagId: 23, name: "poster" },
  { tagId: 24, name: "physical" },
  { tagId: 25, name: "festival" },
  { tagId: 26, name: "music" },
  { tagId: 27, name: "sport" },
  { tagId: 28, name: "tech" },
  { tagId: 29, name: "volunteer" },
  { tagId: 30, name: "art" },
  { tagId: 31, name: "catday" },
  { tagId: 32, name: "green_day" },
  { tagId: 33, name: "innovation" },
  { tagId: 34, name: "anniversary" },
  { tagId: 35, name: "member" },
  { tagId: 36, name: "public" },
  { tagId: 37, name: "vip" },
  { tagId: 38, name: "guest" },
  { tagId: 39, name: "staff" },
  { tagId: 40, name: "leader_reward" },
  { tagId: 41, name: "participant" },
  { tagId: 42, name: "winner" },
  { tagId: 43, name: "sponsor" },
  { tagId: 44, name: "collab" },
  { tagId: 45, name: "campaign" },
  { tagId: 46, name: "promo" },
  { tagId: 47, name: "brand_partner" },
  { tagId: 48, name: "donation" },
  { tagId: 49, name: "premium" },
  { tagId: 50, name: "durable" },
  { tagId: 51, name: "handmade" },
  { tagId: 52, name: "lightweight" },
  { tagId: 53, name: "useful" },
  { tagId: 54, name: "decorative" },
  { tagId: 55, name: "spring" },
  { tagId: 56, name: "summer" },
  { tagId: 57, name: "autumn" },
  { tagId: 58, name: "winter" },
  { tagId: 59, name: "newyear" },
  { tagId: 60, name: "midautumn" },
  { tagId: 61, name: "christmas" },
  { tagId: 62, name: "year_end" },
  { tagId: 63, name: "orientation" }
]

// GET - Fetch all tags
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: "success",
      data: tags
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to fetch tags",
        data: []
      },
      { status: 500 }
    )
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    // Validate name parameter
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: "Tag name is required and must be a string",
          data: null
        },
        { status: 400 }
      )
    }

    // Check if tag name already exists
    const existingTag = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase())
    if (existingTag) {
      return NextResponse.json(
        {
          success: false,
          message: "Tag with this name already exists",
          data: null
        },
        { status: 409 }
      )
    }

    // Generate new tag ID
    const newTagId = Math.max(...tags.map(tag => tag.tagId), 0) + 1

    // Create new tag
    const newTag = {
      tagId: newTagId,
      name: name.trim()
    }

    // Add to tags array
    tags.push(newTag)

    return NextResponse.json(
      {
        success: true,
        message: "Tag created successfully",
        data: newTag
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create tag",
        data: null
      },
      { status: 500 }
    )
  }
}

