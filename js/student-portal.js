
import { auth, db } from "./firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


// ==========================================
// LANGUAGE DICTIONARY
// ==========================================

const dictionary = {

    pt: {
        navJourney: "A minha jornada",
        navMethod: "O método",

        heroEyebrow: "O TEU ESPAÇO DE APRENDIZAGEM",
        heroTitle1: "A tua voz.",
        heroTitle2: "O teu ritmo.",
        heroBody: "Não precisas de falar perfeitamente para começares. Cada conversa é mais um passo para te expressares com confiança.",
        heroButton: "Ver a minha jornada",
        heroTag: "Feito à tua medida",
        heroSub: "A tua evolução merece ser vista.",

        overviewKicker: "VISÃO GERAL",
        overviewTitle: "Um mês de evolução.",
        overviewNote: "O teu percurso, sempre à vista.",

        monthlyPlan: "PLANO MENSAL",
        progressCaption: "do percurso concluído",
        activities: "atividades concluídas",

        weeks: "semanas",
        weeksDesc: "Uma etapa de cada vez",
        liveSessions: "conversas ao vivo",
        liveDesc: "30 minutos por sessão",
        selfStudy: "práticas individuais",
        selfDesc: "Ouvir, compreender, crescer",

        journeyKicker: "O TEU PERCURSO",
        journeyTitle: "Pequenos passos.<br/>Grandes mudanças.",

        done: "Concluída",
        available: "Disponível",
        locked: "Bloqueada",

        unlockMessage: "Cada nova atividade fica disponível quando terminares a anterior e a tua professora a desbloquear.",

        methodKicker: "A NOSSA FORMA DE APRENDER",
        methodTitle: "Menos medo.<br/><em>Mais voz.</em>",
        methodIntro: "Não é sobre memorizar regras sem fim. É sobre usar o inglês para contar histórias, partilhar ideias e viver novas experiências.",

        method1Title: "Conversa real",
        method1Desc: "Duas sessões individuais por semana, com espaço para errar e voltar a tentar.",
        method2Title: "Escuta activa",
        method2Desc: "Uma actividade semanal de escuta e compreensão, feita ao teu ritmo.",
        method3Title: "Progresso visível",
        method3Desc: "As sessões concluídas e a próxima etapa ficam sempre claras nesta página.",

        footerLine: "A tua voz tem lugar no mundo.",

        week: "SEMANA",
        weekSub: "Duas conversas + um exercício de escuta",
        live: "Conversa ao vivo",
        podcast: "Escuta individual",

        nextLesson: "Próxima etapa",
        privateTopic: "O tema será revelado quando esta sessão ficar disponível.",

        goal: "O OBJECTIVO",
        words: "PALAVRAS PARA USAR",
        phrases: "EXPRESSÕES ÚTEIS",
        discuss: "VAMOS CONVERSAR SOBRE",

        podcastLabel: "O TEU PODCAST DA SEMANA",
        podcastInstructions: "Ouve com atenção e prepara-te para partilhar o que compreendeste na próxima conversa.",
        listen: "Ouvir o podcast",

        lessonOpen: "A TUA ETAPA ACTUAL",
        finishedLabel: "ETAPA CONCLUÍDA",

        sessionDuration: "30 MIN · INDIVIDUAL",
        selfDuration: "EXERCÍCIO AUTÓNOMO",

        weekDone: "Concluídas",
        weekReady: "Disponível agora",
        weekLocked: "Em breve",

        finishedAll: "Todas as atividades foram concluídas. Parabéns!",

        markComplete: "Marcar como concluída",
        completeConfirm: "Confirmas que terminaste esta atividade de escuta?",
        completeSuccess: "Excelente! A tua atividade foi concluída.",
        teacherWillComplete: "A tua professora marcará esta sessão como concluída depois da aula.",
        completedByYou: "Esta atividade foi concluída por ti.",

        noPodcast: "O link estará disponível em breve.",
        noLessons: "Ainda não existem aulas publicadas para este mês.",
        month: "MÊS",
        pausedTitle: "O teu acesso às novas aulas está pausado.",
        pausedMessage: "Podes continuar a rever as aulas que já concluíste. Contacta a tua professora para tratar da renovação.",
        loadError: "Não foi possível carregar as tuas aulas. Atualiza a página ou contacta a tua professora.",
        history: "HISTÓRICO DE APRENDIZAGEM",
        signOut: "Terminar sessão",
        completionError: "Não foi possível guardar a conclusão. Tenta novamente."
    },


    en: {
        navJourney: "My journey",
        navMethod: "Our method",

        heroEyebrow: "YOUR PERSONAL LEARNING SPACE",
        heroTitle1: "Your voice.",
        heroTitle2: "Your pace.",
        heroBody: "You don't have to speak perfectly to begin. Every conversation is another step towards expressing yourself with confidence.",
        heroButton: "Explore my journey",
        heroTag: "Made just for you",
        heroSub: "Your progress deserves to be seen.",

        overviewKicker: "OVERVIEW",
        overviewTitle: "One month of growth.",
        overviewNote: "Your journey, always in sight.",

        monthlyPlan: "MONTHLY PLAN",
        progressCaption: "of your journey completed",
        activities: "activities completed",

        weeks: "weeks",
        weeksDesc: "One step at a time",
        liveSessions: "live conversations",
        liveDesc: "30 minutes per session",
        selfStudy: "independent practices",
        selfDesc: "Listen, understand, grow",

        journeyKicker: "YOUR JOURNEY",
        journeyTitle: "Small steps.<br/>Big changes.",

        done: "Completed",
        available: "Available",
        locked: "Locked",

        unlockMessage: "Your next activity becomes available when you finish the previous one and your teacher unlocks it.",

        methodKicker: "HOW WE LEARN",
        methodTitle: "Less fear.<br/><em>More voice.</em>",
        methodIntro: "This isn't about memorising endless rules. It's about using English to tell stories, share ideas and explore new experiences.",

        method1Title: "Real conversations",
        method1Desc: "Two individual sessions every week, with room to make mistakes and try again.",
        method2Title: "Active listening",
        method2Desc: "One weekly listening and comprehension activity, at your own pace.",
        method3Title: "Visible progress",
        method3Desc: "Your completed sessions and next step are always clear on this page.",

        footerLine: "Your voice belongs in the world.",

        week: "WEEK",
        weekSub: "Two conversations + one listening exercise",
        live: "Live conversation",
        podcast: "Independent listening",

        nextLesson: "Next step",
        privateTopic: "The topic will be revealed when this session becomes available.",

        goal: "THE GOAL",
        words: "WORDS TO USE",
        phrases: "USEFUL PHRASES",
        discuss: "LET'S TALK ABOUT",

        podcastLabel: "YOUR PODCAST THIS WEEK",
        podcastInstructions: "Listen closely and get ready to share what you understood in your next conversation.",
        listen: "Listen to the podcast",

        lessonOpen: "YOUR CURRENT STEP",
        finishedLabel: "COMPLETED STEP",

        sessionDuration: "30 MIN · ONE-TO-ONE",
        selfDuration: "INDEPENDENT EXERCISE",

        weekDone: "Completed",
        weekReady: "Available now",
        weekLocked: "Coming soon",

        finishedAll: "All activities are complete. Well done!",

        markComplete: "Mark as completed",
        completeConfirm: "Have you finished this listening activity?",
        completeSuccess: "Excellent! Your activity has been completed.",
        teacherWillComplete: "Your teacher will mark this session as completed after your lesson.",
        completedByYou: "You have completed this activity.",

        noPodcast: "The link will be available soon.",
        noLessons: "There are no published lessons for this month yet.",
        month: "MONTH",
        pausedTitle: "Your access to new lessons is paused.",
        pausedMessage: "You can still revisit the lessons you have completed. Please contact your teacher about renewal.",
        loadError: "Your lessons could not be loaded. Refresh the page or contact your teacher.",
        history: "LEARNING HISTORY",
        signOut: "Sign out",
        completionError: "We couldn't save your completion. Please try again."
    }

};


// ==========================================
// STATE
// ==========================================

let currentUser = null;

let currentProfile = null;

let accessStatus = "active";

let language = "pt";

let currentMonth = 1;

let monthRecords = [];

let lessonRecords = new Map();

let portalInitialised = false;

let loadingMonth = false;

let completionWatchers = [];

let invitationUnsubscribe = null;


// ==========================================
// FIRESTORE REFERENCES
// ==========================================

function studentRef() {

    return doc(
        db,
        "students",
        currentUser.email.toLowerCase()
    );

}


function monthRef(monthNumber) {

    return doc(
        db,
        "students",
        currentUser.email.toLowerCase(),
        "months",
        `month-${monthNumber}`
    );

}


function lessonRef(monthNumber, lessonNumber) {

    return doc(
        db,
        "students",
        currentUser.email.toLowerCase(),
        "months",
        `month-${monthNumber}`,
        "lessons",
        `lesson-${lessonNumber}`
    );

}


function completionRef(monthNumber, lessonNumber) {

    return doc(
        db,
        "students",
        currentUser.email.toLowerCase(),
        "months",
        `month-${monthNumber}`,
        "lessons",
        `lesson-${lessonNumber}`,
        "completions",
        "status"
    );

}


// ==========================================
// HELPERS
// ==========================================

function element(id) {

    return document.getElementById(id);

}


function escapeHTML(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );

}


function validUrl(value) {

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


function expectedLessonType(number) {

    return number % 3 === 0
        ? "podcast"
        : "live";

}


function languageContent(lesson) {

    return lesson?.[language]
        || lesson?.pt
        || {};

}


function vocabularyEntry(entry) {

    if (Array.isArray(entry)) {

        return {
            term: entry[0] || "",
            meaning: entry[1] || ""
        };

    }

    return {
        term: entry?.term || "",
        meaning: entry?.meaning || ""
    };

}


function listItems(items, className) {

    if (!Array.isArray(items)) return "";

    return items.map(item => {

        return `
      <li class="${className}">
        ${escapeHTML(item)}
      </li>
    `;

    }).join("");

}


// ==========================================
// LANGUAGE RENDERING
// ==========================================

function applyLanguage() {

    const text = dictionary[language];

    document.documentElement.lang = language;

    document.title = language === "pt"
        ? "English Confidence — O teu espaço"
        : "English Confidence — Your Space";


    document.querySelectorAll("[data-i18n]").forEach(node => {

        const value = text[node.dataset.i18n];

        if (value === undefined) return;

        if (
            node.dataset.i18n === "journeyTitle"
            || node.dataset.i18n === "methodTitle"
        ) {

            node.innerHTML = value;

        } else {

            node.textContent = value;

        }

    });


    element("lang-pt").classList.toggle(
        "active",
        language === "pt"
    );

    element("lang-en").classList.toggle(
        "active",
        language === "en"
    );

    element("lang-pt").setAttribute(
        "aria-pressed",
        String(language === "pt")
    );

    element("lang-en").setAttribute(
        "aria-pressed",
        String(language === "en")
    );

    // Update the student account controls in the selected language.
    element("student-sign-out").textContent =
        dictionary[language].signOut;

    element("student-month-label").textContent =
        `${dictionary[language].month} ${currentMonth}`;

// Keep the paused-account notice bilingual.
    if (accessStatus === "paused") {

        element("student-notice-title").textContent =
            dictionary[language].pausedTitle;

        element("student-notice-message").textContent =
            dictionary[language].pausedMessage;

    }

}


// ==========================================
// LESSON CONTENT
// ==========================================

function renderLessonDetails(record, text) {

    const lesson = record.data;

    const content = languageContent(lesson);

    const completed = record.completed;

    const isPodcast = lesson.type === "podcast";


    if (isPodcast) {

        const podcast = lesson.podcast || {};

        const link = validUrl(podcast.url)
            ? `
        <a
          href="${escapeHTML(podcast.url)}"
          class="podcast-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${text.listen}
          <span aria-hidden="true">↗</span>
        </a>
      `
            : `<p class="detail-hint">${text.noPodcast}</p>`;


        const completionAction = completed

            ? `
        <p class="student-completed-note">
          ✓ ${text.completedByYou}
        </p>
      `

            : accessStatus === "active"

                ? `
          <button
            type="button"
            class="student-complete-button"
            data-complete-lesson="${record.number}"
          >
            ${text.markComplete} ↗
          </button>
        `

                : "";


        return `

      <div class="lesson-details podcast-details">

        <div class="detail-head">

          <div class="detail-heading-icon">♫</div>

          <div>

            <span class="content-eyebrow">
              ${text.podcastLabel}
            </span>

            <h4>${escapeHTML(podcast.title || "")}</h4>

          </div>

        </div>

        <p>${escapeHTML(content.goal || "")}</p>

        <p class="detail-hint">
          ${text.podcastInstructions}
        </p>

        ${link}

        ${completionAction}

      </div>

    `;

    }


    // Grammar and conversation lesson.

    const vocabulary = Array.isArray(content.vocabulary)

        ? content.vocabulary.map(entry => {

            const pair = vocabularyEntry(entry);

            return `
          <li>
            <span>${escapeHTML(pair.term)}</span>
            <small>${escapeHTML(pair.meaning)}</small>
          </li>
        `;

        }).join("")

        : "";


    const teacherNotice = !completed

        ? `
      <p class="teacher-completion-note">
        ✦ ${text.teacherWillComplete}
      </p>
    `

        : "";


    return `

    <div class="lesson-details">

      <div class="lesson-goal">

        <span class="content-eyebrow">
          ${text.goal}
        </span>

        <p>
          ${escapeHTML(content.goal || "")}
        </p>

      </div>


      <div class="lesson-columns">

        <div class="lesson-column">

          <div class="column-icon">✳</div>

          <h4>${text.words}</h4>

          <ul class="vocab-list">
            ${vocabulary}
          </ul>

        </div>


        <div class="lesson-column">

          <div class="column-icon">↗</div>

          <h4>${text.phrases}</h4>

          <ul class="phrases-list">
            ${listItems(content.phrases, "phrase")}
          </ul>

        </div>

      </div>


      <div class="question-box">

        <span class="content-eyebrow">
          ${text.discuss}
        </span>

        <ol>
          ${listItems(content.prompts, "prompt")}
        </ol>

      </div>

      ${teacherNotice}

    </div>

  `;

}


// ==========================================
// LESSON CARD
// ==========================================

function renderLessonCard(record, text) {

    const number = record.number;

    const lesson = record.data;

    const completed = record.completed;

    const isPodcast = record.type === "podcast";

    const unlocked = Boolean(
        lesson && lesson.published
    );

    const state = completed
        ? "done"
        : unlocked
            ? "current"
            : "locked";


    const typeLabel = isPodcast
        ? text.podcast
        : text.live;

    const duration = isPodcast
        ? text.selfDuration
        : text.sessionDuration;

    const icon = isPodcast ? "♫" : "✳";

    const status = completed
        ? text.done
        : unlocked
            ? text.available
            : text.locked;


    const content = languageContent(lesson || {});

    const heading = unlocked
        ? escapeHTML(content.title || `Lesson ${number}`)
        : text.nextLesson;

    const subtitle = unlocked
        ? escapeHTML(content.subtitle || "")
        : text.privateTopic;


    return `

    <article class="lesson-card ${state} ${
        isPodcast ? "listen-card" : ""
    }">

      <div class="lesson-head">

        <div class="number-block">
          <span>${String(number).padStart(2, "0")}</span>
        </div>


        <div class="lesson-headcopy">

          <span class="lesson-kind">

            ${icon} &nbsp; ${typeLabel}

            <span class="kind-separator">/</span>

            ${duration}

          </span>

          <h3>${heading}</h3>

          <p>${subtitle}</p>

        </div>


        <span class="lesson-state ${state}">

          ${completed ? "✓" : unlocked ? "✦" : "●"}

          <span>${status}</span>

        </span>

      </div>


      ${
        unlocked
            ? renderLessonDetails(record, text)
            : ""
    }

    </article>

  `;

}


// ==========================================
// WEEK RENDERING
// ==========================================

function renderWeeks() {

    const text = dictionary[language];

    const container = element("weeks-container");


    if (!lessonRecords.size) {

        container.innerHTML = `
      <div class="admin-empty">
        ${text.noLessons}
      </div>
    `;

        return;

    }


    const allLessons = Array.from(
        { length: 12 },
        (_, index) => {

            return lessonRecords.get(index + 1) || {

                number: index + 1,

                type: expectedLessonType(index + 1),

                data: null,

                completion: null,

                completed: false

            };

        }
    );


    const weeks = [0, 1, 2, 3].map(index => {

        const activities = allLessons.slice(
            index * 3,
            index * 3 + 3
        );


        const completedCount = activities.filter(
            activity => activity.completed
        ).length;


        const status = completedCount === 3

            ? text.weekDone

            : activities.some(
                activity => activity.data?.published
            )

                ? text.weekReady

                : text.weekLocked;


        return `

      <section class="week-block">

        <div class="week-header">

          <div class="week-left">

            <div class="week-counter">
              0${index + 1}
            </div>

            <div>

              <span class="week-topline">

                ${text.week}

                <span>—</span>

                ${String(index * 3 + 1).padStart(2, "0")}

                –

                ${String(index * 3 + 3).padStart(2, "0")}

              </span>

              <p>${text.weekSub}</p>

            </div>

          </div>


          <div class="week-status">

            ${status}

            <span aria-hidden="true">↗</span>

          </div>

        </div>


        <div class="lesson-stack">

          ${activities.map(
            activity => renderLessonCard(activity, text)
        ).join("")}

        </div>

      </section>

    `;

    });


    container.innerHTML = weeks.join("");

}


// ==========================================
// PROGRESS BAR
// ==========================================

function renderProgress() {

    const completed = Array.from(
        lessonRecords.values()
    ).filter(record => record.completed).length;


    const percentage = Math.round(
        completed / 12 * 100
    );


    element("progress-percent").innerHTML =
        `${percentage}<span>%</span>`;


    element("progress-count").textContent =
        `${completed} / 12`;


    element("progress-fill").style.width =
        `${percentage}%`;


    const text = dictionary[language];


    if (completed === 12) {

        element("unlock-message").textContent =
            text.finishedAll;

    } else {

        element("unlock-message").textContent =
            text.unlockMessage;

    }

}


function stopCompletionWatchers() {

    completionWatchers.forEach(unsubscribe => {
        unsubscribe();
    });

    completionWatchers = [];

}


function watchMonthCompletions(monthNumber) {

    stopCompletionWatchers();

    let initialSnapshots = 0;

    let ready = false;


    for (let number = 1; number <= 12; number++) {

        const unsubscribe = onSnapshot(

            completionRef(monthNumber, number),

            snapshot => {

                // Ignore the initial snapshots.
                // The lesson data was already loaded separately.
                if (!ready) {

                    initialSnapshots++;

                    if (initialSnapshots >= 12) {
                        ready = true;
                    }

                    return;

                }

                // A teacher or student changed a completion.
                // Reload the month to update progress and unlock
                // the next activity where appropriate.
                loadMonth(monthNumber);

            },

            error => {

                console.warn(
                    `Completion listener ${number}:`,
                    error
                );

            }

        );


        completionWatchers.push(unsubscribe);

    }

}


// ==========================================
// MONTH CONTENT
// ==========================================

async function loadMonth(monthNumber) {

    if (!currentUser || loadingMonth) return;

    stopCompletionWatchers();

    loadingMonth = true;

    currentMonth = Number(monthNumber);


    element("weeks-container").innerHTML = `
    <p class="student-loading">
      Loading your lessons...
    </p>
  `;


    try {

        const requests = Array.from(
            { length: 12 },
            async (_, index) => {

                const number = index + 1;

                const completionSnapshot = await getDoc(
                    completionRef(currentMonth, number)
                );


                let lessonSnapshot = null;

                try {

                    lessonSnapshot = await getDoc(
                        lessonRef(currentMonth, number)
                    );

                } catch (error) {

                    // Locked lessons intentionally deny student access.
                    // This is expected for activities that are not yet
                    // available or for unfinished lessons during a pause.
                    if (error.code !== "permission-denied") {
                        throw error;
                    }

                }


                const data = lessonSnapshot?.exists()
                    ? lessonSnapshot.data()
                    : null;


                const completion = completionSnapshot.exists()
                    ? completionSnapshot.data()
                    : null;


                return {

                    number,

                    type: data?.type
                        || expectedLessonType(number),

                    data,

                    completion,

                    completed: completion?.completed === true

                };

            }
        );


        const results = await Promise.all(requests);


        lessonRecords = new Map();


        results.forEach(record => {

            lessonRecords.set(
                record.number,
                record
            );

        });


        // Show the selected month.
        element("student-month-label").textContent =
            `${dictionary[language].month} ${currentMonth}`;


        // Render all 12 activities.
        render();


    } catch (error) {

        console.error(
            "Student lesson loading failed:",
            error
        );


        element("weeks-container").innerHTML = `
      <div class="student-load-error">
        ${dictionary[language].loadError}
      </div>
    `;

    } finally {

        loadingMonth = false;

        if (currentUser) {

            watchMonthCompletions(currentMonth);

        }

    }
}


// ==========================================
// LOAD AVAILABLE MONTHS
// ==========================================

async function loadStudentMonths() {

    const snapshot = await getDocs(
        collection(
            db,
            "students",
            currentUser.email.toLowerCase(),
            "months"
        )
    );


    monthRecords = snapshot.docs

        .map(monthDocument => {

            const data = monthDocument.data();

            const match = monthDocument.id.match(
                /^month-(\d+)$/
            );

            if (!match) return null;

            return {

                id: monthDocument.id,

                number: Number(data.monthNumber || match[1]),

                title: data.title || `Month ${match[1]}`

            };

        })

        .filter(Boolean)

        .sort((a, b) => a.number - b.number);


    const selector = element("student-month-select");

    selector.innerHTML = "";


    monthRecords.forEach(month => {

        const option = document.createElement("option");

        option.value = String(month.number);

        option.textContent = month.title;

        selector.appendChild(option);

    });


    if (!monthRecords.length) {

        element("weeks-container").innerHTML = `
      <div class="student-load-error">
        ${dictionary[language].noLessons}
      </div>
    `;

        return null;

    }


    const profileMonth =
        Number(currentProfile.currentMonth) || 1;


    const selectedMonth = monthRecords.some(
        month => month.number === profileMonth
    )
        ? profileMonth
        : monthRecords[monthRecords.length - 1].number;


    selector.value = String(selectedMonth);


    return selectedMonth;

}


// ==========================================
// COMPLETE SELF-PACED ACTIVITY
// ==========================================

async function completeSelfPaced(number, button) {

    if (accessStatus !== "active") return;

    const record = lessonRecords.get(number);

    if (
        !record
        || record.type !== "podcast"
        || !record.data?.published
    ) {

        return;

    }


    if (record.completed) return;


    // Confirm that the student really finished the activity.
    const confirmed = window.confirm(
        dictionary[language].completeConfirm
    );

    if (!confirmed) return;


    button.disabled = true;

    button.textContent = "Saving...";


    try {

        const previous = lessonRecords.get(number - 1);


        // The first podcast is lesson 3.
        // Lesson 2 must have been completed by the teacher.
        if (
            !previous
            || !previous.completed
        ) {

            throw new Error(
                "The previous activity must be completed first."
            );

        }


        // Avoid updating an existing completion document.
        const ref = completionRef(
            currentMonth,
            number
        );

        const existing = await getDoc(ref);


        if (existing.exists()) {

            await loadMonth(currentMonth);

            return;

        }


        await setDoc(ref, {

            completed: true,

            completedAt: serverTimestamp(),

            completedByEmail: currentUser.email.toLowerCase()

        });


        await loadMonth(currentMonth);


        window.alert(
            dictionary[language].completeSuccess
        );


    } catch (error) {

        console.error(
            "Self-paced completion failed:",
            error
        );


        if (error.message) {

            window.alert(error.message);

        } else {

            window.alert(
                dictionary[language].completionError
            );

        }


        button.disabled = false;

        button.textContent =
            dictionary[language].markComplete;

    }

}


// ==========================================
// RENDER THE COMPLETE PORTAL
// ==========================================

function render() {

    applyLanguage();

    renderProgress();

    renderWeeks();

}



function watchStudentInvitation() {

    if (invitationUnsubscribe) {
        invitationUnsubscribe();
    }

    const ref = doc(
        db,
        "invitations",
        currentUser.email.toLowerCase()
    );

    invitationUnsubscribe = onSnapshot(

        ref,

        async snapshot => {

            if (!snapshot.exists()) {

                await signOut(auth);

                return;
            }

            const newStatus = snapshot.data().status;

            if (newStatus === "revoked") {

                await signOut(auth);

                return;
            }

            if (
                newStatus !== "active"
                && newStatus !== "paused"
            ) {

                await signOut(auth);

                return;
            }

            if (newStatus !== accessStatus) {

                accessStatus = newStatus;

                const notice = element("student-access-notice");

                notice.hidden = accessStatus !== "paused";

                if (accessStatus === "paused") {

                    element("student-notice-title").textContent =
                        dictionary[language].pausedTitle;

                    element("student-notice-message").textContent =
                        dictionary[language].pausedMessage;

                }

                // Reload the month using the new access status.
                await loadMonth(currentMonth);

            }

        },

        error => {

            console.error(
                "Student invitation monitoring failed:",
                error
            );

        }

    );

}



// ==========================================
// INITIALISE STUDENT PORTAL
// ==========================================

export async function initStudentPortal(
    user,
    invitation
) {

    if (!user || !user.emailVerified) {

        throw new Error(
            "A verified Google account is required."
        );

    }


    currentUser = user;

    accessStatus = invitation.status;


    // Show the existing English Confidence design.
    element("auth-screen").hidden = true;

    element("auth-session").hidden = true;

    element("admin-panel").hidden = true;


    document.querySelector("header.topbar").hidden = false;

    document.querySelector("main").hidden = false;

    document.querySelector("footer.footer").hidden = false;


    // ======================================
    // LOAD PERSONAL PROFILE
    // ======================================

    const profileSnapshot = await getDoc(
        studentRef()
    );


    if (!profileSnapshot.exists()) {

        throw new Error(
            "Your student profile has not been created. Please contact your teacher."
        );

    }


    currentProfile = profileSnapshot.data();


    const name =
        currentProfile.name
        || invitation.name
        || user.displayName
        || "Student";


    element("student-display-name").textContent =
        name;


    element("student-sign-out").textContent =
        dictionary[language].signOut;


    watchStudentInvitation();


    // ======================================
    // PAUSED ACCESS
    // ======================================

    const notice = element("student-access-notice");

    notice.hidden = accessStatus !== "paused";


    if (accessStatus === "paused") {

        element("student-notice-title").textContent =
            dictionary[language].pausedTitle;

        element("student-notice-message").textContent =
            dictionary[language].pausedMessage;

    }


    // ======================================
    // EVENTS
    // ======================================

    if (!portalInitialised) {

        element("lang-pt").addEventListener(
            "click",
            () => {

                language = "pt";

                render();

            }
        );


        element("lang-en").addEventListener(
            "click",
            () => {

                language = "en";

                render();

            }
        );


        element("student-month-select").addEventListener(
            "change",
            async event => {

                await loadMonth(
                    Number(event.target.value)
                );

            }
        );


        element("weeks-container").addEventListener(
            "click",
            async event => {

                const button = event.target.closest(
                    "[data-complete-lesson]"
                );

                if (!button) return;


                const number = Number(
                    button.dataset.completeLesson
                );


                await completeSelfPaced(
                    number,
                    button
                );

            }
        );


        element("student-sign-out").addEventListener(
            "click",
            async () => {

                await signOut(auth);

            }
        );


        portalInitialised = true;

    }


    // ======================================
    // LOAD MONTHLY HISTORY
    // ======================================

    const selectedMonth = await loadStudentMonths();


    if (selectedMonth) {

        await loadMonth(selectedMonth);

    }


    // Show the correct language.
    applyLanguage();

}


// ==========================================
// CLEAN UP ON LOGOUT
// ==========================================

export function disposeStudentPortal() {

    if (invitationUnsubscribe) {

        invitationUnsubscribe();

        invitationUnsubscribe = null;

    }

    stopCompletionWatchers();

    element("student-access-notice").hidden = true;

    currentUser = null;

    currentProfile = null;

    accessStatus = "active";

    monthRecords = [];

    lessonRecords.clear();

    loadingMonth = false;

}
