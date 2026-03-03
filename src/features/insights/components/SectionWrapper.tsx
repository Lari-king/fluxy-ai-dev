import { ReactNode } from 'react';

interface Props {
  title: string;
  icon: any;
  color: string;
  children: ReactNode;
}

export function SectionWrapper({ title, icon: Icon, color, children }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Icon className={`size-3.5 ${color}`} />
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] ${color}`}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}
