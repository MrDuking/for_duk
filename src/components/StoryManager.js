// ─────────────────────────────────────────────────────────────────────────────
// StoryManager.js  –  handles proximity triggers, chapter labels and dialogs
// ─────────────────────────────────────────────────────────────────────────────

const CHAPTERS = {
  childhood: {
    title: '🌱 Tuổi Thơ',
    body: `Hành trình bắt đầu từ một ngôi làng nhỏ ấm áp. Những buổi chiều chạy nhảy
ngoài sân, xây lâu đài cát, đọc truyện tranh đến tận khuya – đó là những
ký ức không bao giờ phai. Gia đình là ngọn nến đầu tiên thắp sáng con đường,
và tình bạn thuở ấu thơ là những viên đá đặt nền cho tính cách sau này.`,
    color: '#ffd700',
    zone: 'Tuổi Thơ',
  },
  youth: {
    title: '📚 Tuổi Học Trò',
    body: `Những năm tháng cắp sách đến trường. Lần đầu tiên cầm bút vẽ code trên giấy,
lần đầu tự giải một bài toán khó – cảm giác đó thật kỳ diệu. Bạn bè tốt
đã đến, cả những thử thách cũng đến. Nhưng chính những khó khăn đó đã rèn
luyện ý chí và hun đúc lòng kiên trì.`,
    color: '#4fc3f7',
    zone: 'Tuổi Học Trò',
  },
  dreams: {
    title: '✨ Những Giấc Mơ',
    body: `Đêm đêm ngồi trước màn hình máy tính, viết từng dòng code trong ánh đèn xanh.
Mơ về những sản phẩm thay đổi thế giới, về những trò chơi truyền cảm hứng cho
hàng triệu người. Ước mơ không phải để ngủ – ước mơ là để thức dậy mỗi sáng
với ngọn lửa đam mê bừng cháy trong lồng ngực.`,
    color: '#bd7aff',
    zone: 'Những Giấc Mơ',
  },
  future: {
    title: '🚀 Tương Lai',
    body: `Tên lửa đã sẵn sàng. Hành trình phía trước còn dài và đầy bí ẩn, nhưng
mỗi bước đi đều được xây dựng từ những bài học và ký ức quý giá. Tương lai
không phải là nơi bạn đến – tương lai là nơi bạn xây dựng. Và câu chuyện
của Duk vẫn đang tiếp tục được viết mỗi ngày...`,
    color: '#00e5ff',
    zone: 'Tương Lai',
  },
};

const TRIGGER_RADIUS   = 18;
const LABEL_RADIUS     = 35;
const ALREADY_SEEN_KEY = 'duk_seen_chapters';

export class StoryManager {
  constructor(landmarks) {
    this.landmarks = landmarks;

    this.dialogEl      = document.getElementById('story-dialog');
    this.titleEl       = document.getElementById('dialog-title');
    this.bodyEl        = document.getElementById('dialog-body');
    this.closeBtn      = document.getElementById('story-close');
    this.chapterLabel  = document.getElementById('chapter-label');
    this.progressBar   = document.getElementById('progress-bar');

    // Track which chapters have been shown
    try {
      this.seen = new Set(JSON.parse(localStorage.getItem(ALREADY_SEEN_KEY) || '[]'));
    } catch {
      this.seen = new Set();
    }

    this._dialogOpen  = false;
    this._activeLabel = '';

    this.closeBtn.addEventListener('click', () => this.closeDialog());
    document.addEventListener('keydown', e => {
      if (e.code === 'KeyF' || e.code === 'Enter') this.closeDialog();
    });

    this._updateProgressBar();
  }

  /** Called every frame with the player's world position */
  update(playerPos) {
    if (this._dialogOpen) return;

    let nearestLabel = '';
    let nearestDist  = Infinity;

    this.landmarks.forEach(lm => {
      const dx = lm.position.x - playerPos.x;
      const dz = lm.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const key  = lm.userData.label;

      // Trigger story dialog on first approach
      if (dist < TRIGGER_RADIUS && !this.seen.has(key)) {
        this._showChapter(key);
      }

      // Chapter label in HUD
      if (dist < LABEL_RADIUS && dist < nearestDist) {
        nearestDist  = dist;
        nearestLabel = CHAPTERS[key]?.zone ?? '';
      }
    });

    if (nearestLabel !== this._activeLabel) {
      this._activeLabel = nearestLabel;
      this._setLabel(nearestLabel);
    }
  }

  _showChapter(key) {
    const chapter = CHAPTERS[key];
    if (!chapter) return;

    this.titleEl.textContent = chapter.title;
    this.bodyEl.textContent  = chapter.body;
    this.titleEl.style.color = chapter.color;

    this.dialogEl.classList.add('visible');
    this._dialogOpen = true;

    // Unlock cursor so user can click the close button
    document.exitPointerLock();
  }

  closeDialog() {
    if (!this._dialogOpen) return;

    // Mark the chapter whose title matches the currently open dialog as seen
    for (const [k, v] of Object.entries(CHAPTERS)) {
      if (this.titleEl.textContent === v.title) {
        this.seen.add(k);
      }
    }

    try {
      localStorage.setItem(ALREADY_SEEN_KEY, JSON.stringify([...this.seen]));
    } catch { /* ignore */ }

    this.dialogEl.classList.remove('visible');
    this._dialogOpen = false;
    this._updateProgressBar();
  }

  _setLabel(text) {
    this.chapterLabel.textContent = text;
    this.chapterLabel.style.opacity = text ? '1' : '0';
  }

  _updateProgressBar() {
    const pct = (this.seen.size / Object.keys(CHAPTERS).length) * 100;
    this.progressBar.style.width = `${pct}%`;
  }

  get isDialogOpen() {
    return this._dialogOpen;
  }
}
