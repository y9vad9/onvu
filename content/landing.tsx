import { getTranslations } from 'next-intl/server'
import { createRepository } from '@adapters/createRepositories'
import { listFeaturedNotes } from '@core/ListNotes'
import {
  HeroSection,
  HeroAvatar,
  HeroIntro,
  HeroSocials,
} from '@components/portfolio/Hero'
import { Section, SectionHeading } from '@components/portfolio/Section'
import { NoteCardLarge } from '@components/portfolio/FeaturedNotes'
import { WorkItem } from '@components/portfolio/WorkExperience'
import { ProjectItem } from '@components/portfolio/Projects'
import { EducationItem } from '@components/portfolio/Education'
import { loadSiteConfig } from '@lib/config/loadConfig'

/**
 * Landing page body — this is the file you edit as a template consumer.
 *
 * It owns every high-level decision: which sections exist, in what order,
 * what they're called, how many entries to show, grid columns, etc. The
 * components imported below are deliberately low-level (single item,
 * single heading) so this file stays expressive.
 *
 * Customising:
 *  - Hide a section → delete its `<Section>` block.
 *  - Reorder → move blocks around.
 *  - Show only N items → `.slice(0, N)` on the array.
 *  - Drop a heading → remove the `<SectionHeading>` line.
 *  - Untie a heading from a link → remove the `href` prop.
 *  - Tint a section → `<Section className="bg-card">`.
 *  - Add a brand-new section → write your own JSX, or reuse the primitives.
 *
 * This file is marked `merge=ours` in `.gitattributes`, so your edits
 * survive `git pull upstream`.
 */
export async function LandingBody({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home' })
  const siteConfig = await loadSiteConfig(locale)

  const repo = createRepository(locale)
  const featuredNotes = await listFeaturedNotes(repo, siteConfig.navigation.featuredNotes)

  return (
    <main className="pt-14">
      {/*
        Hero is composed of primitives so you can swap pieces:
          - Replace <HeroAvatar /> with a banner, video, or omit it entirely.
          - Add a CTA button as a child of <HeroIntro>.
          - Replace <HeroSocials> with your own JSX row.
      */}
      <HeroSection>
        <HeroAvatar src={siteConfig.owner.profileImage} alt={siteConfig.owner.name} />
        <HeroIntro name={siteConfig.owner.name} bio={siteConfig.owner.bio}>
          <HeroSocials socials={siteConfig.owner.socials} />
        </HeroIntro>
      </HeroSection>

      <Section id="notes">
        <SectionHeading href={`/${locale}/notes`}>{t('notes')}</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {featuredNotes.map((note) => (
            <NoteCardLarge
              key={note.slug}
              note={note}
              locale={locale}
              viewLabel={t('view')}
            />
          ))}
        </div>
      </Section>

      <Section id="work-experience">
        <SectionHeading>{t('workExperience')}</SectionHeading>
        <div className="flex flex-col gap-3">
          {siteConfig.home.workExperience.map((entry) => (
            <WorkItem key={entry.company} entry={entry} viewLabel={t('view')} />
          ))}
        </div>
      </Section>

      <Section id="projects">
        <SectionHeading>{t('projects')}</SectionHeading>
        <div className="flex flex-col gap-3">
          {siteConfig.home.projects.map((entry) => (
            <ProjectItem key={entry.name} entry={entry} viewLabel={t('view')} />
          ))}
        </div>
      </Section>

      <Section id="education">
        <SectionHeading>{t('education')}</SectionHeading>
        <div className="flex flex-col gap-3">
          {siteConfig.home.education.map((entry) => (
            <EducationItem
              key={entry.institution}
              entry={entry}
              viewLabel={t('view')}
            />
          ))}
        </div>
      </Section>
    </main>
  )
}
