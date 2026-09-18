type BrandLogoProps = {
  variant?: 'on-navy' | 'on-light';
  className?: string;
};

const HEIGHT: Record<NonNullable<BrandLogoProps['variant']>, string> = {
  'on-navy': 'h-8 lg:h-10',
  'on-light': 'h-10 lg:h-12',
};

const BrandLogo = ({ variant = 'on-light', className = '' }: BrandLogoProps) => {
  const mark = (
    <picture>
      <source srcSet="/logo.webp" type="image/webp" />
      <img
        src="/logo.png"
        alt="Petshiwu"
        className={`${HEIGHT[variant]} w-auto object-contain`}
        loading="eager"
        width={195}
        height={40}
      />
    </picture>
  );

  if (variant === 'on-navy') {
    return (
      <span className={`inline-flex items-center bg-white rounded-2xl px-2 py-1 ${className}`}>
        {mark}
      </span>
    );
  }

  return <span className={`inline-flex items-center ${className}`}>{mark}</span>;
};

export default BrandLogo;
