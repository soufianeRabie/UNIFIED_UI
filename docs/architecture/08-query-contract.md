# 08 — Query contract (server-side paging, sorting, searching, filtering)

Canonical specification of [ADR 0007](adr/0007-server-side-query-contract.md). Every list endpoint of every API implements exactly this; every table in every UI speaks exactly this.

## 1. Endpoints

| Method | Path                           | Purpose                                              |
| ------ | ------------------------------ | ---------------------------------------------------- |
| `POST` | `/api/<resource>/query`        | Return one page of `<resource>` matching the request |
| `GET`  | `/api/<resource>/query/schema` | Describe the queryable fields of `<resource>`        |

Example: `POST /api/secu/users/query`, `GET /api/secu/users/query/schema`.

## 2. Request

```json
{
  "page": 1,
  "size": 20,
  "search": "benali",
  "sort": [
    { "field": "createdAt", "dir": "desc" },
    { "field": "username", "dir": "asc" }
  ],
  "filter": {
    "logic": "and",
    "conditions": [
      { "field": "isActive", "op": "eq", "value": true },
      {
        "field": "createdAt",
        "op": "between",
        "value": ["2026-01-01T00:00:00Z", "2026-07-01T00:00:00Z"]
      },
      {
        "logic": "or",
        "conditions": [
          { "field": "email", "op": "endsWith", "value": "@example.com" },
          { "field": "email", "op": "isNull" }
        ]
      }
    ]
  }
}
```

| Property | Type    | Rules                                                                                                                                                                |
| -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`   | int     | ≥ 1, default 1                                                                                                                                                       |
| `size`   | int     | 1–100, default 20                                                                                                                                                    |
| `search` | string? | Trimmed; matches any `searchable` field (case-insensitive _contains_); ignored when empty                                                                            |
| `sort`   | array   | 0–3 items; `field` must be `sortable`; `dir` = `asc` \| `desc`. Empty → the definition's default sort. The key field is always appended last.                        |
| `filter` | group?  | A **group** is `{ logic: "and" \| "or", conditions: [...] }`; a **condition** is `{ field, op, value? }`. Groups nest up to depth 3; at most 25 conditions in total. |

## 3. Field types and operators

| Type       | Wire value                           | Operators                                                                                              |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `text`     | string                               | `eq`, `neq`, `contains`, `notContains`, `startsWith`, `endsWith`, `in`, `notIn`, `isNull`, `isNotNull` |
| `number`   | number                               | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`, `in`, `notIn`, `isNull`, `isNotNull`                 |
| `date`     | `"YYYY-MM-DD"`                       | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`, `isNull`, `isNotNull`                                |
| `datetime` | ISO 8601 instant with offset         | `gt`, `gte`, `lt`, `lte`, `between`, `isNull`, `isNotNull`                                             |
| `boolean`  | `true` \| `false`                    | `eq`, `isNull`, `isNotNull`                                                                            |
| `enum`     | string (one of the schema `options`) | `eq`, `neq`, `in`, `notIn`, `isNull`, `isNotNull`                                                      |
| `guid`     | string                               | `eq`, `neq`, `in`, `notIn`, `isNull`, `isNotNull`                                                      |

Value shapes per operator: `between` → `[from, to]` (inclusive from, **exclusive** to); `in` / `notIn` → array (1–100); `isNull` / `isNotNull` → no `value`; all others → a single value. Text comparisons are case-insensitive.

**Dates and time zones.** The server never guesses a time zone. For `datetime` fields the UI converts what the user picked ("on 14 Oct", "last 7 days") into instants in the user's zone and sends `between [start, end)`. `date` fields (calendar days without time) compare as plain dates.

## 4. Response

`200 OK` — the existing paged envelope:

```json
{ "data": [ … ], "page": 1, "size": 20, "totalRecords": 145, "totalPages": 8 }
```

`400 Bad Request` — validation, with the path of every problem:

```json
{
  "status": 400,
  "title": "Validation failed.",
  "errors": [
    {
      "propertyName": "filter.conditions[1].op",
      "errorMessage": "Operator 'contains' is not allowed for field 'createdAt' (datetime)."
    },
    { "propertyName": "sort[0].field", "errorMessage": "Field 'password' is not sortable." }
  ]
}
```

## 5. Schema

`GET /api/secu/users/query/schema`:

```json
{
  "fields": [
    {
      "name": "username",
      "type": "text",
      "filterable": true,
      "sortable": true,
      "searchable": true,
      "operators": [
        "eq",
        "neq",
        "contains",
        "notContains",
        "startsWith",
        "endsWith",
        "in",
        "notIn",
        "isNull",
        "isNotNull"
      ]
    },
    {
      "name": "status",
      "type": "enum",
      "filterable": true,
      "sortable": true,
      "searchable": false,
      "operators": ["eq", "neq", "in", "notIn"],
      "options": ["Active", "Locked", "Disabled"]
    }
  ],
  "defaultSort": [{ "field": "createdAt", "dir": "desc" }],
  "limits": {
    "maxPageSize": 100,
    "maxSort": 3,
    "maxConditions": 25,
    "maxDepth": 3,
    "maxInValues": 100
  }
}
```

## 6. Server design (each API)

```
Application/Common/Querying/          generic engine — no domain references
  QueryRequest.cs                     wire model (page, size, search, sort, filter tree)
  FieldType.cs / FilterOperator.cs    enums + operator matrix (§3)
  QueryDefinition.cs                  fluent builder: Field("username", u => u.Username).Text().Sortable().Searchable()
  QueryValidator.cs                   FluentValidation: limits, fields, operators, value shapes → paths
  FilterExpressionBuilder.cs          condition tree → Expression<Func<T,bool>> (type conversion, null-safe)
  QueryExecutor.cs                    validate → search → filter → sort (+ key) → page → PagedResponse
  QuerySchema.cs                      definition → schema (§5)
Application/<Domain>/Queries/<Resource>QueryDefinition.cs   one per resource
Api/Controllers                       POST {resource}/query, GET {resource}/query/schema
```

Rules: definitions are static singletons; the executor runs tenant/permission scoping **before** user filters (users can only narrow, never widen, what they may see); no `Dynamic LINQ` strings, only typed expression trees.

## 7. UI design

| Layer              | Owns                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@s/ui` `query/`   | `SQuery`, `SFilterGroup`, `SFilterCondition`, `SFilterType`, `SFilterOperator`, pure functions (`operatorsFor`, `setColumnFilter`, `removeCondition`, `toggleSort`…) with unit tests |
| `@s/ui` components | `SDataTable` header filter buttons, `SColumnFilter` (type-aware editor in an `SPopover`), `SFilterChips`, `SSelect`, `SCalendar`, `SDatePicker`                                      |
| app `data-access`  | `toQueryRequestDto(query)` mapper (UI model → wire), `*-api.ts` `query(dto)`, schema fetch                                                                                           |
| app store          | holds `SQuery` in a signal; any change → one `switchMap` request; resets to page 1 when filter/search/sort change                                                                    |
