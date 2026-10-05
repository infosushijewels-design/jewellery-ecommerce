import CategoryMarquee, { type CategoryItem } from './CategoryMarquee';
import { getHomeCategories } from '@/lib/supabase/queries';

// Used only when a category has neither an admin-set image nor any product photo yet.
const PLACEHOLDER_IMAGES: Record<string, string> = {
  Rings: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOYxVJY_ToSSiEr0r7EOQKbys6_0lQsg7mW41f1zRoVjobYjjhqg1IEQooTvhcgx2mswkzGUinEv6sUPppwFYHvgURIusQq0fmH_u8oj5K1IbhvGNx3RJ4b0a8t7Hk6-D1PQCCz05oUfBxfLzNyfuwCP0RiEvDoZj0BtEpnIHeQho0HEvsl27g41kpoiKFRl4HefuKsmW7v_S8L_3811k_iqcVWvlZMmkO2sFBz-Twd6N1-qRz3q0anQ',
  Earrings: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6qUYyElB8wCXbqcO1xhPQF_hA64Q6egLl1PYpWV94ogd9-u9FAf--6REiSYN4qE4NYN9oD1tXfZutK8E5peM3SwtDZPEePtHQV_zDYahiRMa4mHr-eCFgwDmvPH0lA6F_heBHo0Hx9E6yUiQWM_IzoUOwMbEIFZdNuXodyXSubbJF49sJbYmXC9pbe3Cg204sveBWWYkHAEjE53fNtsSFM27ZN6sag6Q-TMJ8on9RTivw87EZqFpm1A',
  Necklaces: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3yhgDSqMi6hvGcuYYbRuCb511X1TBltq8x7ArVN-eBNS_vYSQ3i2vRtBAPS6JB8_epfCjzK-9o4y21ImVQDVO74zk3Z6RohGmecYDE5YfjFdin59rsj2NZFYxPM1V60NOGlSMeaeGnwGLMESlxnk1hXTvYgB65dKjtswSNhtdFjpgn2HljDYB7cDg4crRceOP0sHyffGVhMYRtij3TV3wjVE4Q_YoGqfo0Zyz2ODIeQidetugxWfoOA',
  Bracelets: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCdwyBjLtIH2wJ72ckqQ_ensYSUN2apMHPlLF0O5zIZ5RP0e9UdswrZN1besrow0Gb38F-0M9YqYfnd37FPktH1dVtFsLSGOzHF38MQD21oX2AAslm2u713dssYS1ds2ApE0qaEKMJu_Qb71Srfdi-ky9UitY8UmkOftZbWx_Fn1GYMIy0fq3LE9dkQIXrSvK_sFwbyG0r4wALX6N0oVakDnCJJI1N9PGGYl2XzzENWYPBfHVqUKS2w',
  Bangles: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl3UixI1cR0dZvSdyZO3g2ogohppy2eabEyxywfLKHADYpkKSXWPTb_gFzRD9OO_pPTWRf-wnbsxwiwLAIYQUCBhz_66GMkpY-lrxSv3UUKv1LsbWKE0ycoZin1bK_qoeZhUJKRsCilP7N9Duwqpsp_DM4thOr7fB-6Yk0bmN_YMpffbKI92X9SlkS_mJEzZPKkrh9TIfbkzL5Tir-sStvssUsU5AzR0AIHNu5efGCqCrajbKC_q4xKg',
};
const GENERIC_PLACEHOLDER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYaFTGzA8QjnJ4sd8JPMjITqQ-LuydJBs8Y0mKciPl4t2hHGx9c7CaXWLCrod9RC_lnHX5ElH_fXKjVsTpK72-RlqoXAiQpaqPMOzhtqZat2tF3DJgpogAV-Mf6zn_5tq40aB9mqGl8vYa65O7lgIOpQlB98kREKS8Id7cDFHRx0gQmS4qyilcfwo_aCmb3peyI0mb485mu_Dsk91uhIbk5B8CvGzbIR1DKi-1e4YPuzNTAyq8RVZamQ';

// Curated shortcuts that are searches rather than database categories.
const SHORTCUTS: CategoryItem[] = [
  { name: 'Solitaires', href: '/search?q=solitaire', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYaFTGzA8QjnJ4sd8JPMjITqQ-LuydJBs8Y0mKciPl4t2hHGx9c7CaXWLCrod9RC_lnHX5ElH_fXKjVsTpK72-RlqoXAiQpaqPMOzhtqZat2tF3DJgpogAV-Mf6zn_5tq40aB9mqGl8vYa65O7lgIOpQlB98kREKS8Id7cDFHRx0gQmS4qyilcfwo_aCmb3peyI0mb485mu_Dsk91uhIbk5B8CvGzbIR1DKi-1e4YPuzNTAyq8RVZamQ' },
  { name: 'Mangalsutras', href: '/category/necklaces?style=mangalsutra', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbTDRspPlaZdrt95j9IdK0vFArW_cjhYuuq-_OOoAoAHMD9-W-EwaMe839rg5ziZOf2nYNBaM5AMSnoKxGJ8Ryo6Dan-OCcf8XDjTgEPLJjFGAi73gNszawfDgQ234-xm4uVu643VXBrj9euiTvAoS76jwNmCvicXXEDEzht017mFmVjQGiF7hYkWqYDJAt6m-QYmIJgP3GmyVP3zylg7GqZM6RlE3zxL5G2R7kvd5KErY8QPih0QpBg' },
  { name: 'Gold Coins', href: '/search?q=gold%20coin', image: 'https://images.unsplash.com/photo-1708714290523-e9f76878bf53?auto=format&fit=crop&q=80&w=300' },
];

export default async function Categories() {
  const categories = await getHomeCategories();
  const items: CategoryItem[] = [
    ...categories.map((c, i) => ({
      name: c.name,
      href: c.href,
      image: c.image || PLACEHOLDER_IMAGES[c.name] || GENERIC_PLACEHOLDER,
      bold: i === 0,
    })),
    ...SHORTCUTS,
  ];
  return <CategoryMarquee items={items} />;
}
