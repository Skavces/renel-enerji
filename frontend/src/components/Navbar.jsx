import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'

const navLinks = [
  { label: 'Anasayfa', to: '/' },
  { label: 'Kurumsal', to: '/kurumsal' },
  { label: 'Hizmetler', to: '/hizmetler' },
  { label: 'Projelerimiz', to: '/projelerimiz' },
  { label: 'Referanslar', to: '/referanslar' },
  { label: 'Blog', to: '/blog' },
  { label: 'S.S.S.', to: '/sss' },
  { label: 'İletişim', to: '/iletisim' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const transparent = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>

      {/* Main navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${transparent ? 'bg-transparent' : 'bg-white shadow-lg'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center select-none" aria-label="RenEL Enerji Ana Sayfa">
            <Logo textWhite={transparent} className="h-20 w-auto" />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `font-medium text-base transition-colors relative group ${
                    transparent
                      ? isActive ? 'text-[#448834] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]' : 'text-white hover:text-[#448834] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]'
                      : isActive ? 'text-[#448834]' : 'text-gray-700 hover:text-[#448834]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#448834] transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* CTA + mobile menu */}
          <div className="flex items-center gap-4">
            <Link
              to="/iletisim"
              className="hidden lg:inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Teklif Al
            </Link>
            <button
              className="lg:hidden p-2 text-gray-700"
              onClick={() => setOpen(o => !o)}
              aria-label="Menü"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 shadow-lg">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `font-medium py-1 border-b border-gray-100 transition-colors ${isActive ? 'text-[#448834]' : 'text-gray-700 hover:text-[#448834]'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/iletisim" onClick={() => setOpen(false)} className="bg-[#448834] text-white text-center py-2.5 rounded-lg font-semibold mt-2">
              Teklif Al
            </Link>
          </div>
        )}
      </nav>
    </>
  )
}
