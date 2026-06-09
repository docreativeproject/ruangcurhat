/**
 * Ruang Curhat - Core Engine & Gemini API Integration (Vite Production Standard)
 */

(function () {
    'use strict';

    // 1. Mengambil API Key dari file .env secara otomatis via Vite
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    // 2. Menyusun Endpoint menggunakan Gemini versi 3.5-flash
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${API_KEY}`;

    const SYSTEM_PROMPT = `Kamu adalah AI yang empatik, tenang, dan tidak menghakimi.
Tugasmu:
1. Validasi emosi user berdasarkan mood dan curhat
2. Berikan perspektif yang menenangkan dan realistis
3. Berikan 1–2 kalimat motivasi singkat
Gunakan bahasa Indonesia natural, seperti teman dewasa yang hangat.`;

    // DOM ELEMENTS
    const btnSubmit = document.getElementById('btn-submit');
    const txtCurhat = document.getElementById('curhat-text');
    const cardResponse = document.getElementById('ai-response-card');
    const loader = document.getElementById('ai-loading');
    const responseContent = document.getElementById('ai-content');

    // EVENT LISTENERS
    document.addEventListener('DOMContentLoaded', () => {
        if (btnSubmit) {
            btnSubmit.addEventListener('click', handleCurhatSubmission);
        }
    });

    async function handleCurhatSubmission() {
        const curhatText = txtCurhat.value.trim();
        const selectedMood = document.querySelector('input[name="mood"]:checked')?.value || 'tidak diketahui';

        if (!validateInput(curhatText)) return;

        // Proteksi jika file .env belum terbaca atau salah nama variabel
        if (!API_KEY) {
            renderError("Gagal membaca API Key. Pastikan file .env bertuliskan VITE_GEMINI_API_KEY.");
            return;
        }

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

    function validateInput(text) {
        if (!text) {
            alert('Silakan tuliskan cerita atau perasaanmu terlebih dahulu.');
            txtCurhat.focus();
            return false;
        }
        return true;
    }

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

    async function fetchGeminiInsight(mood, content) {
        const constructedPrompt = `${SYSTEM_PROMPT}\n\nMood User: ${mood}\nCurhat User: "${content}"`;

        const requestPayload = {
            contents: [{
                parts: [{ text: constructedPrompt }]
            }]
        };

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('API Key salah atau model tidak dikenali. Periksa kembali file .env kamu.');
            }
            throw new Error('Gagal terhubung dengan server AI. Coba periksa koneksi internetmu.');
        }

        const data = await response.json();
        const aiTextOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiTextOutput) {
            throw new Error('AI gagal memproses ceritamu. Coba kirim ulang beberapa saat lagi.');
        }

        return aiTextOutput;
    }

    function renderResponse(text) {
        if (!responseContent || !cardResponse) return;
        responseContent.textContent = text;
        cardResponse.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function renderError(errorMessage) {
        if (!responseContent || !cardResponse) return;
        cardResponse.classList.remove('hidden');
        responseContent.innerHTML = `<span style="color: #d97b83; font-weight: 600;">🛑 Error: ${errorMessage}</span>`;
    }

})();