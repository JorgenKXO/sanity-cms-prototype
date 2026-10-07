import {articleType} from './articleType'
import {
  navigationGroupHeadingType,
  navigationGroupType,
  navigationPageType,
  navigationTilePageType,
} from './navigationPageType'
import {informasjonPanelType, krisePanelType, rettskilderPanelType, varselPanelType} from './panelTypes'
import {siteSettingsType} from './siteSettingsType'
import {
  bildeOgTekstPanelType,
  forsideNavigasjonskortType,
  forsideOverskriftType,
  forsideType,
} from './globaler/forsideType'

export const schemaTypes = [
  siteSettingsType,
  articleType,
  navigationPageType,
  navigationGroupHeadingType,
  navigationGroupType,
  navigationTilePageType,
  rettskilderPanelType,
  informasjonPanelType,
  varselPanelType,
  krisePanelType,
  forsideType,
  forsideOverskriftType,
  forsideNavigasjonskortType,
  bildeOgTekstPanelType,
]
