import {
  EditIcon,
  EyeOpenIcon,
  FolderIcon,
  MasterDetailIcon,
} from '@sanity/icons'
import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'

import {ArticlePreview} from './preview/ArticlePreview'
import {SectionPagePreview} from './preview/SectionPagePreview'
import {NavigationPagePreview} from './preview/NavigationPagePreview'
import {ForsidePreview} from './preview/ForsidePreview'
import {SharedContentUsage} from './preview/SharedContentUsage'
import {kategoriOptions} from './schemaTypes/kategoriOptions'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'sectionPage') {
    return S.document().views([
      S.view.form().icon(EditIcon),
      S.view.component(SectionPagePreview).title('Forhåndsvisning av seksjonsside').icon(EyeOpenIcon),
    ])
  }
  if (schemaType === 'article') {
    return S.document().views([
      S.view.form().icon(EditIcon),
      S.view.component(ArticlePreview).title('Forhåndsvisning av artikkel').icon(EyeOpenIcon),
    ])
  }

  if (schemaType === 'navigationPage') {
    return S.document().views([
      S.view.form().icon(EditIcon),
      S.view.component(NavigationPagePreview).title('Forhåndsvisning av navigasjonsside').icon(EyeOpenIcon),
    ])
  }

  if (schemaType === 'forside') {
    return S.document().views([
      S.view.form().icon(EditIcon),
      S.view.component(ForsidePreview).title('Forhåndsvisning av forside').icon(EyeOpenIcon),
    ])
  }

  if (schemaType === 'sharedContent') {
    return S.document().views([
      S.view.form().icon(EditIcon),
      S.view.component(SharedContentUsage).title('Brukes på').icon(MasterDetailIcon),
    ])
  }

  return undefined
}

// Alle artikler i én flat liste, uavhengig av kategori.
const allArticles = (S: Parameters<StructureResolver>[0]) =>
  S.listItem()
    .title('Alle artikler')
    .id('allArticles')
    .icon(FolderIcon)
    .child(
      S.documentList()
        .title('Alle artikler')
        .id('allArticles-list')
        .schemaType('article')
        .apiVersion('2026-09-10')
        .filter('_type == "article"'),
    )

const sectionPages = (S: Parameters<StructureResolver>[0], title = 'Alle seksjonssider',
  category?: {suffix: string; value?: string}) =>
  S.listItem()
    .title(title)
    .id(`sectionPages-${category?.suffix || 'all'}`)
    .icon(FolderIcon)
    .child(
      S.documentList()
        .title(title)
        .schemaType('sectionPage')
        .apiVersion('2026-09-10')
        .filter(`_type == "sectionPage"${category
          ? category.value ? ' && kategori == $kategori' : ' && !defined(kategori)'
          : ''}`)
        .params(category?.value ? {kategori: category.value} : {})
        .initialValueTemplates(category?.value
          ? [S.initialValueTemplateItem('sectionPage-with-kategori', {kategori: category.value})]
          : [S.initialValueTemplateItem('sectionPage')]),
    )

// Bygger én kategorimappe med artikler og seksjonssider, forhåndsutfylt
// med kategorien når nye dokumenter opprettes herfra.
function kategoriFolder(
  S: Parameters<StructureResolver>[0],
  title: string,
  value: string | undefined,
  idSuffix: string,
) {
  const filterSuffix = value ? '&& kategori == $kategori' : '&& !defined(kategori)'
  const params = value ? {kategori: value} : {}

  return S.listItem()
    .title(title)
    .id(`kategori-${idSuffix}`)
    .icon(FolderIcon)
    .child(
      S.list()
        .title(title)
        .id(`kategori-${idSuffix}-list`)
        .items([
          sectionPages(S, 'Seksjonssider', {suffix: idSuffix, value}),
          S.listItem()
            .title('Artikler')
            .id(`kategori-${idSuffix}-artikler`)
            .icon(FolderIcon)
            .child(
              S.documentList()
                .title(`Artikler – ${title}`)
                .id(`kategori-${idSuffix}-artikler-list`)
                .schemaType('article')
                .apiVersion('2026-09-10')
                .filter(`_type == "article" ${filterSuffix}`)
                .params(params)
                .initialValueTemplates(
                  value ? [S.initialValueTemplateItem('article-with-kategori', {kategori: value})] : [],
                ),
            ),
        ]),
    )
}

// Én mappe per kategori, med en egen mappe til slutt for innhold som mangler kategori.
const kategoriFolders = (S: Parameters<StructureResolver>[0]) => [
  ...kategoriOptions.map(({title, value}) => kategoriFolder(S, title, value, value)),
  kategoriFolder(S, 'Uten kategori', undefined, 'none'),
]

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Innhold')
    .items([
      allArticles(S),
      sectionPages(S),
      S.divider(),
      ...kategoriFolders(S),
    ])
