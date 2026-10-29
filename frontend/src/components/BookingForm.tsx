import { useEffect, useState, type FormEvent } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '../auth/AuthProvider';
import { api, ApiError } from '../shared/api';
import type { Arena, Schedule, Sport } from '../shared/types';
import { ErrorState } from './Feedback';

export function BookingForm({
  titlePrefix = 'Partida de',
  onCreated,
}: {
  titlePrefix?: string;
  onCreated: () => void;
}) {
  const { session } = useAuth();
  const token = session!.access_token;
  const [sports, setSports] = useState<Sport[]>([]);
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [slots, setSlots] = useState<Schedule[]>([]);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [sportId, setSportId] = useState('');
  const [arenaId, setArenaId] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      api.getSports(token),
      api.listArenas(token),
    ])
      .then(([sportPage, arenaPage]) => {
        if (!active) return;
        setSports(sportPage.items);
        setArenas(arenaPage.items.filter((arena) => !arena.isLeagueOnly));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar esportes e arenas.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const availableArenas = arenas.filter((arena) => !sportId || arena.sportIds.includes(sportId));

  useEffect(() => {
    setArenaId('');
    setScheduleId('');
    setSlots([]);
  }, [sportId]);

  useEffect(() => {
    if (!sportId || !arenaId || !date) {
      setSlots([]);
      setScheduleId('');
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    void api.getAvailability(token, arenaId, sportId, date)
      .then((result) => {
        if (active) setSlots(result.items);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao consultar horários.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [arenaId, date, sportId, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sportId || !arenaId || !scheduleId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.createAppointment(token, {
        arenaId,
        sportId,
        date,
        scheduleId,
        title: title.trim() || `${titlePrefix} ${sports.find((sport) => sport.id === sportId)?.name ?? 'esporte'}`,
        description: description.trim() || undefined,
        holder: true,
        maxPlayers: maxPlayers ? Number(maxPlayers) : undefined,
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setMaxPlayers('');
      setScheduleId('');
      onCreated();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : 'Não foi possível criar o agendamento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form onSubmit={submit} className="booking-form">
      {error && <ErrorState message={error} />}
      {success && <Alert variant="success">Agendamento criado com sucesso.</Alert>}
      {loading && <div className="form-note">Atualizando opções...</div>}
      {!loading && arenas.length === 0 && (
        <Alert variant="info">
          Nenhuma arena disponível no catálogo atual da API.
        </Alert>
      )}
      <Form.Group className="mb-3">
        <Form.Label>Esporte</Form.Label>
        <Form.Select value={sportId} onChange={(event) => setSportId(event.target.value)} required>
          <option value="">Selecione uma modalidade</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Arena</Form.Label>
        <Form.Select value={arenaId} onChange={(event) => { setScheduleId(''); setSlots([]); setArenaId(event.target.value); }} required disabled={!sportId}>
          <option value="">Selecione uma arena</option>
          {availableArenas.map((arena) => <option key={arena.id} value={arena.id}>{arena.address}</option>)}
        </Form.Select>
      </Form.Group>
      <div className="row">
        <Form.Group className="col-md-6 mb-3">
          <Form.Label>Data</Form.Label>
          <Form.Control type="date" min={today} value={date} onChange={(event) => { setScheduleId(''); setSlots([]); setDate(event.target.value); }} required />
        </Form.Group>
        <Form.Group className="col-md-6 mb-3">
          <Form.Label>Horário disponível</Form.Label>
          <Form.Select value={scheduleId} onChange={(event) => setScheduleId(event.target.value)} required disabled={!slots.length}>
            <option value="">{slots.length ? 'Selecione um horário' : 'Sem horários para a seleção'}</option>
            {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.horary}</option>)}
          </Form.Select>
        </Form.Group>
      </div>
      <Form.Group className="mb-3">
        <Form.Label>Nome do evento</Form.Label>
        <Form.Control value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder={titlePrefix.startsWith('Torneio') ? 'Ex.: Torneio de vôlei' : 'Ex.: Futebol de sábado'} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Descrição</Form.Label>
        <Form.Control as="textarea" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} placeholder="Detalhes para quem quiser participar" />
      </Form.Group>
      <Form.Group className="mb-4">
        <Form.Label>Limite de participantes (opcional)</Form.Label>
        <Form.Control type="number" min={1} max={1000} value={maxPlayers} onChange={(event) => setMaxPlayers(event.target.value)} />
      </Form.Group>
      <Button type="submit" className="w-100" disabled={saving || loading || !scheduleId}>
        {saving ? 'Salvando...' : titlePrefix.startsWith('Torneio') ? 'Criar evento de liga' : 'Publicar agendamento'}
      </Button>
    </Form>
  );
}

export function BookingModal({
  show,
  onHide,
  onCreated,
}: {
  show: boolean;
  onHide: () => void;
  onCreated: () => void;
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Novo agendamento</Modal.Title>
      </Modal.Header>
      <Modal.Body><BookingForm onCreated={() => { onCreated(); onHide(); }} /></Modal.Body>
    </Modal>
  );
}
