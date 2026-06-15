import React from 'react';
import type { AuthErrorDisplay } from '@/app/utils/authErrors';

interface AuthFormErrorProps {
  error: AuthErrorDisplay;
}

export const AuthFormError: React.FC<AuthFormErrorProps> = ({ error }) => (
  <div
    role="alert"
    className="bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-lg text-sm space-y-2"
  >
    <p className="font-semibold text-red-700">{error.title}</p>
    {error.description && <p>{error.description}</p>}
    {error.hints && error.hints.length > 0 && (
      <ul className="list-disc pl-4 space-y-1 text-red-700/90">
        {error.hints.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ul>
    )}
  </div>
);
