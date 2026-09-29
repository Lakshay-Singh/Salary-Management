import { type ChangeEvent, type KeyboardEvent, useLayoutEffect, useRef, useState } from 'react'
import { Command, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent } from '@/components/ui/popover'

// cmdk highlights its first item whenever its value is empty, so Enter would swap what was typed for a suggestion
// nobody chose. A value no item has keeps the list unhighlighted until the user moves into it.
const NOTHING_HIGHLIGHTED = 'none'

interface AutocompleteProps {
  id: string
  name: string
  value: string
  onValueChange: (value: string) => void
  suggestions: readonly string[]
  /** Names the list for assistive technology, e.g. "Job title suggestions". */
  listLabel: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * A text field with suggestions, like an <input list>, but styled to match the app in every browser.
 * What is typed is the value. A suggestion replaces it only when clicked, or highlighted with the arrow keys and
 * chosen with Enter. Clicking away or pressing Escape closes the list, keeping what was typed, in the suggestion's
 * spelling if it matches one.
 */
export function Autocomplete({ value, onValueChange, suggestions, listLabel, ...inputProps }: AutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [list, setList] = useState<HTMLDivElement | null>(null)

  const search = value.trim().toLowerCase()
  const matches = suggestions.filter((suggestion) => suggestion.toLowerCase().includes(search))
  const highlightedMatch = highlighted === null ? undefined : matches[highlighted]
  const expanded = open && matches.length > 0

  // The field tells assistive technology which option is highlighted by that option's id. cmdk generates the ids
  // and they only exist once the list is in the page, so the attribute is kept in step here rather than rendered.
  useLayoutEffect(() => {
    const option = highlighted === null ? undefined : list?.querySelectorAll('[role="option"]')[highlighted]
    if (option) {
      inputRef.current?.setAttribute('aria-activedescendant', option.id)
      option.scrollIntoView({ block: 'nearest' })
    } else {
      inputRef.current?.removeAttribute('aria-activedescendant')
    }
  }, [highlighted, list])

  const close = () => {
    setOpen(false)
    setHighlighted(null)
  }
  const choose = (suggestion: string) => {
    onValueChange(suggestion)
    close()
  }
  // Typing a suggestion in another case, or with spaces around it, means that suggestion: take its spelling, so the
  // same value is never stored two ways. Only reported when it changes, so leaving the field untouched is not an edit.
  const finishTyping = () => {
    const typed = value.trim()
    const spelling =
      suggestions.find((suggestion) => suggestion === typed) ??
      suggestions.find((suggestion) => suggestion.toLowerCase() === typed.toLowerCase())
    if (spelling !== undefined && spelling !== value) onValueChange(spelling)
    close()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.value)
    setOpen(true)
    setHighlighted(null)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && matches.length > 0) {
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setOpen(true)
      setHighlighted((current) => {
        const from = current ?? (step === 1 ? -1 : matches.length)
        return (from + step + matches.length) % matches.length
      })
    } else if (event.key === 'Enter' && expanded && highlightedMatch !== undefined) {
      // Choosing a suggestion, not submitting the form
      event.preventDefault()
      choose(highlightedMatch)
    } else if (event.key === 'Enter' || event.key === 'Escape') {
      finishTyping()
    }
  }

  return (
    <Popover open={expanded}>
      <Input
        {...inputProps}
        ref={inputRef}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? list?.id : undefined}
        onChange={handleChange}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        onBlur={finishTyping}
      />
      <PopoverContent
        anchor={inputRef}
        align="start"
        // Focus stays in the field throughout, so typing carries on while the list is open
        initialFocus={false}
        finalFocus={false}
        // The list inside is what assistive technology should meet, not a dialog around it
        role="presentation"
        // Otherwise pressing on a suggestion blurs the field, which closes the list before the click lands
        onMouseDown={(event) => event.preventDefault()}
        className="w-(--anchor-width) gap-0 border p-0 shadow-raised ring-0"
      >
        {/* Rebuilt when the matches change: cmdk would highlight its first item when the highlighted one is filtered out */}
        <Command
          key={matches.join('\n')}
          shouldFilter={false}
          value={highlighted === null ? NOTHING_HIGHLIGHTED : String(highlighted)}
          onValueChange={(hovered) => setHighlighted(Number(hovered))}
        >
          <CommandList ref={setList} label={listLabel}>
            {matches.map((suggestion, index) => (
              <CommandItem
                key={suggestion}
                value={String(index)}
                data-checked={suggestion === value}
                onSelect={() => choose(suggestion)}
              >
                {suggestion}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
