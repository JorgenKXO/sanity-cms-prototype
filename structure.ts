import {FolderIcon} from '@sanity/icons'
import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'

import {ArticlePreview} from './preview/ArticlePreview'
import {NavigationPagePreview} from './preview/NavigationPagePreview'
import {kategoriOptions} from './schemaTypes/kategoriOptions'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'article') {
    return S.document().views([
      S.view.form(),
      S.view.component(ArticlePreview).title('Forhåndsvisning av artikkel'),
    ])
  }

  if (schemaType === 'navigationPage') {
    return S.document().views([
      S.view.form(),
      S.view.component(NavigationPagePreview).title('Forhåndsvisning av navigasjonsside'),
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

// Alle navigasjonssider i én flat liste, uavhengig av kategori.
const allNavigationPages = (S: Parameters<StructureResolver>[0]) =>
  S.listItem()
    .title('Alle navigasjonssider')
    .id('allNavigationPages')
    .icon(FolderIcon)
    .child(
      S.documentList()
        .title('Alle navigasjonssider')
        .id('allNavigationPages-list')
        .schemaType('navigationPage')
        .apiVersion('2026-09-10')
        .filter('_type == "navigationPage"'),
    )

// Bygger én kategorimappe med "Artikler"- og "Navigasjonssider"-undermapper,
// begge forhåndsutfylt med kategorien når nye dokumenter opprettes herfra.
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
          S.listItem()
            .title('Navigasjonssider')
            .id(`kategori-${idSuffix}-navigasjonssider`)
            .icon(FolderIcon)
            .child(
              S.documentList()
                .title(`Navigasjonssider – ${title}`)
                .id(`kategori-${idSuffix}-navigasjonssider-list`)
                .schemaType('navigationPage')
                .apiVersion('2026-09-10')
                .filter(`_type == "navigationPage" ${filterSuffix}`)
                .params(params)
                .initialValueTemplates(
                  value
                    ? [S.initialValueTemplateItem('navigationPage-with-kategori', {kategori: value})]
                    : [],
                ),
            ),
        ]),
    )
}

// Én mappe per kategori (artikler + navigasjonssider samlet), med en egen mappe
// til slutt for innhold som mangler kategori.
const kategoriFolders = (S: Parameters<StructureResolver>[0]) => [
  ...kategoriOptions.map(({title, value}) => kategoriFolder(S, title, value, value)),
  kategoriFolder(S, 'Uten kategori', undefined, 'none'),
]

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Innhold')
    .items([
      allArticles(S),
      allNavigationPages(S),
      S.divider(),
      ...kategoriFolders(S),
      S.divider(),
      S.listItem()
        .title('Nettstedsinnstillinger')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Nettstedsinnstillinger'),
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !['article', 'navigationPage', 'siteSettings'].includes(item.getId() || ''),
      ),
    ])
