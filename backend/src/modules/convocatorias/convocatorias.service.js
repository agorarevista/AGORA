const supabase = require('../../config/supabase');

const DEFAULT_EMAIL =
  'contactoagorarevista@gmail.com';

const DEFAULT_RUBRICS = [
  'Nombre completo del autor o autora',
  'Breve semblanza de máximo 100 palabras',
  'Fotografía de retrato',
  'Ciudad de residencia',
  'Usuario de Instagram',
  'Categoría de participación',
  'Título de la obra o propuesta',
  'Obra o propuesta adjunta',
];

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(
    object,
    key
  );

const normalizeDate = value => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw {
      status: 400,
      message:
        'Una de las fechas proporcionadas no es válida',
    };
  }

  return date.toISOString();
};

const normalizeStringArray = value => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(item =>
          String(item || '').trim()
        )
        .filter(Boolean)
    ),
  ];
};

const normalizePositiveInteger = (
  value,
  {
    nullable = false,
    fallback = null,
  } = {}
) => {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return nullable
      ? null
      : fallback;
  }

  const number = Number.parseInt(
    value,
    10
  );

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    throw {
      status: 400,
      message:
        'Los valores numéricos no son válidos',
    };
  }

  return number;
};

const validateSchedule = ({
  opens_at,
  closes_at,
}) => {
  if (!closes_at) {
    throw {
      status: 400,
      message:
        'La fecha de cierre es obligatoria',
    };
  }

  const closesAt =
    new Date(closes_at);

  if (
    opens_at &&
    new Date(opens_at) >= closesAt
  ) {
    throw {
      status: 400,
      message:
        'La fecha de cierre debe ser posterior a la fecha de apertura',
    };
  }
};

const validateCapacity = ({
  max_submissions,
  filled_slots,
}) => {
  if (
    max_submissions !== null &&
    filled_slots > max_submissions
  ) {
    throw {
      status: 400,
      message:
        'Los lugares ocupados no pueden superar el cupo total',
    };
  }
};

const normalizePayload = (
  body,
  current = {}
) => {
  const payload = {};

  if (hasOwn(body, 'title')) {
    payload.title =
      String(body.title || '').trim();

    if (!payload.title) {
      throw {
        status: 400,
        message:
          'El título de la colaboración es obligatorio',
      };
    }
  }

  const textFields = [
    'subtitle',
    'description',
    'requirements',
    'prizes',
  ];

  textFields.forEach(field => {
    if (hasOwn(body, field)) {
      const value =
        String(body[field] || '').trim();

      payload[field] =
        value || null;
    }
  });

  if (hasOwn(body, 'contact_email')) {
    const email =
      String(
        body.contact_email || ''
      ).trim();

    payload.contact_email =
      email || DEFAULT_EMAIL;
  }

  if (hasOwn(body, 'categories')) {
    payload.categories =
      normalizeStringArray(
        body.categories
      );
  }

  if (hasOwn(body, 'email_rubrics')) {
    const rubrics =
      normalizeStringArray(
        body.email_rubrics
      );

    payload.email_rubrics =
      rubrics.length
        ? rubrics
        : DEFAULT_RUBRICS;
  }

  if (hasOwn(body, 'opens_at')) {
    payload.opens_at =
      normalizeDate(body.opens_at);
  }

  if (hasOwn(body, 'closes_at')) {
    payload.closes_at =
      normalizeDate(body.closes_at);
  }

  if (
    hasOwn(
      body,
      'max_submissions'
    )
  ) {
    payload.max_submissions =
      normalizePositiveInteger(
        body.max_submissions,
        {
          nullable: true,
        }
      );
  }

  if (hasOwn(body, 'filled_slots')) {
    payload.filled_slots =
      normalizePositiveInteger(
        body.filled_slots,
        {
          fallback: 0,
        }
      );
  }

  if (
    hasOwn(
      body,
      'max_file_size_mb'
    )
  ) {
    const size =
      normalizePositiveInteger(
        body.max_file_size_mb,
        {
          fallback: 10,
        }
      );

    payload.max_file_size_mb =
      Math.max(1, size);
  }

  if (hasOwn(body, 'is_active')) {
    payload.is_active =
      Boolean(body.is_active);
  }

  const effective = {
    ...current,
    ...payload,
  };

  validateSchedule({
    opens_at:
      effective.opens_at,
    closes_at:
      effective.closes_at,
  });

  validateCapacity({
    max_submissions:
      effective.max_submissions ??
      null,

    filled_slots:
      effective.filled_slots ?? 0,
  });

  return payload;
};

const getRuntimeStatus = convocatoria => {
  const now = Date.now();

  const opensAt =
    convocatoria.opens_at
      ? new Date(
          convocatoria.opens_at
        ).getTime()
      : null;

  const closesAt =
    convocatoria.closes_at
      ? new Date(
          convocatoria.closes_at
        ).getTime()
      : null;

  const isFull =
    convocatoria.max_submissions !==
      null &&
    convocatoria.max_submissions !==
      undefined &&
    Number(
      convocatoria.filled_slots || 0
    ) >=
      Number(
        convocatoria.max_submissions
      );

  if (!convocatoria.is_active) {
    return 'closed';
  }

  if (
    opensAt !== null &&
    opensAt > now
  ) {
    return 'scheduled';
  }

  if (
    closesAt !== null &&
    closesAt <= now
  ) {
    return 'closed';
  }

  if (isFull) {
    return 'full';
  }

  return 'open';
};

const attachRuntimeFields = convocatoria => {
  const status =
    getRuntimeStatus(convocatoria);

  const maximum =
    convocatoria.max_submissions;

  const filled =
    Number(
      convocatoria.filled_slots || 0
    );

  const remaining =
    maximum === null ||
    maximum === undefined
      ? null
      : Math.max(
          0,
          Number(maximum) - filled
        );

  return {
    ...convocatoria,
    runtime_status: status,
    available_slots: remaining,
  };
};

/**
 * Cambia is_active a false cuando una colaboración
 * venció o agotó sus cupos.
 */
const synchronizeClosedItems =
  async items => {
    const idsToClose =
      (items || [])
        .filter(item => {
          const status =
            getRuntimeStatus(item);

          return (
            item.is_active &&
            (
              status === 'closed' ||
              status === 'full'
            )
          );
        })
        .map(item => item.id);

    if (!idsToClose.length) {
      return;
    }

    const { error } = await supabase
      .from('convocatorias')
      .update({
        is_active: false,
      })
      .in('id', idsToClose);

    if (error) {
      console.error(
        'No se pudieron sincronizar las colaboraciones vencidas:',
        error.message
      );
    }
  };

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

  const items = data || [];

  await synchronizeClosedItems(
    items
  );

  return items.map(
    attachRuntimeFields
  );
};

const getActive = async () => {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('*')
    .eq('is_active', true)
    .order('closes_at', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  const items = data || [];

  await synchronizeClosedItems(
    items
  );

  return items
    .map(attachRuntimeFields)
    .filter(
      item =>
        item.runtime_status ===
        'open'
    );
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
      message:
        'Colaboración no encontrada',
    };
  }

  return attachRuntimeFields(data);
};

const create = async body => {
  const payload = normalizePayload(
    body
  );

  if (!payload.title) {
    throw {
      status: 400,
      message:
        'El título de la colaboración es obligatorio',
    };
  }

  payload.contact_email =
    payload.contact_email ||
    DEFAULT_EMAIL;

  payload.categories =
    payload.categories || [];

  payload.email_rubrics =
    payload.email_rubrics?.length
      ? payload.email_rubrics
      : DEFAULT_RUBRICS;

  payload.filled_slots =
    payload.filled_slots || 0;

  payload.max_file_size_mb =
    payload.max_file_size_mb || 10;

  payload.is_active =
    payload.is_active ?? true;

  const { data, error } = await supabase
    .from('convocatorias')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return attachRuntimeFields(data);
};

const update = async (
  id,
  body
) => {
  const current =
    await getById(id);

  const payload =
    normalizePayload(
      body,
      current
    );

  const { data, error } = await supabase
    .from('convocatorias')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return attachRuntimeFields(data);
};

const open = async id => {
  const current =
    await getById(id);

  const now = new Date();

  const closesAt =
    current.closes_at
      ? new Date(
          current.closes_at
        )
      : null;

  if (
    !closesAt ||
    closesAt <= now
  ) {
    throw {
      status: 400,
      message:
        'Actualiza la fecha de cierre antes de abrir esta colaboración',
    };
  }

  const isFull =
    current.max_submissions !==
      null &&
    Number(
      current.filled_slots || 0
    ) >=
      Number(
        current.max_submissions
      );

  if (isFull) {
    throw {
      status: 400,
      message:
        'La colaboración no puede abrirse porque sus cupos están agotados',
    };
  }

  const { data, error } = await supabase
    .from('convocatorias')
    .update({
      is_active: true,
      opens_at:
        now.toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return attachRuntimeFields(data);
};

const close = async id => {
  const { data, error } = await supabase
    .from('convocatorias')
    .update({
      is_active: false,
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw {
      status: 404,
      message:
        'Colaboración no encontrada',
    };
  }

  return attachRuntimeFields(data);
};

const remove = async id => {
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
      message:
        'Colaboración no encontrada',
    };
  }

  return data;
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
};