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
| `size`   | int     | 1–100, default 20; `page × size` ≤ 10 000 (result window — narrow the filter instead of paging deeper)                                                               |
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

`200 OK` — the paged envelope:

```json
{ "data": [ … ], "page": 1, "size": 20, "totalRecords": 145, "totalPages": 8 }
```

A page past the end returns `data: []` with the real totals (no error).

**Errors** follow the platform error contract (PLATFORM_DOTNET handbook 02, [ADR 0009](adr/0009-error-codes-contract.md)): RFC 9457 problem details with a stable `code`, `args`, a server-localized `title` and, for validation, `errors[]` with the JSON path of each problem.

```json
{
  "type": "urn:platform:problem:COMMON.VALIDATION_FAILED",
  "title": "La requête contient des erreurs.",
  "status": 400,
  "code": "COMMON.VALIDATION_FAILED",
  "args": {},
  "traceId": "00-…",
  "correlationId": "a28f…",
  "errors": [
    {
      "path": "size",
      "code": "QUERY.SIZE_OUT_OF_RANGE",
      "args": { "min": 1, "max": 100 },
      "message": "La taille de page doit être comprise entre 1 et 100."
    },
    {
      "path": "filter.conditions[0].op",
      "code": "QUERY.OPERATOR_NOT_ALLOWED",
      "args": { "op": "contains", "field": "createdAt", "type": "datetime" },
      "message": "…"
    }
  ]
}
```

| Status | Code                                                  | When                                                                |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------- |
| 400    | `COMMON.VALIDATION_FAILED` + `QUERY.*` in `errors[]`  | Any rule of §2–§3 broken (all problems reported at once)            |
| 400    | `QUERY.BODY_REQUIRED`                                 | No body                                                             |
| 400    | `COMMON.VALIDATION_FAILED` + `COMMON.MALFORMED_VALUE` | Unknown member (`"filters"`) or a value of the wrong JSON type      |
| 413    | `COMMON.PAYLOAD_TOO_LARGE` (`args.maxBytes`)          | Body over the `Query` profile limit (32 KB)                         |
| 429    | `COMMON.RATE_LIMITED` + `Retry-After` header          | Query budget of the user exhausted                                  |
| 504    | `COMMON.TIMEOUT`                                      | Query over the profile timeout (15 s); the SQL command is cancelled |

The `QUERY.*` codes and their arguments are listed in `PLATFORM_DOTNET/src/Platform.Querying/Errors/QueryErrors.cs`.

## 5. Schema

`GET /api/secu/users/query/schema`:

```json
{
  "fields": [
    {
      "name": "email",
      "type": "text",
      "filterable": true,
      "sortable": true,
      "searchable": true,
      "nullable": true,
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
      ],
      "options": null
    },
    {
      "name": "status",
      "type": "enum",
      "filterable": true,
      "sortable": true,
      "searchable": false,
      "nullable": false,
      "operators": ["eq", "neq", "in", "notIn"],
      "options": ["Active", "Locked", "Disabled"]
    }
  ],
  "defaultSort": [{ "field": "createdAt", "dir": "desc" }],
  "limits": {
    "maxPageSize": 100,
    "maxResultWindow": 10000,
    "maxSort": 3,
    "maxConditions": 25,
    "maxDepth": 3,
    "maxInValues": 100,
    "maxSearchLength": 200,
    "maxTextValueLength": 500
  }
}
```

Fields are listed by name. `isNull` / `isNotNull` are offered only on `nullable` fields. The UI uses `limits` to disable controls (no page past `maxResultWindow / size`, no fourth sort key…) instead of waiting for a 400.

## 6. Server design

Every API uses the shared engine **`Platform.Querying`** (PLATFORM_DOTNET handbook 08); an API only declares definitions and scopes data:

```
Application/<Domain>/Queries/<Resource>QueryDefinition.cs   declared fields (never secrets), default sort, text matching
Application/<Domain>/Queries/Query<Resource>Query.cs        scope (tenant, permissions) → IQueryEngine.ExecuteAsync → ProjectTo<Dto>
Api/Controllers                                              POST {resource}/query + GET {resource}/query/schema, [Protection(ProtectionProfiles.Query)]
```

Rules: definitions are immutable singletons; scoping runs **before** the user's filter (users can only narrow, never widen, what they may see); values always travel as SQL parameters; the same query works on PostgreSQL, SQL Server and Oracle (platform ADR 0004).

## 7. UI design

| Layer              | Owns                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@s/ui` `query/`   | `SQuery`, `SFilterGroup`, `SFilterCondition`, `SFilterType`, `SFilterOperator`, pure functions (`operatorsFor`, `setColumnFilter`, `removeCondition`, `toggleSort`…) with unit tests |
| `@s/ui` components | `SDataTable` header filter buttons, `SColumnFilter` (type-aware editor in an `SPopover`), `SFilterChips`, `SSelect`, `SCalendar`, `SDatePicker`                                      |
| app `data-access`  | `toQueryRequestDto(query)` mapper (UI model → wire), `*-api.ts` `query(dto)`, schema fetch                                                                                           |
| app store          | holds `SQuery` in a signal; any change → one `switchMap` request; resets to page 1 when filter/search/sort change                                                                    |
