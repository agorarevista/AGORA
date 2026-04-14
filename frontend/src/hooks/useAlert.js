import useAlertStore from '../store/alertStore';

const useAlert = () => {
  const { showAlert } = useAlertStore();

  return {
    success: (title, message) => showAlert({ type: 'success', title, message }),
    error: (title, message) => showAlert({ type: 'error', title, message }),
    info: (title, message) => showAlert({ type: 'info', title, message }),
    warning: (title, message) => showAlert({ type: 'warning', title, message }),
  };
};

export default useAlert;