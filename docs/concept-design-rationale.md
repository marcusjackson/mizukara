# Offline-First Personal Journaling App

## Concept & Design Rationale

---

## 1. Purpose & Motivation

This project is a **personal, self-owned journaling application** designed to be:

- Offline-first
- Private by default
- Fully under the user’s control
- Optimized for long-term personal use rather than public sharing or performance

The motivation comes from two core dissatisfactions with existing journaling tools:

1. **Loss of data ownership** — most apps store journal data on third-party servers, limiting trust, portability, and long-term flexibility.
2. **High friction to actually journal** — many tools subtly encourage polished, infrequent writing rather than frequent, low-effort capture.

This app is conceived as a _tool_, not a service. It is meant to live quietly alongside daily life, capturing thoughts as they arise and helping the user reflect later — without pressure, ceremony, or surveillance.

The technical inspiration comes from a prior project (a self-owned kanji dictionary app), proving that a fully client-side, offline-first application with a real database is not only possible but pleasant to use.

---

## 2. Core Philosophy (Non-Negotiable Constraints)

These are not features; they are **design constraints** that shape every decision.

### 2.1 Self-Ownership & Trust

- All data lives locally in a real, inspectable database
- No accounts, no servers, no background syncing
- Import/export is always possible
- The app should still be useful decades later

The user owns both the data _and_ the meaning of that data.

---

### 2.2 Low Pressure by Design

A central goal of the app is to **avoid creating obligation**.

This applies equally to:

- Reflective journaling
- Event recording
- Memory reconstruction

The app should not encourage:

- Completeness
- Exhaustiveness
- “Capturing everything”
- Anxiety about missed entries

Instead, it should communicate implicitly:

> Partial recall is enough.

Missing things is expected. Gaps are normal. The value comes from what _is_ captured, not what is absent.

---

### 2.3 Journaling as Thinking, Not Performance

- Writing is a process, not a product
- Fragmented thoughts are valid
- Incomplete ideas are expected
- Capturing matters more than polishing

The app should never imply that journaling must be:

- Daily
- Long
- Structured
- Emotionally complete

---

### 2.4 Privacy Enables Honesty

- Offline operation is not just technical — it is psychological
- Knowing that nothing leaves the device enables deeper reflection
- An offline LLM reinforces this safety rather than undermining it

---

### 2.2 Journaling as Thinking, Not Performance

- Writing is a process, not a product
- Fragmented thoughts are valid
- Incomplete ideas are expected
- Capturing matters more than polishing

The app should never imply that journaling must be:

- Daily
- Long
- Structured
- Emotionally complete

---

### 2.3 Privacy Enables Honesty

- Offline operation is not just technical — it is psychological
- Knowing that nothing leaves the device enables deeper reflection
- An offline LLM reinforces this safety rather than undermining it

---

## 3. The Core Concept: Items

### 3.1 Neutral Language

While “journaling” is used as a convenient shorthand, the app intentionally avoids a narrow definition of what that means.

Items may represent:

- Things that happened
- Things remembered later
- Thoughts
- Questions
- Feelings
- Vague notes meant to support future recall

Reflection is optional and often downstream.

---

### 3.2 One Concept, Not Two

There is **no hard distinction** between:

- “Entries”
- “Primers”

Instead, there is only one core object:

> **An item**

Length, depth, and intent are **emergent properties**, not types.

This avoids:

- Deciding upfront what something “is”
- Migrating items later
- Switching mental or UI modes

---

### 3.3 Small by Default, Expandable by Exception

The app assumes that most interaction will be:

- Many small captures
- Often just a sentence, phrase, or note
- Occasionally something longer and more reflective

The system should therefore:

- Optimize input for short content
- Allow long-form writing to emerge naturally
- Never force the user to choose a mode before writing

Longer items are still first-class — but they are _grown_, not declared.

---

### 3.2 Small by Default, Expandable by Exception

The app assumes that most interaction will be:

- Many small captures
- Often just a sentence, phrase, or note
- Occasionally something longer and more reflective

The system should therefore:

- Optimize input for short content
- Allow long-form writing to emerge naturally
- Never force the user to choose a mode before writing

Longer items are still first-class — but they are _grown_, not declared.

---

## 4. Capture & Input Philosophy

### 4.1 Low-Friction Capture

The primary input experience should:

- Be fast
- Be minimal
- Require almost no decision-making
- Assume the user is jotting something small

Examples of typical captures:

- A thought
- A reminder
- A feeling
- A question
- A vague note meant only to jog memory later

---

### 4.2 Long-Form Writing as a Natural Extension

Longer writing happens when:

- The user keeps typing
- The user opts into a focused/expanded view

Not when:

- A separate “entry” flow is chosen
- A special editor mode is required

The same journal item can grow organically from a few words into a full reflection.

---

## 5. Viewing, Reading & Safety

### 5.1 Reading Should Be Safe

A key design goal is to avoid the fragility seen in tools like Notion, where:

- Tapping accidentally enters edit mode
- Content is easily dragged or reordered unintentionally
- Reading feels risky

Instead:

> **Reading and viewing should never mutate data.**

---

### 5.2 Editing Is Explicit and Intentional

- Entering edit mode requires a clear action
- Edit mode is temporary and scoped
- Exiting edit mode returns cleanly to read mode

The goal is balance:

- Editing should be easy
- Editing should never be surprising

---

### 5.3 Chronology, Time, and Intentional Reordering

Chronology **does** matter — but not in the simplistic sense of “order of entry equals order of events.”

This app explicitly acknowledges that:

- Thoughts are often recorded **out of order**
- Items may be written **after the fact** (hours or days later)
- Recall is associative, not chronological
- A single capture session may reference many different moments in time

As a result:

- Each journal item should retain a reliable **creation timestamp** (when it was entered)
- Journal items may also have an **assigned day or time context** representing _when the content is about_, not when it was written

The primary timeline is therefore conceptual, not mechanical.

---

### Intentional Reordering (Without Fragility)

Because recall is non-linear, **intentional reordering is meaningful and allowed**:

- Items within a day may be reordered deliberately
- Items may be reassigned to a different day
- The user can correct or refine the narrative order of events over time

However, this must be done in a way that avoids the common failure modes of tools like Notion:

- No accidental drag-to-reorder during casual reading
- No invisible gesture-based mutations
- No unintended structure changes on mobile

Reordering, when it exists, should be:

- Explicit
- Clearly scoped
- Easy to understand and undo

The goal is to support **reflective reconstruction of time**, not constant structural manipulation.

---

## 6. Display & Browsing Philosophy

### 6.1 Optimized for Many Small Items

The UI assumes:

- Dozens of items per day are normal
- Scanning is more common than deep reading
- Glanceability is critical

Therefore:

- Dense list views are desirable
- Items should be readable without opening them
- Metadata matters for scanning

---

### 6.2 Distinguishing Larger Items (Without Separate Types)

Longer or more reflective items can be:

- Filtered by inferred properties (length, presence of title, etc.)
- Visually distinguished in lists
- Expanded by default when opened

But they remain the same underlying object.

---

## 7. Organization Without Friction

### 7.1 The Problem

Manual organization is important but annoying:

- Tagging
- Titling
- Summarizing

If skipped, retrieval later becomes difficult.

---

### 7.2 The LLM as an Organizer

An offline LLM is intended to assist with:

- Auto-generated titles
- Suggested tags
- Short summaries
- Theme detection
- Linking related recent items

Key constraints:

- Suggestions are optional
- Everything is editable
- Nothing is hidden or forced

The LLM maintains structure so the user doesn’t have to.

---

## 8. Reflection & Questioning

Beyond organization, the LLM can act as a **Socratic partner**:

- Asking follow-up questions
- Surfacing patterns across recent days
- Helping the user dig deeper into vague notes

The LLM does **not**:

- Replace the user’s voice
- Write journal entries on their behalf

It supports thinking; it does not perform it.

---

## 9. Memory & Personal Context

Any longer-term memory used by the LLM should be:

- Explicit
- Inspectable
- Editable

Examples of possible memory domains:

- People
- Ongoing projects
- Recurring themes
- Long-term concerns

There is no hidden profiling. Memory exists because the user chose to store it.

---

## 10. Memory Reconstruction & Assembling a Day

A key use case of the app is **assembling a day after the fact**.

This includes:

- Recalling events non-chronologically
- Entering items hours or days later
- Filling in only what is remembered
- Letting structure emerge gradually

The app supports this without turning it into a task to be completed.

Importantly:

- The app should not push the user to reconstruct an entire day
- There is no expectation of completeness
- Assembly is optional and partial

This framing avoids the trap of obsessive record-keeping while still supporting meaningful recall.

---

## 11. Development Philosophy: Always Usable

This project intentionally avoids traditional MVP framing.

Instead:

> **At every point in development, the app should be usable.**

The initial version may only support:

- Writing
- Viewing

But even that is already valuable.

Features are added incrementally without ever breaking usability.

---

## 12. Summary Vision

In short, this app aims to be:

> A private, offline-first space for capturing partial memories and occasional reflections — optimized for low pressure, recall, and understanding rather than completeness or performance.

Or even more simply:

> A safe place to put some of what you remember, so you can understand your days better over time.

This document represents the current conceptual state of the project and is intended to guide both human and AI-assisted development going forward.
