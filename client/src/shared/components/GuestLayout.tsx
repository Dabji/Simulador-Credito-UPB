/* ─────────────────────────────────────────────────────────────
   COMPONENTE: GuestLayout
   Layout envolvente para páginas de invitado.
   Usa UpbHeaderGuest (sin avatar) + UpbFooter.
───────────────────────────────────────────────────────────────── */

import type { ReactNode } from 'react';
import { UpbHeaderGuest } from './UpbHeaderGuest';
import { UpbFooter }      from './UpbFooter';

interface GuestLayoutProps {
  children: ReactNode;
  bgColor?: string;
}

export function GuestLayout({ children, bgColor = '#FFFFFF' }: GuestLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: bgColor }}>
      <UpbHeaderGuest />
      <main className="flex-1">{children}</main>
      <UpbFooter />
    </div>
  );
}
