export type ChartDatum = { name: string; value: number; color: string }

export function generatePieChartSVG(data: ChartDatum[]): string {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return `<p style="text-align: center; color: #888;">No data available</p>`

  const cx = 120
  const cy = 120
  const radius = 90
  let currentAngle = -90

  const slices = data.map((item) => {
    const percentage = item.value / total
    const angle = percentage * 360
    const startAngle = currentAngle * (Math.PI / 180)
    const endAngle = (currentAngle + angle) * (Math.PI / 180)
    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)
    const largeArcFlag = angle > 180 ? 1 : 0
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    currentAngle += angle
    return { path, color: item.color }
  })

  const legend = data
    .map(
      (item) => `
      <div style="display: flex; align-items: center; margin: 4px 0;">
        <div style="width: 14px; height: 14px; background: ${item.color}; margin-right: 8px; border-radius: 2px;"></div>
        <span style="font-size: 13px; color: #374151;">${item.name}: <strong>${item.value}</strong> (${((item.value / total) * 100).toFixed(1)}%)</span>
      </div>`
    )
    .join("")

  return `
    <div style="display: flex; align-items: center; gap: 25px; margin: 12px 0;">
      <svg width="240" height="240" viewBox="0 0 240 240" style="flex-shrink: 0;">
        ${slices.map((slice) => `<path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="2"/>`).join("")}
      </svg>
      <div style="flex: 1;">
        ${legend}
      </div>
    </div>
  `
}

export function generateBarChartSVG(data: ChartDatum[]): string {
  if (data.length === 0) return `<p style="text-align: center; color: #888;">No data available</p>`

  const maxValue = Math.max(...data.map((d) => d.value))
  const barWidth = 70
  const barSpacing = 100
  const chartHeight = 200
  const chartWidth = Math.max(data.length * barSpacing + 60, 300)

  const bars = data.map((item, index) => {
    const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 70) : 0
    const x = 40 + index * barSpacing
    const y = chartHeight - barHeight - 35
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.color}" rx="4"/>
      <text x="${x + barWidth / 2}" y="${chartHeight - 15}" text-anchor="middle" font-size="11" fill="#6b7280" transform="rotate(-30 ${x + barWidth / 2} ${chartHeight - 15})">${item.name}</text>
      <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="15" font-weight="bold" fill="#1f2937">${item.value.toLocaleString()}</text>
    `
  })

  return `
    <div style="margin: 10px 0;">
      <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="display: block; max-width: 100%;">
        <line x1="30" y1="${chartHeight - 35}" x2="${chartWidth - 20}" y2="${chartHeight - 35}" stroke="#d1d5db" stroke-width="1.5"/>
        ${bars.join("")}
      </svg>
    </div>
  `
}


