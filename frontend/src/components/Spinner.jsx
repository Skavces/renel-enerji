export default function Spinner({ size = 'md' }) {
  const dim = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8'
  return (
    <div className={`${dim} border-2 border-[#448834] border-t-transparent rounded-full animate-spin`} />
  )
}
