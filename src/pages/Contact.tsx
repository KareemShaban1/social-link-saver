import { useState } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formFieldClass } from "@/lib/formStyles";
import { useToast } from "@/hooks/use-toast";
import { AnimateIn } from "@/components/landing/AnimateIn";
import { Clock, Mail, MessageSquare } from "lucide-react";

const SUPPORT_EMAIL = "support@socialsaver.com";

const Contact = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: t("contact.missingFields"),
        description: t("contact.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const body = `${t("contact.emailBodyIntro", { name: name.trim(), email: email.trim() })}\n\n${message.trim()}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    toast({
      title: t("contact.successTitle"),
      description: t("contact.successDesc", { email: SUPPORT_EMAIL }),
    });
    setSubmitting(false);
  };

  return (
    <div className="landing-page min-h-screen scroll-smooth bg-white text-gray-900">
      <LandingNavbar />
      <main className="bg-gray-50">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <AnimateIn variant="fade-up" className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">{t("nav.contact")}</p>
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{t("contact.title")}</h1>
            <p className="mt-3 text-base text-gray-500 sm:text-lg">{t("contact.subtitle")}</p>
          </AnimateIn>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
            <AnimateIn variant="fade-up" delay={80} className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t("contact.getInTouch")}</h2>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-2 block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Clock className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t("contact.responseTime")}</h2>
                <p className="mt-2 text-sm text-gray-500">{t("contact.responseTimeDesc")}</p>
              </div>
            </AnimateIn>

            <AnimateIn variant="fade-up" delay={160} className="lg:col-span-3">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{t("contact.sendMessage")}</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-gray-700">
                        {t("contact.name")}
                      </Label>
                      <Input
                        id="contact-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("contact.namePlaceholder")}
                        className={formFieldClass}
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-gray-700">
                        {t("contact.email")}
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("contact.emailPlaceholder")}
                        className={formFieldClass}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject" className="text-gray-700">
                      {t("contact.subject")}
                    </Label>
                    <Input
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("contact.subjectPlaceholder")}
                      className={formFieldClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="text-gray-700">
                      {t("contact.message")}
                    </Label>
                    <Textarea
                      id="contact-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("contact.messagePlaceholder")}
                      className={`min-h-[140px] resize-y ${formFieldClass}`}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-full bg-indigo-600 py-6 font-semibold hover:bg-indigo-700 sm:w-auto sm:px-10"
                  >
                    {submitting ? t("contact.sending") : t("contact.send")}
                  </Button>
                </div>
              </form>
            </AnimateIn>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default Contact;
