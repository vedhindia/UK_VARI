import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import ukLogo from '../assets/UK LOOG.png'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/Book' },
  { label: 'Contact', path: '/Contact' },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <style>
        {`
          .vl-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10;
            overflow: visible;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 18px 28px;
            background: transparent;
            color: #f7f2e7;
          }

          .vl-header::after {
            content: "";
            position: absolute;
            inset: 0;
            background: rgba(3, 9, 18, 0.55);
            pointer-events: none;
            z-index: -1;
          }

          .vl-brand {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 190px;
          }

          .vl-brand-mark {
            width: 52px;
            margin-left: 28px;
          }

          .vl-brand-title {
            margin: 0;
            font-size: 18px;
            line-height: 1;
            font-weight: 500;
            letter-spacing: 0.3px;
          }

          .vl-brand-subtitle {
            margin: 6px 0 0;
            font-size: 11px;
            letter-spacing: 2.6px;
            text-transform: uppercase;
            color: rgba(247, 242, 231, 0.85);
          }

          .vl-nav {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 34px;
            flex: 1;
          }

          .vl-link {
            position: relative;
            padding: 8px 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 15px;
            font-weight: 500;
            text-decoration: none;
            transition: color 0.2s ease;
          }

          .vl-link:hover {
            color: #ffffff;
          }

          .vl-link.active::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: -4px;
            height: 2px;
            border-radius: 999px;
            background: #f0d39a;
          }

          .vl-cta {
            position: relative;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 118px;
            padding: 12px 18px;
            border-radius: 8px;
            background: linear-gradient(180deg, #d9b164 0%, #b88735 100%);
            color: #1c1a14;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
            white-space: nowrap;
            flex-shrink: 0;
          }

          .vl-menu-toggle {
            display: none;
            position: relative;
            z-index: 2;
            width: 40px;
            height: 40px;
            border: none;
            background: transparent;
            cursor: pointer;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            flex-shrink: 0;
          }

          .vl-menu-toggle span {
            display: block;
            width: 24px;
            height: 2px;
            background: #f7f2e7;
            border-radius: 2px;
            transition: transform 0.2s ease, opacity 0.2s ease;
          }

          .vl-menu-toggle.open span:nth-child(1) {
            transform: translateY(7px) rotate(45deg);
          }

          .vl-menu-toggle.open span:nth-child(2) {
            opacity: 0;
          }

          .vl-menu-toggle.open span:nth-child(3) {
            transform: translateY(-7px) rotate(-45deg);
          }

          /* Tablet */
          @media (max-width: 900px) {
            .vl-nav {
              gap: 22px;
            }
          }

          /* Mobile */
          @media (max-width: 768px) {
            .vl-header {
              flex-wrap: nowrap;
              justify-content: space-between;
              padding: 14px 18px;
            }

            .vl-brand {
              min-width: 0;
            }

            .vl-brand-mark {
              margin-left: 0;
              width: 44px;
            }

            .vl-menu-toggle {
              display: flex;
            }

            .vl-nav {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              z-index: 5;
              flex-direction: column;
              align-items: flex-start;
              gap: 0;
              flex: none;
              background: rgba(3, 9, 18, 0.95);
              max-height: 0;
              overflow: hidden;
              opacity: 0;
              transition: max-height 0.25s ease, opacity 0.2s ease;
            }

            .vl-nav.open {
              max-height: 320px;
              opacity: 1;
              padding: 8px 0 16px;
            }

            .vl-link {
              width: 100%;
              padding: 14px 28px;
              font-size: 16px;
            }

            .vl-link.active::after {
              left: 28px;
              right: auto;
              bottom: 8px;
              width: 24px;
            }

            .vl-cta {
              display: none;
            }

            .vl-nav .vl-cta-mobile {
              display: inline-flex;
              margin: 12px 28px 4px;
            }
          }

          @media (max-width: 420px) {
            .vl-brand-mark {
              width: 38px;
            }
          }
        `}
      </style>

      <header className="vl-header">
        <div className="vl-brand">
          <img className="vl-brand-mark" src={ukLogo} alt="UK logo" />
        </div>

        <button
          type="button"
          className={`vl-menu-toggle${menuOpen ? ' open' : ''}`}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`vl-nav${menuOpen ? ' open' : ''}`}
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMenu}
              className={({ isActive }) =>
                `vl-link${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
         
        </nav>

        <button
          type="button"
          className="vl-cta"
          onClick={() => { closeMenu(); navigate('/Book'); }}
        >
          Buy Custom
        </button>
      </header>
    </>
  )
}

export default Header