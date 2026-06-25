import clsx from 'clsx';
import styles from './Card.module.scss';

interface CardProps {
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
}

export function Card({ children, padded = true, className }: CardProps) {
  return (
    <div className={clsx(styles.card, padded && styles.padded, className)}>
      {children}
    </div>
  );
}
