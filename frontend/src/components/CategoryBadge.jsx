const CATEGORY_CONFIG = {
  animal: { label: 'Animal Perdido', className: 'bg-orange-100 text-orange-800', emoji: '🐾' },
  dengue: { label: 'Dengue', className: 'bg-red-100 text-red-800', emoji: '🦟' },
  urban: { label: 'Prob. Urbano', className: 'bg-purple-100 text-purple-800', emoji: '🏙️' },
}

export default function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category] || { label: category, className: 'bg-gray-100 text-gray-800', emoji: '📌' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.emoji} {config.label}
    </span>
  )
}
