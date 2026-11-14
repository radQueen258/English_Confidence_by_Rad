
import { auth, db } from "./firebase.js";

import {
    collection,
    collectionGroup,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


// ==========================================
// STATE
// ==========================================

let feedbackUnsubscribe = null;

let renewalUnsubscribe = null;

let listenersReady = false;

let feedbackItems = [];

let renewalItems = [];


// ==========================================
// HELPERS
// ==========================================

function el(id) {
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


function showMessage(id, message, type = "info") {

    const node = el(id);

    node.textContent = message;

    node.dataset.type = type;

}


function formatDate(timestamp) {

    if (!timestamp?.toDate) return "Not available";

    return timestamp.toDate().toLocaleString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function methodName(method) {

    return {
        emola: "e-Mola",
        mpesa: "M-Pesa",
        bim: "BIM"
    }[method] || method;

}


function safeScreenshot(dataUrl) {

    if (
        typeof dataUrl !== "string"
        || !/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)
    ) {

        return "";

    }

    return dataUrl;

}


// ==========================================
// PAYMENT SETTINGS
// ==========================================

function fillPaymentSettings(settings = {}) {

    for (const method of ["emola", "mpesa"]) {

        const data = settings[method] || {};

        el(`${method}-enabled`).checked =
            data.enabled ?? true;

        el(`${method}-recipient`).value =
            data.recipientName || "";

        el(`${method}-number`).value =
            data.number || "";

        el(`${method}-instructions`).value =
            data.instructions || "";

    }


    const bim = settings.bim || {};


    el("bim-enabled").checked =
        bim.enabled ?? true;

    el("bim-bank").value =
        bim.bankName || "Banco Internacional de Moçambique";

    el("bim-account-name").value =
        bim.accountName || "";

    el("bim-account-number").value =
        bim.accountNumber || "";

    el("bim-instructions").value =
        bim.instructions || "";

}


async function loadPaymentSettings() {

    try {

        const snapshot = await getDoc(
            doc(db, "settings", "paymentMethods")
        );


        if (snapshot.exists()) {

            fillPaymentSettings(snapshot.data());

        }

    } catch (error) {

        console.error(
            "Payment settings loading failed:",
            error
        );

        showMessage(
            "payment-settings-message",
            "Could not load payment settings.",
            "error"
        );

    }

}


async function savePaymentSettings(event) {

    event.preventDefault();


    const button = el("save-payment-settings");

    button.disabled = true;

    button.textContent = "Saving...";


    try {

        const settings = {

            emola: {

                enabled: el("emola-enabled").checked,

                recipientName: el("emola-recipient").value.trim(),

                number: el("emola-number").value.trim(),

                instructions: el("emola-instructions").value.trim()

            },


            mpesa: {

                enabled: el("mpesa-enabled").checked,

                recipientName: el("mpesa-recipient").value.trim(),

                number: el("mpesa-number").value.trim(),

                instructions: el("mpesa-instructions").value.trim()

            },


            bim: {

                enabled: el("bim-enabled").checked,

                bankName: el("bim-bank").value.trim(),

                accountName: el("bim-account-name").value.trim(),

                accountNumber: el("bim-account-number").value.trim(),

                instructions: el("bim-instructions").value.trim()

            },

            updatedAt: serverTimestamp(),

            updatedByEmail: auth.currentUser.email

        };


        // Require enough information for every enabled method.
        if (
            settings.emola.enabled
            && (!settings.emola.recipientName || !settings.emola.number)
        ) {

            throw new Error(
                "Complete the e-Mola recipient name and number, or disable e-Mola."
            );

        }


        if (
            settings.mpesa.enabled
            && (!settings.mpesa.recipientName || !settings.mpesa.number)
        ) {

            throw new Error(
                "Complete the M-Pesa recipient name and number, or disable M-Pesa."
            );

        }


        if (
            settings.bim.enabled
            && (!settings.bim.accountName || !settings.bim.accountNumber)
        ) {

            throw new Error(
                "Complete the BIM account holder and account number, or disable BIM."
            );

        }


        if (!Object.values(settings).some(
            value => typeof value === "object"
                && value !== null
                && value.enabled === true
        )) {

            throw new Error(
                "Enable at least one payment method."
            );

        }


        await setDoc(
            doc(db, "settings", "paymentMethods"),
            settings
        );


        showMessage(
            "payment-settings-message",
            "Payment information saved successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Saving payment settings failed:",
            error
        );

        showMessage(
            "payment-settings-message",
            error.message || "Could not save payment settings.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent = "Save payment details ↗";

    }

}


// ==========================================
// FEEDBACK INBOX
// ==========================================

function renderFeedback() {

    const container = el("admin-feedback-list");


    if (!feedbackItems.length) {

        container.innerHTML = `
      <div class="admin-empty">
        No student feedback has been submitted yet.
      </div>
    `;

        return;

    }


    const sorted = [...feedbackItems].sort((a, b) => {

        const first = a.data.submittedAt?.toMillis?.() || 0;

        const second = b.data.submittedAt?.toMillis?.() || 0;

        return second - first;

    });


    container.innerHTML = sorted.map(item => {

        const data = item.data;

        return `

      <article class="stage5-submission-card">

        <div class="stage5-submission-heading">

          <div>

            <p class="admin-section-kicker">
              MONTH ${escapeHTML(data.monthNumber)}
            </p>

            <h3>${escapeHTML(data.studentName)}</h3>

            <p>${escapeHTML(data.email)}</p>

          </div>

          <span class="admin-status status-active">
            Feedback received
          </span>

        </div>


        <div class="feedback-answer">

          <strong>What did the student like?</strong>

          <p>${escapeHTML(data.liked)}</p>

        </div>


        <div class="feedback-answer">

          <strong>What could be improved?</strong>

          <p>${escapeHTML(data.improve)}</p>

        </div>


        <p class="stage5-submission-date">
          Submitted: ${formatDate(data.submittedAt)}
        </p>

      </article>

    `;

    }).join("");

}


// ==========================================
// RENEWAL INBOX
// ==========================================

function renderRenewals() {

    const container = el("admin-renewal-list");


    if (!renewalItems.length) {

        container.innerHTML = `
      <div class="admin-empty">
        No payment submissions have been received yet.
      </div>
    `;

        return;

    }


    const sorted = [...renewalItems].sort((a, b) => {

        const first = a.data.submittedAt?.toMillis?.() || 0;

        const second = b.data.submittedAt?.toMillis?.() || 0;

        return second - first;

    });


    container.innerHTML = sorted.map((item, index) => {

        const data = item.data;

        const status = data.status || "pending";

        const screenshot = safeScreenshot(
            data.screenshotDataUrl
        );


        const actions = status === "pending"

            ? `
        <div class="renewal-admin-actions">

          <button
            type="button"
            class="primary-btn"
            data-renewal-action="approve"
            data-renewal-index="${index}"
          >
            Approve payment ✓
          </button>

          <button
            type="button"
            class="student-action-button danger"
            data-renewal-action="reject"
            data-renewal-index="${index}"
          >
            Reject payment
          </button>

        </div>
      `

            : "";


        return `

      <article class="stage5-submission-card">

        <div class="stage5-submission-heading">

          <div>

            <p class="admin-section-kicker">
              MONTH ${escapeHTML(data.monthNumber)}
              → MONTH ${escapeHTML(data.nextMonthNumber)}
            </p>

            <h3>${escapeHTML(data.studentName)}</h3>

            <p>${escapeHTML(data.email)}</p>

          </div>

          <span class="admin-status status-${
            status === "approved"
                ? "active"
                : status === "rejected"
                    ? "revoked"
                    : "paused"
        }">
            ${escapeHTML(status.toUpperCase())}
          </span>

        </div>


        <div class="renewal-admin-details">

          <span>PAYMENT METHOD</span>

          <strong>${escapeHTML(methodName(data.paymentMethod))}</strong>

          <span>PAYMENT REFERENCE</span>

          <strong>${escapeHTML(data.paymentReference || "Not provided")}</strong>

          <span>SUBMITTED</span>

          <strong>${formatDate(data.submittedAt)}</strong>

          <span>SCREENSHOT SIZE</span>

          <strong>${(Number(data.screenshotBytes || 0) / 1024).toFixed(1)} KB</strong>

        </div>


        ${
            screenshot
                ? `
              <div class="renewal-admin-proof">

                <p>PAYMENT SCREENSHOT</p>

                <a
                  href="${screenshot}"
                  target="_blank"
                  rel="noopener noreferrer"
                >

                  <img
                    src="${screenshot}"
                    alt="Payment proof submitted by ${escapeHTML(data.studentName)}"
                  />

                </a>

              </div>
            `
                : `
              <p class="admin-form-message" data-type="error">
                Screenshot unavailable or invalid.
              </p>
            `
        }


        ${
            data.adminNote
                ? `
              <div class="feedback-answer">
                <strong>Administrator note</strong>
                <p>${escapeHTML(data.adminNote)}</p>
              </div>
            `
                : ""
        }


        ${actions}

      </article>

    `;

    }).join("");

}


// ==========================================
// APPROVE PAYMENT
// ==========================================

async function approveRenewal(item) {

    const data = item.data;


    if (data.status !== "pending") {

        throw new Error(
            "This payment is no longer pending."
        );

    }


    const email = String(data.email || "").toLowerCase();

    const currentMonth = Number(data.monthNumber);

    const nextMonth = Number(data.nextMonthNumber);


    if (
        !email
        || !Number.isInteger(currentMonth)
        || nextMonth !== currentMonth + 1
    ) {

        throw new Error(
            "The renewal information is invalid."
        );

    }


    const confirmed = window.confirm(
        `Approve ${data.studentName}'s payment for Month ${nextMonth}? Their next month will be created and access restored.`
    );

    if (!confirmed) return;


    const batch = writeBatch(db);


    const profileRef = doc(
        db,
        "students",
        email
    );


    const invitationRef = doc(
        db,
        "invitations",
        email
    );


    const nextMonthRef = doc(
        db,
        "students",
        email,
        "months",
        `month-${nextMonth}`
    );


    // Preserve all previous months.
    // Only create or initialise the next month's document.
    batch.set(
        nextMonthRef,
        {

            monthNumber: nextMonth,

            title: `Month ${nextMonth}`,

            status: "draft",

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp()

        },
        { merge: true }
    );


    // Update the student profile.
    batch.update(
        profileRef,
        {

            status: "active",

            currentMonth: nextMonth,

            currentMonthId: `month-${nextMonth}`,

            updatedAt: serverTimestamp()

        }
    );


    // Restore the invitation.
    batch.update(
        invitationRef,
        {

            status: "active",

            updatedAt: serverTimestamp()

        }
    );


    // Record approval.
    batch.update(
        item.ref,
        {

            status: "approved",

            reviewedAt: serverTimestamp(),

            reviewedByEmail: auth.currentUser.email,

            adminNote: ""

        }
    );


    await batch.commit();

}


// ==========================================
// REJECT PAYMENT
// ==========================================

async function rejectRenewal(item) {

    const data = item.data;


    if (data.status !== "pending") {

        throw new Error(
            "This payment is no longer pending."
        );

    }


    const note = window.prompt(
        "Why is this payment being rejected? This message will be visible to the student.",
        "Please upload a clearer payment confirmation."
    );

    if (note === null) return;


    await writeBatchUpdateReject(item.ref, note.trim());

}


async function writeBatchUpdateReject(reference, note) {

    await updateDoc(reference, {

        status: "rejected",

        adminNote: note,

        reviewedAt: serverTimestamp(),

        reviewedByEmail: auth.currentUser.email

    });

}


// ==========================================
// ADMIN ACTION HANDLER
// ==========================================

async function handleRenewalAction(event) {

    const button = event.target.closest(
        "[data-renewal-action]"
    );

    if (!button) return;


    const index = Number(
        button.dataset.renewalIndex
    );


    const action = button.dataset.renewalAction;

    const sorted = [...renewalItems].sort((a, b) => {

        const first = a.data.submittedAt?.toMillis?.() || 0;

        const second = b.data.submittedAt?.toMillis?.() || 0;

        return second - first;

    });


    const item = sorted[index];

    if (!item) return;


    button.disabled = true;


    try {

        if (action === "approve") {

            await approveRenewal(item);

        } else if (action === "reject") {

            await rejectRenewal(item);

        }

    } catch (error) {

        console.error(
            "Renewal action failed:",
            error
        );

        window.alert(
            error.message || "Could not update the payment."
        );

    } finally {

        button.disabled = false;

    }

}


// ==========================================
// REAL-TIME INBOX LISTENERS
// ==========================================

function listenToFeedback() {

    if (feedbackUnsubscribe) {
        feedbackUnsubscribe();
    }


    feedbackUnsubscribe = onSnapshot(

        collectionGroup(db, "feedback"),

        snapshot => {

            feedbackItems = snapshot.docs.map(document => ({

                ref: document.ref,

                id: document.id,

                data: document.data()

            }));


            renderFeedback();

        },

        error => {

            console.error(
                "Feedback inbox failed:",
                error
            );

            el("admin-feedback-list").innerHTML = `
        <p class="admin-empty">
          Feedback could not be loaded. Check the Firestore rules.
        </p>
      `;

        }

    );

}


function listenToRenewals() {

    if (renewalUnsubscribe) {
        renewalUnsubscribe();
    }


    renewalUnsubscribe = onSnapshot(

        collectionGroup(db, "renewals"),

        snapshot => {

            renewalItems = snapshot.docs.map(document => ({

                ref: document.ref,

                id: document.id,

                data: document.data()

            }));


            renderRenewals();

        },

        error => {

            console.error(
                "Payment inbox failed:",
                error
            );

            el("admin-renewal-list").innerHTML = `
        <p class="admin-empty">
          Payment submissions could not be loaded.
          Check the Firestore rules.
        </p>
      `;

        }

    );

}


// ==========================================
// INITIALISE
// ==========================================

export async function setupStage5Admin() {

    if (!auth.currentUser) {

        throw new Error("Administrator login is required.");

    }


    if (!listenersReady) {

        el("payment-settings-form").addEventListener(
            "submit",
            savePaymentSettings
        );

        el("admin-renewal-list").addEventListener(
            "click",
            handleRenewalAction
        );

        listenersReady = true;

    }


    await loadPaymentSettings();

    listenToFeedback();

    listenToRenewals();

}


// ==========================================
// CLEAN UP
// ==========================================

export function disposeStage5Admin() {

    if (feedbackUnsubscribe) {

        feedbackUnsubscribe();

        feedbackUnsubscribe = null;

    }


    if (renewalUnsubscribe) {

        renewalUnsubscribe();

        renewalUnsubscribe = null;

    }


    feedbackItems = [];

    renewalItems = [];

}
