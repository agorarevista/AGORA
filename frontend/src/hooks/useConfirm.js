import useConfirmStore from '../store/confirmStore';

const useConfirm = () => {
  const { showConfirm } = useConfirmStore();

  return (options) =>
    new Promise((resolve) => {
      showConfirm({
        ...options,
        onConfirm: () => resolve(true),
        onCancel:  () => resolve(false),
      });
    });
};

export default useConfirm;