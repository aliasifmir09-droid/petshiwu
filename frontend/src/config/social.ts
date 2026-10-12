/** Public profiles that resolve. Instagram is Pet's own (restorable) account. */
export const SOCIAL_PROFILES = [
  'https://www.facebook.com/1386014131242363',
  'https://www.youtube.com/@petshiwuinc',
  'https://www.instagram.com/petshiwu',
] as const;

export const FOOTER_SOCIAL = [
  { name: 'Facebook', href: 'https://www.facebook.com/1386014131242363', network: 'facebook' as const },
  { name: 'YouTube', href: 'https://www.youtube.com/@petshiwuinc', network: 'youtube' as const },
  { name: 'Instagram', href: 'https://www.instagram.com/petshiwu', network: 'instagram' as const },
] as const;
