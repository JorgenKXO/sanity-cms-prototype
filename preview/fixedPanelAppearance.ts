import {ErrorOutlineIcon, WarningOutlineIcon} from '@skatteetaten/ds-icons'
import {type PanelColor, type PanelVariant} from '@skatteetaten/ds-content'
import type {IconPropsWithoutSvgPath} from '@skatteetaten/ds-icons'
import type {JSX} from 'react'

export const fixedPanelAppearance: Record<
  'varsel' | 'krise',
  {color: PanelColor; variant: PanelVariant; icon: (props: IconPropsWithoutSvgPath) => JSX.Element}
> = {
  varsel: {color: 'ochre', variant: 'filled', icon: ErrorOutlineIcon},
  krise: {color: 'burgundy', variant: 'filled', icon: WarningOutlineIcon},
}
