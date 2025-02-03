import { toast } from 'react-toastify';

const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
  style: {
    background: '#333',
    color: '#fff',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '14px'
  }
};

export const showNotification = (message, type = 'info') => {
  if (!message) return;

  switch (type.toLowerCase()) {
    case 'success':
      toast.success(message, defaultOptions);
      break;
    case 'error':
      toast.error(message, defaultOptions);
      break;
    case 'warning':
      toast.warning(message, defaultOptions);
      break;
    default:
      toast.info(message, defaultOptions);
  }
};
