// API Configuration
const API_BASE_URL = 'https://maganghub.kemnaker.go.id/be/v1/api/list/vacancies-aktif';

// State
let currentPage = 1;
let totalPages = 1;

// DOM Elements
const vacanciesContainer = document.getElementById('vacancies');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const paginationElement = document.getElementById('pagination');
const provinsiSelect = document.getElementById('provinsi');
const keywordInput = document.getElementById('keyword');
const perPageSelect = document.getElementById('perPage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    searchVacancies();
    
    // Enter key on keyword input
    keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchVacancies();
        }
    });
});

// Search Vacancies
async function searchVacancies(page = 1) {
    currentPage = page;
    showLoading();
    
    const provinsi = provinsiSelect.value;
    const keyword = keywordInput.value.trim();
    const perPage = perPageSelect.value;
    
    const params = new URLSearchParams({
        order_by: 'jumlah_terdaftar',
        order_direction: 'ASC',
        page: page,
        limit: perPage,
        per_page: perPage,
        keyword: keyword
    });
    
    if (provinsi) {
        params.append('kode_provinsi', provinsi);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        displayVacancies(result.data);
        updateStats(result.meta.pagination);
        renderPagination(result.meta.pagination);
        hideLoading();
    } catch (error) {
        console.error('Error fetching vacancies:', error);
        showError();
    }
}

// Display Vacancies
function displayVacancies(vacancies) {
    if (!vacancies || vacancies.length === 0) {
        vacanciesContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <h3>Tidak Ada Lowongan Ditemukan</h3>
                <p>Coba ubah filter pencarian Anda</p>
            </div>
        `;
        return;
    }
    
    vacanciesContainer.innerHTML = vacancies.map(vacancy => createVacancyCard(vacancy)).join('');
}

// Create Vacancy Card
function createVacancyCard(vacancy) {
    const programStudi = parseJSON(vacancy.program_studi, []);
    const jenjang = parseJSON(vacancy.jenjang, []);
    const isOpen = isRegistrationOpen(vacancy.jadwal);
    
    return `
        <div class="vacancy-card">
            <div class="vacancy-header">
                <div>
                    <h3 class="vacancy-title">${escapeHtml(vacancy.posisi)}</h3>
                    <p class="vacancy-company">🏢 ${escapeHtml(vacancy.perusahaan?.nama_perusahaan || 'N/A')}</p>
                </div>
                <span class="vacancy-badge ${isOpen ? '' : 'closed'}">${isOpen ? '✓ Buka' : '✗ Tutup'}</span>
            </div>
            
            <div class="vacancy-info">
                <div class="info-item">
                    <span class="icon">📍</span>
                    <span>${escapeHtml(vacancy.perusahaan?.nama_kabupaten || 'N/A')}, ${escapeHtml(vacancy.perusahaan?.nama_provinsi || 'N/A')}</span>
                </div>
                <div class="info-item">
                    <span class="icon">📅</span>
                    <span>Angkatan ${escapeHtml(vacancy.jadwal?.angkatan || 'N/A')} - ${escapeHtml(vacancy.jadwal?.tahun || 'N/A')}</span>
                </div>
            </div>
            
            <div class="vacancy-description">
                <h4>📋 Deskripsi Posisi:</h4>
                <p>${escapeHtml(vacancy.deskripsi_posisi || 'Tidak ada deskripsi')}</p>
            </div>
            
            <div class="vacancy-tags">
                ${programStudi.map(ps => `<span class="tag">${escapeHtml(ps.title)}</span>`).join('')}
                ${jenjang.map(j => `<span class="tag jenjang">${escapeHtml(j)}</span>`).join('')}
            </div>
            
            <div class="vacancy-footer">
                <div class="vacancy-quota">
                    <div class="quota-item">
                        <span class="quota-number">${vacancy.jumlah_kuota || 0}</span>
                        <span class="quota-label">Kuota</span>
                    </div>
                    <div class="quota-item">
                        <span class="quota-number">${vacancy.jumlah_terdaftar || 0}</span>
                        <span class="quota-label">Terdaftar</span>
                    </div>
                    <div class="quota-item">
                        <span class="quota-number">${(vacancy.jumlah_kuota || 0) - (vacancy.jumlah_terdaftar || 0)}</span>
                        <span class="quota-label">Sisa</span>
                    </div>
                </div>
                <div class="vacancy-dates">
                    <div><strong>Pendaftaran:</strong></div>
                    <div>${formatDate(vacancy.jadwal?.tanggal_pendaftaran_awal)} - ${formatDate(vacancy.jadwal?.tanggal_pendaftaran_akhir)}</div>
                    <div style="margin-top: 5px;"><strong>Periode Magang:</strong></div>
                    <div>${formatDate(vacancy.jadwal?.tanggal_mulai)} - ${formatDate(vacancy.jadwal?.tanggal_selesai)}</div>
                </div>
            </div>
        </div>
    `;
}

// Update Stats
function updateStats(pagination) {
    document.getElementById('totalVacancies').textContent = pagination.total.toLocaleString('id-ID');
    document.getElementById('currentPage').textContent = pagination.current_page;
    document.getElementById('totalPages').textContent = pagination.last_page;
    totalPages = pagination.last_page;
}

// Render Pagination
function renderPagination(pagination) {
    const { current_page, last_page } = pagination;
    
    if (last_page <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button class="page-btn" onclick="searchVacancies(${current_page - 1})" ${current_page === 1 ? 'disabled' : ''}>← Sebelumnya</button>`;
    
    // Page numbers
    const pages = getPageNumbers(current_page, last_page);
    pages.forEach(page => {
        if (page === '...') {
            html += `<span class="page-btn" style="border: none; cursor: default;">...</span>`;
        } else {
            html += `<button class="page-btn ${page === current_page ? 'active' : ''}" onclick="searchVacancies(${page})">${page}</button>`;
        }
    });
    
    // Next button
    html += `<button class="page-btn" onclick="searchVacancies(${current_page + 1})" ${current_page === last_page ? 'disabled' : ''}>Selanjutnya →</button>`;
    
    paginationElement.innerHTML = html;
}

// Get Page Numbers
function getPageNumbers(current, total) {
    const pages = [];
    const delta = 2;
    
    if (total <= 7) {
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        pages.push(1);
        
        if (current > delta + 2) {
            pages.push('...');
        }
        
        for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
            pages.push(i);
        }
        
        if (current < total - delta - 1) {
            pages.push('...');
        }
        
        pages.push(total);
    }
    
    return pages;
}

// Helper Functions
function parseJSON(str, defaultValue) {
    try {
        return JSON.parse(str) || defaultValue;
    } catch {
        return defaultValue;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function isRegistrationOpen(jadwal) {
    if (!jadwal) return false;
    const now = new Date();
    const start = new Date(jadwal.tanggal_pendaftaran_awal);
    const end = new Date(jadwal.tanggal_pendaftaran_akhir);
    return now >= start && now <= end;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    loadingElement.style.display = 'block';
    errorElement.style.display = 'none';
    vacanciesContainer.innerHTML = '';
    paginationElement.innerHTML = '';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

function showError() {
    loadingElement.style.display = 'none';
    errorElement.style.display = 'block';
    vacanciesContainer.innerHTML = '';
    paginationElement.innerHTML = '';
}
