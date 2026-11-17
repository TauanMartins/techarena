import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../auth/useAuth';
import { teamsApi } from '../api/teams.api';
export function TeamNameAvailability({
  name,
  currentName = '',
}: {
  name: string;
  currentName?: string;
}) {
  const { session } = useAuth();
  const [checkedName, setCheckedName] = useState('');
  const value = name.trim();
  useEffect(() => {
    const timer = window.setTimeout(() => setCheckedName(value), 400);
    return () => window.clearTimeout(timer);
  }, [value]);
  const unchanged =
    value.toLocaleLowerCase() === currentName.trim().toLocaleLowerCase();
  const query = useQuery({
    queryKey: ['teamName', session?.user.id, checkedName],
    queryFn: () => teamsApi.nameExists(session!.access_token, checkedName),
    enabled: Boolean(
      session &&
      checkedName &&
      checkedName.length <= 45 &&
      checkedName === value &&
      !unchanged,
    ),
  });
  if (!value || value.length > 45 || unchanged || checkedName !== value)
    return null;
  return (
    <small
      className="d-block mt-1"
      role="status"
    >
      {query.isPending
        ? 'Verificando nome...'
        : query.error
          ? 'Não foi possível verificar agora. O nome será validado ao salvar.'
          : query.data?.exists
            ? 'Já existe uma equipe com esse nome.'
            : 'Nome disponível.'}
    </small>
  );
}
