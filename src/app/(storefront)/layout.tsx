import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { getProfile } from "@/lib/supabase/server";
import { getSiteSettings, getActiveAnnouncement } from "@/services/catalog";
import { SetupNotice } from "@/components/layout/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [profile, settings, announcement] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getActiveAnnouncement(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar announcement={announcement} />
      <Navbar profile={profile} />
      {!isSupabaseConfigured() && <SetupNotice />}
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} />
    </div>
  );
}
