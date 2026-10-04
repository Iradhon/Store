import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowRight, ChevronDown, Filter, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import './styles/product.css'

interface Product {
  id: string
  name: string
  category: string
  price: number
  image: string
  createdAt: string
}

const products: Product[] = []
const categories = [...new Set(products.map((product) => product.category))]

type ProductSort = 'newest' | 'price-ascending' | 'price-descending'

function isProductSort(value: string): value is ProductSort {
  return value === 'newest' || value === 'price-ascending' || value === 'price-descending'
}

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  icon?: LucideIcon
}

function FilterDropdown({ label, value, options, onChange, icon: Icon }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value)),
  )
  const dropdownId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!isOpen) return

    function handleOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => document.removeEventListener('pointerdown', handleOutsidePointer)
  }, [isOpen])

  function openDropdown(direction: 1 | -1 = 1) {
    const selectedIndex = options.findIndex((option) => option.value === value)
    const initialIndex = selectedIndex < 0 ? 0 : selectedIndex
    setActiveIndex(
      direction === 1
        ? Math.min(initialIndex, options.length - 1)
        : Math.max(initialIndex, 0),
    )
    setIsOpen(true)
  }

  function chooseOption(index: number) {
    const option = options[index]
    if (!option) return

    onChange(option.value)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      if (!isOpen) {
        openDropdown(direction)
        return
      }
      setActiveIndex((index) => (index + direction + options.length) % options.length)
      return
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End' && isOpen) {
      event.preventDefault()
      setActiveIndex(options.length - 1)
    } else if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
      event.preventDefault()
      chooseOption(activeIndex)
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      setIsOpen(false)
    } else if (event.key === 'Tab' && isOpen) {
      setIsOpen(false)
    }
  }

  return (
    <div className="product-filter" ref={containerRef}>
      <button
        ref={triggerRef}
        className="product-filter__trigger"
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${dropdownId}-listbox`}
        aria-activedescendant={isOpen ? `${dropdownId}-option-${activeIndex}` : undefined}
        onClick={() => {
          if (isOpen) setIsOpen(false)
          else openDropdown()
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {Icon && <Icon className="product-filter__icon" size={16} aria-hidden="true" />}
        <span className="product-filter__value">{selectedOption?.label ?? label}</span>
        <ChevronDown className="product-filter__chevron" size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="product-filter__menu"
          id={`${dropdownId}-listbox`}
          role="listbox"
          aria-label={label}
        >
          {options.map((option, index) => (
            <div
              className={`product-filter__option${index === activeIndex ? ' is-active' : ''}`}
              id={`${dropdownId}-option-${index}`}
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => chooseOption(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Products() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<ProductSort>('newest')

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return products
      .filter((product) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          product.name.toLowerCase().includes(normalizedSearch)
        const matchesCategory = category.length === 0 || product.category === category

        return matchesSearch && matchesCategory
      })
      .sort((first, second) => {
        if (sort === 'price-ascending') return first.price - second.price
        if (sort === 'price-descending') return second.price - first.price
        return Date.parse(second.createdAt) - Date.parse(first.createdAt)
      })
  }, [search, category, sort])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <section className="product-directory">
      <div className="product-directory__container">
        <header className="product-directory__header">
          <div>
            <h1 className="product-directory__title">All Products</h1>
            <p className="product-directory__description">
              Explore our curated collection of quality products.
            </p>
          </div>
        </header>

        <div className="product-toolbar">
          <form className="product-search" role="search" onSubmit={handleSearch}>
            <label className="product-search__field">
              <Search className="product-search__icon" size={18} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </label>
            <button className="product-search__submit" type="submit">
              Search
            </button>
          </form>

          <div className="product-filters">
            <FilterDropdown
              label="Filter by category"
              value={category}
              onChange={setCategory}
              icon={Filter}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((productCategory) => ({
                  value: productCategory,
                  label: productCategory,
                })),
              ]}
            />
            <FilterDropdown
              label="Sort products"
              value={sort}
              onChange={(value) => {
                if (isProductSort(value)) setSort(value)
              }}
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'price-ascending', label: 'Price: Low to High' },
                { value: 'price-descending', label: 'Price: High to Low' },
              ]}
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="product-directory__grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <img className="product-card__image" src={product.image} alt={product.name} />
                <p className="product-card__category">{product.category}</p>
                <h2 className="product-card__name">{product.name}</h2>
                <p className="product-card__price">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(product.price)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="product-empty-state" role="status">
            <h2>
              {search || category ? 'No matching products found' : 'No products available yet'}
            </h2>
            <p>
              {search || category
                ? 'Try changing your search or category filter.'
                : 'We’re getting our collection ready. Please check back soon.'}
            </p>
            {(search || category) && (
              <button
                className="product-empty-state__reset"
                type="button"
                onClick={() => {
                  setSearch('')
                  setCategory('')
                }}
              >
                Clear filters
              </button>
            )}
            {!search && !category && (
              <Link className="product-empty-state__link" to="/">
                Return to Home
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}