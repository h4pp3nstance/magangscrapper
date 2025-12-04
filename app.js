// API Configuration
const API_BASE_URL = 'https://maganghub.kemnaker.go.id/be/v1/api/list/vacancies-aktif';
const API_DETAIL_URL = 'https://maganghub.kemnaker.go.id/be/v1/api/read/vacancies-aktif';

// State
let currentPage = 1;
let totalPages = 1;
let kabupatenCache = {}; // Cache cities by province

// DOM Elements
const vacanciesContainer = document.getElementById('vacancies');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const paginationElement = document.getElementById('pagination');
const provinsiSelect = document.getElementById('provinsi');
const kabupatenSelect = document.getElementById('kabupaten');
const keywordInput = document.getElementById('keyword');
const perPageSelect = document.getElementById('perPage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load cities for default province (Jawa Barat - 32)
    loadKabupaten('32');
    searchVacancies();
    
    // Enter key on keyword input
    keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchVacancies();
        }
    });
});

// On Province Change
function onProvinceChange() {
    const provinsi = provinsiSelect.value;
    kabupatenSelect.innerHTML = '<option value="">Semua Kota/Kabupaten</option>';
    
    if (provinsi) {
        loadKabupaten(provinsi);
    }
}

// Load Kabupaten for Province
async function loadKabupaten(kodeProvinsi) {
    // Check cache first
    if (kabupatenCache[kodeProvinsi]) {
        populateKabupatenSelect(kabupatenCache[kodeProvinsi]);
        return;
    }
    
    try {
        // Fetch a larger sample to get all unique kabupaten
        const params = new URLSearchParams({
            order_by: 'jumlah_terdaftar',
            order_direction: 'ASC',
            page: 1,
            limit: 500,
            per_page: 500,
            kode_provinsi: kodeProvinsi
        });
        
        const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch kabupaten');
        }
        
        const result = await response.json();
        
        // Extract unique kabupaten
        const kabupatenMap = new Map();
        result.data.forEach(vacancy => {
            if (vacancy.perusahaan?.kode_kabupaten && vacancy.perusahaan?.nama_kabupaten) {
                kabupatenMap.set(vacancy.perusahaan.kode_kabupaten, vacancy.perusahaan.nama_kabupaten);
            }
        });
        
        // Convert to array and sort
        const kabupatenList = Array.from(kabupatenMap, ([kode, nama]) => ({ kode, nama }))
            .sort((a, b) => a.nama.localeCompare(b.nama));
        
        // Cache the result
        kabupatenCache[kodeProvinsi] = kabupatenList;
        
        populateKabupatenSelect(kabupatenList);
    } catch (error) {
        console.error('Error loading kabupaten:', error);
    }
}

// Populate Kabupaten Select
function populateKabupatenSelect(kabupatenList) {
    kabupatenSelect.innerHTML = '<option value="">Semua Kota/Kabupaten</option>';
    kabupatenList.forEach(kab => {
        const option = document.createElement('option');
        option.value = kab.kode;
        option.textContent = kab.nama;
        kabupatenSelect.appendChild(option);
    });
}

// Search Vacancies
async function searchVacancies(page = 1) {
    currentPage = page;
    showLoading();
    
    const provinsi = provinsiSelect.value;
    const kabupaten = kabupatenSelect.value;
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
    
    if (kabupaten) {
        params.append('kode_kabupaten', kabupaten);
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
        <div class="vacancy-card" onclick="openDetail('${vacancy.id_posisi}')">
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
                <p>${truncateText(escapeHtml(vacancy.deskripsi_posisi || 'Tidak ada deskripsi'), 200)}</p>
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
            <button class="btn-detail" onclick="event.stopPropagation(); openDetail('${vacancy.id_posisi}')">📄 Lihat Detail</button>
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

// Truncate Text
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ============== DETAIL MODAL FUNCTIONS ==============

// Open Detail Modal
async function openDetail(id) {
    const modalOverlay = document.getElementById('modalOverlay');
    const modalLoading = document.getElementById('modalLoading');
    const modalContent = document.getElementById('modalContent');
    
    modalOverlay.classList.add('active');
    modalLoading.style.display = 'block';
    modalContent.innerHTML = '';
    document.body.style.overflow = 'hidden';
    
    try {
        const response = await fetch(`${API_DETAIL_URL}/${id}?order_direction=ASC&page=1&limit=10&per_page=10`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch detail');
        }
        
        const result = await response.json();
        modalLoading.style.display = 'none';
        
        // Handle array response - data is returned as array with single item
        const data = Array.isArray(result.data) ? result.data[0] : result.data;
        
        if (!data) {
            throw new Error('No data found');
        }
        
        modalContent.innerHTML = createDetailContent(data);
    } catch (error) {
        console.error('Error fetching detail:', error);
        modalLoading.style.display = 'none';
        modalContent.innerHTML = `
            <div class="empty-state">
                <div class="icon">⚠️</div>
                <h3>Gagal Memuat Detail</h3>
                <p>Silakan coba lagi nanti</p>
            </div>
        `;
    }
}

// Close Detail Modal
function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Create Detail Content
function createDetailContent(data) {
    const programStudi = parseJSON(data.program_studi, []);
    const jenjang = parseJSON(data.jenjang, []);
    const isOpen = isRegistrationOpen(data.jadwal);
    const jadwal = data.jadwal || {};
    const perusahaan = data.perusahaan || {};
    
    const companyInitial = perusahaan.nama_perusahaan ? perusahaan.nama_perusahaan.charAt(0).toUpperCase() : '?';
    const hasLogo = perusahaan.logo && perusahaan.logo.length > 0;
    const hasBanner = perusahaan.banner && perusahaan.banner.length > 0;
    
    return `
        ${hasBanner ? `
        <div class="detail-banner">
            <img src="${perusahaan.banner}" alt="Banner ${escapeHtml(perusahaan.nama_perusahaan)}" onerror="this.parentElement.style.display='none'">
        </div>
        ` : ''}
        
        <div class="detail-header ${hasBanner ? 'has-banner' : ''}">
            <h2 class="detail-title">${escapeHtml(data.posisi)}</h2>
            <div class="detail-company">
                <div class="company-logo ${hasLogo ? 'has-image' : ''}">
                    ${hasLogo 
                        ? `<img src="${perusahaan.logo}" alt="${escapeHtml(perusahaan.nama_perusahaan)}" onerror="this.parentElement.innerHTML='${companyInitial}'; this.parentElement.classList.remove('has-image')">` 
                        : companyInitial}
                </div>
                <div class="company-info">
                    <h3>${escapeHtml(perusahaan.nama_perusahaan || 'N/A')}</h3>
                    <p>📍 ${escapeHtml(perusahaan.nama_kabupaten || 'N/A')}, ${escapeHtml(perusahaan.nama_provinsi || 'N/A')}</p>
                </div>
            </div>
            <div class="detail-badges">
                <span class="detail-badge status ${isOpen ? '' : 'closed'}">${isOpen ? '✓ Pendaftaran Dibuka' : '✗ Pendaftaran Ditutup'}</span>
                <span class="detail-badge angkatan">📅 Angkatan ${escapeHtml(jadwal.angkatan || 'N/A')} - ${escapeHtml(jadwal.tahun || 'N/A')}</span>
                ${data.ref_status_posisi?.nama_status_posisi ? `<span class="detail-badge verified">✓ ${escapeHtml(data.ref_status_posisi.nama_status_posisi)}</span>` : ''}
            </div>
        </div>
        
        <div class="detail-section">
            <h4><span class="icon">📊</span> Informasi Kuota</h4>
            <div class="info-grid">
                <div class="info-card">
                    <span class="icon">👥</span>
                    <span class="value">${data.jumlah_kuota || 0}</span>
                    <span class="label">Total Kuota</span>
                </div>
                <div class="info-card">
                    <span class="icon">✅</span>
                    <span class="value">${data.jumlah_terdaftar || 0}</span>
                    <span class="label">Sudah Terdaftar</span>
                </div>
                <div class="info-card">
                    <span class="icon">🎯</span>
                    <span class="value">${(data.jumlah_kuota || 0) - (data.jumlah_terdaftar || 0)}</span>
                    <span class="label">Sisa Kuota</span>
                </div>
                <div class="info-card">
                    <span class="icon">📈</span>
                    <span class="value">${data.jumlah_kuota > 0 ? Math.round((data.jumlah_terdaftar / data.jumlah_kuota) * 100) : 0}%</span>
                    <span class="label">Terisi</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4><span class="icon">📋</span> Deskripsi Posisi</h4>
            <div class="detail-box">
                <p>${escapeHtml(data.deskripsi_posisi || 'Tidak ada deskripsi')}</p>
            </div>
        </div>
        
        ${data.syarat_khusus ? `
        <div class="detail-section">
            <h4><span class="icon">📝</span> Syarat Khusus</h4>
            <div class="detail-box">
                <p>${escapeHtml(data.syarat_khusus)}</p>
            </div>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h4><span class="icon">🎓</span> Kualifikasi</h4>
            <div class="detail-tags">
                ${programStudi.map(ps => `<span class="detail-tag">${escapeHtml(ps.title)}</span>`).join('')}
                ${jenjang.map(j => `<span class="detail-tag jenjang">${escapeHtml(j)}</span>`).join('')}
            </div>
            ${data.usia_minimal || data.usia_maksimal ? `
            <div style="margin-top: 15px; color: #666;">
                <strong>Usia:</strong> ${data.usia_minimal || '-'} - ${data.usia_maksimal || '-'} tahun
            </div>
            ` : ''}
        </div>
        
        <div class="detail-section">
            <h4><span class="icon">📅</span> Timeline Program</h4>
            <div class="timeline">
                ${createTimelineItem('📝', 'Pendaftaran', jadwal.tanggal_pendaftaran_awal, jadwal.tanggal_pendaftaran_akhir)}
                ${createTimelineItem('🔍', 'Seleksi', jadwal.tanggal_seleksi_mulai, jadwal.tanggal_seleksi_akhir)}
                ${createTimelineItem('📢', 'Pengumuman', jadwal.tanggal_pengumuman_mulai, jadwal.tanggal_pengumuman_akhir)}
                ${createTimelineItem('🎓', 'Periode Magang', jadwal.tanggal_mulai, jadwal.tanggal_selesai)}
            </div>
        </div>
        
        <div class="detail-section">
            <h4><span class="icon">🏢</span> Tentang Perusahaan</h4>
            ${perusahaan.deskripsi_perusahaan ? `
            <div class="detail-box" style="margin-bottom: 15px;">
                <p>${escapeHtml(perusahaan.deskripsi_perusahaan)}</p>
            </div>
            ` : ''}
            <div class="address-box">
                <div class="icon">📍</div>
                <div class="address-text">
                    <p>${escapeHtml(perusahaan.alamat || 'Alamat tidak tersedia')}</p>
                    <p class="location">${escapeHtml(perusahaan.nama_kabupaten || '')}, ${escapeHtml(perusahaan.nama_provinsi || '')}</p>
                </div>
            </div>
        </div>
        
        <div class="apply-section">
            <a href="https://maganghub.kemnaker.go.id/lowongan/${data.id_posisi}" 
               target="_blank" 
               class="btn-apply ${isOpen ? '' : 'disabled'}"
               ${isOpen ? '' : 'onclick="return false;"'}>
                ${isOpen ? '🚀 Daftar Sekarang di MagangHub' : '⏳ Pendaftaran Belum Dibuka / Sudah Ditutup'}
            </a>
        </div>
    `;
}

// Create Timeline Item
function createTimelineItem(icon, title, startDate, endDate) {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    let status = '';
    if (start && end) {
        if (now < start) {
            status = ''; // future
        } else if (now >= start && now <= end) {
            status = 'active'; // current
        } else {
            status = 'past'; // past
        }
    }
    
    return `
        <div class="timeline-item ${status}">
            <div class="timeline-icon">${icon}</div>
            <div class="timeline-content">
                <h5>${title}</h5>
                <p>${formatDate(startDate)} - ${formatDate(endDate)}</p>
            </div>
        </div>
    `;
}
