---
name: Caravan Workshop
description: Off-white and teal service booking workspace
colors:
  brand: "#00857c"
  brand-hover: "#006c64"
  background: "#f8f9f6"
  surface: "#ffffff"
  sidebar: "#f3f5f0"
  ink: "#242c2a"
  muted: "#63716c"
  line: "#e4e8e1"
  input: "#fcfdfa"
  input-border: "#d7dfd7"
  accent: "#eaf2e9"
  accent-foreground: "#166558"
  filter-track: "#f2f4ef"
  secondary-hover: "#eff4ef"
  pending: "#805c10"
  pending-surface: "#fbf1d9"
  confirmed-surface: "#e6f2eb"
  cancelled: "#675c60"
  cancelled-surface: "#f0eded"
  error: "#a12832"
  error-hover: "#7e1c25"
typography:
  headline:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "clamp(30px, 3vw, 42px)"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.4
  body:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "14px"
    lineHeight: 1.6
  label:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 600
rounded:
  field: "10px"
  navigation: "12px"
  sheet: "16px"
  pill: "999px"
spacing:
  field-gap: "8px"
  action-gap: "12px"
  compact: "16px"
  section: "24px"
  panel: "32px"
  form: "36px"
  desktop-gutter: "44px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "11px 22px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "11px 22px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "11px 22px"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
    height: "48px"
  navigation-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.navigation}"
    padding: "13px 16px"
  status-confirmed:
    backgroundColor: "{colors.confirmed-surface}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  status-filter-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
---

# Design System: Caravan Workshop

## Overview

The confirmed direction is a light service desk workspace: an off-white canvas, muted persistent sidebar, teal actions and active navigation, and pale green supporting surfaces. Keep the booking register and forms easy to scan, with generous space around compact operational details. This records the implemented interface; it does not establish a broader product brand.

**Key Characteristics:**

- Quiet tonal surfaces with restrained borders.
- Rounded pill actions and status filters.
- Avenir typography and readable text alongside status colors.
- Desktop sidebar and collapsible mobile navigation.

## Colors

The palette combines muted green neutrals with a clear teal action color. Frontmatter contains the normative values extracted from `web/app/globals.css`.

### Primary

- **Teal (`brand`)** identifies primary actions, links, active navigation and focus. `brand-hover` deepens primary actions on hover.
- **Pale green (`accent`)** groups appointment summaries and highlights interactive options; `accent-foreground` supplies their darker text.

### Neutral

- **Off-white (`background`)** is the full workspace canvas; **white (`surface`)** holds the register, form and record sheets.
- **Muted sidebar (`sidebar`)** separates navigation without strong contrast.
- **Dark ink (`ink`)** carries headings and content; **muted green gray (`muted`)** carries secondary information.
- **Soft border (`line`)** divides regions. Fields use `input` and `input-border` for a slightly tinted interior and clearer boundary.
- **Filter track (`filter-track`)** groups status filters; the selected filter uses white and teal.

Pending, confirmed and cancelled statuses use the matching semantic text/surface pairs in frontmatter. Error and destructive actions use `error`; retain explicit status and error wording alongside color.

## Typography

Use the local stack **Avenir Next, Avenir, Segoe UI, sans-serif** throughout. No downloaded font is required. The character is restrained and legible, with slightly tightened page headings and compact supporting labels.

- **Headline:** responsive page titles, as defined by `headline`.
- **Title:** section headings and form legends, as defined by `title`.
- **Body:** booking content and supporting prose, as defined by `body`.
- **Label:** field labels, as defined by `label`; secondary metadata typically uses (11–12px).

Use tabular numbers for registration, dates, times, pagination and appointment values. Supporting page and form descriptions use a maximum width of approximately (70ch).

## Layout

Desktop navigation is fixed on the left at (240px) wide, with matching content offset. Header and main content use (44px) horizontal gutters. Main content and footer cap at (1540px); forms and detail pages cap at (1040px). The register remains a horizontally scrollable table when its columns exceed available space.

At (900px) and below, the sidebar narrows to (210px), content gutters become (24px), and secondary header context is hidden. At (700px) and below, navigation becomes an in-flow header with an expandable menu, the content offset clears, main gutters become (16px), and form/detail grids become one column. Desktop forms have two equal columns with (24px) gaps; mobile forms use (20px) gaps.

Date and time occupy a flexible date column and (140px) time column with a (10px) gap. Between (701px) and (1100px), they stack. At (400px) and below, the time column narrows to (125px). Both controls stay (48px) high.

## Elevation & Depth

The workspace uses tonal layering and fine borders for its resting sheets. Avoid adding shadows to those sheets. Select menus and calendar popovers retain the shadcn overlay shadow. The destructive confirmation dialog uses the stronger existing shadow (`0 16px 64px #16342633`) and a muted dark backdrop (`#122c2670`).

## Shapes

Pill silhouettes identify actions, filter tracks and status badges. Fields have softly rounded corners (`field`); navigation and notices use `navigation`; register, form and detail sheets use `sheet`. The calendar popover is rounded (12px). Borders are generally (1px). Keep the distinction between pill actions and rectangular field controls.

## Components

### Buttons

Primary page actions use teal, white text and pill corners; secondary actions use white with a soft border and ink text. Destructive actions use red or the existing red outline variant. Actions have a minimum height of (42px), a (9px) icon gap, and (600) font weight. Disabled application actions lower opacity to (0.55).

Primary hover deepens teal; secondary hover adds a pale green tint. The application action transition is background color over (140ms ease-out). Keyboard focus remains visible with the existing teal outline (3px, offset 4px); shadcn controls retain their ring treatment.

### Status and filters

Status badges combine readable labels with a small dot and semantic tint. Filters sit in one pill track; the active filter is white with teal text. Filters can scroll horizontally on small screens. Do not represent status using color alone.

### Sheets and register

White sheets use a fine border and rounded corners. The register has a separate toolbar, lightly tinted column headers, dividing lines and pale row hover. Preserve long-content wrapping and horizontal table scrolling. Forms use (36px) internal padding on desktop and (24px 20px) on mobile.

### Inputs, Select and Calendar

Fields use tinted off-white interiors, clear borders, dark text and an explicit label. Keep the (48px) field height and the error text directly below its field. Invalid fields use the error border.

Use the existing shadcn **Select** backed by Radix for booking selections, and **Button / Popover / Calendar** composition for dates. Calendar uses DayPicker with month/year dropdowns and single selection; choosing a day closes its popover. Keep the existing keyboard, focus and collision behavior. Display dates as day, abbreviated month and year; the adjacent time input presents hours and minutes without seconds. Date/time input and display use Melbourne local time, with existing UTC conversion and server validation preserved.

### Navigation

The muted sidebar contains the brand, primary links, status links and Melbourne timezone footer. Active primary navigation is teal with white text; inactive links are muted, and hover adds a soft green surface. The mobile toggle exposes its expanded state and closes navigation after choosing a link. Preserve the current sidebar content; the removed marketing block is not part of the interface.

### Feedback and loading

Success notices use a pale green tint; errors use a pale red tint. Loading placeholders share the finished page geometry and pulse over (1.5s ease-in-out). Respect reduced motion by disabling animation and transitions.

## Do's and Don'ts

- **Do** reuse the established teal, off-white and pale green roles.
- **Do** retain text status labels, visible focus, field errors and keyboard access.
- **Do** keep date, time and selection controls aligned at (48px) high.
- **Do** use the existing shadcn Select and Calendar components.
- **Don't** introduce promotional sidebar content into this task workspace.
- **Don't** add decorative sheet shadows or replace the local font stack without a new design decision.
- **Don't** expose seconds in the booking time controls or change Melbourne time handling as a visual adjustment.
