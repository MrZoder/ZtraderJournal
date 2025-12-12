// src/context/themePresets.js
export const themePresets = {
  default: {
    name: 'default',
    values: {
      'bg-from':    '#031010',
      'bg-to':      '#0C1114',
      'panel-bg':   'rgba(14,17,22,0.6)',
      'panel-border': 'rgba(54, 54, 54, 0.5)',
      'accent-bg':  '#4CAF50',
      'accent-hover': '#388E3C',
      'text-base':  '#ffff',
      'text-muted': '#A1A1AA',
    },
  },
  light: {
    name: 'light',
    values: {
      'bg-from':      '#f0f0f3',
      'bg-to':        '#d6d6d8',
      'panel-bg':     'rgba(255,255,255,0.3)',
      'panel-border': 'rgba(156,163,175,0.5)',
      'accent-bg':    '#3B82F6',
      'accent-hover': '#2563EB',
      'text-base':    '#111827',
      'text-muted':   '#6B7280',
    },
  },
  dark: {
    name: 'dark',
    values: {
      'bg-from':      '#000000',
      'bg-to':        '#0f0f0f',
      'panel-bg':     'rgba(28,28,30,0.6)',
      'panel-border': 'rgba(82,82,91,0.5)',
      'accent-bg':    '#8B5CF6',
      'accent-hover': '#7C3AED',
      'text-base':    '#E5E7EB',
      'text-muted':   '#A1A1AA',
    },
  },
};
