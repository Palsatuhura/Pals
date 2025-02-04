import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00A884',
      light: '#25D366',
      dark: '#075E54',
    },
    secondary: {
      main: '#128C7E',
      light: '#25D366',
      dark: '#075E54',
    },
    background: {
      default: '#111B21',
      paper: '#202C33',
      sidebar: '#111B21',
      chat: '#0B141A',
      hover: '#2A3942',
      selected: '#2A3942',
      input: '#2A3942',
      divider: '#2A3942'
    },
    text: {
      primary: '#E9EDEF',
      secondary: '#8696A0',
      muted: '#8696A0',
      link: '#53BDEB'
    },
    action: {
      hover: '#202C33',
      selected: '#2A3942'
    }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#E9EDEF'
    },
    body1: {
      fontSize: '0.9375rem',
      color: '#E9EDEF'
    },
    body2: {
      fontSize: '0.875rem',
      color: '#8696A0'
    },
    caption: {
      fontSize: '0.75rem',
      color: '#8696A0'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#111B21',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#374045',
            borderRadius: '3px',
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '24px',
          padding: '6px 16px',
          fontSize: '0.875rem',
          fontWeight: 600
        },
        containedPrimary: {
          backgroundColor: '#00A884',
          '&:hover': {
            backgroundColor: '#028E6E'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#202C33',
          boxShadow: 'none',
          borderBottom: '1px solid #2A3942'
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#2A3942'
          },
          '&.Mui-selected': {
            backgroundColor: '#2A3942',
            '&:hover': {
              backgroundColor: '#2A3942'
            }
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#2A3942'
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: '#2A3942',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: '#2A3942'
          },
          '&.Mui-focused': {
            backgroundColor: '#2A3942'
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#8696A0',
          '&:hover': {
            backgroundColor: 'rgba(134, 150, 160, 0.1)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#202C33',
          backgroundImage: 'none'
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2A3942',
          color: '#8696A0'
        }
      }
    }
  },
  shape: {
    borderRadius: 8
  },
  shadows: [
    'none',
    '0 1px 3px rgba(11, 20, 26, 0.2)',
    ...Array(23).fill('none')
  ]
});

export default theme;
