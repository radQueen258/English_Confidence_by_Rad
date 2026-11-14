
import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";


// ==========================================
// STATE
// ==========================================

let getStudentContext = null;

let selectedPaymentMethods = {};

let compressedProof = null;

let stage5Initialised = false;

let renewalStatus = null;



const monthEndTranslations = {

    pt: {
        monthTitle: "Conseguiste.<br/><em>Vamos celebrar.</em>",
        monthKicker: "REFLEXÃO DO MÊS",

        feedbackKicker: "A TUA OPINIÃO IMPORTA",
        feedbackTitle: "Ajuda-me a melhorar a tua experiência.",
        feedbackIntro: "Cada estudante aprende de forma diferente. A tua opinião vai ajudar-me a melhorar o próximo mês.",

        liked: "O que gostaste nas aulas deste mês?",
        improve: "O que achas que poderia melhorar?",

        sendFeedback: "Enviar a minha opinião ↗",
        feedbackThanks: "Obrigada por partilhares a tua opinião!",

        renewalKicker: "CONTINUA A CRESCER",
        renewalTitle: "O teu próximo capítulo começa aqui.",
        renewalIntro: "Queres continuar a melhorar o teu inglês? Renova o teu programa mensal.",

        continue: "Continuar para o próximo mês ↗",
        chooseMethod: "01 / ESCOLHE O MÉTODO DE PAGAMENTO",
        paymentMethod: "Método de pagamento",
        upload: "02 / ENVIA O COMPROVATIVO",
        screenshot: "Captura de ecrã do pagamento",
        uploadHint: "Envia uma imagem legível. Tamanho máximo após compressão: 400 KB.",
        submit: "Enviar comprovativo ↗",

        pending: "Pagamento pendente de verificação",
        pendingText: "O teu comprovativo foi recebido. A tua professora irá verificar o pagamento.",
        approved: "Pagamento aprovado!",
        approvedText: "O teu próximo mês está preparado. Termina a sessão e volta a entrar para atualizar o teu programa.",
        rejected: "O pagamento precisa de atenção",

        thankYou: "A tua opinião foi enviada à tua professora.",

        feedbackPlaceholder1: "Gostei especialmente...",
        feedbackPlaceholder2: "Acho que poderíamos...",

        selectMethod: "Escolhe um método de pagamento",
        rejectedText: "Verifica a mensagem da tua professora e envia um novo comprovativo.",

        resubmit: "Enviar novo comprovativo ↗",
    },

    en: {
        monthTitle: "You've made it.<br/><em>Let's celebrate.</em>",
        monthKicker: "MONTH-END REFLECTION",

        feedbackKicker: "YOUR VOICE MATTERS",
        feedbackTitle: "Help me make your journey better.",
        feedbackIntro: "Every student learns differently. Your feedback helps me improve our next month.",

        liked: "What did you like about this month's lessons?",
        improve: "What do you think could be improved?",

        sendFeedback: "Send my feedback ↗",
        feedbackThanks: "Thank you for sharing your feedback!",

        renewalKicker: "KEEP GROWING",
        renewalTitle: "Your next chapter starts here.",
        renewalIntro: "Ready to keep improving your English? Renew your monthly programme.",

        continue: "Continue next month ↗",
        chooseMethod: "01 / CHOOSE YOUR PAYMENT METHOD",
        paymentMethod: "Payment method",
        upload: "02 / UPLOAD PAYMENT CONFIRMATION",
        screenshot: "Payment screenshot",
        uploadHint: "Upload a clear screenshot. Maximum compressed size: 400 KB.",
        submit: "Submit payment proof ↗",

        pending: "Payment pending review",
        pendingText: "Your payment confirmation has been received. Your teacher will verify it.",
        approved: "Payment approved!",
        approvedText: "Your next month is ready. Sign out and sign in again to refresh your programme.",
        rejected: "Payment needs attention",

        thankYou: "Your feedback has been sent to your teacher.",

        feedbackPlaceholder1: "I especially enjoyed...",
        feedbackPlaceholder2: "I think we could...",

        selectMethod: "Select a payment method",
        rejectedText: "Review your teacher's message and submit a new payment confirmation.",

        resubmit: "Resubmit payment proof ↗",
    }

};


export function applyMonthEndLanguage(language) {

    const t = monthEndTranslations[language]
        || monthEndTranslations.en;

    el("month-end-heading").innerHTML = t.monthTitle;

    el("month-end-kicker").textContent = t.monthKicker;

    el("feedback-kicker").textContent = t.feedbackKicker;
    el("feedback-title").textContent = t.feedbackTitle;
    el("feedback-description").textContent = t.feedbackIntro;

    el("feedback-liked-label").textContent = t.liked;
    el("feedback-improve-label").textContent = t.improve;

    el("feedback-liked").placeholder = t.feedbackPlaceholder1;
    el("feedback-improve").placeholder = t.feedbackPlaceholder2;

    el("feedback-submit-button").textContent = t.sendFeedback;

    el("renewal-kicker").textContent = t.renewalKicker;
    el("renewal-title").textContent = t.renewalTitle;
    el("renewal-description").textContent = t.renewalIntro;

    el("renewal-start-button").textContent =
        renewalStatus === "rejected"
            ? t.resubmit
            : t.continue;

    el("renewal-step-one").textContent = t.chooseMethod;
    el("renewal-method-label").textContent = t.paymentMethod;

    el("renewal-step-two").textContent = t.upload;
    el("renewal-proof-label").textContent = t.screenshot;

    el("renewal-upload-hint").textContent = t.uploadHint;

    el("renewal-submit-button").textContent = t.submit;


    // Keep the payment selection placeholder translated.
    const placeholder = el("renewal-method").querySelector(
        'option[value=""]'
    );

    if (placeholder) {
        placeholder.textContent = t.selectMethod;
    }

}




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


function studentMonthRef(email, month) {

    return doc(
        db,
        "students",
        email,
        "months",
        `month-${month}`
    );

}


function feedbackRef(email, month) {

    return doc(
        studentMonthRef(email, month),
        "feedback",
        "current"
    );

}


function renewalRef(email, month) {

    return doc(
        studentMonthRef(email, month),
        "renewals",
        "current"
    );

}


function setMessage(id, message, type = "info") {

    const node = el(id);

    node.textContent = message;

    node.dataset.type = type;

}


function formatMethodName(method) {

    return {
        emola: "e-Mola",
        mpesa: "M-Pesa",
        bim: "BIM"
    }[method] || method;

}


// ==========================================
// IMAGE COMPRESSION
// ==========================================

const MAX_IMAGE_BYTES = 400 * 1024;


function blobToDataUrl(blob) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = () => reject(
            new Error("Could not read the compressed screenshot.")
        );

        reader.readAsDataURL(blob);

    });

}


function canvasToBlob(canvas, type, quality) {

    return new Promise((resolve, reject) => {

        canvas.toBlob(
            blob => {

                if (!blob) {

                    reject(
                        new Error("Image compression failed.")
                    );

                    return;

                }

                resolve(blob);

            },
            type,
            quality
        );

    });

}


async function compressPaymentScreenshot(file) {

    if (!file || !file.type.startsWith("image/")) {

        throw new Error("Please select an image.");

    }

    if (file.size > 12 * 1024 * 1024) {

        throw new Error(
            "The original image is too large. Please use a smaller screenshot."
        );

    }


    let bitmap;

    try {

        bitmap = await createImageBitmap(file);

    } catch {

        throw new Error(
            "The screenshot could not be opened. Please choose another image."
        );

    }


    let scale = Math.min(
        1,
        1600 / Math.max(bitmap.width, bitmap.height)
    );


    try {

        for (let attempt = 0; attempt < 8; attempt++) {

            const canvas = document.createElement("canvas");

            canvas.width = Math.max(
                1,
                Math.round(bitmap.width * scale)
            );

            canvas.height = Math.max(
                1,
                Math.round(bitmap.height * scale)
            );


            const context = canvas.getContext("2d");

            if (!context) {

                throw new Error("Image processing is unavailable.");

            }


            context.drawImage(
                bitmap,
                0,
                0,
                canvas.width,
                canvas.height
            );


            for (const quality of [0.86, 0.80, 0.74, 0.68, 0.62, 0.56]) {

                const blob = await canvasToBlob(
                    canvas,
                    "image/webp",
                    quality
                );


                if (
                    blob.size <= MAX_IMAGE_BYTES
                    && ["image/webp", "image/jpeg", "image/png"].includes(blob.type)
                ) {

                    return {

                        blob,

                        dataUrl: await blobToDataUrl(blob),

                        size: blob.size,

                        mimeType: blob.type

                    };

                }

            }


            // Reduce resolution slightly and try again.
            scale *= 0.85;

        }

    } finally {

        bitmap.close();

    }


    throw new Error(
        "Your screenshot could not be compressed below 400 KB. Please crop it to show only the payment confirmation and try again."
    );

}


// ==========================================
// PAYMENT METHOD DETAILS
// ==========================================

function renderPaymentDetails() {

    const methodId = el("renewal-method").value;

    const method = selectedPaymentMethods[methodId];

    const container = el("renewal-payment-details");


    if (!method) {

        container.textContent =
            "Select a payment method to see its details.";

        return;

    }


    let details = "";


    if (methodId === "emola" || methodId === "mpesa") {

        details = `
      <span>RECIPIENT</span>
      <strong>${escapeHTML(method.recipientName || "Not configured")}</strong>

      <span>PAYMENT NUMBER</span>
      <strong>${escapeHTML(method.number || "Not configured")}</strong>
    `;

    }


    if (methodId === "bim") {

        details = `
      <span>BANK</span>
      <strong>${escapeHTML(method.bankName || "BIM")}</strong>

      <span>ACCOUNT HOLDER</span>
      <strong>${escapeHTML(method.accountName || "Not configured")}</strong>

      <span>ACCOUNT NUMBER / NIB</span>
      <strong>${escapeHTML(method.accountNumber || "Not configured")}</strong>
    `;

    }


    container.innerHTML = `

    <div class="payment-details-content">

      <p class="payment-detail-method">
        ${formatMethodName(methodId)}
      </p>

      ${details}

      ${
        method.instructions
            ? `
            <div class="payment-instructions">
              ${escapeHTML(method.instructions)}
            </div>
          `
            : ""
    }

    </div>

  `;

}


// ==========================================
// LOAD PAYMENT SETTINGS
// ==========================================

async function loadPaymentMethods() {

    const snapshot = await getDoc(
        doc(db, "settings", "paymentMethods")
    );


    const selector = el("renewal-method");

    const context = getStudentContext();

    const t = monthEndTranslations[context.language]
        || monthEndTranslations.en;

    selector.innerHTML = `
  <option value="">${t.selectMethod}</option>
`;


    selectedPaymentMethods = {};


    if (!snapshot.exists()) {

        el("renewal-payment-details").textContent =
            "Payment information is not available yet. Please contact your teacher.";

        return;

    }


    const settings = snapshot.data();


    for (const methodId of ["emola", "mpesa", "bim"]) {

        const method = settings[methodId];

        if (!method || method.enabled !== true) continue;


        selectedPaymentMethods[methodId] = method;


        const option = document.createElement("option");

        option.value = methodId;

        option.textContent = formatMethodName(methodId);

        selector.appendChild(option);

    }


    if (!Object.keys(selectedPaymentMethods).length) {

        el("renewal-payment-details").textContent =
            "Your teacher has not enabled any payment methods yet.";

    }


    renderPaymentDetails();

}


// ==========================================
// SHOW FEEDBACK
// ==========================================

async function loadFeedback(email, monthNumber, name) {

    const reference = feedbackRef(email, monthNumber);

    const snapshot = await getDoc(reference);


    const form = el("student-feedback-form");

    const submitted = el("feedback-submitted");


    if (snapshot.exists()) {

        const context = getStudentContext();

        const t = monthEndTranslations[context.language]
            || monthEndTranslations.en;

        const feedback = snapshot.data();

        form.hidden = true;

        submitted.hidden = false;

        submitted.innerHTML = `

      <span>✦</span>

      <strong>${t.feedbackThanks}</strong>

      <div class="feedback-answer">

        <b>What you liked</b>

        <p>${escapeHTML(feedback.liked)}</p>

      </div>

      <div class="feedback-answer">

        <b>What could be improved</b>

        <p>${escapeHTML(feedback.improve)}</p>

      </div>

    `;

    } else {

        form.hidden = false;

        submitted.hidden = true;

        form.reset();

    }

}


// ==========================================
// SUBMIT FEEDBACK
// ==========================================

async function submitFeedback(event) {

    event.preventDefault();


    const context = getStudentContext();

    const email = context.user.email.toLowerCase();

    const month = context.month;

    const completed = context.completedCount;


    if (completed !== 12) {

        throw new Error(
            "Complete all 12 activities before submitting feedback."
        );

    }


    const liked = el("feedback-liked").value.trim();

    const improve = el("feedback-improve").value.trim();


    if (!liked || !improve) {

        throw new Error(
            "Please answer both feedback questions."
        );

    }


    if (liked.length > 3000 || improve.length > 3000) {

        throw new Error(
            "Your feedback is too long."
        );

    }


    const reference = feedbackRef(email, month);

    const existing = await getDoc(reference);


    if (existing.exists()) {

        throw new Error(
            "You have already submitted feedback for this month."
        );

    }


    const button = el("feedback-submit-button");

    button.disabled = true;

    button.textContent = "Sending...";


    try {

        await setDoc(reference, {

            email,

            studentName: context.name,

            monthNumber: month,

            monthKey: `month-${month}`,

            liked,

            improve,

            submittedAt: serverTimestamp()

        });


        await loadFeedback(email, month, context.name);

        setMessage(
            "feedback-message",
            "Your feedback has been sent.",
            "success"
        );


    } finally {

        button.disabled = false;

        button.textContent = "Send my feedback ↗";

    }

}


// ==========================================
// LOAD RENEWAL STATUS
// ==========================================

async function loadRenewalStatus(email, month) {

    const reference = renewalRef(email, month);

    const snapshot = await getDoc(reference);


    const statusBox = el("renewal-status");

    const startButton = el("renewal-start-button");

    const panel = el("student-renewal-panel");


    statusBox.hidden = false;

    panel.hidden = true;

    startButton.hidden = true;


    if (!snapshot.exists()) {

        statusBox.hidden = true;

        startButton.hidden = false;

        startButton.textContent =
            "Continue next month ↗";

        return;

    }

    renewalStatus = snapshot.exists()
        ? snapshot.data().status
        : null;


    const renewal = snapshot.data();

    const context = getStudentContext();

    const t = monthEndTranslations[context.language]
        || monthEndTranslations.en;


    if (renewal.status === "pending") {

        statusBox.innerHTML = `
    <span class="renewal-status-icon">◷</span>
    <strong>${t.pending}</strong>
    <p>${t.pendingText}</p>
  `;

        return;
    }


    if (renewal.status === "approved") {

        statusBox.innerHTML = `
    <span class="renewal-status-icon">✓</span>
    <strong>${t.approved}</strong>
    <p>${t.approvedText}</p>
  `;

        return;
    }


    if (renewal.status === "rejected") {

        statusBox.innerHTML = `
    <span class="renewal-status-icon">!</span>
    <strong>${t.rejected}</strong>
    <p>${escapeHTML(renewal.adminNote || t.rejectedText)}</p>
  `;

        startButton.hidden = false;

        startButton.textContent = t.continue;

    }

}


// ==========================================
// FILE PREVIEW AND COMPRESSION
// ==========================================

async function handleProofSelection(event) {

    const file = event.target.files?.[0];

    compressedProof = null;

    el("renewal-submit-button").disabled = true;

    el("renewal-proof-preview-box").hidden = true;


    if (!file) return;


    setMessage(
        "renewal-proof-message",
        "Compressing screenshot..."
    );


    try {

        compressedProof = await compressPaymentScreenshot(file);


        el("renewal-proof-preview").src =
            compressedProof.dataUrl;

        el("renewal-proof-size").textContent =
            `${(compressedProof.size / 1024).toFixed(1)} KB · Ready to submit`;


        el("renewal-proof-preview-box").hidden = false;

        el("renewal-submit-button").disabled = false;


        setMessage(
            "renewal-proof-message",
            "Screenshot ready. Please check that all payment details are readable.",
            "success"
        );


    } catch (error) {

        compressedProof = null;

        setMessage(
            "renewal-proof-message",
            error.message,
            "error"
        );

    }

}


// ==========================================
// SUBMIT PAYMENT PROOF
// ==========================================

async function submitRenewal() {

    const context = getStudentContext();

    const email = context.user.email.toLowerCase();

    const month = context.month;

    const nextMonth = month + 1;


    if (context.completedCount !== 12) {

        throw new Error(
            "Complete all 12 activities before continuing."
        );

    }


    if (!compressedProof) {

        throw new Error(
            "Please upload your payment screenshot."
        );

    }


    const paymentMethod = el("renewal-method").value;

    if (!selectedPaymentMethods[paymentMethod]) {

        throw new Error(
            "Please select an available payment method."
        );

    }


    const reference = renewalRef(email, month);

    const existing = await getDoc(reference);


    if (
        existing.exists()
        && existing.data().status !== "rejected"
    ) {

        throw new Error(
            "A renewal request already exists for this month."
        );

    }


    const paymentReference =
        el("renewal-reference").value.trim();


    const payload = {

        email,

        studentName: context.name,

        monthNumber: month,

        monthKey: `month-${month}`,

        nextMonthNumber: nextMonth,

        paymentMethod,

        paymentReference,

        screenshotDataUrl: compressedProof.dataUrl,

        screenshotMimeType: compressedProof.mimeType,

        screenshotBytes: compressedProof.size,

        status: "pending",

        submittedAt: serverTimestamp()

    };


    const button = el("renewal-submit-button");

    button.disabled = true;

    button.textContent = "Submitting...";


    try {

        if (existing.exists()) {

            // Rejected requests may be resubmitted.
            // Update only the permitted submission fields.
            await updateDoc(reference, payload);

        } else {

            await setDoc(reference, payload);

        }


        compressedProof = null;

        el("renewal-proof").value = "";

        el("renewal-proof-preview-box").hidden = true;

        el("student-renewal-panel").hidden = true;


        await loadRenewalStatus(email, month);


        setMessage(
            "renewal-message",
            "Your payment confirmation has been submitted successfully.",
            "success"
        );


    } finally {

        button.disabled = false;

        button.textContent = "Submit payment proof ↗";

    }

}


// ==========================================
// REFRESH MONTH-END EXPERIENCE
// ==========================================

export async function refreshMonthEndExperience() {

    if (!getStudentContext) return;


    const context = getStudentContext();

    applyMonthEndLanguage(context.language);

    const section = el("month-end-section");


    // Display only after all twelve activities are complete.
    if (context.completedCount !== 12) {

        section.hidden = true;

        return;

    }


    section.hidden = false;


    try {

        await Promise.all([

            loadFeedback(
                context.user.email.toLowerCase(),
                context.month,
                context.name
            ),

            loadRenewalStatus(
                context.user.email.toLowerCase(),
                context.month
            ),

            loadPaymentMethods()

        ]);

    } catch (error) {

        console.error(
            "Month-end section failed:",
            error
        );

        setMessage(
            "renewal-message",
            "Some renewal information could not be loaded. Please refresh the page.",
            "error"
        );

    }

}


// ==========================================
// SETUP
// ==========================================

export function setupMonthEndExperience(contextProvider) {

    getStudentContext = contextProvider;


    if (stage5Initialised) return;


    el("student-feedback-form").addEventListener(
        "submit",
        async event => {

            try {

                await submitFeedback(event);

            } catch (error) {

                setMessage(
                    "feedback-message",
                    error.message,
                    "error"
                );

            }

        }
    );


    el("renewal-start-button").addEventListener(
        "click",
        async () => {

            el("student-renewal-panel").hidden = false;

            el("renewal-status").hidden = true;

            try {

                await loadPaymentMethods();

            } catch (error) {

                setMessage(
                    "renewal-message",
                    "Payment details could not be loaded.",
                    "error"
                );

            }

        }
    );


    el("renewal-method").addEventListener(
        "change",
        renderPaymentDetails
    );


    el("renewal-proof").addEventListener(
        "change",
        handleProofSelection
    );


    el("renewal-submit-button").addEventListener(
        "click",
        async () => {

            try {

                await submitRenewal();

            } catch (error) {

                console.error(error);

                setMessage(
                    "renewal-proof-message",
                    error.message || "Payment submission failed.",
                    "error"
                );

                el("renewal-submit-button").disabled =
                    !compressedProof;

            }

        }
    );


    stage5Initialised = true;

}


function applyMonthEndLanguage(language) {

    const t = monthEndTranslations[language]
        || monthEndTranslations.en;

    el("month-end-heading").innerHTML = t.monthTitle;

    el("feedback-kicker").textContent = t.feedbackKicker;
    el("feedback-title").textContent = t.feedbackTitle;
    el("feedback-description").textContent = t.feedbackIntro;

    el("feedback-liked-label").textContent = t.liked;
    el("feedback-improve-label").textContent = t.improve;

    el("feedback-liked").placeholder = t.feedbackPlaceholder1;
    el("feedback-improve").placeholder = t.feedbackPlaceholder2;

    el("feedback-submit-button").textContent = t.sendFeedback;

    el("renewal-kicker").textContent = t.renewalKicker;
    el("renewal-title").textContent = t.renewalTitle;
    el("renewal-description").textContent = t.renewalIntro;

    el("renewal-start-button").textContent = t.continue;

    el("renewal-step-one").textContent = t.chooseMethod;
    el("renewal-method-label").textContent = t.paymentMethod;

    el("renewal-step-two").textContent = t.upload;
    el("renewal-proof-label").textContent = t.screenshot;
    el("renewal-upload-hint").textContent = t.uploadHint;

    el("renewal-submit-button").textContent = t.submit;

}
