export default function Newsletter() {
  return (
    <section className="py-20 border-t border-outline-variant/40">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 text-center max-w-3xl">
        <span className="material-symbols-outlined text-[40px] text-secondary mb-4 font-light">mail</span>
        <h2 className="font-headline-lg text-headline-lg text-primary">Join the Inner Circle</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-3 max-w-lg mx-auto">
          Subscribe to receive exclusive access to private launches, editorial journals, and privileged seasonal pricing.
        </p>
        <form className="mt-8 flex flex-col sm:flex-row max-w-lg mx-auto gap-3">
          <input className="flex-1 px-6 py-4 bg-surface-container-low border border-outline-variant/60 rounded-full font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all" placeholder="Enter your email address" required type="email"/>
          <button className="px-8 py-4 bg-primary text-surface rounded-full font-label-lg text-label-lg hover:bg-primary-container transition-all" type="submit">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
