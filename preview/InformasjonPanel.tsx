import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import {Link} from '@skatteetaten/ds-buttons'
import {Panel, type PanelColor, type PanelVariant} from '@skatteetaten/ds-content'
import {
  BellIcon,
  CalendarIcon,
  ClockIcon,
  CompletedIcon,
  HelpOutlineIcon,
  type IconProps,
  type IconPropsWithoutSvgPath,
  InfoIcon,
  LockIcon,
} from '@skatteetaten/ds-icons'
import {Heading, List, Paragraph} from '@skatteetaten/ds-typography'
import type {JSX} from 'react'

import {withAlignmentOffset} from './panelUtilities'

const colorMap: Record<string, {color: PanelColor; variant: PanelVariant}> = {
  denim: {color: 'denim', variant: 'filled'},
  forest: {color: 'forest', variant: 'filled'},
  'denim-outline': {color: 'denim', variant: 'outline'},
  'forest-outline': {color: 'forest', variant: 'outline'},
  white: {color: 'graphite', variant: 'outline'},
}

const iconMap: Record<string, (props: IconPropsWithoutSvgPath) => JSX.Element> = {
  info: InfoIcon,
  help: HelpOutlineIcon,
  completed: CompletedIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  bell: BellIcon,
  lock: LockIcon,
}

const bodyComponents: PortableTextComponents = {
  block: {
    normal: ({children}) => <Paragraph hasSpacing>{children}</Paragraph>,
    h3: ({children}) => <Heading as="h3" level={3}>{children}</Heading>,
  },
  marks: {
    link: ({children, value}) => {
      const href =
        typeof value === 'object' && value !== null && 'href' in value && typeof value.href === 'string'
          ? value.href
          : '#'
      return <Link href={href}>{children}</Link>
    },
  },
  list: {
    bullet: ({children}) => <List as="ul" hasSpacing>{children}</List>,
    number: ({children}) => <List as="ol" hasSpacing>{children}</List>,
  },
  listItem: {
    bullet: ({children}) => <List.Element>{children}</List.Element>,
    number: ({children}) => <List.Element>{children}</List.Element>,
  },
}

type InformasjonPanelProps = {
  heading?: string
  color?: string
  icon?: string
  body?: PortableTextBlock[]
}

export function InformasjonPanel({heading, color, icon, body}: InformasjonPanelProps) {
  const appearance = colorMap[color || 'denim'] || colorMap.denim
  const Icon = icon ? iconMap[icon] : undefined

  return (
    <Panel
      title={heading || 'Informasjon'}
      titleAs="h2"
      color={appearance.color}
      variant={appearance.variant}
      padding="m"
      spacing="l"
      renderIcon={Icon ? () => withAlignmentOffset(<Icon />) : undefined}
    >
      {body ? <PortableText value={body} components={bodyComponents} /> : null}
    </Panel>
  )
}
