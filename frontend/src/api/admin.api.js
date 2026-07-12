import api from './axios';

export const getDashboard = () => {
  return api
    .get('/admin/dashboard')
    .then(response => response.data);
};

export const getSiteConfig = () => {
  return api
    .get('/admin/config')
    .then(response => response.data);
};

export const updateSiteConfig = data => {
  return api
    .put(
      '/admin/config',
      data
    )
    .then(response => response.data);
};

export const getUsers = () => {
  return api
    .get('/admin/users')
    .then(response => response.data);
};

export const createUser = data => {
  return api
    .post(
      '/admin/users',
      data
    )
    .then(response => response.data);
};

export const updateUser = (
  id,
  data
) => {
  return api
    .put(
      `/admin/users/${id}`,
      data
    )
    .then(response => response.data);
};

export const toggleUser = id => {
  return api
    .patch(
      `/admin/users/${id}/toggle`
    )
    .then(response => response.data);
};

export const uploadFile = (
  file,
  folder = 'misc',
  onUploadProgress = null
) => {
  if (!(file instanceof File)) {
    return Promise.reject(
      new Error(
        'El archivo proporcionado no es válido'
      )
    );
  }

  const form = new FormData();

  form.append(
    'file',
    file
  );

  return api
    .post(
      `/upload?folder=${encodeURIComponent(
        folder
      )}`,
      form,
      {
        onUploadProgress:
          progressEvent => {
            if (
              typeof onUploadProgress !==
                'function' ||
              !progressEvent.total
            ) {
              return;
            }

            const percentage =
              Math.round(
                (
                  progressEvent.loaded *
                  100
                ) /
                  progressEvent.total
              );

            onUploadProgress(
              percentage
            );
          },
      }
    )
    .then(response => response.data);
};

export const uploadFiles = (
  files,
  folder = 'misc',
  onUploadProgress = null
) => {
  const fileList =
    Array.from(files || []);

  if (fileList.length === 0) {
    return Promise.reject(
      new Error(
        'No se proporcionaron archivos'
      )
    );
  }

  const form = new FormData();

  fileList.forEach(file => {
    form.append(
      'files',
      file
    );
  });

  return api
    .post(
      `/upload/multiple?folder=${encodeURIComponent(
        folder
      )}`,
      form,
      {
        onUploadProgress:
          progressEvent => {
            if (
              typeof onUploadProgress !==
                'function' ||
              !progressEvent.total
            ) {
              return;
            }

            const percentage =
              Math.round(
                (
                  progressEvent.loaded *
                  100
                ) /
                  progressEvent.total
              );

            onUploadProgress(
              percentage
            );
          },
      }
    )
    .then(response => response.data);
};