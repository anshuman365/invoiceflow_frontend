const DOT = {
  draft: '○',
  sent: '◉',
  viewed: '◎',
  paid: '●',
  overdue: '⚠',
  partial: '◑',
  cancelled: '✕',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <span>{DOT[status] || '○'}</span>
      {status}
    </span>
  )
}
