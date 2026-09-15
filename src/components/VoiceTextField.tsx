import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useSpeechToText, type SpeechToTextError } from "@/hooks/useSpeechToText";
import { useTranslation } from "@/contexts/LanguageContext";
import { persistSpeechLocale } from "@/lib/speechRecognition";
import { cn } from "@/lib/utils";
import type { Locale, TranslationKey } from "@/i18n";

interface VoiceTextFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  speechLocale: Locale;
  onSpeechLocaleChange: (locale: Locale) => void;
  enabled?: boolean;
}

const ERROR_KEYS: Record<SpeechToTextError, TranslationKey> = {
  unsupported: "voiceInput.unsupported",
  insecure: "voiceInput.insecure",
  permission: "voiceInput.permissionDenied",
  network: "voiceInput.networkError",
  generic: "voiceInput.error",
};

export const VoiceTextField = ({
  id,
  value,
  onChange,
  placeholder,
  className,
  required,
  multiline = false,
  rows = 3,
  speechLocale,
  onSpeechLocaleChange,
  enabled = true,
}: VoiceTextFieldProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const showError = (error: SpeechToTextError) => {
    toast({
      title: t("common.error"),
      description: t(ERROR_KEYS[error]),
      variant: "destructive",
    });
  };

  const { listening, toggle } = useSpeechToText({
    value,
    onChange,
    locale: speechLocale,
    enabled,
    onError: showError,
  });

  const handleMicClick = () => {
    if (!listening) onChange(value);
    const error = toggle();
    if (error) showError(error);
  };

  const handleLocaleToggle = () => {
    const next: Locale = speechLocale === "ar" ? "en" : "ar";
    persistSpeechLocale(next);
    onSpeechLocaleChange(next);
  };

  const micLabel = listening ? t("voiceInput.stop") : t("voiceInput.start");
  const localeLabel =
    speechLocale === "ar" ? t("voiceInput.speakArabic") : t("voiceInput.speakEnglish");

  const controls = (
    <div className={cn("flex items-center gap-0.5", multiline ? "absolute end-1.5 bottom-1.5" : "absolute end-1 top-1/2 -translate-y-1/2")}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLocaleToggle}
            className={cn(
              "h-7 min-w-7 rounded-full px-1.5 text-[11px] font-semibold",
              listening ? "text-indigo-700" : "text-gray-500 hover:text-indigo-700",
            )}
            aria-label={t("voiceInput.language")}
          >
            {speechLocale === "ar" ? t("voiceInput.arabic") : t("voiceInput.english")}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{localeLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleMicClick}
            className={cn(
              "h-8 w-8 rounded-full",
              listening
                ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                : "text-gray-500 hover:text-indigo-700",
            )}
            aria-label={micLabel}
            aria-pressed={listening}
          >
            <Mic className={cn("h-4 w-4", listening && "animate-pulse")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{micLabel}</TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {multiline ? (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={listening ? t("voiceInput.listening") : placeholder}
            className={cn(className, "pb-10 pe-24", listening && "ring-2 ring-indigo-400")}
            rows={rows}
            readOnly={listening}
            dir="auto"
          />
        ) : (
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={listening ? t("voiceInput.listening") : placeholder}
            className={cn(className, "pe-24", listening && "ring-2 ring-indigo-400")}
            required={required}
            readOnly={listening}
            dir="auto"
          />
        )}
        {controls}
      </div>
      {listening && (
        <p className="flex items-center gap-1.5 text-xs text-indigo-600">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          {t("voiceInput.listeningHint", {
            language: speechLocale === "ar" ? t("common.arabic") : t("common.english"),
          })}
        </p>
      )}
    </div>
  );
};
