import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); window.location.hash = ''; vi.restoreAllMocks(); });
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
Element.prototype.scrollIntoView = vi.fn();
if (!URL.createObjectURL) URL.createObjectURL = vi.fn(() => 'blob:local-test-report');
if (!URL.revokeObjectURL) URL.revokeObjectURL = vi.fn();
