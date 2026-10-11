import { useEffect, useRef } from 'react';
import { useData } from './useData';

/**
 * صفحات الإدارة بتشتغل على نسخة محلية من البيانات (عشان الشاشة تتحدّث فورًا من غير وميض).
 * أول ما تتغيّر حاجة نعمل markChanged()، ولما المستخدمة تسيب الصفحة بنعمل init() مرة واحدة
 * عشان باقي الصفحات (الرئيسية، المهندسين...) تشوف التغييرات.
 */
export function useRefreshOnLeave() {
  const { init } = useData();
  const initRef = useRef(init);
  const changed = useRef(false);
  initRef.current = init;

  useEffect(() => () => {
    if (changed.current) initRef.current?.();
  }, []);

  return () => { changed.current = true; };
}