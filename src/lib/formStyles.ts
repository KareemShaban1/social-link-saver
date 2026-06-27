/** Shared form field classes matching the landing page design */
export const formFieldClass =
  "rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus-visible:ring-indigo-500";

/** Select triggers — placeholder state uses muted gray; selected value stays dark */
export const formSelectTriggerClass =
  `${formFieldClass} [&_[data-placeholder]]:text-gray-400 [&_[data-placeholder]]:font-normal`;

export const modalPanelClass =
  "rounded-2xl border border-gray-100 bg-white shadow-xl shadow-indigo-100/20";
