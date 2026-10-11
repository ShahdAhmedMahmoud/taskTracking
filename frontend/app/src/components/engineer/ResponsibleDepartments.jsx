import { useEffect, useMemo, useState } from 'react';
import MultiSelectSearch from '../ui/MultiSelectSearch';
import { departmentsService } from '../../services/departmentsService';
import { parseDepts, serializeDepts } from '../../utils/departments';

// قايمة الأقسام بتتحمّل مرة واحدة وتتشارك بين كل الحقول في الصفحة
let cache = null;
let inflight = null;
const loadOptions = () => {
  if (cache) return Promise.resolve(cache);
  inflight ??= departmentsService.list().then((l) => (cache = l)).catch(() => (cache = [])).finally(() => { inflight = null; });
  return inflight;
};

/**
 * حقل "القسم المسؤول" — اختيار متعدد + بحث.
 *   value:    القيمة المخزنة (نص قديم "قسم أ،قسم ب" أو array)
 *   onChange: بتستقبل النص الجاهز للحفظ (serialized)
 *
 * الاستخدام جوه TaskItem بدل <input type="text"> بتاع القسم:
 *   <ResponsibleDepartments value={st.department} onChange={(v) => setField('department', v)} />
 */
export default function ResponsibleDepartments({ value, onChange, disabled }) {
  const [options, setOptions] = useState(cache || []);
  useEffect(() => { let on = true; loadOptions().then((o) => on && setOptions(o)); return () => { on = false; }; }, []);

  const current = useMemo(() => parseDepts(value), [value]);
  // أي قيمة محفوظة قديمًا مش في القايمة تفضل ظاهرة ومتاحة للاختيار
  const all = useMemo(() => [...new Set([...options, ...current])], [options, current]);

  return (
    <MultiSelectSearch
      value={current}
      options={all}
      allowCreate
      disabled={disabled}
      onCreate={(name) => { departmentsService.create(name).then((n) => { if (n && cache && !cache.includes(n)) cache = [...cache, n]; }).catch(() => {}); }}
      onChange={(arr) => onChange(serializeDepts(arr))}
    />
  );
}