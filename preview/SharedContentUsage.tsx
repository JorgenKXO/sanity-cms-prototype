import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'

type ArticleUsage = {
  _id: string
  title?: string
}

type SharedContentUsageProps = {
  document?: {
    displayed?: {
      _id?: string
    }
  }
}

export function SharedContentUsage({document}: SharedContentUsageProps) {
  const client = useClient({apiVersion: '2026-09-10'})
  const sharedContentId = document?.displayed?._id?.replace(/^drafts\./, '')
  const [articles, setArticles] = useState<ArticleUsage[]>([])
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!sharedContentId) {
      setArticles([])
      setError(undefined)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setArticles([])
    setIsLoading(true)
    setError(undefined)

    client
      .withConfig({perspective: 'drafts'})
      .fetch<ArticleUsage[]>(
        `*[_type == "article" && references($sharedContentId)] | order(title asc) {_id, title}`,
        {sharedContentId},
      )
      .then((results) => {
        if (cancelled) return
        setArticles(results)
        setIsLoading(false)
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return
        setArticles([])
        setError(fetchError instanceof Error ? fetchError.message : 'Ukjent feil')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [client, sharedContentId])

  const count = articles.length
  const countLabel = isLoading || error ? '…' : count === 1 ? '1 artikkel' : `${count} artikler`

  if (!sharedContentId) {
    return (
      <div style={{padding: 'var(--spacing-l)'}}>
        <h2>Brukes på</h2>
        <p role="status">Lagre dokumentet for å se hvor det brukes.</p>
      </div>
    )
  }

  return (
    <div style={{padding: 'var(--spacing-l)'}}>
      <h2>Brukes på {isLoading ? '…' : countLabel}</h2>
      {error ? <p role="alert">Kunne ikke hente brukersteder: {error}</p> : null}
      {!error && !isLoading && count === 0 ? <p>Dette innholdet brukes ikke i noen artikler ennå.</p> : null}
      {!error && isLoading ? <p role="status">Henter artikler …</p> : null}
      {!error && !isLoading && count > 0 ? (
        <ul>
          {articles.map((article) => (
            <li key={article._id}>
              <IntentLink intent="edit" params={{id: article._id, type: 'article'}}>
                {article.title || 'Artikkel uten tittel'}
              </IntentLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
