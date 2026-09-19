'use client'
import { createContext, useContext } from 'react'
import { DEFAULT_LANG, type Lang } from './index'

/**
 * Lang context for client components (product card, purchase box…).
 * Server components read the cookie via getLang() and pass `lang` down as a prop.
 */
export const LangContext = createContext<Lang>(DEFAULT_LANG)
export const useLang = (): Lang => useContext(LangContext)
