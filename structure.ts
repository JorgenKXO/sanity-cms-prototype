import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'

import {ArticlePreview} from './preview/ArticlePreview'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'article') {
    return S.document().views([
      S.view.form(),
      S.view.component(ArticlePreview).title('Forhåndsvisning av artikkel'),
    ])
  }

  return undefined
}

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Innhold')
    .items([
      S.documentTypeListItem('article').title('Artikler'),
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
        (item) => !['article', 'siteSettings'].includes(item.getId() || ''),
      ),
    ])
