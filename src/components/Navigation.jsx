'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation = () => {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/dnd-char-gen', label: 'Character Generator' },
    { href: '/glossary', label: 'Glossary' },
    { href: '/dnd-reference', label: 'PC Options Reference' },
    { href: '/dnd-magic-items', label: 'Magic Item Generator' },
    { href: '/dnd-statblock', label: 'Statblock Generator' },
  ]

  return (
    <nav className="w-full py-4 border-b">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
          {links.map((link, index) => (
            <div key={link.href} className="flex items-center gap-2">
              {pathname === link.href ? (
                <span className="font-bold">{link.label}</span>
              ) : (
                <Link href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              )}
              {index < links.length - 1 && <span className="text-muted-foreground">-</span>}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
