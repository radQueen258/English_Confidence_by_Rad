
import { auth, db } from "./firebase.js";

import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


// ==========================================
// STATE
// ==========================================

let currentStudentEmail = null;

let currentMonthNumber = 1;

let currentLessonNumber = 1;

let lessonRecords = new Map();

let editorInitialised = false;


// ==========================================
// LESSON STRUCTURE
// ==========================================

function lessonType(number) {

    return number % 3 === 0
        ? "podcast"
        : "live";

}


function monthId() {

    return `month-${currentMonthNumber}`;

}


function lessonId(number) {

    return `lesson-${number}`;

}


function lessonRef(number) {

    return doc(
        db,
        "students",
        currentStudentEmail,
        "months",
        monthId(),
        "lessons",
        lessonId(number)
    );

}


function completionRef(number) {

    return doc(
        db,
        "students",
        currentStudentEmail,
        "months",
        monthId(),
        "lessons",
        lessonId(number),
        "completions",
        "status"
    );

}


function blankLanguage() {

    return {
        title: "",
        subtitle: "",
        goal: "",
        vocabulary: [],
        phrases: [],
        prompts: []
    };

}


function blankLesson(number) {

    return {
        number,
        type: lessonType(number),

        weekNumber: Math.ceil(number / 3),

        pt: blankLanguage(),

        en: blankLanguage(),

        podcast: {
            title: "",
            url: ""
        },

        published: false
    };

}


// ==========================================
// ELEMENT HELPERS
// ==========================================

function element(id) {

    return document.getElementById(id);

}


function value(id) {

    return element(id).value.trim();

}


function setValue(id, text) {

    element(id).value = text || "";

}


function showMessage(id, message, type = "info") {

    const target = element(id);

    target.textContent = message;

    target.dataset.type = type;

}


function escapeHTML(text) {

    return String(text ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );

}


function isValidHttpUrl(value) {

    try {

        const url = new URL(value);

        return (
            url.protocol === "https:"
            || url.protocol === "http:"
        );

    } catch {

        return false;

    }

}


// ==========================================
// TEXT FIELD CONVERSION
// ==========================================

function vocabularyToText(vocabulary = []) {

    return vocabulary
        .map(pair => {

            if (!Array.isArray(pair)) return "";

            return `${pair[0] || ""} | ${pair[1] || ""}`;

        })
        .join("\n");

}


function arrayToText(items = []) {

    return Array.isArray(items)
        ? items.join("\n")
        : "";

}


function textToArray(text) {

    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

}


function textToVocabulary(text) {

    const lines = textToArray(text);

    const result = [];

    for (const line of lines) {

        const separator = line.indexOf("|");

        if (separator < 0) {

            return {
                error: `The vocabulary line "${line}" must use the format: word | meaning.`
            };

        }

        const word = line.slice(0, separator).trim();

        const meaning = line.slice(separator + 1).trim();

        if (!word || !meaning) {

            return {
                error: `Please complete both sides of this vocabulary entry: "${line}".`
            };

        }

        result.push([word, meaning]);

    }

    return {
        value: result
    };

}


// ==========================================
// RENDER LESSON NAVIGATION
// ==========================================

function renderLessonList() {

    const container = element("admin-lesson-list");

    if (!currentStudentEmail) {

        container.innerHTML = `
      <p class="admin-empty">
        Select a student first.
      </p>
    `;

        return;

    }


    const html = Array.from(
        { length: 12 },
        (_, index) => {

            const number = index + 1;

            const record = lessonRecords.get(number) || {};

            const data = record.data;

            const completed = Boolean(record.completion?.completed);

            const published = Boolean(data?.published);

            const type = lessonType(number);

            const title =
                data?.pt?.title
                || data?.en?.title
                || "New lesson";


            const selected =
                currentLessonNumber === number
                    ? " selected"
                    : "";


            const status = completed
                ? "Completed"
                : published
                    ? "Published"
                    : "Draft";


            return `

        <button
          type="button"
          class="admin-lesson-item${selected}"
          data-lesson-number="${number}"
        >

          <span class="lesson-item-number">
            ${String(number).padStart(2, "0")}
          </span>

          <span class="lesson-item-info">

            <strong>
              ${escapeHTML(title)}
            </strong>

            <small>
              ${type === "live" ? "Live lesson" : "Self-paced activity"}
            </small>

          </span>

          <span class="lesson-item-status ${
                completed ? "completed" : published ? "published" : ""
            }">
            ${status}
          </span>

        </button>

      `;

        }

    ).join("");


    container.innerHTML = html;

}


// ==========================================
// FILL EDITOR
// ==========================================

function fillEditor(number) {

    currentLessonNumber = number;

    const record = lessonRecords.get(number) || {};

    const data = record.data || blankLesson(number);

    const pt = data.pt || blankLanguage();

    const en = data.en || blankLanguage();

    const type = lessonType(number);


    element("editor-lesson-heading").textContent =
        `Lesson ${String(number).padStart(2, "0")}`;


    element("editor-lesson-type").textContent =
        type === "live"
            ? "Grammar / Conversation · Live lesson"
            : "Podcast / Listening · Self-paced activity";


    // Portuguese fields

    setValue("lesson-pt-title", pt.title);
    setValue("lesson-pt-subtitle", pt.subtitle);
    setValue("lesson-pt-goal", pt.goal);

    setValue(
        "lesson-pt-vocabulary",
        vocabularyToText(pt.vocabulary)
    );

    setValue(
        "lesson-pt-phrases",
        arrayToText(pt.phrases)
    );

    setValue(
        "lesson-pt-prompts",
        arrayToText(pt.prompts)
    );


    // English fields

    setValue("lesson-en-title", en.title);
    setValue("lesson-en-subtitle", en.subtitle);
    setValue("lesson-en-goal", en.goal);

    setValue(
        "lesson-en-vocabulary",
        vocabularyToText(en.vocabulary)
    );

    setValue(
        "lesson-en-phrases",
        arrayToText(en.phrases)
    );

    setValue(
        "lesson-en-prompts",
        arrayToText(en.prompts)
    );


    // Podcast fields

    const podcast = data.podcast || {};

    setValue(
        "lesson-podcast-title",
        podcast.title
    );

    setValue(
        "lesson-podcast-url",
        podcast.url
    );


    element("podcast-editor").hidden =
        type !== "podcast";


    element("lesson-published").checked =
        Boolean(data.published);


    const status = element("editor-lesson-status");

    status.textContent = data.published
        ? "Published"
        : "Draft";

    status.className = data.published
        ? "admin-status status-active"
        : "admin-status status-paused";


    renderCompletionControls();

    showMessage("lesson-save-message", "");

    renderLessonList();

}


// ==========================================
// COMPLETION CONTROLS
// ==========================================

function renderCompletionControls() {

    const record = lessonRecords.get(
        currentLessonNumber
    ) || {};

    const data = record.data;

    const completion = record.completion;

    const type = lessonType(currentLessonNumber);

    const button = element("teacher-complete-button");

    const content = element("teacher-completion-content");


    if (type === "podcast") {

        button.hidden = true;

        content.textContent =
            "This is a self-paced activity. The student will mark it as completed after listening to the podcast or video and finishing the exercise.";

        return;

    }


    button.hidden = false;


    const completed = Boolean(completion?.completed);

    const previousRecord =
        lessonRecords.get(currentLessonNumber - 1);

    const previousCompleted =
        currentLessonNumber === 1
        || Boolean(previousRecord?.completion?.completed);


    const isPublished = Boolean(data?.published);

    button.disabled =
        !completed && (!isPublished || !previousCompleted);


    button.textContent = completed
        ? "Undo teacher completion"
        : "Mark as completed";


    if (completed) {

        content.textContent =
            "You have marked this live lesson as completed.";

    } else if (!isPublished) {

        content.textContent =
            "Save and publish this lesson before marking it as completed.";

    } else if (!previousCompleted) {

        content.textContent =
            "The previous activity must be completed before this lesson can be marked as done.";

    } else {

        content.textContent =
            "Only you can mark this live lesson as completed after the session.";

    }

}


// ==========================================
// LANGUAGE CONTENT
// ==========================================

function buildLanguageContent(language) {

    const prefix = language === "pt"
        ? "lesson-pt-"
        : "lesson-en-";


    const vocabulary = textToVocabulary(
        value(prefix + "vocabulary")
    );

    if (vocabulary.error) {

        throw new Error(
            vocabulary.error
        );

    }


    return {

        title: value(prefix + "title"),

        subtitle: value(prefix + "subtitle"),

        goal: value(prefix + "goal"),

        vocabulary: vocabulary.value,

        phrases: textToArray(
            value(prefix + "phrases")
        ),

        prompts: textToArray(
            value(prefix + "prompts")
        )

    };

}


// ==========================================
// SAVE LESSON
// ==========================================

async function saveLesson(event) {

    event.preventDefault();


    if (!currentStudentEmail) {

        showMessage(
            "lesson-save-message",
            "Select a student first.",
            "error"
        );

        return;

    }


    const number = currentLessonNumber;

    const type = lessonType(number);

    const existing = lessonRecords.get(number)?.data || {};

    const published = element("lesson-published").checked;


    try {

        const pt = buildLanguageContent("pt");

        const en = buildLanguageContent("en");


        const podcast = type === "podcast"
            ? {
                title: value("lesson-podcast-title"),
                url: value("lesson-podcast-url")
            }
            : null;


        if (podcast?.url && !isValidHttpUrl(podcast.url)) {

            throw new Error(
                "Please enter a valid HTTP or HTTPS podcast/video link."
            );

        }


        // Validate content when publishing.
        if (published) {

            if (
                !pt.title
                || !en.title
                || !pt.goal
                || !en.goal
            ) {

                throw new Error(
                    "To publish a lesson, complete the Portuguese and English titles and learning objectives."
                );

            }


            if (
                type === "podcast"
                && (!podcast.title || !isValidHttpUrl(podcast.url))
            ) {

                throw new Error(
                    "A published self-paced activity needs a podcast/video title and a valid link."
                );

            }

        }


        const button = element("save-lesson-button");

        button.disabled = true;

        button.textContent = "Saving...";


        const payload = {

            number,

            type,

            weekNumber: Math.ceil(number / 3),

            pt,

            en,

            podcast,

            published,

            createdAt: existing.createdAt || serverTimestamp(),

            updatedAt: serverTimestamp(),

            updatedByEmail: auth.currentUser.email

        };


        await setDoc(
            lessonRef(number),
            payload,
            { merge: true }
        );


        const previousCompletion =
            lessonRecords.get(number)?.completion || null;


        lessonRecords.set(number, {

            data: payload,

            completion: previousCompletion

        });


        fillEditor(number);


        showMessage(
            "lesson-save-message",
            "Lesson saved successfully.",
            "success"
        );


    } catch (error) {

        console.error("Lesson save failed:", error);

        showMessage(
            "lesson-save-message",
            error.message || "The lesson could not be saved.",
            "error"
        );

    } finally {

        const button = element("save-lesson-button");

        button.disabled = false;

        button.textContent = "Save lesson changes ↗";

    }

}


// ==========================================
// TEACHER COMPLETION
// ==========================================

async function toggleTeacherCompletion() {

    const number = currentLessonNumber;

    const data = lessonRecords.get(number)?.data;

    const completion =
        lessonRecords.get(number)?.completion;


    if (lessonType(number) !== "live") return;


    if (completion?.completed) {

        if (!window.confirm(
            "Undo the completion record for this lesson?"
        )) return;


        try {

            await deleteDoc(
                completionRef(number)
            );

            lessonRecords.set(number, {
                data,
                completion: null
            });

            fillEditor(number);

            showMessage(
                "teacher-completion-message",
                "Completion has been reversed.",
                "success"
            );

        } catch (error) {

            console.error(error);

            showMessage(
                "teacher-completion-message",
                "Could not reverse this completion.",
                "error"
            );

        }

        return;

    }


    if (!data?.published) {

        showMessage(
            "teacher-completion-message",
            "Publish the lesson before marking it completed.",
            "error"
        );

        return;

    }


    const previous = lessonRecords.get(number - 1);

    if (
        number > 1
        && !previous?.completion?.completed
    ) {

        showMessage(
            "teacher-completion-message",
            "The previous activity has not been completed yet.",
            "error"
        );

        return;

    }


    const confirmed = window.confirm(
        "Confirm that this live lesson has taken place and is completed?"
    );

    if (!confirmed) return;


    try {

        await setDoc(
            completionRef(number),
            {

                completed: true,

                completedAt: serverTimestamp(),

                completedByEmail: auth.currentUser.email,

                source: "teacher"

            }
        );


        lessonRecords.set(number, {

            data,

            completion: {
                completed: true,
                source: "teacher"
            }

        });


        fillEditor(number);


        showMessage(
            "teacher-completion-message",
            "Live lesson marked as completed.",
            "success"
        );


    } catch (error) {

        console.error(
            "Teacher completion failed:",
            error
        );

        showMessage(
            "teacher-completion-message",
            "Could not update completion. Check Firestore rules.",
            "error"
        );

    }

}


// ==========================================
// LOAD MONTH LESSONS
// ==========================================

export async function loadStudentLessonEditor(
    email,
    selectedMonth = 1
) {

    currentStudentEmail = email;

    currentMonthNumber = Number(selectedMonth) || 1;

    currentLessonNumber = 1;


    if (!currentStudentEmail) return;


    element("lesson-management").hidden = false;

    element("admin-month-select").value =
        String(currentMonthNumber);


    showMessage(
        "legacy-import-message",
        "Ready to manage this student's lessons."
    );


    const monthReference = doc(
        db,
        "students",
        currentStudentEmail,
        "months",
        monthId()
    );


    try {

        // Ensure the monthly document exists.
        await setDoc(
            monthReference,
            {

                monthNumber: currentMonthNumber,

                title: `Month ${currentMonthNumber}`,

                updatedAt: serverTimestamp()

            },
            { merge: true }
        );


        const requests = Array.from(
            { length: 12 },
            async (_, index) => {

                const number = index + 1;

                const [lessonSnapshot, completionSnapshot] =
                    await Promise.all([

                        getDoc(lessonRef(number)),

                        getDoc(completionRef(number))

                    ]);


                return {

                    number,

                    data: lessonSnapshot.exists()
                        ? lessonSnapshot.data()
                        : null,

                    completion: completionSnapshot.exists()
                        ? completionSnapshot.data()
                        : null

                };

            }
        );


        const results = await Promise.all(requests);

        lessonRecords = new Map();


        results.forEach(item => {

            lessonRecords.set(item.number, {

                data: item.data,

                completion: item.completion

            });

        });


        renderLessonList();

        fillEditor(1);


    } catch (error) {

        console.error(
            "Could not load student lessons:",
            error
        );


        showMessage(
            "lesson-save-message",
            "Unable to load this student's lessons. Check Firestore permissions.",
            "error"
        );

    }

}


// ==========================================
// IMPORT LEGACY STUDENT DATA
// ==========================================

function legacyContentReady(lesson) {

    if (
        !lesson?.pt?.title
        || !lesson?.en?.title
        || !lesson?.pt?.goal
        || !lesson?.en?.goal
    ) {

        return false;

    }


    if (lesson.type === "podcast") {

        return Boolean(
            lesson.podcast?.title
            && isValidHttpUrl(lesson.podcast.url)
        );

    }


    return true;

}


async function importLegacyLessons() {

    const messageId = "legacy-import-message";


    if (!currentStudentEmail) {

        showMessage(
            messageId,
            "Select the student you want to import lessons for.",
            "error"
        );

        return;

    }


    if (currentMonthNumber !== 1) {

        showMessage(
            messageId,
            "Legacy student files can only be imported into Month 1.",
            "error"
        );

        return;

    }


    const config = window.STUDENT_CONFIG;


    if (!config || !Array.isArray(config.lessons)) {

        showMessage(
            messageId,
            "The legacy lesson file is not loaded. Follow the temporary import instructions below.",
            "error"
        );

        return;

    }


    const lessons = Array.from(
        { length: 12 },
        (_, index) => {

            const number = index + 1;

            return config.lessons.find(
                item => Number(item.number) === number
            ) || blankLesson(number);

        }
    );


    const requested = Math.min(
        13,
        Math.max(1, Number(config.unlockedThrough) || 1)
    );


    // Reproduce the original portal's release logic.
    let released = 0;


    for (const lesson of lessons) {

        if (
            lesson.number > requested
            || !legacyContentReady(lesson)
        ) {

            break;

        }

        released = lesson.number;

    }


    if (requested === 13 && released === 12) {

        released = 13;

    }


    // In the old portal, unlockedThrough N meant
    // the activities before N were completed.
    const completedCount = released === 13
        ? 12
        : Math.max(0, Math.min(12, released - 1));


    try {

        const existing = await getDocs(
            collection(
                db,
                "students",
                currentStudentEmail,
                "months",
                monthId(),
                "lessons"
            )
        );


        if (existing.size > 0) {

            const replace = window.confirm(
                "This student's Month 1 already contains lesson records. Importing again will replace the 12 lesson documents and reset their old completion records to match the selected legacy file. Continue?"
            );

            if (!replace) return;

        }


        const importButton = element("import-legacy-lessons");

        importButton.disabled = true;

        importButton.textContent = "Importing...";


        const batch = writeBatch(db);


        // Update monthly record.
        batch.set(
            doc(
                db,
                "students",
                currentStudentEmail,
                "months",
                monthId()
            ),
            {

                monthNumber: 1,

                title: "Month 1",

                status: "in-progress",

                legacyUnlockedThrough: requested,

                legacyImportedAt: serverTimestamp(),

                updatedAt: serverTimestamp()

            },
            { merge: true }
        );


        // Import all 12 lessons and clear old
        // completion records before recreating them.
        for (const lesson of lessons) {

            const number = lesson.number;

            const type = lesson.type || lessonType(number);

            const ref = lessonRef(number);

            const oldCompletionRef = completionRef(number);


            const oldCompletion = await getDoc(
                oldCompletionRef
            );

            if (oldCompletion.exists()) {

                batch.delete(oldCompletionRef);

            }


            const ready = legacyContentReady(lesson);

            const published =
                ready && number <= released;


            batch.set(
                ref,
                {

                    number,

                    type,

                    weekNumber: Math.ceil(number / 3),

                    pt: lesson.pt || blankLanguage(),

                    en: lesson.en || blankLanguage(),

                    podcast: lesson.podcast || {
                        title: "",
                        url: ""
                    },

                    published,

                    createdAt: serverTimestamp(),

                    updatedAt: serverTimestamp(),

                    updatedByEmail: auth.currentUser.email,

                    importedFromLegacy: true

                }
            );


            // Restore the actual completion count
            // encoded in the previous unlockedThrough value.
            if (number <= completedCount) {

                batch.set(
                    oldCompletionRef,
                    {

                        completed: true,

                        completedAt: serverTimestamp(),

                        completedByEmail: auth.currentUser.email,

                        source: "legacy-import"

                    }
                );

            }

        }


        await batch.commit();


        await loadStudentLessonEditor(
            currentStudentEmail,
            1
        );


        showMessage(
            messageId,
            `Successfully imported 12 lessons. Restored ${completedCount} previously completed activities and published ${released} available activities.`,
            "success"
        );


    } catch (error) {

        console.error(
            "Legacy import failed:",
            error
        );


        showMessage(
            messageId,
            "Import failed. Check that the administrator can access Firestore and try again.",
            "error"
        );

    } finally {

        const importButton = element("import-legacy-lessons");

        importButton.disabled = false;

        importButton.textContent = "Import existing lessons";

    }

}


// ==========================================
// EVENT LISTENERS
// ==========================================

export function setupLessonEditor() {

    if (editorInitialised) return;


    element("admin-month-select").addEventListener(
        "change",
        async event => {

            const month = Number(event.target.value);

            await loadStudentLessonEditor(
                currentStudentEmail,
                month
            );

        }
    );


    element("admin-lesson-list").addEventListener(
        "click",
        event => {

            const button = event.target.closest(
                "[data-lesson-number]"
            );

            if (!button) return;


            const number = Number(
                button.dataset.lessonNumber
            );


            fillEditor(number);

        }
    );


    element("admin-lesson-form").addEventListener(
        "submit",
        saveLesson
    );


    element("teacher-complete-button").addEventListener(
        "click",
        toggleTeacherCompletion
    );


    element("import-legacy-lessons").addEventListener(
        "click",
        importLegacyLessons
    );


    editorInitialised = true;

}


// ==========================================
// RESET EDITOR
// ==========================================

export function resetStudentLessonEditor() {

    currentStudentEmail = null;

    currentMonthNumber = 1;

    currentLessonNumber = 1;

    lessonRecords.clear();


    element("admin-lesson-list").innerHTML = `
    <p class="admin-empty">
      Select a student to load their lessons.
    </p>
  `;


    showMessage(
        "lesson-save-message",
        ""
    );


    showMessage(
        "legacy-import-message",
        ""
    );

}
