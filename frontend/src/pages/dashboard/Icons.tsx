import React from 'react';
import { cn } from '../../components/ui';

export type IconName = 'shield' | 'lock' | 'share' | 'drive' | 'projects' | 'folder' | 'file' | 'note' | 'search' | 'filter' | 'dots' | 'copy' | 'eye' | 'edit' | 'trash' | 'plus' | 'externalLink' | 'menu' | 'x' | 'info';

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = cn('inline-block', className);
  // Tiny inline icons (no deps)
  switch (name) {
    case 'shield':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'lock':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v6A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-6A2.5 2.5 0 0 1 6.5 11z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'share':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 6a2.5 2.5 0 1 0 0 .01V6zM6 12a2.5 2.5 0 1 0 0 .01V12zM16 18a2.5 2.5 0 1 0 0 .01V18z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8.2 11.2l5.6-3.2M8.2 12.8l5.6 3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'drive':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 4h8l4 7-4 7H8L4 11 8 4z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 4l4 7h8" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 11h8l4 7" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'projects':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7a2 2 0 0 1 2-2h5v14H6a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M11 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7V5z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M7 9h2M7 12h2M7 15h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'folder':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'file':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'note':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3h10a2 2 0 0 1 2 2v14l-4-2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 8h8M8 12h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'search':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'filter':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case 'dots':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 6.6a1.2 1.2 0 1 0 0 .01V6.6zM12 12a1.2 1.2 0 1 0 0 .01V12zM12 17.4a1.2 1.2 0 1 0 0 .01v-.01z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'externalLink':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M19 14v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'copy':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 9h10v12H9V9z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'eye':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'edit':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-.2-.2a2 2 0 0 0-2.8 0L5 17v3z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'trash':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M10 3h4l1 2H9l1-2z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case 'plus':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'menu':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'x':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'info':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 10v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 7h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
}
