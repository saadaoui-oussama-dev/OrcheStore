import { AnySlice, Slice, Tail } from "../helpers/types";

/**
 * Provides APIs for selecting slices and registering mutation listeners.
 *
 * Builder selections are immutable. Every selection method returns a new
 * builder selection, allowing traversal to continue independently.
 *
 * ```ts
 * builder.parent.on("refresh", listener);
 * builder.slices.filter({ family: "CRUDSlice" }).children.at("pagination");
 * ```
 *
 * **Selection model**
 *
 * Builder APIs navigate the slice tree in different ways:
 *
 * - `parent` / `parents` → traverse upward through ancestors.
 * - `slice` / `slices` → select slices using absolute paths from the store root.
 * - `child` / `children` → select slices using paths relative to the current selection.
 *
 * Every selection can be refined further and watched for mutations.
 */
export type ListenersBuilder<S> = (WatchableSelection<S> & ChildrenSelector<S>) & {
	/**
	 * Selects the direct parent of the current slice.
	 *
	 * ```ts
	 * builder.parent.on("reset", listener);
	 * ```
	 *
	 * **Notes**
	 *
	 * - If the current slice is already mounted under the store root,
	 *   the store root is selected instead.
	 * - Equivalent to `builder.parents.at(1)`.
	 *
	 * **Traversal**
	 *
	 * Like every builder selection, this API also exposes `children`,
	 * allowing traversal to continue from the selected parent.
	 *
	 * ```ts
	 * builder.parent.children;
	 * builder.parent.children.filter({ family: "CRUDSlice" });
	 * ```
	 */
	readonly parent: WatchableSelection<S> & ChildrenSelector<S>;

	/**
	 * Selects ancestor slices.
	 *
	 * ```ts
	 * builder.parents.on("refresh", listener);
	 * ```
	 *
	 * **Selection methods**
	 *
	 * Additional methods are available to narrow the selection:
	 *
	 * - `at(...levels)` → ancestors at specific levels.
	 * - `find(...)` → the first matching ancestor.
	 * - `filter(...)` → every matching ancestor.
	 *
	 * **Traversal**
	 *
	 * Like every builder selection, this API also exposes `children`,
	 * allowing traversal to continue from any selected ancestor.
	 *
	 * ```ts
	 * builder.parents.children;
	 * builder.parents.at(2).children;
	 * builder.parents.find({ family: "ShopSlice" }).children;
	 * ```
	 */
	readonly parents: (WatchableSelection<S> & ChildrenSelector<S>) & {
		/**
		 * Selects the ancestors at the specified levels.
		 *
		 * ```ts
		 * builder.parents.at(2).on("refresh", listener);
		 * builder.parents.at(1, 3).on("refresh", listener);
		 * ```
		 *
		 * **Notes**
		 *
		 * - If a requested level exceeds the tree depth, the store root is selected.
		 * - `builder.parents.at(1)` is equivalent to `builder.parent`.
		 * - Non-numeric values, floats, negative numbers, `0`, `NaN`, and `Infinity` are ignored.
		 *
		 * **Recommended**
		 *
		 * Prefer using `builder.slices` or `builder.slice(...)` when the store root
		 * is the intended starting point, rather than using an arbitrarily large level.
		 */
		readonly at: (...levels: number[]) => WatchableSelection<S> & ChildrenSelector<S>;

		/**
		 * Searches the ancestor chain until the first matching slice is found.
		 *
		 * ```ts
		 * builder.parents.find({ family: "CRUDSlice" }).on("refresh", listener);
		 * builder.parents.find(shopSlice).on("refresh", listener);
		 * builder.parents.find((slice, key) => key === "shop").on("refresh", listener);
		 * ```
		 *
		 * **Matcher**
		 *
		 * The matcher may be:
		 *
		 * - a partial metadata object matching the runtime `name`, `family`, or both
		 * - a slice instance, which matches by slice runtime `name` and `family`
		 *   and avoids collisions between slices sharing the same runtime name
		 * - a callback for custom matching logic
		 */
		readonly find: SelectionMatcher<ChildrenSelector<S>>;

		/**
		 * Searches the entire ancestor chain and selects every matching slice.
		 *
		 * ```ts
		 * builder.parents.filter({ family: "CRUDSlice" }).on("refresh", listener);
		 * builder.parents.filter(shopSlice).on("refresh", listener);
		 * builder.parents.filter((slice) => slice.family.name.includes("Weak"));
		 * ```
		 *
		 * **Matcher**
		 *
		 * The matcher may be:
		 *
		 * - unlike `.find()`, traversal continues until the store root.
		 * - a partial metadata object matching the runtime `name`, `family`, or both
		 * - a slice instance, which matches by slice runtime `name` and `family`
		 *   and avoids collisions between slices sharing the same runtime name
		 * - a callback for custom matching logic
		 */
		readonly filter: SelectionMatcher<ChildrenSelector<S>>;
	};

	/**
	 * Selects slices at the specified absolute paths.
	 *
	 * ```ts
	 * builder.slice("shop.products").on("refresh", listener);
	 * builder.slice("shop", "auth").children;
	 * ```
	 *
	 * **Notes**
	 *
	 * - Paths are absolute and resolved from the store root.
	 * - Supports deep paths for every provided path.
	 * - Path segments are separated by `.` (for example, `shop.products.filters`).
	 * - Invalid or missing paths are ignored.
	 *
	 * **Equivalent to**
	 *
	 * ```ts
	 * builder.slices.at(...)
	 * ```
	 *
	 * The singular and plural forms are interchangeable. Both APIs support
	 * selecting one or more slices.
	 *
	 * **Traversal**
	 *
	 * Like every builder selection, this API also exposes `children`,
	 * allowing traversal to continue from any selected slice.
	 *
	 * ```ts
	 * builder.slice("shop").children;
	 * builder.slice("shop", "stock").children.filter({ family: "CRUDSlice" });
	 * ```
	 */
	readonly slice: (...absolutePaths: string[]) => WatchableSelection<S> & ChildrenSelector<S>;

	/**
	 * Selects slices from the store root.
	 *
	 * ```ts
	 * builder.slices.on("refresh", listener);
	 * ```
	 *
	 * Unlike `builder.parent` and `builder.parents`, which traverse upward from
	 * the current slice, `builder.slices` always starts from the store root.
	 *
	 * **Selection methods**
	 *
	 * Additional methods are available to narrow the selection:
	 *
	 * - `at(...paths)` → slices at specific absolute paths.
	 * - `filter(...)` → filters the root slices.
	 * - `deepFilter(...)` → recursively filters the root slices and their descendants.
	 *
	 * **Traversal**
	 *
	 * Like every builder selection, this API also exposes `children`,
	 * allowing traversal to continue from any selected slice.
	 *
	 * ```ts
	 * builder.slices.children;
	 * builder.slices.at("shop").children;
	 * builder.slices.filter({ family: "CRUDSlice" }).children;
	 * ```
	 */
	readonly slices: (WatchableSelection<S> & ChildrenSelector<S>) & {
		/**
		 * Selects the slices at the specified absolute paths.
		 *
		 * ```ts
		 * builder.slices.at("shop.products").on("refresh", listener);
		 * builder.slices.at("shop", "auth").on("refresh", listener);
		 * ```
		 *
		 * **Notes**
		 *
		 * - Paths are absolute and resolved from the store root.
		 * - Supports deep paths for every provided path.
		 * - Path segments are separated by `.` (for example, `shop.products.filters`).
		 * - Invalid or missing paths are ignored.
		 * - Equivalent to `builder.slice(...paths)`.
		 */
		readonly at: (...absolutePaths: string[]) => WatchableSelection<S> & ChildrenSelector<S>;

		/**
		 * Filters the currently selected root slices.
		 *
		 * ```ts
		 * builder.slices.filter({ family: "CRUDSlice" }).on("refresh", listener);
		 * builder.slices.filter(shopSlice).on("refresh", listener);
		 * builder.slices.filter((slice) => slice.family.name.includes("Weak"));
		 * ```
		 *
		 * **Matcher**
		 *
		 * The matcher may be:
		 *
		 * - a partial metadata object matching the runtime `name`, `family`, or both
		 * - a slice instance, which matches by slice runtime `name` and `family`
		 *   and avoids collisions between slices sharing the same runtime name
		 * - a callback for custom matching logic
		 *
		 * **Notes**
		 *
		 * - Does not support deep search.
		 * - For deep search, use `builder.slices.deepFilter()`.
		 */
		readonly filter: SelectionMatcher<ChildrenSelector<S>>;

		/**
		 * Recursively searches the selected root slices and all of their descendants.
		 *
		 * ```ts
		 * builder.slices.deepFilter({ family: "CRUDSlice" }).on("refresh", listener);
		 * builder.slices.deepFilter(shopSlice).on("refresh", listener);
		 * builder.slices.deepFilter((slice) => slice.family.name.includes("Weak"));
		 * ```
		 *
		 * **Matcher**
		 *
		 * The matcher may be:
		 *
		 * - a partial metadata object matching the runtime `name`, `family`, or both
		 * - a slice instance, which matches by slice runtime `name` and `family`
		 *   and avoids collisions between slices sharing the same runtime name
		 * - a callback for custom matching logic
		 *
		 * **Notes**
		 *
		 * - Includes the currently selected root slices in the search.
		 * - Use `builder.slices.children.deepFilter()` to exclude the root slices.
		 */
		readonly deepFilter: SelectionMatcher<ChildrenSelector<S>>;
	};
};

type ChildrenSelector<S> = {
	/**
	 * Selects child slices at the specified relative paths.
	 *
	 * ```ts
	 * builder.child("products").on("refresh", listener);
	 * builder.slice("shop").child("products", "pagination");
	 * ```
	 *
	 * Unlike `builder.slices`, which always starts from the store root,
	 * `[selection].children` always starts from the current selection.
	 *
	 * **Notes**
	 *
	 * - Paths are relative to each currently selected slice.
	 * - Supports deep paths for every provided path.
	 * - Path segments are separated by `.` (for example, `products.pagination.filters`).
	 * - Invalid or missing paths are ignored.
	 *
	 * **Continuation**
	 *
	 * This selector always starts from the children of the current selection,
	 * whether it originated from `builder`, `parent`, `parents`, `slice`, or `slices`.
	 *
	 * ```ts
	 * builder.child; // or .children
	 * builder.parent.child; // or .children
	 * builder.parents.child; // or .children
	 * builder.slice("shop").child; // or .children
	 * builder.slices.child; // or .children
	 * ```
	 *
	 * **Equivalent to**
	 *
	 * ```ts
	 * builder.children.at(...)
	 * ```
	 *
	 * The singular and plural forms are interchangeable. Both APIs support
	 * selecting one or more child slices.
	 */
	readonly child: (...relativePaths: string[]) => WatchableSelection<S>;

	/**
	 * Selects the direct children of the current selection.
	 *
	 * ```ts
	 * builder.children.on("refresh", listener);
	 * builder.slice("shop").children.on("refresh", listener);
	 * builder.slices.filter({ family: "CRUDSlice" }).child("pagination");
	 * ```
	 *
	 * Unlike `builder.slices`, which always starts from the store root,
	 * `[selection].children` always starts from the current selection.
	 *
	 * **Selection methods**
	 *
	 * Additional methods are available to narrow the selection:
	 *
	 * - `at(...paths)` → child slices at specific relative paths.
	 * - `filter(...)` → filters the selected children.
	 * - `deepFilter(...)` → recursively filters the selected children and their descendants.
	 *
	 * **Continuation**
	 *
	 * This selector always starts from the children of the current selection,
	 * whether it originated from `builder`, `parent`, `parents`, `slice`, or `slices`.
	 *
	 * ```ts
	 * builder.children; // or .child
	 * builder.parent.children; // or .child
	 * builder.parents.children; // or .child
	 * builder.slice("shop").children; // or .child
	 * builder.slices.children; // or .child
	 * ```
	 */
	readonly children: WatchableSelection<S> & {
		/**
		 * Selects child slices at the specified relative paths.
		 *
		 * ```ts
		 * builder.children.at("products.pagination", "filters").on("refresh", listener);
		 * builder.parents.at(2).children.at("products").on("refresh", listener);
		 * builder.slices.filter({ family: "CRUDSlice" }).children.at("pagination");
		 * ```
		 *
		 * **Notes**
		 *
		 * - Paths are relative to each currently selected slice.
		 * - Supports deep paths for every provided path.
		 * - Path segments are separated by `.` (for example, `products.pagination.filters`).
		 * - Invalid or missing paths are ignored.
		 * - Equivalent to `builder.child(...paths)`.
		 */
		readonly at: (...relativePaths: string[]) => WatchableSelection<S>;

		/**
		 * Filters the currently selected child slices.
		 *
		 * ```ts
		 * builder.children.filter({ family: "CRUDSlice" }).on("refresh", listener);
		 * builder.children.filter(shopSlice).on("refresh", listener);
		 * builder.children.filter((slice) => slice.family.name.includes("Weak"));
		 * ```
		 *
		 * **Matcher**
		 *
		 * The matcher may be:
		 *
		 * - a partial metadata object matching the runtime `name`, `family`, or both
		 * - a slice instance, which matches by slice runtime `name` and `family`
		 *   and avoids collisions between slices sharing the same runtime name
		 * - a callback for custom matching logic
		 *
		 * **Notes**
		 *
		 * - Does not support deep search.
		 * - For deep search, use `builder.children.deepFilter()`.
		 */
		readonly filter: SelectionMatcher<S>;

		/**
		 * Recursively searches the selected child slices and all of their descendants.
		 *
		 * ```ts
		 * builder.children.deepFilter({ family: "CRUDSlice" }).on("refresh", listener);
		 * builder.children.deepFilter(shopSlice).on("refresh", listener);
		 * builder.children.deepFilter((slice) => slice.family.name.includes("Weak"));
		 * ```
		 *
		 * **Matcher**
		 *
		 * The matcher may be:
		 *
		 * - a partial metadata object matching the runtime `name`, `family`, or both
		 * - a slice instance, which matches by slice runtime `name` and `family`
		 *   and avoids collisions between slices sharing the same runtime name
		 * - a callback for custom matching logic
		 */
		readonly deepFilter: SelectionMatcher<S>;
	};
};

/**
 * Narrows the current selection using a matcher.
 *
 * The returned selection preserves the same traversal capabilities as
 * the API it was called from.
 */
type SelectionMatcher<S, Selector = {}> = {
	/**
	 * Matches slices by runtime metadata.
	 *
	 * The metadata may contain `name`, `family`, or both.
	 */
	(metadata: { name?: string; family?: string }): WatchableSelection<S, any> & Selector;

	/**
	 * Matches a specific slice instance.
	 *
	 * Matching is performed by slice runtime `name` and `family`,
	 * avoiding collisions between slices sharing the same runtime name.
	 */
	<T extends AnySlice>(slice: T): WatchableSelection<S, T> & Selector;

	/**
	 * Matches slices using custom logic.
	 *
	 * Return `true` to include the slice in the selection.
	 */
	<T extends AnySlice>(callback: (slice: T, key: string) => boolean): WatchableSelection<S, T> & Selector;
};

/**
 * Registers a listener for a mutation on the selected slices.
 */
type WatchableSelection<S, T = any> = {
	/**
	 * Registers a listener that is invoked whenever the specified mutation
	 * is emitted by any slice in the current selection.
	 *
	 * ```ts
	 * builder.parent.on("refresh", listener);
	 * builder.slices.filter({ family: "CRUDSlice" }).on("reset", listener);
	 * ```
	 *
	 * @param mutation The mutation name to listen for.
	 * @param callback Invoked for every matching mutation.
	 */
	readonly on: <K extends keyof SliceReducers<T> | string>(
		mutation: K,
		callback: (
			state: S,
			slice: T,
			...args: K extends keyof SliceReducers<T> ? Tail<Parameters<SliceReducers<T>[K]>> : any[]
		) => void,
	) => void;
};

type SliceReducers<T> = T extends Slice<any, infer R, any, any> ? R : never;
