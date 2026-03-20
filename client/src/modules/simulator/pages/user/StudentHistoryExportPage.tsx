// ============================================================
// PÁGINA: StudentHistoryExportPage (HU-36)
// Redirige al detalle de la simulación, donde la exportación
// PDF está integrada directamente.
// ============================================================

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function StudentHistoryExportPage() {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      navigate(`/student/history/${id}`, { replace: true });
    } else {
      navigate('/student/history', { replace: true });
    }
  }, [id, navigate]);

  return null;
}
