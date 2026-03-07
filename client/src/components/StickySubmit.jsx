export default function StickySubmit({ onClick, disabled, loading, children }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 pt-4 pb-6 px-4 -mx-4 bg-gradient-to-t from-slate-100 via-slate-100 to-transparent sticky-submit">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full py-5 rounded-2xl bg-slate-800 text-white text-lg font-bold shadow-card active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Envoi…
          </>
        ) : (
          children
        )}
      </button>
    </div>
  );
}
