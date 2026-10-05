import type {IconProps} from '@skatteetaten/ds-icons'
import type {ReactElement} from 'react'

const iconAlignmentOffset = '0.3rem'

export function withAlignmentOffset(icon: ReactElement): ReactElement<IconProps> {
  return (
    <span style={{display: 'inline-block', marginTop: iconAlignmentOffset}}>{icon}</span>
  ) as unknown as ReactElement<IconProps>
}
