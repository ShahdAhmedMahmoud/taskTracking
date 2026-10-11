/** الأدوار — "reports" هو دور المهندس طه (مشاهدة التقارير فقط). */
export const ROLES = {
  dept: 'dept',
  team: 'team',
  engineer: 'engineer',
  reports: 'reports',
};

export const ROLE_LABELS = {
  dept: 'مدير القسم',
  team: 'مدير فريق',
  engineer: 'مهندس',
  reports: 'مشاهد التقارير',
};

/** الصفحات (المسارات) المسموحة لكل دور. null = كل الصفحات. */
export const ALLOWED_PATHS = {
  dept: null,
  team: null,
  engineer: null,
  reports: ['/reports', '/profile', '/notifications'],
};

export const isReportsViewer = (role) => role === ROLES.reports;

export const canVisit = (role, pathname) => {
  const allowed = ALLOWED_PATHS[role];
  if (!allowed) return true;
  return allowed.some((p) => pathname === p || pathname.startsWith(`${p}/`));
};

/** الصفحة اللي يتوجه لها الدور بعد تسجيل الدخول */
export const homeFor = (role) => (role === ROLES.reports ? '/reports' : '/');