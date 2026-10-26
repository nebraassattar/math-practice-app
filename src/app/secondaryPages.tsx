import { lazy } from 'react'

export const StatisticsPage = lazy(() =>
  import('../pages/StatisticsPage').then((module) => ({
    default: module.StatisticsPage,
  })),
)
export const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
