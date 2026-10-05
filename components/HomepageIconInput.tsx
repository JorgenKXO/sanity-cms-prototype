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
import {useId, type ComponentType, type ReactElement} from 'react'
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

const inputStyles = {
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))',
    gap: '0.5rem',
  },
  option: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    minHeight: '5rem',
    padding: '0.5rem',
    border: '1px solid currentColor',
    borderRadius: '0.25rem',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
  },
  selected: {
    outline: '2px solid currentColor',
    outlineOffset: '1px',
  },
}

export function HomepageIconInput({value, onChange, readOnly}: StringInputProps) {
  const groupId = useId()
  const selectedValue = normalizeHomepageIconValue(value)

  return (
    <fieldset disabled={readOnly} style={{border: 0, margin: 0, padding: 0}}>
      <legend>Velg ikon</legend>
      <div style={inputStyles.options}>
        {homepageIconOptions.map(({title, value: optionValue, Icon}) => (
          <label
            key={optionValue}
            style={{
              ...inputStyles.option,
              ...(value === optionValue ? inputStyles.selected : {}),
              ...(readOnly ? {cursor: 'not-allowed'} : {}),
            }}
          >
            <input
              type="radio"
              name={groupId}
              value={optionValue}
              checked={selectedValue === optionValue}
              onChange={() => onChange(set(optionValue))}
            />
            <Icon size="large" />
            <span>{title}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
