import {FolderIcon} from '@sanity/icons'
import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'

import {ArticlePreview} from './preview/ArticlePreview'
import {navigasjonKategorier} from './schemaTypes/navigationPageType'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'article') {
    return S.document().views([
      S.view.form(),
      S.view.component(ArticlePreview).title('Forhåndsvisning av artikkel'),
    ])
  }

  return undefined
}

// Én mappe per kategori, med navigasjonssider som mangler kategori samlet til slutt.
const navigationPagesByCategory = (S: Parameters<StructureResolver>[0]) =>
  S.listItem()
    .title('Navigasjonssider')
    .id('navigationPagesByCategory')
    .icon(FolderIcon)
    .child(
      S.list()
        .title('Navigasjonssider')
        .id('navigationPagesByCategory')
        .items([
          ...navigasjonKategorier.map(({title, value}) =>
            S.listItem()
              .title(title)
              .id(`navigationPage-kategori-${value}`)
              .icon(FolderIcon)
              .child(
                S.documentList()
                  .title(title)
                  .id(`navigationPage-kategori-${value}-list`)
                  .schemaType('navigationPage')
                  .apiVersion('2026-09-10')
                  .filter('_type == "navigationPage" && kategori == $kategori')
                  .params({kategori: value}),
              ),
          ),
          S.listItem()
            .title('Uten kategori')
            .id('navigationPage-kategori-none')
            .icon(FolderIcon)
            .child(
              S.documentList()
                .title('Uten kategori')
                .id('navigationPage-kategori-none-list')
                .schemaType('navigationPage')
                .apiVersion('2026-09-10')
                .filter('_type == "navigationPage" && !defined(kategori)'),
            ),
        ]),
    )

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Innhold')
    .items([
      S.documentTypeListItem('article').title('Artikler'),
      navigationPagesByCategory(S),
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
