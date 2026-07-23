interface ToastProps {
  message: string | null
}

export default function Toast({ message }: ToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: `translateX(-50%) translateY(${message ? '0' : '20px'})`,
        background: 'var(--text-primary)',
        color: 'var(--bg-surface)',
        padding: '11px 20px',
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 600,
        opacity: message ? 1 : 0,
        pointerEvents: 'none',
        transition: '0.2s',
        zIndex: 2000,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      {message}
    </div>
  )
}
