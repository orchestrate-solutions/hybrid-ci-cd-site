/**
 * ConfigEditor Component
 * 
 * Form for editing tool configuration with dynamic field generation,
 * validation, and theme support.
 */

import React, { useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';

interface ConfigEditorProps {
  /** Name of tool being configured */
  toolName: string;
  /** Initial configuration values */
  initialConfig: Record<string, string>;
  /** Called when form is saved */
  onSave: (config: Record<string, string>) => void;
  /** Called when form is cancelled */
  onCancel?: () => void;
}

/**
 * ConfigEditor component
 */
export function ConfigEditor({
  toolName,
  initialConfig,
  onSave,
  onCancel,
}: ConfigEditorProps) {
  const [config, setConfig] = useState<Record<string, string>>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(Object.keys(initialConfig).length > 0);

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setConfig((prev) => ({
        ...prev,
        [key]: value,
      }));

      // Validate: non-empty required fields
      if (!value.trim()) {
        setErrors((prev) => ({
          ...prev,
          [key]: 'This field is required',
        }));
        setIsValid(false);
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
        // Check if all fields are valid
        const allFilled = Object.entries({ ...config, [key]: value }).every(
          ([, v]) => v.trim()
        );
        setIsValid(allFilled);
      }
    },
    [config]
  );

  const handleSave = useCallback(() => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(config).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsValid(false);
      return;
    }

    setIsValid(true);
    onSave(config);
  }, [config, onSave]);

  const handleCancel = useCallback(() => {
    setConfig(initialConfig);
    setErrors({});
    onCancel?.();
  }, [initialConfig, onCancel]);

  const hasConfig = Object.keys(config).length > 0;

  return (
    <form
      data-testid="config-editor"
      className="bg-[var(--bg-primary)] rounded-lg border border-[var(--ui-border)] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      {/* Header */}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {toolName}
      </h3>

      {/* Form fields */}
      <div className="space-y-4 mb-6">
        {Object.entries(config).map(([key, value]) => (
          <div key={key}>
            <label
              htmlFor={key}
              className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              aria-label={key}
            >
              {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </label>
            <input
              id={key}
              type={key.toLowerCase().includes('token') || key.toLowerCase().includes('password') ? 'password' : 'text'}
              value={value}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              aria-label={key}
              className={`
                w-full px-3 py-2 rounded border
                bg-[var(--bg-secondary)] text-[var(--text-primary)]
                placeholder-[var(--text-tertiary)]
                focus:outline-none focus:ring-2
                ${
                  errors[key]
                    ? 'border-[var(--semantic-error)] focus:ring-[var(--semantic-error)]'
                    : 'border-[var(--ui-border)] focus:ring-[var(--brand-primary)]'
                }
              `}
            />
            {errors[key] && (
              <p className="text-xs text-[var(--semantic-error)] mt-1">{errors[key]}</p>
            )}
          </div>
        ))}

        {!hasConfig && (
          <p className="text-sm text-[var(--text-tertiary)] italic">
            No configuration fields for {toolName}
          </p>
        )}
      </div>

      {/* Validation message for empty form */}
      {!isValid && hasConfig && (
        <div className="bg-[var(--semantic-error)]/10 border border-[var(--semantic-error)] rounded p-3 mb-6">
          <p className="text-sm text-[var(--semantic-error)]">
            Please fill in all required fields
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className={`
              flex items-center gap-2 px-4 py-2 rounded border
              text-[var(--text-primary)] border-[var(--ui-border)]
              hover:bg-[var(--bg-secondary)] transition-colors
            `}
          >
            <X size={16} />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid}
          className={`
            flex items-center gap-2 px-4 py-2 rounded
            transition-colors
            ${
              isValid
                ? 'bg-[var(--semantic-success)] text-white hover:opacity-90'
                : 'bg-[var(--ui-border)] text-[var(--text-tertiary)] cursor-not-allowed'
            }
          `}
        >
          <Check size={16} />
          Save
        </button>
      </div>
    </form>
  );
}
