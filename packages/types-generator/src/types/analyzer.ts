export interface GeneratedTypes {
    baseTypes: string
    queryTypes: string
}

export interface Analyzer {
    analyze: () => Promise<GeneratedTypes>
    close?: () => void
}
