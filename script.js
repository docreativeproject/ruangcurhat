/**
 * Ruang Curhat - Core Engine & Gemini API Integration
 * Senior Frontend & UI/UX Standards: Clean, Robust, Error-Safe.
 */

// ==========================================================================
// CONFIGURATION & CONSTANTS
// ==========================================================================
// Mengambil data dari file .env melalui sistem build Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;
const SYSTEM_PROMPT = `Kamu adalah AI yang empatik, tenang, dan tidak menghakimi.
Tugasmu:
1. Validasi emosi user berdasarkan mood dan curhat
2. Berikan perspektif yang menenangkan dan realistis
3. Berikan 1–2 kalimat motivasi singkat
Gunakan bahasa Indonesia natural, seperti teman dewasa yang hangat.`;

// ==========================================================================
// DOM ELEMENTS
// ==========================================================================
const btnSubmit = document.getElementById('btn-submit');
const txtCurhat = document.getElementById('curhat-text');
const cardResponse = document.getElementById('ai-response-card');
const loader = document.getElementById('ai-loading');
const responseContent = document.getElementById('ai-content');

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (btnSubmit) {
        btnSubmit.addEventListener('click', handleCurhatSubmission);
    }
});

/**
 * Handles the user flow when submission is triggered.
 */
async function handleCurhatSubmission() {
    const curhatText = txtCurhat.value.trim();
    const selectedMood = document.querySelector('input[name="mood"]:checked')?.value || 'tidak diketahui';

    if (!validateInput(curhatText)) return;

    setLoadingState(true);

    try {
        const aiResponse = await fetchGeminiInsight(selectedMood, curhatText);
        renderResponse(aiResponse);
    } catch (error) {
        renderError(error.message);
    } finally {
        setLoadingState(false);
    }
}

/**
 * Client-side validation.
 * @param {string} text - The core input string.
 * @returns {boolean} Valid state.
 */
function validateInput(text) {
    if (!text) {
        alert('Silakan tuliskan cerita atau perasaanmu terlebih dahulu.');
        txtCurhat.focus();
        return false;
    }
    return true;
}

/**
 * Controls the layout switching during asynchronous states.
 * @param {boolean} isLoading 
 */
function setLoadingState(isLoading) {
    if (!cardResponse || !loader || !responseContent || !btnSubmit) return;

    if (isLoading) {
        cardResponse.classList.remove('hidden');
        loader.classList.remove('hidden');
        responseContent.classList.add('hidden');
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.7';
        btnSubmit.querySelector('span').innerText = 'Mengirim...';
    } else {
        loader.classList.add('hidden');
        responseContent.classList.remove('hidden');
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.querySelector('span').innerText = 'Kirim Curhat';
    }
}

/**
 * Communicates directly with the Gemini API.
 * @param {string} mood 
 * @param {string} content 
 * @returns {Promise<string>} Parsed textual response from AI.
 */
async function fetchGeminiInsight(mood, content) {
    // Validasi proteksi jika user lupa mengganti key bawaan
    if (API_KEY === "YOUR_GEMINI_API_KEY" || API_KEY.trim() === "") {
        throw new Error('API Key belum diisi. Sila pasang AIzaSy key Anda di baris ke-9 file script.js.');
    }

    const constructedPrompt = `${SYSTEM_PROMPT}\n\nMood User: ${mood}\nCurhat User: "${content}"`;

    const requestPayload = {
        contents: [{
            parts: [{
                text: constructedPrompt
            }]
        }]
    };

    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
        if (response.status === 400) {
            throw new Error('API Key salah atau tidak valid. Tolong periksa kembali kode AIzaSy Anda.');
        }
        throw new Error('Gagal terhubung dengan safe space AI. Coba periksa koneksi internet Anda.');
    }

    const data = await response.json();
    const aiTextOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiTextOutput) {
        throw new Error('AI sedang kebingungan menerima ceritamu. Coba kirim ulang beberapa saat lagi.');
    }

    return aiTextOutput;
}

/**
 * Safely updates DOM string to hold AI text block.
 * @param {string} text 
 */
function renderResponse(text) {
    if (!responseContent || !cardResponse) return;
    responseContent.textContent = text;
    cardResponse.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Fallback layout display for caught dynamic promise exceptions.
 * @param {string} errorMessage 
 */
function renderError(errorMessage) {
    if (!responseContent) return;
    responseContent.innerHTML = `<span style="color: #d97b83; font-weight: 600;">🛑 Error: ${errorMessage}</span>`;
}