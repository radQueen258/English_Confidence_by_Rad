
import { auth, db, ADMIN_EMAIL } from "./firebase.js";


import {
    setupLessonEditor,
    loadStudentLessonEditor,
    resetStudentLessonEditor
} from "./lesson-editor.js";


import {
    signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


// ==========================================
// ELEMENTS
// ==========================================

const panel = document.getElementById("admin-panel");

const adminEmailLabel =
    document.getElementById("admin-email-label");

const inviteForm =
    document.getElementById("student-invite-form");

const studentNameInput =
    document.getElementById("student-name");

const studentEmailInput =
    document.getElementById("student-email");

const inviteButton =
    document.getElementById("invite-student-button");

const inviteMessage =
    document.getElementById("invite-message");

const searchInput =
    document.getElementById("student-search");

const studentsList =
    document.getElementById("admin-students-list");

const totalStudents =
    document.getElementById("total-students");

const activeStudents =
    document.getElementById("active-students");

const pausedStudents =
    document.getElementById("paused-students");

const detailPanel =
    document.getElementById("admin-student-detail");

const logoutButton =
    document.getElementById("admin-sign-out");


// ==========================================
// STATE
// ==========================================

let students = [];

let selectedStudentEmail = null;

let unsubscribeStudents = null;

let listenersAttached = false;


// ==========================================
// HELPERS
// ==========================================

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


function normaliseEmail(email) {

    return String(email || "")
        .trim()
        .toLowerCase();

}


function formatDate(timestamp) {

    if (!timestamp || typeof timestamp.toDate !== "function") {
        return "Not available";
    }

    return timestamp.toDate().toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


function statusLabel(status) {

    const labels = {
        active: "Active",
        paused: "Paused",
        revoked: "Revoked"
    };

    return labels[status] || "Unknown";

}


function showInviteMessage(message, type = "info") {

    inviteMessage.textContent = message;

    inviteMessage.dataset.type = type;

}


// ==========================================
// DASHBOARD COUNTERS
// ==========================================

function updateDashboardStats() {

    const total = students.length;

    const active = students.filter(
        student => student.status === "active"
    ).length;

    const paused = students.filter(
        student => student.status === "paused"
    ).length;

    totalStudents.textContent = total;

    activeStudents.textContent = active;

    pausedStudents.textContent = paused;

}


// ==========================================
// STUDENT DIRECTORY
// ==========================================

function renderStudents() {

    const searchTerm = normaliseEmail(searchInput.value);

    const filteredStudents = students.filter(student => {

        const searchable = [
            student.name,
            student.email
        ].join(" ").toLowerCase();

        return searchable.includes(searchTerm);

    });


    updateDashboardStats();


    if (!filteredStudents.length) {

        studentsList.innerHTML = `
      <div class="admin-empty">
        ${
            students.length
                ? "No students match your search."
                : "Your student directory is empty. Invite your first student to get started."
        }
      </div>
    `;

        return;
    }


    studentsList.innerHTML = filteredStudents.map(student => {

        const email = escapeHTML(student.email);

        const name = escapeHTML(student.name);

        const status = escapeHTML(student.status);

        const buttonText =
            student.status === "active"
                ? "Pause access"
                : "Activate access";

        const nextStatus =
            student.status === "active"
                ? "pause"
                : "activate";

        const selected =
            selectedStudentEmail === student.email
                ? " selected"
                : "";


        return `

      <article class="admin-student-row${selected}">

        <div class="student-avatar">
          ${name.charAt(0).toUpperCase() || "S"}
        </div>

        <div class="student-row-info">

          <strong>${name}</strong>

          <span>${email}</span>

          <span class="admin-status status-${status}">
            ${statusLabel(student.status)}
          </span>

        </div>


        <div class="student-row-actions">

          <button
            type="button"
            class="student-action-button"
            data-admin-action="view"
            data-email="${email}"
          >
            View
          </button>

          ${
            student.status !== "revoked"
                ? `
                <button
                  type="button"
                  class="student-action-button"
                  data-admin-action="${nextStatus}"
                  data-email="${email}"
                >
                  ${buttonText}
                </button>
              `
                : `
                <button
                  type="button"
                  class="student-action-button"
                  data-admin-action="activate"
                  data-email="${email}"
                >
                  Restore
                </button>
              `
        }

          ${
            student.status !== "revoked"
                ? `
                <button
                  type="button"
                  class="student-action-button danger"
                  data-admin-action="revoke"
                  data-email="${email}"
                >
                  Revoke
                </button>
              `
                : ""
        }

        </div>

      </article>

    `;

    }).join("");


    renderStudentDetails();

}


// ==========================================
// SELECTED STUDENT DETAILS
// ==========================================

function renderStudentDetails() {

    const student = students.find(
        item => item.email === selectedStudentEmail
    );


    if (!student) {

        detailPanel.hidden = true;

        return;
    }


    detailPanel.hidden = false;

    document.getElementById("detail-student-name").textContent =
        student.name;

    document.getElementById("detail-student-email").textContent =
        student.email;

    document.getElementById("detail-student-status").textContent =
        statusLabel(student.status);

    document.getElementById("detail-student-status").className =
        `admin-status status-${student.status}`;

    document.getElementById("detail-access-value").textContent =
        statusLabel(student.status);

    document.getElementById("detail-month-value").textContent =
        `Month ${Number(student.currentMonth) || 1}`;

    document.getElementById("detail-created-value").textContent =
        formatDate(student.createdAt);

}


// ==========================================
// CREATE STUDENT
// ==========================================

async function createStudent(event) {

    event.preventDefault();

    const name = studentNameInput.value.trim();

    const email = normaliseEmail(studentEmailInput.value);


    if (!name || !email) {

        showInviteMessage(
            "Please complete both fields.",
            "error"
        );

        return;
    }


    if (name.length > 100) {

        showInviteMessage(
            "The student's name is too long.",
            "error"
        );

        return;
    }


    const emailPattern =
        /^[^\s@]+@gmail\.com$/i;

    if (!emailPattern.test(email)) {

        showInviteMessage(
            "Please enter a valid Gmail address ending in @gmail.com.",
            "error"
        );

        return;
    }


    if (email === ADMIN_EMAIL.toLowerCase()) {

        showInviteMessage(
            "Your administrator account cannot be added as a student.",
            "error"
        );

        return;
    }


    inviteButton.disabled = true;

    showInviteMessage(
        "Creating the student's personal account..."
    );


    try {

        const studentRef = doc(
            db,
            "students",
            email
        );

        const invitationRef = doc(
            db,
            "invitations",
            email
        );

        const monthRef = doc(
            db,
            "students",
            email,
            "months",
            "month-1"
        );


        // Check whether this student already exists.
        const existingStudent = await getDoc(studentRef);

        if (existingStudent.exists()) {

            showInviteMessage(
                "This student already exists in your directory.",
                "error"
            );

            return;
        }


        // An invitation might already exist because
        // we manually created a test invitation earlier.
        // We can safely adopt that invitation here.
        const existingInvitation = await getDoc(invitationRef);

        const previousInvitation = existingInvitation.exists()
            ? existingInvitation.data()
            : {};


        const allowedStatuses = [
            "active",
            "paused",
            "revoked"
        ];

        const status = allowedStatuses.includes(
            previousInvitation.status
        )
            ? previousInvitation.status
            : "active";


        // Keep all three database records in sync.
        const batch = writeBatch(db);


        // Invitation
        const invitationData = {
            email,
            name,
            status,
            updatedAt: serverTimestamp()
        };

        if (!existingInvitation.exists()) {
            invitationData.createdAt = serverTimestamp();
        }

        batch.set(
            invitationRef,
            invitationData,
            { merge: true }
        );


        // Student profile
        batch.set(studentRef, {

            email,
            name,
            status,

            currentMonth: 1,
            currentMonthId: "month-1",

            preferredLanguage: "pt",

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()

        });


        // First month record
        batch.set(monthRef, {

            monthNumber: 1,
            title: "Month 1",

            status: "draft",

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()

        }, { merge: true });


        await batch.commit();


        inviteForm.reset();

        showInviteMessage(
            "Student created successfully! Their Google account can now access the portal.",
            "success"
        );


        selectedStudentEmail = email;
        await loadStudentLessonEditor(email, 1);

    } catch (error) {

        console.error("Student creation failed:", error);

        showInviteMessage(
            error.code === "permission-denied"
                ? "Permission denied. Check that the new Firestore security rules have been published."
                : "We could not create the student. Please check your connection and try again.",
            "error"
        );

    } finally {

        inviteButton.disabled = false;

    }

}


// ==========================================
// CHANGE ACCESS STATUS
// ==========================================

async function changeStudentStatus(email, newStatus) {

    const student = students.find(
        item => item.email === email
    );

    if (!student) return;


    if (newStatus === "revoked") {

        const confirmed = window.confirm(
            `Revoke portal access for ${student.name}? Their learning history will remain in the database.`
        );

        if (!confirmed) return;

    }


    try {

        const batch = writeBatch(db);


        const invitationRef = doc(
            db,
            "invitations",
            email
        );

        const studentRef = doc(
            db,
            "students",
            email
        );


        batch.update(invitationRef, {

            status: newStatus,

            updatedAt: serverTimestamp()

        });


        batch.update(studentRef, {

            status: newStatus,

            updatedAt: serverTimestamp()

        });


        await batch.commit();


        showInviteMessage(
            `${student.name}'s access is now ${newStatus}.`,
            "success"
        );


    } catch (error) {

        console.error("Student status update failed:", error);

        showInviteMessage(
            "We could not update this student's access. Please try again.",
            "error"
        );

    }

}


// ==========================================
// BUTTON ACTIONS
// ==========================================

async function handleAdminAction(event) {

    const button = event.target.closest(
        "[data-admin-action]"
    );

    if (!button) return;


    const action = button.dataset.adminAction;

    const email = button.dataset.email;

    if (!email) return;


    if (action === "view") {

        selectedStudentEmail = email;

        renderStudents();

        await loadStudentLessonEditor(email, 1);

        detailPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        return;
    }


    if (action === "pause") {

        await changeStudentStatus(email, "paused");

        return;
    }


    if (action === "activate") {

        await changeStudentStatus(email, "active");

        return;
    }


    if (action === "revoke") {

        await changeStudentStatus(email, "revoked");

    }

}


// ==========================================
// REAL-TIME STUDENT DIRECTORY
// ==========================================

function listenToStudents() {

    if (unsubscribeStudents) {
        unsubscribeStudents();
    }


    const studentsQuery = query(

        collection(db, "students"),

        orderBy("createdAt", "desc")

    );


    unsubscribeStudents = onSnapshot(

        studentsQuery,

        snapshot => {

            students = snapshot.docs.map(document => {

                return {
                    ...document.data(),
                    email: document.id
                };

            });


            renderStudents();

        },

        error => {

            console.error(
                "Student directory listener failed:",
                error
            );

            studentsList.innerHTML = `
        <p class="admin-empty">
          Student records could not be loaded.
          Please check Firestore permissions.
        </p>
      `;

        }

    );

}


// ==========================================
// INITIALISE ADMIN DASHBOARD
// ==========================================

export async function initAdminDashboard() {

    const user = auth.currentUser;


    if (!user || !user.emailVerified) {

        throw new Error(
            "A verified administrator account is required."
        );

    }


    if (normaliseEmail(user.email) !== ADMIN_EMAIL.toLowerCase()) {

        throw new Error(
            "This account does not have administrator privileges."
        );

    }


    panel.hidden = false;

    adminEmailLabel.textContent = user.email;


    // Attach event listeners only once.
    if (!listenersAttached) {

        inviteForm.addEventListener(
            "submit",
            createStudent
        );

        searchInput.addEventListener(
            "input",
            renderStudents
        );

        panel.addEventListener(
            "click",
            handleAdminAction
        );

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    await signOut(auth);

                } catch (error) {

                    console.error(
                        "Administrator logout failed:",
                        error
                    );

                    showInviteMessage(
                        "Could not sign out. Please try again.",
                        "error"
                    );

                }

            }
        );

        setupLessonEditor();


        listenersAttached = true;

    }


    listenToStudents();

}


// ==========================================
// CLEAN UP WHEN ADMIN LOGS OUT
// ==========================================

export function disposeAdminDashboard() {

    if (unsubscribeStudents) {

        unsubscribeStudents();

        unsubscribeStudents = null;

    }


    if (panel) {

        panel.hidden = true;

    }

    resetStudentLessonEditor();

    students = [];

    selectedStudentEmail = null;

}
