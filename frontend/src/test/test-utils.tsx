import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';

interface TestProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: MemoryRouterProps['initialEntries'];
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

export function createTestWrapper(queryClient = createTestQueryClient(), initialEntries: MemoryRouterProps['initialEntries'] = ['/']) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, { initialEntries }, children),
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), initialEntries = ['/'], ...options }: TestProviderOptions = {},
) {
  return { ...render(ui, { wrapper: createTestWrapper(queryClient, initialEntries), ...options }), queryClient };
}

