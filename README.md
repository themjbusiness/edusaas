# EduSaas: AI-narrated textbook lessons for FBISE colleges

A working demo of the product described in the blueprint:
- A teacher marks a student absent.
- The parent gets a WhatsApp alert.
- The student studies the missed lesson (the textbook page with narration) and passes a quiz.
- The teacher sees the green tick.

Everyone signs in on their own phone. **Only people registered by the college can sign in, and each
person sees only the records they are linked to.**

## Start the demo

Windows: double-click **`start-demo.bat`**. On Mac or Linux, run `sh start-demo.sh`.

- On this computer, open **http://localhost:8000**.
- On a phone on the same Wi-Fi, open `http://<this computer's IP>:8000`. Run `ipconfig` to find the IP.
  If the phone can't connect, allow Python through Windows Firewall on private networks.
- Every start resets the demo to a clean roster. To keep the data from a previous run, use
  `start-demo.bat --keep`.
- The **college admin** (Ms. Sana Javed, 399 4440001) signs in to the app like everyone else and manages
  her own college in the **Admin** area: people, classes, teacher assignments, roster import and subject
  requests.
- The Django panel at **http://localhost:8000/admin** is for the EduSaas team only (all colleges): phone
  `+923999990000`, password `demo-admin-2026`. College admins cannot open it.
- To set up a real college: `cd backend && python manage.py create_college "<name>" --admin-phone 03xxxxxxxxx --admin-name "<name>"`.

Requires Python 3.11 or later. The start script installs Django.

Requires Node.js 20 or later to build the web app (the start script runs `npm install` and `npm run build`). Without
Node.js, the last build in `web/dist` is served. `/#/gallery` shows every component of the design system.

## Who can sign in

The demo college is **Margalla Heights College (Demo)**, a fictional college. All numbers are in the
`+92 399` range, which no operator issues. Any number not in this list is refused with *"This number is
not registered with any college."*

| Role | Name | Mobile (type the 10 digits after +92) | Linked to |
|---|---|---|---|
| College admin | Ms. Sana Javed | 399 4440001 | Margalla Heights College (Demo) only |
| Teacher | Mr. Tariq Mehmood | 399 1110001 | teaches Physics to 11th Pre-Medical A |
| Teacher | Mr. Adeel Anwar | 399 1110003 | teaches Chemistry and Biology to 11th Pre-Medical A (no lessons yet, so "Coming soon") |
| Teacher | Mr. Kamran Shah | 399 1110002 | teaches Physics and Mathematics to 11th Pre-Engineering B |
| Student | Ali Raza | 399 2220001 | 11th Pre-Medical A, roll 11A-01 |
| Parent | Mrs. Fatima Raza | 399 3330001 | Ali Raza's parent |
| Student | Bilal Ahmed | 399 2220003 | 11th Pre-Medical A, roll 11A-03 |
| Parent | Mr. Naveed Ahmed | 399 3330003 | Bilal's parent (with `PAID_MESSAGING=1`, simulated as not on WhatsApp to show the SMS fallback) |
| Student | Saad Hussain | 399 2220011 | 11th Pre-Engineering B |
| Parent | Mr. Jawad Hussain | 399 3330011 | Saad's parent |

There are four more students and parents in class A. Open **Demo accounts** on the sign-in screen for
the full list, and tap an account to fill in its number. In demo mode, the 6-digit sign-in code appears
on screen as an "SMS" card. Without demo mode it would be sent by SMS.

### What each person can see

| Person | Can see | Cannot see |
|---|---|---|
| Teacher | Only the classes they are assigned to: attendance, clearance, the alerts log for those students | Other teachers' classes (the page says "You are not assigned to this class") |
| Student | Their own lessons, progress, quiz and clearance | Teacher or parent screens, other students |
| Parent | Only their own child's clearance, attendance and the messages sent to them | Other children, other parents' messages |

The server enforces all of these rules; hiding buttons in the app is not what protects the data. The
automated tests try to break each rule.

## Demo script (about 5 minutes, best with two or three phones)

1. **Stranger.** Enter `3001234567`. The app refuses: the number is not registered.
2. **Teacher (Mr. Tariq, 399 1110001).** The app opens *11th Pre-Medical A*. Choose topic
   *1.2 Derived Units*, mark **Ali Raza** and **Bilal Ahmed** absent, then tap **Submit attendance**.
   - Alerts are free (decision D6): both parents get an alert in the app, and on their phone if they turned
     on alerts. The **Tell parents on WhatsApp** card lists both parents: **Send on WhatsApp** opens the
     teacher's own WhatsApp with the message ready, and the parent drops off the "not told yet" list.
   - **Alerts log** shows every alert and how it was delivered.
3. **Parent (Mrs. Fatima, 399 3330001).** She sees *1 to clear* and the college's message about Ali.
   - **Alerts on this phone → Turn on** asks for permission and turns on free phone notifications. This
     works on `http://localhost:8000` on this computer, and on phones once the app is on HTTPS (browsers
     block notifications on plain `http://` addresses on the Wi-Fi). On iPhone, add EduSaas to the Home
     Screen first.
4. **Student (Ali, 399 2220001).**
   - The home screen shows *Pending clearance*. Open the missed lesson and press play.
   - The textbook page turns with the narration. The quiz unlocks at 90% heard, which takes about
     1.5 minutes at 1.5x speed. Skipping ahead does not count.
   - Pass the quiz with 4 of 5 correct. The screen shows *Cleared for class* and a review of the answers.
5. **Parent again.** Ali now shows *Up to date* with a new message (and a phone notification if alerts are on).
6. **Teacher again.** Ali has a green **Cleared** tick with his score and time.
   - Tap **Clear manually…** on Bilal and give a reason, such as a medical certificate.
   - Use the pencil icon to correct a parent's wrong number.
7. **Other teacher (Mr. Kamran, 399 1110002).** He sees only *11th Pre-Engineering B*, for Physics and Mathematics.
8. **More subjects (F20).**
   - As Ali, the home screen shows *Physics* with progress and *Chemistry, Biology* under "Coming soon". The **Library** has a tab per subject and a "Grade 12 · coming soon" section.
   - As Mr. Tariq, open **My classes → Add subject**, choose *English* and send. The card shows *Waiting for college admin*.
   - As Ms. Sana (399 4440001), the request waits on her Admin home. Tap **Approve**. Mr. Tariq now has an *English* card marked "Coming soon", and Ali sees English too.
9. **Parent progress (F21).** As Mrs. Fatima, the card for Ali shows attendance over 30 days, topics done, average quiz score and a bar per subject. Tap *Physics* to see each topic's status.
   - To send the weekly summary now, run `cd backend && python manage.py send_weekly_summaries`. It appears in the parent's Messages marked "In app". Parents can turn it off at the bottom of their home screen.
   - To send it every Sunday at 18:00, add a Windows Task Scheduler task that runs that command in the `backend` folder.
10. **College admin (F22).** Sign in as Ms. Sana (399 4440001).
    - **People → Teachers → Add**: add a teacher with a new number. **Classes → Assign teacher**: give them a
      subject. They can sign in straight away and see only that class.
    - **Import**: download the student template, add two rows and press **Check file**. Rows with mistakes
      (for example a roll number already used) are listed by row number; nothing is saved until the file is
      clean and you press **Import**.
    - Tap a student, give a reason and **Suspend account**: they can no longer sign in. **Reactivate** brings
      them back. **Home → See all** shows every change, with phone numbers partly hidden.
11. **Urdu (F23).** Tap **اردو** in the header. Student and parent screens switch to Urdu, right to left.
    The choice is saved to the account, so a parent who picks Urdu also gets alerts and the weekly
    summary in Urdu. Teacher and admin screens stay in English for now. The Urdu text is a draft until a
    native speaker reviews it.
12. **Urdu narration (F12).** In any lesson, switch **Narration** to **اردو**: the same lesson is read in
    Urdu by a Pakistani voice, with an Urdu transcript. Hearing 90% of either narration unlocks the quiz.
    The Urdu narration is a draft until a physics teacher approves it.

## Project layout

| Folder | What it is |
|---|---|
| [content_factory/](content_factory/) | Phase 1, offline: textbook PDF → narrated lesson objects (script, quiz, MP3). See its README. |
| [backend/](backend/) | Phase 2: Django API, roster, OTP login, attendance, clearance, quiz scoring, notifications, admin panel |
| [web/](web/) | The web app for students, teachers, parents and college admins (React + TypeScript, served by the backend) |
| [media/](media/) | Lesson page images and audio |
| [legacy/](legacy/) | The old vanilla JavaScript app, kept for reference only |
| [docs/](docs/) | All project documents: [roadmap](docs/roadmap.md), [change register](docs/Change-Register-v1.1.md), feature specs |

## Tests

```text
cd backend && python manage.py test lms          # 76 API tests: access rules, OTP, workflow, alerts, subjects, parent progress, admin console, language, Urdu narration
cd content_factory && python -m pytest tests     # 19 pipeline tests
cd web && npm test                               # 12 unit tests for the web app
```

## Demo limits (to address before a real pilot)

- **Messaging:** free by default (D6): in-app alerts, web push and teachers' one-tap WhatsApp messages.
  `PAID_MESSAGING=1` switches to a WhatsApp gateway with SMS fallback (simulated here); connect a real
  provider in `backend/lms/notify.py`, with pre-approved WhatsApp templates.
- **Push keys:** the first alert creates `backend/vapid.json`. It is a secret: don't share it. In
  production, set `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` and `VAPID_SUBJECT` instead.
- **OTP delivery:** the sign-in code is shown on screen in demo mode. Set `DEMO_MODE=0` and add an SMS
  gateway in `backend/lms/auth.py` to send it for real. `DEMO_MODE=0` also removes the demo accounts list.
- **Infrastructure:** SQLite and Django's development server. For a pilot, use PostgreSQL, a production
  web server with HTTPS, a secret key from the environment, and Cloudflare R2 or a CDN for media.
- **Admin scope:** college admins see only their own college (F22). The Django panel at `/admin` shows
  every college and is for the EduSaas team only.
- **Offline:** there is no offline mode yet (service worker and saved lessons).
- **Data protection:** phone numbers are stored in plain text. Change register item CR-18 covers
  encrypting them.
- **Content:** the lessons are drafts until a physics teacher approves them (`factory.py review`).
  Textbook pages are National Book Foundation material, so keep the demo internal until you have
  permission (CR-02).
