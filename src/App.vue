<script setup>
import { ref } from 'vue'

const videoUrl = ref('')
const errorMessage = ref('')
const metadata = ref(null)
const isLoading = ref(false)
const openFaq = ref(0)
const copied = ref(false)

const faqs = [
  {
    question: 'Bagaimana cara menyalin tautan video TikTok?',
    answer:
      'Buka video di TikTok, ketuk tombol Bagikan, lalu pilih Salin tautan. Setelah itu, tempel tautannya di kolom pada halaman ini.',
  },
  {
    question: 'Apakah halaman ini mengunduh video?',
    answer:
      'Tidak. oEmbed resmi hanya menyediakan informasi embed dan tautan sumber; halaman ini tidak menyediakan file video/audio untuk diunduh.',
  },
  {
    question: 'Format tautan apa yang bisa dimasukkan?',
    answer:
      'Gunakan tautan video TikTok seperti www.tiktok.com/@akun/video/… atau tautan pendek vm.tiktok.com dan vt.tiktok.com.',
  },
  {
    question: 'Apakah saya boleh mengunduh video apa saja?',
    answer:
      'Pastikan Anda memiliki izin dari pemilik konten dan mematuhi hak cipta serta ketentuan layanan platform sebelum menyimpan atau membagikan video.',
  },
]

function isTikTokUrl(value) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    return (
      url.protocol === 'https:' &&
      (host === 'tiktok.com' ||
        host.endsWith('.tiktok.com'))
    )
  } catch {
    return false
  }
}

async function pasteLink() {
  errorMessage.value = ''
  metadata.value = null

  try {
    videoUrl.value = await navigator.clipboard.readText()
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    errorMessage.value =
      'Clipboard tidak dapat diakses. Silakan tempel tautan secara manual.'
  }
}

async function submitLink() {
  errorMessage.value = ''
  metadata.value = null

  const normalizedUrl = videoUrl.value.trim()
  if (!normalizedUrl) {
    errorMessage.value = 'Masukkan tautan video TikTok terlebih dahulu.'
    return
  }

  if (!isTikTokUrl(normalizedUrl)) {
    errorMessage.value =
      'Tautan tidak dikenali. Gunakan tautan video dari TikTok.'
    return
  }

  isLoading.value = true

  try {
    const response = await fetch(
      `/api/video-metadata?url=${encodeURIComponent(normalizedUrl)}`,
      { headers: { Accept: 'application/json' } },
    )
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error(
        'Backend tidak mengembalikan JSON. Jalankan ulang npm run dev dari folder proyek dan gunakan alamat Vite yang ditampilkan.',
      )
    }

    let result
    try {
      result = await response.json()
    } catch {
      throw new Error(
        'Backend mengirim JSON yang tidak valid. Periksa terminal backend.',
      )
    }

    if (!response.ok) {
      throw new Error(result.error || 'Metadata video tidak dapat dimuat.')
    }

    metadata.value = result
  } catch (error) {
    errorMessage.value =
      error instanceof TypeError
        ? 'Backend tidak dapat dihubungi. Pastikan server backend sedang berjalan.'
        : error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat memuat metadata video.'
  } finally {
    isLoading.value = false
  }
}

function clearLink() {
  videoUrl.value = ''
  errorMessage.value = ''
  metadata.value = null
}
</script>

<template>
  <div class="page-shell">
    <header class="site-header">
      <a class="brand" href="#" aria-label="SnapTik beranda">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path
              d="M17.8 4v15.3a5.6 5.6 0 1 1-4.1-5.4V9.7a9.5 9.5 0 1 0 8.2 9.4V12c1.6 1.3 3.5 2 5.6 2V9.8c-3.4-.2-6.1-2.6-6.7-5.8h-3Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span>スナッピー<span class="brand-accent">ティック</span></span>
      </a>

      <nav class="main-nav" aria-label="Navigasi utama">
        <a href="#cara-kerja">Cara kerja</a>
        <a href="#fitur">Fitur</a>
        <a href="#faq">FAQ</a>
      </nav>

      <a class="header-cta" href="#unduh">今から <span aria-hidden="true">↗</span></a>
    </header>

    <main>
      <section class="hero" id="unduh">
        <div class="hero-glow hero-glow-one"></div>
        <div class="hero-glow hero-glow-two"></div>
        <div class="hero-content">
          <div class="eyebrow"><span class="status-dot"></span> TikTok動画のメタデータ</div>
          <h1>動画を確認する,<br /><span>見る前に.</span></h1>
          <p class="hero-copy">
            TikTokのリンクを貼り付けて、埋め込み情報やソースリンクを確認しましょう。
スマートフォン、タブレット、パソコンから手軽にご利用いただけます。.
          </p>

          <form class="download-card" @submit.prevent="リンクを送信">
            <label class="input-label" for="video-url">TikTok動画のリンク</label>
            <div class="input-row" :class="{ 'has-error': エラーメッセージ }">
              <span class="link-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7M14 10.5a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 19.2l1.7-1.7"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <input
                id="video-url"
                v-model="videoUrl"
                type="url"
                placeholder="TikTok動画のリンクを貼り付けてください..."
                autocomplete="url"
                aria-describedby="form-feedback"
                :disabled="isLoading"
                @input="errorMessage = ''; metadata = null"
              />
              <button
                v-if="videoUrl"
                class="clear-button"
                type="button"
                aria-label="Hapus tautan"
                :disabled="isLoading"
                @click="clearLink"
              >
                ×
              </button>
              <button
                v-else
                class="paste-button"
                type="button"
                :disabled="isLoading"
                @click="pasteLink"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="6" y="6" width="10" height="11" rx="2" stroke="currentColor" stroke-width="1.5" />
                  <path d="M13 6V4.8A1.8 1.8 0 0 0 11.2 3H5.8A1.8 1.8 0 0 0 4 4.8v7.4A1.8 1.8 0 0 0 5.8 14H6" stroke="currentColor" stroke-width="1.5" />
                </svg>
                {{ copied ? 'Tersalin' : 'Tempel' }}
              </button>
            </div>
            <p v-if="エラーメッセージ" id="form-feedback" class="form-feedback error" role="alert">
              {{ エラーメッセージ }}
            </p>
            <div
              v-else-if="metadata"
              id="form-feedback"
              class="metadata-preview"
              role="status"
            >
              <div class="metadata-details">
                <strong>{{ metadata.provider }}</strong>
                <span v-if="metadata.media_type">
                  Jenis konten: {{ metadata.media_type }}
                </span>
                <span v-if="metadata.video_id">
                  ID video: {{ metadata.video_id }}
                </span>
                <a :href="metadata.source_url" target="_blank" rel="noopener noreferrer">
                  Buka video di TikTok ↗
                </a>
              </div>
            </div>
            <p v-else id="form-feedback" class="privacy-note">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2m-7 0h7a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
             続行するには、公開リンクを貼り付けてください
            </p>
            <button class="download-button" type="submit" :disabled="isLoading" :aria-busy="isLoading">
              <span>{{ isLoading ? 'Memuat metadata...' : 'Lihat metadata' }}</span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <div class="card-footnote">
              <span><span class="tiny-check">✓</span> 無料で利用可能</span>
              <span><span class="tiny-check">✓</span> インストール不要</span>
              <span><span class="tiny-check">✓</span> デバイスフレンドリー</span>
            </div>
          </form>

          <div class="supported-by">
            <span class="supported-line"></span>
            <span>すべてのデバイスから簡単にアクセス可能</span>
            <span class="supported-line"></span>
          </div>
          <div class="device-list" aria-label="Kompatibel dengan">
            <span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="5" y="2.5" width="10" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 14.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>モバイル</span>
            <span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 16.5h6M10 13.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>デスクトップ</span>
            <span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="2.5" width="12" height="15" rx="1.8" stroke="currentColor" stroke-width="1.5"/><path d="M8 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>タブレット</span>
          </div>
        </div>
        <div class="hero-decoration" aria-hidden="true">
          <div class="decor-card decor-card-back">
            <div class="decor-video">
              <div class="decor-sun"></div>
              <div class="decor-hill hill-one"></div>
              <div class="decor-hill hill-two"></div>
              <div class="play-button">▶</div>
            </div>
            <div class="decor-lines"><i></i><i></i><i></i></div>
          </div>
          <div class="floating-badge badge-download">
            <span class="badge-icon">↓</span>
            <span><b>Info tersedia</b><small>Lihat sebelum membuka</small></span>
          </div>
          <div class="floating-badge badge-spark">
            <span>✦</span>
          </div>
        </div>
      </section>

      <section class="trust-strip" aria-label="Keunggulan layanan">
        <div><span class="trust-icon">✦</span><strong>簡単なプロセス</strong><small>シンプルなステップ</small></div>
        <div><span class="trust-icon">◎</span><strong>アプリなし</strong><small>ブラウザから直接</small></div>
        <div><span class="trust-icon">⌁</span><strong>さまざまなデバイス</strong><small>デスクトップからモバイルまで</small></div>
        <div><span class="trust-icon">♡</span><strong>無料でアクセス可能</strong><small>登録は不要です</small></div>
      </section>

      <section class="how-section section-wrap" id="cara-kerja">
        <div class="section-heading">
          <span class="section-kicker">仕組み</span>
          <h2>3つのステップ, <span>それほど単純なこと.</span></h2>
          <p>保存したい動画のリンクから始めましょう.</p>
        </div>
        <div class="steps-grid">
          <article class="step-card">
            <div class="step-number">01 <span>↗</span></div>
            <div class="step-illustration copy-illustration" aria-hidden="true">
              <div class="mini-phone"><div class="mini-video"><span>▶</span></div><i></i><i></i><div class="share-dot">↑</div></div>
            </div>
            <h3>リンクをコピー</h3>
            <p>TikTokで動画を選び、「共有」メニューからリンクをコピーします。.</p>
          </article>
          <article class="step-card">
            <div class="step-number">02 <span>↗</span></div>
            <div class="step-illustration paste-illustration" aria-hidden="true">
              <div class="mini-input"><span>tiktok.com/@...</span><b>↳</b></div><div class="paste-arrow">↓</div>
            </div>
            <h3>Tempel di sini</h3>
            <p>Masukkan tautan ke kolom di atas. Kami akan memeriksa format tautannya.</p>
          </article>
          <article class="step-card">
            <div class="step-number">03 <span>↗</span></div>
            <div class="step-illustration save-illustration" aria-hidden="true">
              <div class="save-circle"><span>↓</span></div><div class="save-spark spark-a">✦</div><div class="save-spark spark-b">✧</div>
            </div>
            <h3>Lihat metadata</h3>
            <p>Lihat informasi embed yang tersedia sebelum membuka sumber resmi di TikTok.</p>
          </article>
        </div>
      </section>

      <section class="features-section" id="fitur">
        <div class="features-inner section-wrap">
          <div class="features-copy">
            <span class="section-kicker">DIBUAT UNTUKMU</span>
            <h2>Lebih mudah<br />mengenali <span>video.</span></h2>
            <p>Lihat informasi dasar video langsung lewat browser favoritmu.</p>
            <a class="text-link" href="#unduh">Coba sekarang <span>→</span></a>
          </div>
          <div class="feature-list">
            <article class="feature-item">
              <span class="feature-icon purple">◈</span>
              <div><h3>Alur yang sederhana</h3><p>Tempel tautan dan ikuti langkah berikutnya dari satu halaman.</p></div>
            </article>
            <article class="feature-item">
              <span class="feature-icon yellow">⌘</span>
              <div><h3>Siap di berbagai layar</h3><p>Tampilan menyesuaikan dengan ponsel, tablet, dan desktop.</p></div>
            </article>
            <article class="feature-item">
              <span class="feature-icon green">↗</span>
              <div><h3>Tanpa pemasangan</h3><p>Buka halaman ini di browser tanpa mengunduh aplikasi tambahan.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section class="faq-section section-wrap" id="faq">
        <div class="section-heading">
          <span class="section-kicker">PUNYA PERTANYAAN?</span>
          <h2>Yang sering <span>ditanyakan.</span></h2>
          <p>Info singkat untuk membantumu memulai.</p>
        </div>
        <div class="faq-list">
          <article v-for="(faq, index) in faqs" :key="faq.question" class="faq-item" :class="{ expanded: openFaq === index }">
            <button
              class="faq-question"
              type="button"
              :aria-expanded="openFaq === index"
              @click="openFaq = openFaq === index ? -1 : index"
            >
              <span>{{ faq.question }}</span><span class="faq-toggle">{{ openFaq === index ? '−' : '+' }}</span>
            </button>
            <p v-if="openFaq === index" class="faq-answer">{{ faq.answer }}</p>
          </article>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-main">
        <a class="brand footer-brand" href="#" aria-label="SnapTik beranda">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none"><path d="M17.8 4v15.3a5.6 5.6 0 1 1-4.1-5.4V9.7a9.5 9.5 0 1 0 8.2 9.4V12c1.6 1.3 3.5 2 5.6 2V9.8c-3.4-.2-6.1-2.6-6.7-5.8h-3Z" fill="currentColor"/></svg>
          </span>
          <span>Snap<span class="brand-accent">Tik</span></span>
        </a>
        <p>Pratinjau metadata publik video TikTok.</p>
        <span class="footer-note">Gunakan konten secara bertanggung jawab dan hormati hak pemiliknya.</span>
      </div>
      <div class="footer-bottom">
        <span>© 2025 SnapTik. Dibuat untuk pengalaman yang lebih sederhana.</span>
        <a href="#unduh">Kembali ke atas ↑</a>
      </div>
    </footer>
  </div>
</template>
