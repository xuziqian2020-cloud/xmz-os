/** XMZADD 20260819 提供学习中心专用的克制线性导航图形，避免通用 AI 符号。 */
export function LearningGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4.5 5.75c2.55-.8 4.9-.48 7.5 1.1v12.2c-2.6-1.58-4.95-1.9-7.5-1.1V5.75Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      <path d="M19.5 5.75c-2.55-.8-4.9-.48-7.5 1.1v12.2c2.6-1.58 4.95-1.9 7.5-1.1V5.75Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      <path d="M7.2 9.25h2.3M14.5 10.5h2.3M14.5 13.25h2.3" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  )
}
