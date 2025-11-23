import { X as LucideX } from 'lucide-react'

export default function CloseIcon(props) {
  const Icon = LucideX
  if (Icon) {
    return <Icon {...props} />
  }

  // Fallback to a simple times character if the icon isn't available
  return (
    <span aria-hidden="true" {...props}>
      ×
    </span>
  )
}
