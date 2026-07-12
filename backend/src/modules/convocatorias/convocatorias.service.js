const supabase = require('../../config/supabase');

const normalizeNullableDate = value => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw {
      status: 400,
      message: 'La fecha proporcionada no es válida',
    };
  }

  return date.toISOString();
};

const validateSchedule = ({
  opens_at,
  closes_at,
}) => {
  if (!opens_at || !closes_at) {
    return;
  }

  const opensAt = new Date(opens_at);
  const closesAt = new Date(closes_at);

  if (opensAt >= closesAt) {
    throw {
      status: 400,
      message:
        'La fecha de cierre debe ser posterior a la fecha de apertura',
    };
  }
};

const normalizePayload = body => {
  const payload = {
    ...body,
  };

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'opens_at'
    )
  ) {
    payload.opens_at =
      normalizeNullableDate(payload.opens_at);
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'closes_at'
    )
  ) {
    payload.closes_at =
      normalizeNullableDate(payload.closes_at);
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'max_submissions'
    )
  ) {
    payload.max_submissions =
      payload.max_submissions
        ? Number(payload.max_submissions)
        : null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'max_file_size_mb'
    )
  ) {
    payload.max_file_size_mb =
      Number(payload.max_file_size_mb) || 10;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      'is_active'
    )
  ) {
    payload.is_active =
      Boolean(payload.is_active);
  }

  validateSchedule(payload);

  return payload;
};

/**
 * Todas las convocatorias para el panel administrativo.
 */
const getAll = async () => {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Convocatorias que realmente están abiertas al público.
 *
 * Una convocatoria está abierta cuando:
 * - is_active = true;
 * - opens_at no existe o ya llegó;
 * - closes_at no existe o todavía no llegó.
 *
 * De esta forma no dependemos de que Render ejecute un cron
 * exactamente a la hora programada.
 */
const getActive = async () => {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .eq('is_active', true)
    .or(
      `opens_at.is.null,opens_at.lte.${nowIso}`
    )
    .or(
      `closes_at.is.null,closes_at.gt.${nowIso}`
    )
    .order('closes_at', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
};

const getById = async id => {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw {
      status: 404,
      message: 'Convocatoria no encontrada',
    };
  }

  return data;
};

const create = async body => {
  const payload = normalizePayload(body);

  if (!payload.title?.trim()) {
    throw {
      status: 400,
      message:
        'El título de la convocatoria es obligatorio',
    };
  }

  payload.title = payload.title.trim();

  const { data, error } = await supabase
    .from('convocatorias')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const update = async (id, body) => {
  const current = await getById(id);

  const payload = normalizePayload(body);

  validateSchedule({
    opens_at:
      Object.prototype.hasOwnProperty.call(
        payload,
        'opens_at'
      )
        ? payload.opens_at
        : current.opens_at,

    closes_at:
      Object.prototype.hasOwnProperty.call(
        payload,
        'closes_at'
      )
        ? payload.closes_at
        : current.closes_at,
  });

  if (
    typeof payload.title === 'string'
  ) {
    const cleanTitle =
      payload.title.trim();

    if (!cleanTitle) {
      throw {
        status: 400,
        message:
          'El título de la convocatoria es obligatorio',
      };
    }

    payload.title = cleanTitle;
  }

  const { data, error } = await supabase
    .from('convocatorias')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Cierra la convocatoria sin eliminarla.
 */
const close = async id => {
  const { data, error } = await supabase
    .from('convocatorias')
    .update({
      is_active: false,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Abre inmediatamente una convocatoria.
 *
 * Si la fecha de cierre ya pasó, se elimina para que pueda
 * volver a recibir envíos.
 */
const open = async id => {
  const current = await getById(id);
  const now = new Date();

  const closesAt =
    current.closes_at
      ? new Date(current.closes_at)
      : null;

  const payload = {
    is_active: true,
    opens_at: null,
  };

  if (
    closesAt &&
    closesAt <= now
  ) {
    payload.closes_at = null;
  }

  const { data, error } = await supabase
    .from('convocatorias')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Elimina definitivamente.
 *
 * Primero elimina los envíos asociados para evitar errores
 * de llave foránea si submissions no tiene ON DELETE CASCADE.
 */
const remove = async id => {
  const { error: submissionsError } =
    await supabase
      .from('submissions')
      .delete()
      .eq('convocatoria_id', id);

  if (submissionsError) {
    throw submissionsError;
  }

  const { data, error } = await supabase
    .from('convocatorias')
    .delete()
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw {
      status: 404,
      message: 'Convocatoria no encontrada',
    };
  }

  return data;
};

/**
 * Sincronización opcional para cron.
 *
 * El frontend público ya funciona correctamente aunque este
 * proceso no se ejecute, porque getActive valida las fechas.
 */
const autoCloseConvocatorias = async () => {
  const nowIso =
    new Date().toISOString();

  const { error } = await supabase
    .from('convocatorias')
    .update({
      is_active: false,
    })
    .lte('closes_at', nowIso)
    .eq('is_active', true);

  if (error) {
    console.error(
      'Error auto-cerrando convocatorias:',
      error.message
    );
  }
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  open,
  close,
  remove,
  autoCloseConvocatorias,
};