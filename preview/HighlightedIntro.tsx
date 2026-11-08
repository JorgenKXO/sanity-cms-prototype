import type {CSSProperties, ReactNode} from 'react'

type HighlightedIntroProps = {
  backgroundColor?: string
  imageUrl?: string
  children: ReactNode
}

const heroBackgroundMap: Record<string, string> = {
  blue: 'var(--palette-denim-10)',
  green: 'var(--palette-forest-10)',
  yellow: 'var(--palette-ochre-10)',
  white: 'var(--semantic-page-background)',
}

const styles: Record<string, CSSProperties> = {
  band: {
    width: '100%',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 'var(--spacing-l)',
    alignItems: 'center',
    maxWidth: 'var(--semantic-responsive-wide-content)',
    margin: '0 auto',
    padding: 'var(--spacing-xl) var(--spacing-m)',
  },
  image: {
    display: 'block',
    maxWidth: '220px',
    height: 'auto',
    borderRadius: '4px',
  },
}

export function HighlightedIntro({backgroundColor, imageUrl, children}: HighlightedIntroProps) {
  return (
    <div
      style={{
        ...styles.band,
        background: heroBackgroundMap[backgroundColor || 'white'],
      }}
    >
      <div style={styles.content}>
        <div>{children}</div>
        {imageUrl ? <img src={imageUrl} alt="" style={styles.image} /> : null}
      </div>
    </div>
  )
}
