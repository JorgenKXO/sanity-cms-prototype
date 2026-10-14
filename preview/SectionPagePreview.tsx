import {ArticlePreview, type ArticlePreviewProps} from './ArticlePreview'

export function SectionPagePreview(props: ArticlePreviewProps) {
  return <ArticlePreview {...props} isSectionPage />
}
