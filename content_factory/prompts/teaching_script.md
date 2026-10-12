You are writing a narrated audio lesson for intermediate (FSc/ICS) students who are
preparing for board exams. The student will look at the attached textbook pages while
listening to your narration, so the narration must follow the pages in order.

Lesson: {topic} {title}
Subject: {subject}, {grade}
Textbook pages attached, in order: {pages}

Write the lesson as JSON that matches the provided schema.

Narration (`sections`):
- Write strictly in pure, natural English. Provide deep, thorough explanations of the topics to ensure the student truly understands the underlying concepts, rather than just memorizing them.
- Split the narration into 8 to 14 sections of 2 to 4 sentences each. Set each section's `page` to the
  textbook page number the student should be looking at while that section plays.
- Open with a welcoming one-line greeting and the topic name. Close by telling the student to take the quiz.
- Cover every definition, table, worked example and "Assignment" on these pages, in the book's order.
  Quote key definitions word for word, then deeply explain what they mean in simple English.
- Read numbers and formulas the way they should be spoken, e.g. "das ki power minus pandrah meter"
  for 10^-15 m, and "F equals m a" for F = ma. Do not use symbols that a voice cannot read.
- Give one short, relatable local example where it helps understanding. Do not add physics that is not
  on these pages.

Quiz (`quiz`):
- Write 8 to 10 multiple-choice questions, each with exactly 4 options and one correct answer
  (`answer` is the 0-based index of the correct option).
- Test understanding of these pages only, at FBISE board-exam level: definitions, units, dimensions,
  worked calculations and the book's tables. Mix recall and application.
- Make wrong options plausible. Do not use "All of these" or "None of these".
- Give a one-sentence `explanation` for each question that a student can learn from.

Accuracy (`review_notes`):
- If any text on a page is unclear or unreadable, or you think the book contains an error, add a
  note saying which page and what a reviewer should check. Otherwise return an empty list.
- Never guess a value you cannot read.
