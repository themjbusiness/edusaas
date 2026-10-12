# Stitch prompts for the EduSaas UI

As of 2 October 2026 (colours updated after the accessibility check; missing screens and interaction details added) · For: Google Stitch (AI UI design) · Feeds: F1, the React rebuild

This pack describes every screen of the EduSaas app so Stitch can design them in one consistent style. The designs then guide F1. The design tokens below are the ones the app uses today, so the designs and the code stay in step.

## How to use it

1. Create one Stitch project called **EduSaas**. Choose **Mobile** first (390 × 844).
2. Paste the **master prompt** (section 1) as the first message. It sets the product, users, brand and components for every later screen.
3. Paste the screen prompts (section 2) one at a time, in the same project, so Stitch reuses the style. Each prompt stands on its own if you need to regenerate one.
4. After the mobile screens, run the **variant prompts** (section 3) for desktop, dark mode, Urdu and tablet.
5. Check every screen against the **review checklist** (section 4) before exporting to Figma or code.

Notes:
- **Textbook pages:** Stitch can't show the real National Book Foundation pages. Prompts ask for a "scanned textbook page placeholder", and the real page goes in during build.
- **People:** every name and phone number is fictional (the demo uses the unissued `+92 399` range).
- **Iterating:** keep prompts short when you revise one screen, for example "Make the Submit button sticky above the bottom bar."
- **One screen per message:** Stitch generates higher quality when focused on a single screen. Don't combine multiple prompts into one message.

---

## 1. Master prompt (paste first)

```text
Design a mobile-first web app (installable PWA) called EduSaas, for FBISE intermediate colleges in Pakistan.

WHAT IT DOES: When a student misses a class, they get the exact textbook lesson they missed as a narrated page: the scanned textbook page on screen, with audio narration that follows the page. After listening to 90% they take a 5-question quiz; 4 correct = "Cleared for class". The parent gets an alert, and the teacher sees a green "Cleared" tick. The college admin registers everyone. The only way in is a phone number registered by the college.

USERS (4 roles, each with their own home screen):
- Student (16–18, low-end Android phone, patchy mobile data): catches up on missed lessons, studies by subject.
- Teacher: takes attendance in under a minute, sees who is cleared, tells parents on WhatsApp with one tap.
- Parent (often reads Urdu more easily than English, may not be tech-savvy): sees their child's attendance, progress and alerts. Read-only.
- College admin: adds teachers, students and parents, imports a class from a spreadsheet, approves teachers' subject requests.

BRAND AND STYLE: calm, trustworthy, academic. Flat surfaces, 1px borders, soft 12px corners, no heavy shadows, no gradients, no stock photos, no emoji. Generous spacing. Feels like a well-made banking or government-services app, not a game.

COLOURS (light theme):
- Background #F5F6F9, cards #FFFFFF, sunken areas #EEF0F5, borders #DDE1EA
- Text #1B2130, secondary text #5A6478
- Primary (deep navy) #1E3A5F, text on primary #FFFFFF
- Accent (teal/emerald) #0F8F83 for fills and icons, #0B6F66 for teal text (contrast), accent tint #E3F4F2
- Success #047857 on #E3F5EC; Pending/warning (amber) #A55A06 on #FFF3DC; Error/absent #B42318 on #FDECEA
- WhatsApp green for WhatsApp actions only: #0B6E63 (darkened for 4.5:1 contrast with white text)
COLOURS (dark theme): background #171A21, cards #21252E, borders #353B47, text #ECEEF3, secondary #A3ABBB, primary #7AA7E8, accent #3CC9B8, success #4ADE9B, warning #F5B94A, error #F58A80.

ELEVATION AND SHADOWS: cards have box-shadow: 0 1px 3px rgba(0,0,0,0.06). Bottom sheets have box-shadow: 0 -4px 20px rgba(0,0,0,0.12) with a 40% dark scrim behind them. Nothing else has a shadow. In dark theme the card shadow is rgba(0,0,0,0.2).

TYPE: Inter (or Roboto). Body 16px minimum, line height 1.5. H1 22px bold on phones (26px desktop). Section labels 15px bold, uppercase, letter-spaced, secondary colour. Urdu text uses Noto Nastaliq Urdu with line height 2 and right-to-left layout.

LAYOUT:
- Phone (360–390px): single column, 16px side margins, sticky top bar (logo "EduSaas" with a small "demo" tag, a language button "اردو", a theme toggle), bottom tab bar with icons and labels (64px tall, active tab has a 3px navy bar).
- Desktop (960px+): the bottom bar becomes a 208px left side rail; content max 1040px wide.
- Touch targets at least 44px. Buttons 48px tall, 10px corners. One primary action per screen.

TRANSITIONS AND MICRO-INTERACTIONS:
- State changes (hover, press, tab switch, toggle): 200ms ease.
- Toast messages: slide down from the top over 300ms, auto-dismiss after 3 seconds.
- Bottom sheets: slide up from the bottom over 250ms with a 40% dark scrim that fades in.
- Skeleton loaders: a subtle shimmer animation sweeping left to right (1.5s loop).
- Page/screen transitions: cross-fade over 200ms.
- Buttons: on press, scale to 0.97 for 100ms. On hover (desktop), background darkens 8%.

ICONS: Lucide icon set (MIT-licensed), 24px grid, 2px stroke, round caps and round joins. Icons used: home, book-open, log-out, play, pause, skip-back, skip-forward, check, x, alert-triangle, shield, clock, pencil, chevron-right, chevron-left, plus, search, upload, download, wifi-off, bell, bell-off, eye, eye-off, user, users, message-circle, phone, settings, star, refresh-cw, zoom-in, atom (custom), flask (custom), leaf (custom), sigma (custom), code-2, type.

COMPONENTS to reuse everywhere: cards; status badges (pill: green "Cleared", red "Pending", amber "Waiting", grey "Coming soon"/"Draft"); topic chips (a 44px rounded square with the topic number, e.g. "1.2", accent colours); stat tiles (big number + small label); progress ring and thin progress bars (accent); bottom sheet dialogs (phone) and centred dialogs (desktop); segmented controls; tabs as pill buttons; toast messages; skeleton loaders; an offline banner (amber); empty states with one helpful sentence; line icons (2px stroke, rounded).

SUBJECT ICONS: Physics = atom, Chemistry = flask, Biology = leaf, Mathematics = sigma, English = lines of text, Computer Science = </> code.

ACCESSIBILITY: WCAG 2.2 AA contrast, never colour alone (always icon + text for status), visible focus rings in teal (2px solid, 2px offset). Show disabled or "coming soon" items with grey text (#5A6478), not transparency.

Use realistic demo data: college "Margalla Heights College (Demo)"; class "11th Pre-Medical A"; student Ali Raza (roll 11A-01); parent Mrs. Fatima Raza; teacher Mr. Tariq Mehmood (Physics); admin Ms. Sana Javed. Physics Unit 1 "Physical Quantities and Measurements" has three topics: 1.1 Estimation of Physical Quantities (3:30, pages 8–10), 1.2 Derived Units in Terms of Base Units (2:13, pages 10–11), 1.3 Dimensions of Physical Quantities (3:40, pages 11–14).

Start with the Sign in screen.
```

---

## 2. Screen prompts

### Everyone

**2.1 Sign in**

```text
Sign in screen, phone. Centred navy app mark (book with play triangle), title "Sign in", subtitle "For students, teachers and parents registered by your college."
Card: label "Mobile number", input with a fixed "+92" prefix box and placeholder "3001234567", primary button "Send code".
Below: an info banner with a shield icon: "Only numbers registered by the college can sign in. Each account sees only its own class, child or record."
A collapsed "Demo accounts (for presenters)" row at the bottom.
Also design the second step on the same screen: "We sent a 6-digit code to +92 399 2220001. Change", a large centred 6-digit code input with wide letter spacing, "Resend code in 30s", and an error state "That code is wrong. 4 tries left." in red.
Show a small toast-like card at the top: "SMS · EduSaas — Your sign-in code is 482913. It expires in 5 minutes."
Expanded "Demo accounts" state: a scrollable list grouped by role (Teacher, Student, Parent, College admin). Each row shows a role badge (pill), the person's name, and their phone number in grey. Tapping a row fills the phone input and collapses the list. Example rows: "🟦 Teacher · Mr. Tariq Mehmood · 399 1110001", "🟩 Student · Ali Raza · 399 2220001", "🟨 Parent · Mrs. Fatima Raza · 399 3330001", "🟪 Admin · Ms. Sana Javed · 399 4440001".
```

**2.2 Shared states**

```text
Design a sheet of shared states for EduSaas, phone width: (1) skeleton loading cards with a left-to-right shimmer animation, (2) offline banner "You are offline. Reconnect to continue; your progress so far is saved." with a wifi-off icon, (3) error card "Could not load this page" with "Try again", (4) empty state "No messages yet." with a subtle line-art illustration, (5) toast "Attendance saved." sliding down from the top, (6) a bottom-sheet dialog with title, body text, error line and Cancel / primary buttons, showing the 40% dark scrim behind it, (7) a "new version available" banner at the top of the screen: "A new version is available" with a "Refresh" button.
```

### Student

**2.3 Student home**

```text
Student home, phone. Top: date "Thursday, October 1", greeting "Assalam o alaikum, Ali", "11th Pre-Medical A · Roll 11A-01", and on the right a progress ring "33%" with caption "1/3 topics".
An amber "Pending clearance" card with a warning icon: "You were absent on Thu, Oct 1 and missed Physics 1.2 Derived Units in Terms of Base Units. Listen to the lesson and score 4/5 in the quiz to be cleared for class." Attempts line "Attempts: 1 · best 3/5". Full-width navy button with play icon "Start missed lesson".
A green "Cleared for class" card: "1.1 Estimation of Physical Quantities · passed with 4/5".
Section "MY SUBJECTS": a card per live subject (Physics: atom icon tile, "1 of 3 topics done", red badge "1 missed", thin teal progress bar). Then a collapsed row "Coming soon · Chemistry, Biology".
Bottom tabs: Home (active), Library, Log out.
Empty state (no subjects yet): a dashed card with a clock icon "Your college has not added any subjects yet. Ask your teacher or college admin." No pending clearance section. The progress ring shows "0%" with caption "0/0 topics".
```

**2.4 Subject page**

```text
Subject page for Physics, phone. Back link "Home". Large atom icon tile, title "Physics", "Grade 11 · 1 of 14 units available".
Section "UNIT 1 · PHYSICAL QUANTITIES AND MEASUREMENTS" with three topic cards: chip "1.1", title, meta row with clock "3:30" and page icon "Pages 8–10", and a status badge on the right (green "✓ 4/5", amber "Quiz ready", grey "45% heard", red "Missed").
Section "MORE UNITS · COMING SOON": compact greyed rows with the unit number chip, title (Vectors, Translatory Motion, Rotational and Circular Motion, …) and a grey "Coming soon" badge.
Also show the version for a subject with no content: a dashed card with a clock icon "Chemistry is coming soon — Lessons appear here after the EduSaas team produces them and your teacher approves them."
```

**2.5 Library**

```text
Course library, phone. Title "Course library", "11th Pre-Medical A · 3 subjects". A horizontally scrolling row of pill tabs with subject icons: Physics (selected, navy), Chemistry "soon", Biology "soon". Under it, the selected subject's units (as on the subject page). At the bottom: "GRADE 12 · COMING SOON" with greyed pills Physics, Chemistry, Biology, Mathematics, English, Computer Science, and a small centred note "Units are added as the Content Factory produces them and teachers approve them."
```

**2.6 Lesson player** (the most important screen)

```text
Lesson player, phone. Breadcrumb "Home / Physics / Unit 1". Chip "1.2" + title "Derived Units in Terms of Base Units", meta "2:13 · Textbook pages 10, 11", badges red "Missed lecture" and grey "Draft, not yet reviewed".
Page tabs "p. 10" (selected) "p. 11" and a checkbox "Follow audio" on the right. Switching pages cross-fades over 200ms.
A large scanned textbook page placeholder (portrait, A4 ratio, white, looks like a photographed book page with headings and equations) with a dark pill "Tap to zoom" in the corner. The page image has a subtle 1px border matching --border.
Small grey credit line "Physics Grade 11, National Book Foundation."
A caption card with a teal left border: label "NOW EXPLAINING", text "Pehla example: Force. Force barabar mass into acceleration…" (Roman Urdu).
A segmented control "Narration: English mix | اردو".
Docked at the bottom above the tab bar: a player with a segmented progress bar (10 segments, heard ones teal, current one navy), "45% heard · section 4 of 10" and "1:02 / 2:13", controls "-10s", previous, a 56px round navy play button, next, "+10s", speed "1x". Below the controls a full-width button: locked state "🔒 Quiz unlocks at 90% heard" (disabled, grey) and unlocked state "✓ Start quiz" (teal).
A collapsible "Full transcript (Roman Urdu)" list where the current section is highlighted in the accent tint.
```

**2.7 Quiz**

```text
Quiz question, phone. Back link "Back to lesson". Header "Physics · 1.2 quiz" and "Question 2 of 5", a thin progress bar. Card with the question "The joule (J) in terms of SI base units is:" and four full-width answer buttons with letter badges A–D ("kg m s⁻²", "kg m² s⁻³", "kg m² s⁻²", "kg m⁻² s²"); the selected one has a navy outline and a filled navy letter badge. Bottom: "Back" and primary "Next" (last question: "Submit answers"). Small centred note "You need 4 of 5 correct to pass."
```

**2.8 Quiz result**

```text
Two result screens, phone.
PASS: big green circle with a check, score "5/5", "Great job, you passed!", green badge "Cleared for class", "Your parent and your teacher have been told.", button "Back to home", light confetti.
FAIL: amber circle with a refresh icon, score "3/5", "Almost there!", "You need 4/5 to pass. Review the lesson, then try again in 30 seconds.", buttons "Review lesson" and primary "Try again".
Both followed by "REVIEW YOUR ANSWERS": a card per question with a green or amber left border, the question, "You chose: …" and "Correct: …" in bold, and a one-line grey explanation.
```

**2.9 Zoomed textbook page**

```text
Zoomed page view, phone. Full-screen overlay with a dark (#171A21) background. The scanned textbook page fills the width and supports pinch-to-zoom and pan gestures. A floating pill "✕ Close" in the top-right corner (white text on a semi-transparent dark chip, rgba(0,0,0,0.6), 10px corners). Swipe left/right to change pages; small page indicator dots at the bottom centre ("p. 10 of 11"). No tab bar, no header — fully immersive. The page itself stays on a white background so the scan is readable against the dark surround.
```

### Teacher

**2.10 My classes**

```text
Teacher "My classes", phone. Date, name "Mr. Tariq Mehmood", college name. Section header "MY CLASSES" with a small outlined button "+ Add subject" on the right. Cards per class+subject with the subject icon tile: "11th Pre-Medical A · Physics · 6 students"; another "11th Pre-Medical A · Mathematics · 6 students" with a grey "Coming soon" badge.
Section "YOUR SUBJECT REQUESTS": a greyed card "English · Waiting for college admin" (amber badge) and one "Declined" (red badge) with the admin's note and a "Dismiss" link.
An "Alerts on this phone" card: "Get a notification when a student you teach is cleared." with a "Turn on" button.
Bottom tabs: My classes (active), Alerts log, Log out.
```

**2.11 Class: attendance and clearance**

```text
Teacher class page, phone. Back "My classes", "Thursday, October 1 · Physics", title "11th Pre-Medical A". Three stat tiles: Present 5 (green), Absent 1, Pending 1 (amber).
A card with a WhatsApp-green border "Tell parents on WhatsApp" and badge "1 not told yet": "Free: each button opens your WhatsApp with the message ready. Tap Send there." Row: avatar "AR", "Mrs. Fatima Raza, parent of Ali Raza", green WhatsApp button "Send on WhatsApp".
Section "CLASS CLEARANCE": rows with avatar initials, name, "1.2 Derived Units · absent Thu, Oct 1", "Last attempt today 4:10 pm · best 3/5 · 2 attempts", red "Pending" badge and a text button "Clear manually…"; another row with green "✓ Cleared" "Passed 5/5, today 11:42".
Section "TODAY'S ATTENDANCE" with a green "Submitted" badge: dropdown "Topic taught today: 1.2 Derived Units in Terms of Base Units", help text "Absent students get this topic as their missed lecture, and their parents get an alert."
Roster card: each row avatar, name, "11A-02 · Mr. Imran Khan" with a small pencil icon, and two square toggle buttons "P" (filled green when present) and "A" (filled red when absent; the absent student's avatar turns red).
Sticky bar above the bottom tabs: "All present" and primary "Save changes · 1 absent" (when nothing changed: a disabled green "✓ Saved").
Pre-submission state (before the teacher has submitted attendance for the first time today): the topic dropdown shows placeholder text "Choose the topic taught today", the "Save" button is disabled with text "Choose a topic first", stat tiles show "—" as placeholders instead of numbers, and the "Submitted" badge is absent. The clearance section is still visible with any pending items from previous days.
```

**2.12 Teacher dialogs**

```text
Three bottom sheets, phone:
(1) "Clear Ali Raza manually": text "1.2 Derived Units in Terms of Base Units. The reason is saved with the record, and the parent gets an alert." Radio list: Medical certificate provided (selected), On official college duty, Covered the topic with the teacher in person, Other (reveals a text area). Buttons Cancel / "Clear for class".
(2) "Parent's mobile number": "Mrs. Fatima Raza, parent of Ali Raza. Absence alerts go to this number." +92 phone input, inline error "Enter a 10-digit mobile number starting with 3.", Cancel / "Save number".
(3) "Add a subject": class dropdown, radio list of subjects with icons; Physics and Mathematics disabled with a green "You teach this" badge, Chemistry disabled "Already taught here", English and Computer Science selectable with a grey "Coming soon" badge. Cancel / "Send request".
```

**2.13 Alerts log**

```text
Teacher "Alerts log", phone. Intro "Every alert about students in your classes: in-app alerts, phone notifications, and the WhatsApp messages you sent." A chat-style panel with a dark green header "Margalla Heights College (Demo) · Alerts sent to parents and teachers". Message bubbles (light green) each with a small teal "To parent: Mrs. Fatima Raza · +92 399 3330001" line, the message text, and a footer "In app · sent to 1 phone · today 10:40" or "WhatsApp, sent by the teacher · today 10:41 ✓✓".
Empty state: a centred line-art bell icon (muted), "No alerts yet. Alerts appear here after you take attendance and students are marked absent."
```

### Parent

**2.14 Parent home**

```text
Parent home, phone, for Mrs. Fatima Raza. Child card for "Ali Raza, 11th Pre-Medical A · Roll 11A-01" with an amber badge "1 to clear" (or green "Up to date").
Three stat tiles: "80%" Attendance (8 of 10 classes, 30 days), "1/3" Topics done, "4.3/5" Average quiz score.
Lines with icons: "⚠ Absent Thu, Oct 1: must complete Physics 1.3 Dimensions of Physical Quantities (not started yet)" and "✓ Cleared Physics 1.1 Estimation, Sep 29".
"Subjects": rows with subject icon, "Physics · 1 of 3 topics · avg 4/5", progress bar and a chevron; greyed rows "Chemistry · Coming soon".
"Recent attendance": a strip of 7 small day tiles (Mon P green … Thu A red).
"Last studied today at 4:10 pm · usually clears missed lectures in 1 day".
Below: "Alerts on this phone" card with "Turn on", "MESSAGES FROM THE COLLEGE" (last 4 messages, chat style) with "See all 6 messages", and a "Weekly summary — Every Sunday evening, a short progress report in Messages" row with a toggle switch.
Bottom tabs: My child, Messages, Log out. Read-only: no edit buttons anywhere.
Multi-child note: if the parent has two or more children, show a separate child card for each, stacked vertically. Each card is tappable and expands to show that child's stats, subjects and attendance. The bottom tab label changes from "My child" to "My children".
```

**2.15 Child's subject detail**

```text
Parent view of one subject, phone. Back link "Ali Raza". Atom icon tile, title "Physics", "Ali Raza · 11th Pre-Medical A". Info banner: "After each lesson there is a 5-question quiz. 4 correct answers is a pass. A missed lecture is cleared when the quiz is passed."
"UNIT 1 · …" card with a row per topic: chip "1.1", title, an optional coloured sub-line ("Missed, now cleared" green / "Missed lecture, not cleared yet" amber), and a status badge on the right: green "✓ Passed 4/5", grey "Listening (45% heard)", amber "Quiz ready", grey "— Not started". Footer "13 more units coming soon."
```

**2.16 Messages**

```text
Parent "Messages", phone. Chat-style list from "Margalla Heights College (Demo)". Show three kinds: absence alert ("Dear Parent, Ali Raza was marked absent today in Physics…", footer "In app · sent to 1 phone"), the same message "WhatsApp, sent by the teacher ✓✓", and a weekly summary ("Weekly summary, Mon 21 Sep to Sun 27 Sep. Ali Raza: present in 6 of 6 classes. Physics 1 of 3 topics, average quiz 4/5. Chemistry, Biology: coming soon.", footer "In app"). Footnote explaining that alerts are free.
```

### College admin

**2.17 Admin home**

```text
College admin home, phone. Title "Margalla Heights College (Demo)", "College admin · Ms. Sana Javed". Four tappable stat tiles in a 2×2 grid: 8 Students, 3 Teachers, 8 Parents, 2 Classes.
"SUBJECT REQUESTS" with amber badge "1 waiting": card with Mathematics icon "Mathematics for 11th Pre-Medical A", "Asked by Mr. Tariq Mehmood · today 11:42 · no lessons yet (Coming soon)", buttons "Decline…" and primary "Approve".
"RECENT ACTIVITY" with a "See all" link: rows like "Imported students: 2 students, 1 parent — Ms. Sana Javed · today 11:51", "Imran Ali: suspended: Moved to another college".
Bottom tabs: Home, People, Classes, Import, Log out.
Also design the "Decline subject request" bottom sheet: title "Decline Mathematics for 11th Pre-Medical A", body "Mr. Tariq Mehmood will see this reason.", a required text area labelled "Reason", buttons Cancel / red-text "Decline". After declining, the card on the home screen updates to a red "Declined" badge with the reason text shown.
```

**2.18 People**

```text
Admin "People", phone. Title with a navy "+ Add" button. Pill tabs Students (selected) / Teachers / Parents. Search field "Search by name, phone or roll number". A list card: avatar, bold name, grey line "+92 399 2220001 · 11th Pre-Medical A · Roll 11A-01 · parent Mrs. Fatima Raza", chevron. One row dimmed with a red "Suspended" badge. Footer "8 shown".
Also design the "Add a student" bottom sheet: Full name, Mobile number (+92), Gender, Class dropdown, Roll number, a "PARENT" divider, Parent's mobile number, Parent's full name ("Leave blank if the parent is already registered"), note "They sign in with this number. Nobody else can use it.", buttons Cancel / "Add student".
And the edit sheet with an "ACCOUNT" section: reason field and a red-text "Suspend account" button (or "Reactivate account" when suspended).
```

**2.19 Classes**

```text
Admin "Classes", phone. Title with "+ New class". A card per class: section chip "A", "11th Pre-Medical A", "2026-2027 · Boys · 6 students"; "Teachers" list with subject icon, "Physics · Mr. Tariq Mehmood" and a small ✕ remove button per row; outlined button "+ Assign teacher".
Plus the "New class" sheet (Grade 11th/12th, Stream, Section, Students Boys/Girls/Mixed, Academic year) and the "Assign a teacher to 11th Pre-Medical A" sheet (Teacher dropdown, Subject dropdown with "(coming soon)" labels).
```

**2.20 Import**

```text
Admin "Import", phone. Intro "Add a whole class, or all your teachers, from a spreadsheet saved as CSV." Pill tabs "Students and parents" / "Teachers". Card with numbered steps: 1. "Download the template" link …, 2. choose the file or paste below, 3. "Check file — nothing is saved until you press Import". File picker, a monospace text area, primary "Check file".
Loading state: while checking, replace the result area with a skeleton card and text "Checking… 2 rows". While importing, show a thin progress bar and "Importing… do not close this page."
Result state A (errors): amber card "1 row needs fixing — 2 rows checked · 1 OK · 1 with errors", section "FIX THESE ROWS, THEN CHECK AGAIN" with red row-number chips "3" and "Roll number 11A-01 already exists in 11th Pre-Medical A.", note "Row numbers match your spreadsheet (row 1 is the header)", and "ROWS THAT ARE OK" preview rows.
Result state B (clean): green card "Ready to import 2 rows", preview, primary "Import 2 rows"; then success "Imported — 2 students, 1 parent created. They can sign in with their numbers now."
```

**2.21 Activity log**

```text
Admin "Activity log", phone. Back "Home", intro "Every change in your college: who did it and when. Phone numbers are partly hidden." A card list of entries: summary text (e.g. "Added teacher Ms. Hira Saleem (+92 3** ***9005)") and grey "Ms. Sana Javed · today 11:50".
```

### System and edge-case screens

**2.22 Push notification permission**

```text
Push notification permission, phone. After the user taps "Turn on" on the Alerts card, a bottom sheet appears: title "Get alerts on this phone", a large bell icon with a green notification dot, body "You'll get a notification when your child is marked absent or cleared, and when they pass a quiz. You can turn this off any time in your browser settings.", primary button "Allow notifications", ghost button "Not now". After allowing, the Alerts card on the home screen updates to show "Alerts on ✓" with a green check icon and a "Turn off" text button underneath. Also show a reference of the browser's native permission prompt appearing above the bottom sheet (a small browser bar asking "Allow notifications?").
```

**2.23 Gallery / design system page**

```text
Component gallery, phone and desktop side by side. Title "Component gallery", subtitle "Every component in the EduSaas design system. Use the header buttons to check dark mode and right-to-left Urdu."
Sections: Buttons (primary, secondary, accent, ghost, disabled, small, WhatsApp green), Badges (Cleared green with check, Pending red with cross, Waiting amber, Coming soon grey, Draft grey), Chips and subject icons (topic chip "1.2", subject icon tiles for Physics atom, Chemistry flask, Biology leaf, Mathematics sigma, English text lines, Computer Science code), Rings and bars (33% progress ring, 60% thin progress bar), Stat tiles (Present 5 green, Absent 1 default, Pending 1 amber), Cards (amber alert card, green success card, dashed "coming soon" card, info banner with shield, offline banner with wifi-off), Tabs and segmented control (pill tabs, narration switch), Form fields (phone input with "+92" prefix, select dropdown, text area), Feedback (toast notification, bottom-sheet dialog with scrim, skeleton loader with shimmer, error card with Retry), Icons grid (all Lucide icons used, shown in a wrapped row of small chips). This page is for internal design review, not for end users.
```

**2.24 PWA install prompt**

```text
PWA install prompt, phone. A slim banner docked at the bottom of the screen, above the tab bar, shown after the user's second visit: the EduSaas app icon (small, 32px), text "Add EduSaas to your home screen for faster access", a small primary "Add" button, and a small "✕" dismiss button on the right. The banner has a white card background, 1px top border, and the same shadow as a card.
Also design the iPhone-specific version: a bottom sheet titled "Add EduSaas to your home screen" with numbered steps: "1. Tap the Share button (□↑) at the bottom of Safari", "2. Scroll down and tap 'Add to Home Screen'", "3. Tap 'Add'". Include a simplified illustration of the Safari share menu with the "Add to Home Screen" option highlighted. A "Got it" button to dismiss.
```

**2.25 Session expired**

```text
Session expired screen, phone. Centred on the page (no bottom tab bar, no header — this replaces the entire screen): the navy app mark (book with play triangle) at 64px, title "Session expired", body text "You were signed out because your session expired, or you signed in on another device. Sign in again to continue.", a full-width primary button "Sign in again". Tapping it goes to the Sign in screen. Background is the standard #F5F6F9. Clean and simple — no other elements on the page.
```

---

## 3. Variant prompts

**3.1 Desktop**

```text
Create desktop (1440×900) versions of: Student home, Lesson player, Teacher class page, Parent home, Admin People.
Replace the bottom tab bar with a 208px left side rail (icon + label, active item in accent tint with a 3px navy marker, "Log out" pinned at the bottom).
Lesson player: two columns: the textbook page on the left, sized to fit the window height; on the right the narration switch, caption, the player (not docked) and an open transcript.
Teacher class page: attendance roster on the left, clearance list on the right (sticky).
Student home: subject cards in a 3-column grid. Parent home: child cards two across. Admin People: a table with columns Name, Phone, Class/Roll, Parent, Status.
Desktop hover states: buttons darken 8% on hover (200ms). Cards lift slightly with box-shadow: 0 2px 8px rgba(0,0,0,0.08) on hover. List rows get a subtle --sunk (#EEF0F5) background on hover. Interactive elements show a pointer cursor. Focus rings are visible on keyboard navigation (2px solid teal, 2px offset).
```

**3.2 Dark mode**

```text
Create dark-theme versions of Student home, Lesson player, Teacher class page and Parent home using: background #171A21, cards #21252E, borders #353B47, text #ECEEF3, secondary #A3ABBB, primary #7AA7E8 (with dark text #0E1522 on it), accent #3CC9B8, success #4ADE9B, warning #F5B94A, error #F58A80. Keep the textbook page area light (#D9D9D6) so the scan stays readable. Card shadow becomes rgba(0,0,0,0.2).
```

**3.3 Urdu (right to left)**

```text
Create Urdu versions of Sign in, Student home, Lesson player, Quiz and Parent home. Mirror the layout right to left (dir=rtl): the side rail on the right, back arrows pointing right, text right-aligned. Use Noto Nastaliq Urdu for Urdu text with line height 2; keep English names, class names, lesson titles, numbers, phone numbers and the audio controls left to right.
Labels: Home = ہوم, Library = لائبریری, My child = میرا بچہ, Messages = پیغامات, Log out = لاگ آؤٹ, Sign in = سائن ان, Send code = کوڈ بھیجیں, Pending clearance = کلیئرنس باقی ہے, Start missed lesson = رہ جانے والا سبق شروع کریں, My subjects = میرے مضامین, Coming soon = جلد آ رہا ہے, Start quiz = کوئز شروع کریں, Quiz unlocks at 90% heard = 90٪ سننے پر کوئز کھلے گا, Up to date = سب مکمل, Attendance = حاضری, Weekly summary = ہفتہ وار رپورٹ, Physics = فزکس, Chemistry = کیمسٹری, Biology = بیالوجی. Greeting: السلام علیکم، Ali.
The header language button shows "English" when Urdu is on.
```

**3.4 Tablet**

```text
Create tablet (768×1024 portrait and 1024×768 landscape) versions of the Lesson player, Teacher class page, Student home and Admin People.
Lesson player portrait: one column with wider cards and the player docked above a bottom tab bar. Lesson player landscape: two panes as on desktop (page left, controls right), with the bottom tab bar replaced by the side rail.
Teacher class page portrait: single column with wider cards. Landscape: attendance roster on the left, clearance list on the right (as desktop).
Student home: subject cards in a 2-column grid (portrait) or 3-column grid (landscape).
Admin People: a responsive table that collapses to cards in portrait and expands to the full table in landscape.
```

---

## 4. Review checklist (before exporting)

- [ ] Every screen uses only the colours and type above; status is never shown by colour alone.
- [ ] Touch targets are at least 44px; the primary action is reachable with one thumb.
- [ ] The phone layout works at 360px wide with no sideways scrolling.
- [ ] Loading, empty, error and offline states exist for each list screen.
- [ ] Teacher attendance: one tap per student, Save always visible.
- [ ] Lesson player: page, caption, controls and the quiz button are all visible without scrolling on a 390×844 phone.
- [ ] Parent screens contain no edit actions.
- [ ] Urdu screens are mirrored, with numbers, names and media controls left to right.
- [ ] Dark mode keeps WCAG AA contrast.
- [ ] No real person's name, photo or phone number appears.
- [ ] Transitions and micro-interactions are annotated (duration, easing).
- [ ] Desktop screens include hover states for buttons, cards and list rows.
- [ ] Bottom sheets show the 40% dark scrim behind them.
- [ ] Focus rings (teal, 2px) are visible on interactive elements.
- [ ] The zoomed textbook page overlay is fully immersive (no tab bar, no header).
