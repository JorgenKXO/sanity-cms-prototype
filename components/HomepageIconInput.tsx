import {
  BriefcaseIcon,
  BriefcaseSVGpath,
  CalculatorIcon,
  CalculatorSVGpath,
  CalendarClockIcon,
  CalendarClockSVGpath,
  CompanyIcon,
  CompanySVGpath,
  EarthIcon,
  EarthSVGpath,
  EditIcon,
  EditSVGpath,
  FolkeregisterIcon,
  FolkeregisterSVGpath,
  KronerIcon,
  KronerSVGpath,
  MvaRegistreringerIcon,
  MvaRegistreringerSVGpath,
  NaeringsinntektIcon,
  NaeringsinntektSVGpath,
  PercentIcon,
  PercentSVGpath,
  PercentCompanyIcon,
  PercentCompanySVGpath,
  PersonIcon,
  PersonSVGpath,
  type IconPropsWithoutSvgPath,
} from '@skatteetaten/ds-icons'
import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import type {ComponentType, ReactElement} from 'react'
import {set, type StringInputProps} from 'sanity'

export const homepageIconOptions = [
  {title: 'Kalkulator', value: 'kalkulator', Icon: CalculatorIcon, svgPath: CalculatorSVGpath},
  {title: 'Prosent', value: 'prosent', Icon: PercentIcon, svgPath: PercentSVGpath},
  {
    title: 'Prosent selskap',
    value: 'prosent-selskap',
    Icon: PercentCompanyIcon,
    svgPath: PercentCompanySVGpath,
  },
  {
    title: 'Folkeregister',
    value: 'folkeregister',
    Icon: FolkeregisterIcon,
    svgPath: FolkeregisterSVGpath,
  },
  {title: 'Jordklode', value: 'jordklode', Icon: EarthIcon, svgPath: EarthSVGpath},
  {title: 'Kroner', value: 'kroner', Icon: KronerIcon, svgPath: KronerSVGpath},
  {
    title: 'Næringsinntekt',
    value: 'naeringsinntekt',
    Icon: NaeringsinntektIcon,
    svgPath: NaeringsinntektSVGpath,
  },
  {title: 'Selskap', value: 'selskap', Icon: CompanyIcon, svgPath: CompanySVGpath},
  {title: 'Stresskoffert', value: 'stresskoffert', Icon: BriefcaseIcon, svgPath: BriefcaseSVGpath},
  {title: 'Person', value: 'person', Icon: PersonIcon, svgPath: PersonSVGpath},
  {title: 'Rediger', value: 'rediger', Icon: EditIcon, svgPath: EditSVGpath},
  {
    title: 'Kalenderklokke',
    value: 'kalenderklokke',
    Icon: CalendarClockIcon,
    svgPath: CalendarClockSVGpath,
  },
  {
    title: 'MVA-registreringer',
    value: 'mva-registreringer',
    Icon: MvaRegistreringerIcon,
    svgPath: MvaRegistreringerSVGpath,
  },
] satisfies {
  title: string
  value: string
  Icon: ComponentType<IconPropsWithoutSvgPath>
  svgPath: ReactElement
}[]

const legacyIconValues: Record<string, string> = {
  tax: 'kalkulator',
  duties: 'prosent',
  'population-register': 'folkeregister',
  foreign: 'jordklode',
  payment: 'kroner',
  company: 'selskap',
  work: 'stresskoffert',
}

export function normalizeHomepageIconValue(value: string | undefined) {
  return value ? legacyIconValues[value] ?? value : value
}

export function HomepageIconInput({id, value, onChange, readOnly}: StringInputProps) {
  const selectedValue = normalizeHomepageIconValue(value)
  const selected = homepageIconOptions.find((option) => option.value === selectedValue)

  return (
    <MenuButton
      id={`${id}-menu`}
      button={
        <Button
          id={id}
          mode="ghost"
          padding={3}
          width="fill"
          justify="flex-start"
          disabled={readOnly}
          aria-label={selected ? `Ikon: ${selected.title}` : 'Velg ikon'}
        >
          <Flex align="center" gap={3}>
            {selected ? <selected.Icon size="medium" /> : null}
            <Box flex={1}>
              <Text muted={!selected}>{selected?.title ?? 'Velg ikon'}</Text>
            </Box>
            <Text>
              <ChevronDownIcon />
            </Text>
          </Flex>
        </Button>
      }
      menu={
        <Menu>
          {homepageIconOptions.map(({title, value: optionValue, Icon}) => (
            <MenuItem
              key={optionValue}
              pressed={selectedValue === optionValue}
              onClick={() => onChange(set(optionValue))}
            >
              <Flex align="center" gap={3}>
                <Icon size="medium" />
                <Text>{title}</Text>
              </Flex>
            </MenuItem>
          ))}
        </Menu>
      }
      popover={{matchReferenceWidth: true, portal: true, placement: 'bottom-start'}}
    />
  )
}
