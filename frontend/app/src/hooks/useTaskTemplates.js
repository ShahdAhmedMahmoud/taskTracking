import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUI } from './useUI';
import { fetchTemplates, saveTemplatesApi } from '../services/templateService';
import { DEFAULT_TEMPLATE } from '../utils/taskTemplates';

/**
 * قوالب المهام: بتتحمّل من الـ API، والقالب الأساسي (temp1) موجود دايمًا.
 * لو الـ endpoint لسه ماتعملش، الـ hook بيشتغل بالقالب الأساسي بس
 * و persisted = false (والتعديلات مش بتتحفظ — بتظهر رسالة).
 */
export function useTaskTemplates() {
  const { toast } = useUI();
  const [stored, setStored] = useState([]);
  const [loading, setLoading] = useState(true);
  const [persisted, setPersisted] = useState(true);

  useEffect(() => {
    let off = false;
    fetchTemplates()
      .then((l) => { if (!off) setStored(l); })
      .catch(() => { if (!off) setPersisted(false); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, []);

  const templates = useMemo(
    () => (stored.some((t) => t.id === DEFAULT_TEMPLATE.id) ? stored : [DEFAULT_TEMPLATE, ...stored]),
    [stored],
  );

  const persist = useCallback(async (next) => {
    setStored(next);
    try {
      await saveTemplatesApi(next);
      setPersisted(true);
      toast('success', 'تم حفظ القالب — أصبح مرئيًا للجميع');
      return true;
    } catch (e) {
      setPersisted(false);
      toast('error', `تعذّر حفظ القالب: ${e.message}`, 5000);
      return false;
    }
  }, [toast]);

  /** إنشاء أو تحديث قالب (حسب id) */
  const saveTemplate = useCallback((tpl) => {
    const base = stored.some((t) => t.id === DEFAULT_TEMPLATE.id) ? stored : [DEFAULT_TEMPLATE, ...stored];
    const exists = base.some((t) => t.id === tpl.id);
    return persist(exists ? base.map((t) => (t.id === tpl.id ? tpl : t)) : [...base, tpl]);
  }, [stored, persist]);

  const deleteTemplate = useCallback((id) => {
    if (id === DEFAULT_TEMPLATE.id) return Promise.resolve(false); // الأساسي مينفعش يتمسح
    return persist(stored.filter((t) => t.id !== id));
  }, [stored, persist]);

  return { templates, loading, persisted, saveTemplate, deleteTemplate };
}