'use client'

import { Component, ComponentAction } from '@/lib/types'

interface ComponentMapProps {
  components: Component[]
  selectedIndex: number
  onSelect: (index: number) => void
  componentHasRecommended: boolean[]
  repoCounts: number[]
  componentActions: (ComponentAction | undefined)[]
}

function ArrowConnector() {
  return (
    <div className="flex items-center flex-none w-8">
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-zinc-300 dark:border-l-zinc-600" />
    </div>
  )
}

const ACTION_BAR: Record<ComponentAction, string> = {
  use: 'bg-emerald-500',
  build: 'bg-amber-500',
}

export default function ComponentMap({ components, selectedIndex, onSelect, componentHasRecommended, repoCounts, componentActions }: ComponentMapProps) {
  return (
    <div className="overflow-x-auto -mx-8 px-8">
      <div className="flex items-stretch min-w-max gap-0">
        {components.map((component, i) => {
          const isSelected = i === selectedIndex
          const hasRecommended = componentHasRecommended[i]
          const action = componentActions[i]

          return (
            <div key={component.name} className="flex items-center">
              <button
                onClick={() => onSelect(i)}
                className={`relative flex flex-col rounded-xl border overflow-hidden w-44 text-left transition-all duration-150 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600 shadow-lg shadow-indigo-900/30'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-sm'
                }`}
              >
                {/* Action colour bar at top */}
                {action && (
                  <div className={`h-1 w-full ${ACTION_BAR[action]} ${isSelected ? 'opacity-70' : ''}`} />
                )}

                <div className="flex flex-col justify-between px-4 pt-3 pb-4 gap-2">
                  {/* Index + recommended dot row */}
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs ${isSelected ? 'text-indigo-200' : 'text-zinc-400 dark:text-zinc-600'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {hasRecommended && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {/* Name */}
                  <span className={`text-sm font-medium leading-snug ${isSelected ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {component.name}
                  </span>

                  {/* Action label + repo count */}
                  <div className="flex items-center justify-between gap-1">
                    {action && (
                      <span className={`text-xs font-medium ${
                        isSelected
                          ? 'text-indigo-200'
                          : action === 'use'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {action === 'use' ? 'USE' : 'BUILD'}
                      </span>
                    )}
                    <span className={`text-xs font-mono ml-auto ${isSelected ? 'text-indigo-200' : 'text-zinc-400 dark:text-zinc-600'}`}>
                      {repoCounts[i]} repo{repoCounts[i] !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>

              {i < components.length - 1 && <ArrowConnector />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
