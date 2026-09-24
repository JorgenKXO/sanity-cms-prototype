import {articleType} from './articleType'
import {authorType} from './authorType'
import {categoryType} from './categoryType'
import {
  navigationGroupHeadingType,
  navigationPageType,
  navigationTilePageType,
} from './navigationPageType'
import {informasjonPanelType, navigationPanelType, rettskilderPanelType} from './panelTypes'
import {pageType} from './pageType'
import {postType} from './postType'
import {siteSettingsType} from './siteSettingsType'

export const schemaTypes = [
  siteSettingsType,
  articleType,
  navigationPageType,
  navigationGroupHeadingType,
  navigationTilePageType,
  navigationPanelType,
  rettskilderPanelType,
  informasjonPanelType,
  authorType,
  categoryType,
  pageType,
  postType,
]
