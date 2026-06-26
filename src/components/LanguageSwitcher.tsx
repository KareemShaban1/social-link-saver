import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Locale } from "@/i18n";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export const LanguageSwitcher = ({ className, compact = false }: LanguageSwitcherProps) => {
  const { locale, setLocale, t } = useTranslation();

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: compact ? "EN" : t("common.english") },
    { value: "ar", label: compact ? "ع" : t("common.arabic") },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 shadow-sm",
        className,
      )}
      role="group"
      aria-label={t("common.language")}
    >
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
            locale === value
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700",
          )}
          aria-pressed={locale === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
