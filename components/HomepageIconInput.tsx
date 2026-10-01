import {
  BriefcaseIcon,
  BriefcaseSVGpath,
  CalculatorIcon,
  CalculatorSVGpath,
  CompanyIcon,
  CompanySVGpath,
  EarthIcon,
  EarthSVGpath,
  FolkeregisterIcon,
  FolkeregisterSVGpath,
  KronerIcon,
  KronerSVGpath,
  PercentIcon,
  PercentSVGpath,
  PersonIcon,
  PersonSVGpath,
  type IconPropsWithoutSvgPath,
} from '@skatteetaten/ds-icons'
import {useId, type ComponentType, type ReactElement} from 'react'
import {set, type StringInputProps} from 'sanity'

export const homepageIconOptions = [
  {title: 'Skatt', value: 'tax', Icon: CalculatorIcon, svgPath: CalculatorSVGpath},
  {title: 'Avgifter', value: 'duties', Icon: PercentIcon, svgPath: PercentSVGpath},
  {
    title: 'Folkeregister',
    value: 'population-register',
    Icon: FolkeregisterIcon,
    svgPath: FolkeregisterSVGpath,
  },
  {title: 'Utland', value: 'foreign', Icon: EarthIcon, svgPath: EarthSVGpath},
  {title: 'Betaling', value: 'payment', Icon: KronerIcon, svgPath: KronerSVGpath},
  {title: 'Bedrift', value: 'company', Icon: CompanyIcon, svgPath: CompanySVGpath},
  {title: 'Arbeid', value: 'work', Icon: BriefcaseIcon, svgPath: BriefcaseSVGpath},
  {title: 'Person', value: 'person', Icon: PersonIcon, svgPath: PersonSVGpath},
] satisfies {
  title: string
  value: string
  Icon: ComponentType<IconPropsWithoutSvgPath>
  svgPath: ReactElement
}[]

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
              checked={value === optionValue}
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
