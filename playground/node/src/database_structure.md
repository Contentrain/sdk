# Database Structure

## tbl_services

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| reference_id | TEXT |  |

## tbl_services_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| description | TEXT |  |
| image | TEXT |  |

## tbl_processes

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

## tbl_processes_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| description | TEXT |  |
| icon | TEXT |  |

## tbl_tabitems

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| category_id | TEXT |  |

## tbl_tabitems_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| link | TEXT |  |
| description | TEXT |  |
| image | TEXT |  |

## tbl_workitems

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| category_id | TEXT |  |

## tbl_workitems_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| image | TEXT |  |
| description | TEXT |  |
| link | TEXT |  |
| field_order | INTEGER |  |

## tbl_workcategories

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

## tbl_workcategories_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| category | TEXT |  |
| field_order | INTEGER |  |

## tbl_faqitems

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

## tbl_faqitems_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| question | TEXT |  |
| answer | TEXT |  |
| field_order | INTEGER |  |

## tbl_sections

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

## tbl_sections_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| description | TEXT |  |
| buttontext | TEXT |  |
| buttonlink | TEXT |  |
| name | TEXT |  |
| subtitle | TEXT |  |

## tbl_sociallinks

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| link | TEXT |  |
| icon | TEXT |  |
| service_id | TEXT |  |

## tbl_field_references

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| logo | TEXT |  |

## tbl_meta_tags

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

## tbl_meta_tags_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| name | TEXT |  |
| content | TEXT |  |
| description | TEXT |  |

## tbl_testimonial_items

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| creative_work_id | TEXT |  |

## tbl_testimonial_items_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| name | TEXT |  |
| description | TEXT |  |
| title | TEXT |  |
| image | TEXT |  |

## tbl_contentrain_relations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| source_model | TEXT |  |
| source_id | TEXT |  |
| target_model | TEXT |  |
| target_id | TEXT |  |
| field_id | TEXT |  |
| type | TEXT |  |

