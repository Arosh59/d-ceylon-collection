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
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <label className="filter-field md:col-span-2 lg:col-span-1">
          <span>Search</span>
          <input
            defaultValue={values.query}
            maxLength={100}
            minLength={2}
            name="query"
            placeholder="Railways, wellness, coast…"
            type="search"
          />
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
          <span>Sort by</span>
          <select defaultValue={values.sort ?? "name"} name="sort">
            <option value="name">Name</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="duration-asc">Shortest duration</option>
          </select>
        </label>
      </div>
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
