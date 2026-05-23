import { useEffect, useState } from 'react';
import useI18n from '../i18n/index.js';

const TOUR_STORAGE_KEY = 'narok-shoes-tour-seen';

const steps = [
  {
    titleKey: 'tour.steps.browseTitle',
    bodyKey: 'tour.steps.browseBody',
  },
  {
    titleKey: 'tour.steps.detailsTitle',
    bodyKey: 'tour.steps.detailsBody',
  },
  {
    titleKey: 'tour.steps.cartTitle',
    bodyKey: 'tour.steps.cartBody',
  },
  {
    titleKey: 'tour.steps.requestTitle',
    bodyKey: 'tour.steps.requestBody',
  },
];

export default function OnboardingTour({ open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const t = useI18n((s) => s.t);

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
    }
  }, [open]);

  if (!open) return null;

  const currentStep = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const handleDismiss = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1a1a1a]/55 px-4 pb-4 pt-20 sm:items-center sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-[#fffdf8] shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="bg-gradient-to-r from-[rgba(46,125,50,0.96)] to-[rgba(102,187,106,0.88)] px-6 py-5 text-white sm:px-8">
          <span className="inline-flex rounded-full bg-white/18 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/95">
            {t('tour.badge')}
          </span>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">{t('tour.title')}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/88">{t('tour.subtitle')}</p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="mb-6 flex items-center gap-2">
            {steps.map((step, index) => (
              <button
                key={step.titleKey}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`h-2.5 rounded-full transition ${
                  index === activeStep ? 'w-10 bg-(--color-primary)' : 'w-2.5 bg-[rgba(46,125,50,0.22)]'
                }`}
                aria-label={`${t('tour.step')} ${index + 1}`}
              />
            ))}
          </div>

          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            {t('tour.step')} {activeStep + 1}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
            {t(currentStep.titleKey)}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
            {t(currentStep.bodyKey)}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-bold text-[var(--color-text)] transition hover:border-[var(--color-primary)]"
            >
              {t('tour.skip')}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
                disabled={isFirstStep}
                className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-bold text-[var(--color-text)] transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('tour.back')}
              </button>

              {isLastStep ? (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="cta-button rounded-full px-5 py-3 text-sm font-extrabold"
                >
                  {t('tour.finish')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveStep((step) => Math.min(steps.length - 1, step + 1))}
                  className="cta-button rounded-full px-5 py-3 text-sm font-extrabold"
                >
                  {t('tour.next')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TOUR_STORAGE_KEY };
