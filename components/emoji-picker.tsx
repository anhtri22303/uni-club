"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Smile } from "lucide-react"
import { Input } from "@/components/ui/input"

// Common emoji categories
const EMOJI_CATEGORIES = [
  {
    name: "Mặt cười và hình người",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
      "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
      "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
      "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒",
      "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵",
      "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕",
      "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺",
      "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱",
      "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
      "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩",
    ],
  },
  {
    name: "Cử chỉ",
    icon: "👋",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏",
      "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
      "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛",
      "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️",
      "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃",
    ],
  },
  {
    name: "Trái tim",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
    ],
  },
  {
    name: "Động vật",
    icon: "🐶",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵",
      "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤",
      "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗",
      "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜",
      "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎",
    ],
  },
  {
    name: "Thực phẩm",
    icon: "🍕",
    emojis: [
      "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈",
      "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆",
      "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄",
      "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨",
      "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩",
      "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙",
      "🧆", "🌮", "🌯", "🥗", "🥘", "🥫", "🍝", "🍜",
      "🍲", "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚",
      "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨",
      "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬",
      "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛",
      "🍼", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻",
      "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊",
    ],
  },
  {
    name: "Hoạt động",
    icon: "⚽",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
      "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
      "🏏", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊",
      "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿",
      "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺", "⛹️",
      "🤾", "🏌️", "🏇", "🧘", "🏊", "🤽", "🚣", "🧗",
      "🚴", "🚵", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧",
      "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻",
    ],
  },
  {
    name: "Du lịch",
    icon: "✈️",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
      "🚒", "🚐", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼",
      "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍",
      "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞",
      "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊",
      "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀",
      "🛸", "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️",
      "🚢", "⚓", "⛽", "🚧", "🚦", "🚥", "🚏", "🗺️",
    ],
  },
  {
    name: "Đồ vật",
    icon: "💡",
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️",
      "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼",
      "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️",
      "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭",
      "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋",
      "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸",
      "💵", "💴", "💶", "💷", "💰", "💳", "💎", "⚖️",
    ],
  },
  {
    name: "Biểu tượng",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
      "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈",
      "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
      "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️",
      "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️",
      "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹",
      "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌",
      "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️",
      "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗",
      "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️",
      "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯",
      "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀",
      "💤", "🏧", "🚾", "♿", "🅿️", "🈳", "🈂️", "🛂",
      "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "⚧️", "🚻",
      "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤", "🔡",
      "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "0️⃣",
      "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣",
      "9️⃣", "🔟", "🔢", "#️⃣", "*️⃣", "⏏️", "▶️", "⏸️",
      "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫",
      "⏬", "◀️", "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️",
      "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️",
      "⤴️", "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃", "🎵",
      "🎶", "➕", "➖", "➗", "✖️", "♾️", "💲", "💱",
      "™️", "©️", "®️", "〰️", "➰", "➿", "🔚", "🔙",
      "🔛", "🔝", "🔜", "✔️", "☑️", "🔘", "🔴", "🟠",
      "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺",
      "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️",
      "▫️", "◾", "◽", "◼️", "◻️", "🟥", "🟧", "🟨",
      "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇",
      "🔉", "🔊", "🔔", "🔕", "📣", "📢", "👁️‍🗨️", "💬",
      "💭", "🗯️", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴",
      "🀄", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖",
      "🕗", "🕘", "🕙", "🕚", "🕛", "🕜", "🕝", "🕞",
      "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦",
      "🕧",
    ],
  },
]

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  trigger?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function EmojiPicker({
  onEmojiSelect,
  trigger,
  side = "top",
  align = "end",
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(0)

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setOpen(false)
    setSearchQuery("")
  }

  // Filter emojis based on search query
  const filteredCategories = searchQuery
    ? EMOJI_CATEGORIES.map((category) => ({
        ...category,
        emojis: category.emojis.filter((emoji) =>
          emoji.includes(searchQuery)
        ),
      })).filter((category) => category.emojis.length > 0)
    : EMOJI_CATEGORIES

  const currentCategory = searchQuery
    ? filteredCategories[0]
    : EMOJI_CATEGORIES[selectedCategory]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            type="button"
          >
            <Smile className="h-5 w-5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        side={side}
        align={align}
        sideOffset={8}
      >
        <div className="flex flex-col h-[400px]">
          {/* Search */}
          <div className="p-2 border-b">
            <Input
              placeholder="Tìm kiếm biểu tượng cảm xúc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Category tabs - hide when searching */}
          {!searchQuery && (
            <div className="flex gap-1 p-2 border-b overflow-x-auto">
              {EMOJI_CATEGORIES.map((category, index) => (
                <Button
                  key={index}
                  variant={selectedCategory === index ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={() => setSelectedCategory(index)}
                  type="button"
                >
                  <span className="text-lg">{category.icon}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Emoji grid with scrollbar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-2">
              {searchQuery && filteredCategories.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Không tìm thấy biểu tượng cảm xúc
                </div>
              ) : searchQuery ? (
                // Show all filtered results when searching
                <div>
                  {filteredCategories.map((category, catIndex) => (
                    <div key={catIndex} className="mb-4">
                      <h3 className="text-xs font-medium text-muted-foreground mb-2">
                        {category.name}
                      </h3>
                      <div className="grid grid-cols-8 gap-1">
                        {category.emojis.map((emoji, emojiIndex) => (
                          <button
                            key={emojiIndex}
                            onClick={() => handleEmojiClick(emoji)}
                            className="h-9 w-9 flex items-center justify-center text-xl hover:bg-accent rounded transition-colors"
                            type="button"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Show selected category
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2">
                    {currentCategory.name}
                  </h3>
                  <div className="grid grid-cols-8 gap-1">
                    {currentCategory.emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiClick(emoji)}
                        className="h-9 w-9 flex items-center justify-center text-xl hover:bg-accent rounded transition-colors"
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

