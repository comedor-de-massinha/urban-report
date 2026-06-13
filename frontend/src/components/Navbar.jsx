import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MapPin, LayoutDashboard, FilePlus, LogIn, LogOut, Menu, X, User, ClipboardList } from 'lucide-react'

// ── Modal de confirmação de logout ─────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Sair da conta?</h3>
          <p className="text-sm text-gray-500 mb-6">Você precisará fazer login novamente para acessar sua conta.</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const confirmLogout = () => {
    setShowLogoutModal(false)
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
    }`

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-blue-700 text-lg">
              <MapPin className="w-6 h-6" />
              <span>UrbanReport</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/map" className={linkClass}>
                <MapPin className="w-4 h-4" /> Mapa
              </NavLink>
              <NavLink to="/report" className={linkClass}>
                <FilePlus className="w-4 h-4" /> Registrar
              </NavLink>
              {isAuthenticated && (
                <NavLink to="/my-occurrences" className={linkClass}>
                  <ClipboardList className="w-4 h-4" /> Minhas ocorrencias
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/dashboard" className={linkClass}>
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </NavLink>
              )}
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <NavLink
                    to="/profile"
                    className="text-sm text-gray-600 flex items-center gap-1 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
                  >
                    <User className="w-4 h-4" />
                    {user?.name?.split(' ')[0]}
                  </NavLink>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </div>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <LogIn className="w-4 h-4" /> Entrar
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Cadastrar
                  </NavLink>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-1 bg-white">
            <NavLink to="/map" className={linkClass} onClick={() => setMenuOpen(false)}>
              <MapPin className="w-4 h-4" /> Mapa
            </NavLink>
            <NavLink to="/report" className={linkClass} onClick={() => setMenuOpen(false)}>
              <FilePlus className="w-4 h-4" /> Registrar
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/my-occurrences" className={linkClass} onClick={() => setMenuOpen(false)}>
                <ClipboardList className="w-4 h-4" /> Minhas ocorrencias
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/dashboard" className={linkClass} onClick={() => setMenuOpen(false)}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </NavLink>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            ) : (
              <>
                <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                  <LogIn className="w-4 h-4" /> Entrar
                </NavLink>
                <NavLink to="/register" className={linkClass} onClick={() => setMenuOpen(false)}>
                  Cadastrar
                </NavLink>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
