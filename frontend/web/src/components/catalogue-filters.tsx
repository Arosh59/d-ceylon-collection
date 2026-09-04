import type {
  CollectionSummary,
  DestinationSummary,
  NamedReference,
  ProductType,
} from "@dceylon/sdk";
import Link from "next/link";

export interface FilterValues {
  category?: string | undefined;
  collection?: string | undefined;
  destination?: string | undefined;
  productType?: string | undefined;
  query?: string | undefined;
  sort?: string | undefined;
  tag?: string | undefined;
  minimumPrice?: number | undefined;
  maximumPrice?: number | undefined;
  maximumDurationMinutes?: number | undefined;
}

interface CatalogueFiltersProps {
  categories: NamedReference[];
  collections: CollectionSummary[];
  destinations: DestinationSummary[];
  productTypes: ProductType[];
  tags: NamedReference[];
  values: FilterValues;
}

export function CatalogueFilters({
  categories,
  collections,
  destinations,
  productTypes,
  tags,
  values,
}: CatalogueFiltersProps) {
  return (
    <form
      aria-label="Filter catalogue"
      className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-soft"
      method="get"
    >
      <details className="catalogue-filters__panel" open>
        <summary className="catalogue-filters__summary">
          <span>Refine your search</span>
          <span aria-hidden="true">⌄</span>
        </summary>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <label className="filter-field md:col-span-2 lg:col-span-1">
          <span>Search the collection</span>
          <div className="relative">
            <input
              aria-label="Search"
              className="pr-12"
              defaultValue={values.query}
              maxLength={100}
              minLength={2}
              name="query"
              placeholder="Railways, wellness, coast…"
              type="search"
            />
            <button
              aria-label="Search"
              className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-navy text-white transition hover:bg-navy/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              type="submit"
            >
              <svg aria-hidden="true" fill="none" height="17" viewBox="0 0 24 24" width="17">
                <path d="m20 20-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </label>
        <FilterSelect
          label="Product type"
          name="productType"
          options={productTypes}
          value={values.productType}
        />
        <FilterSelect
          label="Collection"
          name="collection"
          options={collections}
          value={values.collection}
        />
        <FilterSelect
          label="Destination"
          name="destination"
          options={destinations}
          value={values.destination}
        />
        <FilterSelect
          label="Category"
          name="category"
          options={categories}
          value={values.category}
        />
        <FilterSelect label="Tag" name="tag" options={tags} value={values.tag} />
        <label className="filter-field">
          <span>Price from</span>
          <input
            defaultValue={values.minimumPrice}
            min="0"
            name="minimumPrice"
            placeholder="Any price"
            step="0.01"
            type="number"
          />
        </label>
        <label className="filter-field">
          <span>Price to</span>
          <input
            defaultValue={values.maximumPrice}
            min="0"
            name="maximumPrice"
            placeholder="Any price"
            step="0.01"
            type="number"
          />
        </label>
        <label className="filter-field">
          <span>Maximum duration</span>
          <select defaultValue={values.maximumDurationMinutes ?? ""} name="maximumDurationMinutes">
            <option value="">Any duration</option>
            <option value="180">Up to 3 hours</option>
            <option value="360">Up to 6 hours</option>
            <option value="720">Up to 12 hours</option>
            <option value="1440">Up to 1 day</option>
          </select>
        </label>
        <label className="filter-field">
          <span>Sort by</span>
          <select defaultValue={values.sort ?? "name"} name="sort">
            <option value="name">Name</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="duration-asc">Shortest duration</option>
          </select>
        </label>
        </div>
      </details>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="button-primary" type="submit">
          Apply filters
        </button>
        <Link className="button-secondary" href="/catalogue">
          Clear filters
        </Link>
      </div>
    </form>
  );
}

interface FilterOption {
  name: string;
  slug: string;
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: FilterOption[];
  value?: string | undefined;
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select defaultValue={value ?? ""} name={name}>
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
