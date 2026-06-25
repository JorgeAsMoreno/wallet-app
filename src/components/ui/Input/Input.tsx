import clsx from 'clsx';
import styles from './Input.module.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  // `| undefined` explícito: con exactOptionalPropertyTypes permite pasar
  // directamente errors.x?.message (string | undefined) sin castear.
  error?: string | undefined;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(styles.input, error && styles.error, className)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
