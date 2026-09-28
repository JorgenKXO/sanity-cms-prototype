import {articleType} from './articleType'
import {
  navigationGroupHeadingType,
  navigationPageType,
  navigationTilePageType,
} from './navigationPageType'
import {informasjonPanelType, rettskilderPanelType} from './panelTypes'
import {siteSettingsType} from './siteSettingsType'

export const schemaTypes = [
  siteSettingsType,
  articleType,
  navigationPageType,
  navigationGroupHeadingType,
  navigationTilePageType,
  rettskilderPanelType,
  informasjonPanelType,
]
