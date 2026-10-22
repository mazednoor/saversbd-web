import Link from "next/link";
import type { ResolvedDepartment, ResolvedGroup } from "@/lib/taxonomy";

export interface BrandOption {
  slug: string;
  name: string;
  count: number;
}

export interface ShopFilters {
  department: string;
  group: string;
  brand: string;
  min: string;
  max: string;
  instock: boolean;
  onSale: boolean;
  query: string;
  orderby: string;
}

interface FilterPanelProps {
  filters: ShopFilters;
  departments: ResolvedDepartment[];
  groups: { department: ResolvedDepartment; group: ResolvedGroup }[];
  brands: BrandOption[];
  activeCount: number;
}

/**
 * Server-rendered filter form. It is a plain GET form, so filtering works
 * without JavaScript and every filtered view has a shareable URL.
 */
export function FilterPanel({ filters, departments, groups, brands, activeCount }: FilterPanelProps) {
  return (
    <form action="/shop" method="get" className="space-y-6">
      {/* Keep the search term and sort order when filters are applied */}
      {filters.query ? <input type="hidden" name="q" value={filters.query} /> : null}
      {filters.orderby ? <input type="hidden" name="orderby" value={filters.orderby} /> : null}
      {filters.department ? <input type="hidden" name="department" value={filters.department} /> : null}
      {filters.onSale ? <input type="hidden" name="on_sale" value="1" /> : null}

      {/* Department */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink">Department</legend>
        <div className="space-y-1">
          {departments.map((department) => (
            <label
              key={department.key}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-haze"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="department"
                  value={department.key}
                  defaultChecked={filters.department === department.key}
                  className="size-4 accent-[#2060a0]"
                />
                {department.name}
              </span>
              <span className="text-xs text-muted/70">{department.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Sub-category */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink">Sub-category</legend>
        <select
          name="group"
          defaultValue={filters.group}
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option value="">All sub-categories</option>
          {departments.map((department) => {
            const departmentGroups = groups.filter(
              (entry) => entry.department.key === department.key,
            );
            if (!departmentGroups.length) return null;
            return (
              <optgroup key={department.key} label={department.name}>
                {departmentGroups.map(({ group }) => (
                  <option key={`${department.key}-${group.slug}`} value={group.slug}>
                    {group.name} ({group.count})
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </fieldset>

      {/* Brand */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink">Brand</legend>
        <select
          name="brand"
          defaultValue={filters.brand}
          className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.slug} value={brand.slug}>
              {brand.name} ({brand.count})
            </option>
          ))}
        </select>
      </fieldset>

      {/* Price */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink">Price (৳)</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="min"
            min={0}
            step={50}
            inputMode="numeric"
            defaultValue={filters.min}
            placeholder="Min"
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            name="max"
            min={0}
            step={50}
            inputMode="numeric"
            defaultValue={filters.max}
            placeholder="Max"
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Availability */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-ink">Availability</legend>
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-haze">
            <input
              type="checkbox"
              name="instock"
              value="1"
              defaultChecked={filters.instock}
              className="size-4 accent-[#2060a0]"
            />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-haze">
            <input
              type="checkbox"
              name="on_sale"
              value="1"
              defaultChecked={filters.onSale}
              className="size-4 accent-[#2060a0]"
            />
            On sale
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-ink h-10 flex-1">
          Apply filters
        </button>
        {activeCount > 0 ? (
          <Link href="/shop" className="btn btn-outline h-10">
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
