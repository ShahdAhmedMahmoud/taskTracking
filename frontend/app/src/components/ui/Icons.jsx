const make = (paths) =>
  function IconComp({ className = 'h-5 w-5', ...rest }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
        {paths}
      </svg>
    );
  };

export const TeamsIcon = make(<><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M21 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>);
export const EngineersIcon = make(<><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></>);
export const ProjectsIcon = make(<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />);
export const ReportsIcon = make(<><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>);
export const UserPlusIcon = make(<><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>);
export const SettingsIcon = make(<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />);
export const MailIcon = make(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></>);
export const ArchiveIcon = make(<><rect x="2" y="3" width="20" height="5" rx="1" /><path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8M10 12h4" /></>);
export const HasrIcon = make(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>);
export const FlagIcon = make(<path d="M4 22V4M4 4h13l-2 4 2 4H4" />);
export const CheckIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>);
export const ClockIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const ArrowIcon = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const CalendarIcon = make(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>);
export const AlertIcon = make(<><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></>);

export const HomeIcon = make(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>);
export const BellIcon = make(<><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></>);
export const KeyIcon = make(<><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L21 2M16 7l3 3M14 9l2 2" /></>);
export const LogoutIcon = make(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>);
export const MenuIcon = make(<path d="M3 6h18M3 12h18M3 18h18" />);
export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const CloseIcon = make(<path d="M18 6L6 18M6 6l12 12" />);
export const TasksIcon = make(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12l3 3 5-6" /></>);
export const TrophyIcon = make(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z" /><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" /></>);

export const ChevronDownIcon = make(<path d="M6 9l6 6 6-6" />);

export const ShieldIcon = make(<><path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></>);
export const EyeIcon = make(<><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOffIcon = make(<><path d="M17.9 17.9A10.9 10.9 0 0112 19C5 19 1 12 1 12a18.4 18.4 0 015.1-5.9M9.9 4.2A10.9 10.9 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M1 1l22 22" /><path d="M14.1 14.1a3 3 0 01-4.2-4.2" /></>);
export const UserIcon = make(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>);
export const LockIcon = make(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>);

export const PencilIcon = make(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></>);
export const SaveIcon = make(<><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>);

export const InfoIcon = make(<><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></>);