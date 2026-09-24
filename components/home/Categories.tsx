import Link from 'next/link';

export default function Categories() {
  return (
    <section className="py-10 sm:py-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16" id="categories">
      <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
        <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">The Silhouettes</span>
        <h2 className="font-headline-lg text-[24px] sm:text-headline-lg text-primary mt-1">Shop by Category</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">Curated silhouettes for everyday indulgence and grand celebration.</p>
      </div>
      <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-8 overflow-x-auto sm:overflow-visible gap-5 sm:gap-6 text-center no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth snap-x snap-mandatory">
        {/* 1: Rings */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/category/rings">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOYxVJY_ToSSiEr0r7EOQKbys6_0lQsg7mW41f1zRoVjobYjjhqg1IEQooTvhcgx2mswkzGUinEv6sUPppwFYHvgURIusQq0fmH_u8oj5K1IbhvGNx3RJ4b0a8t7Hk6-D1PQCCz05oUfBxfLzNyfuwCP0RiEvDoZj0BtEpnIHeQho0HEvsl27g41kpoiKFRl4HefuKsmW7v_S8L_3811k_iqcVWvlZMmkO2sFBz-Twd6N1-qRz3q0anQ" alt="Rings" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors font-semibold">Rings</span>
        </Link>
        {/* 2: Earrings */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/category/earrings">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6qUYyElB8wCXbqcO1xhPQF_hA64Q6egLl1PYpWV94ogd9-u9FAf--6REiSYN4qE4NYN9oD1tXfZutK8E5peM3SwtDZPEePtHQV_zDYahiRMa4mHr-eCFgwDmvPH0lA6F_heBHo0Hx9E6yUiQWM_IzoUOwMbEIFZdNuXodyXSubbJF49sJbYmXC9pbe3Cg204sveBWWYkHAEjE53fNtsSFM27ZN6sag6Q-TMJ8on9RTivw87EZqFpm1A" alt="Earrings" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors">Earrings</span>
        </Link>
        {/* 3: Necklaces */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/category/necklaces">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3yhgDSqMi6hvGcuYYbRuCb511X1TBltq8x7ArVN-eBNS_vYSQ3i2vRtBAPS6JB8_epfCjzK-9o4y21ImVQDVO74zk3Z6RohGmecYDE5YfjFdin59rsj2NZFYxPM1V60NOGlSMeaeGnwGLMESlxnk1hXTvYgB65dKjtswSNhtdFjpgn2HljDYB7cDg4crRceOP0sHyffGVhMYRtij3TV3wjVE4Q_YoGqfo0Zyz2ODIeQidetugxWfoOA" alt="Necklaces" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors">Necklaces</span>
        </Link>
        {/* 4: Bracelets */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/category/bracelets">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMCdwyBjLtIH2wJ72ckqQ_ensYSUN2apMHPlLF0O5zIZ5RP0e9UdswrZN1besrow0Gb38F-0M9YqYfnd37FPktH1dVtFsLSGOzHF38MQD21oX2AAslm2u713dssYS1ds2ApE0qaEKMJu_Qb71Srfdi-ky9UitY8UmkOftZbWx_Fn1GYMIy0fq3LE9dkQIXrSvK_sFwbyG0r4wALX6N0oVakDnCJJI1N9PGGYl2XzzENWYPBfHVqUKS2w" alt="Bracelets" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors">Bracelets</span>
        </Link>
        {/* 5: Bangles */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/category/bangles">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl3UixI1cR0dZvSdyZO3g2ogohppy2eabEyxywfLKHADYpkKSXWPTb_gFzRD9OO_pPTWRf-wnbsxwiwLAIYQUCBhz_66GMkpY-lrxSv3UUKv1LsbWKE0ycoZin1bK_qoeZhUJKRsCilP7N9Duwqpsp_DM4thOr7fB-6Yk0bmN_YMpffbKI92X9SlkS_mJEzZPKkrh9TIfbkzL5Tir-sStvssUsU5AzR0AIHNu5efGCqCrajbKC_q4xKg" alt="Bangles" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors">Bangles</span>
        </Link>
        {/* 6: Solitaires */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/search?q=solitaire">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYaFTGzA8QjnJ4sd8JPMjITqQ-LuydJBs8Y0mKciPl4t2hHGx9c7CaXWLCrod9RC_lnHX5ElH_fXKjVsTpK72-RlqoXAiQpaqPMOzhtqZat2tF3DJgpogAV-Mf6zn_5tq40aB9mqGl8vYa65O7lgIOpQlB98kREKS8Id7cDFHRx0gQmS4qyilcfwo_aCmb3peyI0mb485mu_Dsk91uhIbk5B8CvGzbIR1DKi-1e4YPuzNTAyq8RVZamQ" alt="Solitaires" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors">Solitaires</span>
        </Link>
        {/* 7: Mangalsutras */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/category/necklaces?style=mangalsutra">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbTDRspPlaZdrt95j9IdK0vFArW_cjhYuuq-_OOoAoAHMD9-W-EwaMe839rg5ziZOf2nYNBaM5AMSnoKxGJ8Ryo6Dan-OCcf8XDjTgEPLJjFGAi73gNszawfDgQ234-xm4uVu643VXBrj9euiTvAoS76jwNmCvicXXEDEzht017mFmVjQGiF7hYkWqYDJAt6m-QYmIJgP3GmyVP3zylg7GqZM6RlE3zxL5G2R7kvd5KErY8QPih0QpBg" alt="Mangalsutras" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors">Mangalsutras</span>
        </Link>
        {/* 8: Gold Coins */}
        <Link className="group flex flex-col items-center flex-shrink-0 snap-start w-20 sm:w-auto" href="/search?q=gold%20coin">
          <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-surface-container border border-outline-variant/60 p-1 group-hover:border-secondary transition-colors duration-300">
            <img className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5T1brtItLcP7aO6m991RgQsRe8t8Gqi6DAL71CdF5QgJbUbcQ2eFJ6plkTo3NGu4V8QRUI32xPD_dLN7d5KPJbjnZxN6DPdOJ2u7YJflOocIMwBea0xTk6sfo4M5i65V4OkuTuglnyNi526jvoW5u7RSE_wsQttKS_oB_lyHXfPHK4Md94BDcTeHtLntLQcjmpWmehWofM1dWesE1Hf6NktoTvTgNxmq8xP2bPPe9MCzpxx-8_37NSA" alt="Gold Coins" />
          </div>
          <span className="font-label-sm sm:font-label-lg text-[11px] sm:text-label-lg text-primary mt-2 sm:mt-3 group-hover:text-secondary transition-colors">Gold Coins</span>
        </Link>
      </div>
    </section>
  );
}
