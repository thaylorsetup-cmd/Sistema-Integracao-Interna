import { useState, useEffect, forwardRef } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface InputProProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: boolean;
    hint?: string;
    mask?: 'plate' | 'phone' | 'cpf' | 'cnpj' | 'cep';
    mono?: boolean;
    leftIcon?: React.ReactNode;
    onValidation?: (isValid: boolean, value: string) => void;
}

// Masks patterns
const masks = {
    plate: {
        pattern: /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/,
        format: (value: string) => {
            const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
            if (clean.length <= 3) return clean;
            return `${clean.slice(0, 3)}-${clean.slice(3)}`;
        },
        placeholder: 'ABC-1D23',
    },
    phone: {
        pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
        format: (value: string) => {
            const clean = value.replace(/\D/g, '').slice(0, 11);
            if (clean.length <= 2) return `(${clean}`;
            if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
            if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
            return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        },
        placeholder: '(62) 99999-9999',
    },
    cpf: {
        pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        format: (value: string) => {
            const clean = value.replace(/\D/g, '').slice(0, 11);
            if (clean.length <= 3) return clean;
            if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
            if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
            return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
        },
        placeholder: '000.000.000-00',
    },
    cnpj: {
        pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
        format: (value: string) => {
            const clean = value.replace(/\D/g, '').slice(0, 14);
            if (clean.length <= 2) return clean;
            if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
            if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
            if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
            return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
        },
        placeholder: '00.000.000/0000-00',
    },
    cep: {
        pattern: /^\d{5}-\d{3}$/,
        format: (value: string) => {
            const clean = value.replace(/\D/g, '').slice(0, 8);
            if (clean.length <= 5) return clean;
            return `${clean.slice(0, 5)}-${clean.slice(5)}`;
        },
        placeholder: '00000-000',
    },
};

export const InputPro = forwardRef<HTMLInputElement, InputProProps>(
    ({
        label,
        error,
        success,
        hint,
        mask,
        mono = false,
        leftIcon,
        onValidation,
        className = '',
        onChange,
        value: propValue,
        ...props
    }, ref) => {
        const [internalValue, setInternalValue] = useState(propValue?.toString() || '');
        const [isValid, setIsValid] = useState<boolean | null>(null);
        const [shake, setShake] = useState(false);

        const value = propValue !== undefined ? propValue.toString() : internalValue;

        useEffect(() => {
            if (propValue !== undefined) {
                setInternalValue(propValue.toString());
            }
        }, [propValue]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let newValue = e.target.value;

            if (mask && masks[mask]) {
                newValue = masks[mask].format(newValue);

                // Validate against pattern
                const valid = masks[mask].pattern.test(newValue);
                setIsValid(newValue.length > 0 ? valid : null);

                if (onValidation) {
                    onValidation(valid, newValue);
                }

                // Shake on invalid input attempt
                if (!valid && newValue.length > 0) {
                    setShake(true);
                    setTimeout(() => setShake(false), 300);
                }
            }

            setInternalValue(newValue);

            // Create synthetic event with formatted value
            const syntheticEvent = {
                ...e,
                target: { ...e.target, value: newValue },
            };

            onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
        };

        const getPlaceholder = () => {
            if (props.placeholder) return props.placeholder;
            if (mask && masks[mask]) return masks[mask].placeholder;
            return '';
        };

        const getValidationState = () => {
            if (error) return 'error';
            if (success || isValid === true) return 'success';
            return 'default';
        };

        const validationState = getValidationState();

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        value={value}
                        onChange={handleChange}
                        placeholder={getPlaceholder()}
                        className={`
              input-pro
              ${mono || mask ? 'input-mono' : ''}
              ${leftIcon ? 'pl-10' : ''}
              ${validationState === 'success' ? 'valid' : ''}
              ${validationState === 'error' ? 'invalid' : ''}
              ${shake ? 'animate-shake' : ''}
              ${className}
            `}
                        {...props}
                    />
                    {/* Validation icon */}
                    {validationState === 'success' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check className="w-5 h-5 text-emerald-500" />
                        </div>
                    )}
                    {validationState === 'error' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="w-5 h-5 text-red-500" />
                        </div>
                    )}
                </div>
                {/* Hint or Error message */}
                {(hint || error) && (
                    <div className={`flex items-center gap-1 mt-1.5 text-xs ${error ? 'text-red-400' : 'text-text-secondary'}`}>
                        {error && <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{error || hint}</span>
                    </div>
                )}
            </div>
        );
    }
);

InputPro.displayName = 'InputPro';
