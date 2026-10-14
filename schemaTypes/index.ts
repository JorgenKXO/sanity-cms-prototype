import {articleType} from './articleType'
import {pageSectionType, sectionPageType} from './sectionPageType'
import {
  articleImageContentBlockType,
  articleInformationContentBlockType,
  articleTextContentBlockType,
} from './articleContentBlocks'
import {
  navigationGroupHeadingType,
  navigationGroupType,
  navigationPageType,
  navigationTilePageType,
} from './navigationPageType'
import {informasjonPanelType, krisePanelType, rettskilderPanelType, varselPanelType} from './panelTypes'
import {siteSettingsType} from './siteSettingsType'
import {sharedContentType} from './sharedContentType'
import {
  bildeOgTekstPanelType,
  forsideNavigasjonsgruppeType,
  forsideNavigasjonskortType,
  forsideType,
} from './globaler/forsideType'

export const schemaTypes = [
  siteSettingsType,
  articleTextContentBlockType,
  articleImageContentBlockType,
  articleInformationContentBlockType,
  sharedContentType,
  articleType,
  pageSectionType,
  sectionPageType,
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
