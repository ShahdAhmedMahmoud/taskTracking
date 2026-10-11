// أيقونات خطية بسيطة للصفحات الجديدة. اسم الملف Icons.jsx عشان ما يتعارضش مع EngineerIcons.jsx.
const PATHS = {
  check: 'M5 13l4 4L19 7',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3',
  chevron: 'M6 9l6 6 6-6',
  back: 'M9 6l6 6-6 6',
  edit: 'M4 20h4L18 10l-4-4L4 16v4zM13 7l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  archive: 'M4 7h16v4H4zM6 11v8h12v-8M10 14h4',
  restore: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 3 3M16 6h4v1a3 3 0 0 1-3 3M12 13v4M8 21h8M10 17h4',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  folder: 'M3 6h6l2 2h10v11H3z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  filter: 'M4 5h16l-6 8v6l-4-2v-4z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
};

export default function Icon({ name, className = 'h-4 w-4', strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name] || PATHS.list} />
    </svg>
  );
}