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
  forsideNavigasjonsgruppeType,
  forsideNavigasjonskortType,
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
  forsideNavigasjonsgruppeType,
  forsideNavigasjonskortType,
  bildeOgTekstPanelType,
]
