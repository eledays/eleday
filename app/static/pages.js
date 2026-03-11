/**
 * Pages System with Swipe Navigation
 * - Horizontal swipe to navigate pages
 * - Progress bar at top
 * - Smooth transitions with cubic-bezier easing
 * - Vertical scroll within each page
 */

class PagesSystem {
  constructor(options = {}) {
    this.wrapper = document.querySelector(options.wrapper || '.pages-wrapper');
    this.container = document.querySelector(options.container || '.pages-container');
    this.progressBar = document.querySelector(options.progress || '.pages-progress');
    
    if (!this.wrapper || !this.container) {
      console.warn('PagesSystem: wrapper or container not found');
      return;
    }

    this.pages = Array.from(this.container.querySelectorAll('.page'));
    this.currentIndex = 0;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.isDragging = false;
    this.isTransitioning = false;
    this.dragDirection = null; // 'horizontal', 'vertical', or null
    this.minSwipeDistance = 50; // pixels
    this.directionThreshold = 10; // pixels needed to determine direction

    // Bind methods once to use in remove listener
    this._onTouchStart = this.onTouchStart.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onTouchEnd = this.onTouchEnd.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);

    this.init();
  }

  init() {
    if (this.pages.length === 0) {
      console.warn('PagesSystem: no pages found');
      return;
    }

    // Initialize block animation indices
    this.initializeBlockAnimations();

    // Setup progress bar segments
    this.setupProgressBar();

    // Touch events
    this.wrapper.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.wrapper.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.wrapper.addEventListener('touchend', this._onTouchEnd, { passive: false });

    // Mouse events
    this.wrapper.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);

    // Keyboard navigation
    document.addEventListener('keydown', this._onKeyDown);

    // Show first page
    this.goToPage(0, false);
  }

  initializeBlockAnimations() {
    this.pages.forEach((page) => {
      const blocks = page.querySelectorAll('.block');
      blocks.forEach((block, index) => {
        block.style.setProperty('--index', index);
      });
    });
  }

  setupProgressBar() {
    if (!this.progressBar) return;

    this.progressBar.innerHTML = '';
    this.progressSegments = [];

    this.pages.forEach((page, index) => {
      const segment = document.createElement('div');
      segment.className = 'pages-progress-segment';
      segment.setAttribute('data-index', index);
      segment.setAttribute('tabindex', '0');
      segment.setAttribute('role', 'button');
      segment.setAttribute('aria-label', `Go to page ${index + 1}`);

      segment.addEventListener('click', () => this.goToPage(index, true));
      segment.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.goToPage(index, true);
        }
      });

      this.progressBar.appendChild(segment);
      this.progressSegments.push(segment);
    });
  }

  updateProgress() {
    if (!this.progressSegments) return;
    this.progressSegments.forEach((seg, index) => {
      seg.classList.toggle('active', index <= this.currentIndex);
    });
  }

  onTouchStart(e) {
    if (this.isTransitioning) return;
    
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.currentX = this.startX;
    this.currentY = this.startY;
    this.isDragging = true;
    this.dragDirection = null; // Reset direction until we can determine it
    this.wrapper.classList.add('dragging');
    this.container.style.transition = 'none';
  }

  onTouchMove(e) {
    if (!this.isDragging) return;
    
    this.currentX = e.touches[0].clientX;
    this.currentY = e.touches[0].clientY;
    
    const diffX = Math.abs(this.currentX - this.startX);
    const diffY = Math.abs(this.currentY - this.startY);
    
    // Determine direction on first significant movement
    if (this.dragDirection === null && (diffX > this.directionThreshold || diffY > this.directionThreshold)) {
      if (diffX > diffY) {
        this.dragDirection = 'horizontal';
      } else {
        this.dragDirection = 'vertical';
      }
    }
    
    // Only apply horizontal drag transform if horizontal movement detected
    if (this.dragDirection === 'horizontal') {
      e.preventDefault();
      this.updateDragPosition();
    }
  }

  onTouchEnd(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.wrapper.classList.remove('dragging');
    
    // Only handle swipe if it was a horizontal drag
    if (this.dragDirection === 'horizontal') {
      this.handleSwipeEnd();
    } else {
      // For vertical drags, just ensure container is at correct position
      this.container.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      this.container.style.transform = `translateX(${-this.currentIndex * 100}%)`;
      setTimeout(() => {
        this.isTransitioning = false;
      }, 200);
    }
    
    this.dragDirection = null;
  }

  onMouseDown(e) {
    if (this.isTransitioning) return;
    // Ignore if clicking on interactive elements
    if (e.target.closest('a, button, input, textarea, [role="button"]')) return;
    
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currentX = this.startX;
    this.currentY = this.startY;
    this.isDragging = true;
    this.dragDirection = null;
    this.wrapper.classList.add('dragging');
    this.container.style.transition = 'none';
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    
    this.currentX = e.clientX;
    this.currentY = e.clientY;
    
    const diffX = Math.abs(this.currentX - this.startX);
    const diffY = Math.abs(this.currentY - this.startY);
    
    // Determine direction on first significant movement
    if (this.dragDirection === null && (diffX > this.directionThreshold || diffY > this.directionThreshold)) {
      if (diffX > diffY) {
        this.dragDirection = 'horizontal';
      } else {
        this.dragDirection = 'vertical';
      }
    }
    
    // Only apply horizontal drag transform if horizontal movement detected
    if (this.dragDirection === 'horizontal') {
      this.updateDragPosition();
    }
  }

  onMouseUp(e) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.wrapper.classList.remove('dragging');
    
    // Only handle swipe if it was a horizontal drag
    if (this.dragDirection === 'horizontal') {
      this.handleSwipeEnd();
    } else {
      // For vertical drags, just ensure container is at correct position
      this.container.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      this.container.style.transform = `translateX(${-this.currentIndex * 100}%)`;
      setTimeout(() => {
        this.isTransitioning = false;
      }, 200);
    }
    
    this.dragDirection = null;
  }

  onKeyDown(e) {
    if (this.isTransitioning) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.wrapper.classList.add('keyboard-nav');
      this.prevPage();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.wrapper.classList.add('keyboard-nav');
      this.nextPage();
    }

    setTimeout(() => this.wrapper.classList.remove('keyboard-nav'), 300);
  }

  updateDragPosition() {
    const diff = this.currentX - this.startX;
    const offset = -this.currentIndex * 100 + (diff / this.wrapper.offsetWidth) * 100;
    this.container.style.transform = `translateX(${offset}%)`;
  }

  handleSwipeEnd() {
    const diff = this.currentX - this.startX;
    const distance = Math.abs(diff);
    const threshold = this.wrapper.offsetWidth * 0.25; // 25% of screen width

    let targetIndex = this.currentIndex;

    if (distance > threshold) {
      if (diff > 0) {
        // Swiped right -> go to previous page
        targetIndex = Math.max(0, this.currentIndex - 1);
      } else {
        // Swiped left -> go to next page
        targetIndex = Math.min(this.pages.length - 1, this.currentIndex + 1);
      }
    }

    // Always animate back to target page (even if same index)
    this.goToPage(targetIndex, true);
  }

  prevPage() {
    const targetIndex = Math.max(0, this.currentIndex - 1);
    this.goToPage(targetIndex, true);
  }

  nextPage() {
    const targetIndex = Math.min(this.pages.length - 1, this.currentIndex + 1);
    this.goToPage(targetIndex, true);
  }

  goToPage(index, animate = true) {
    index = Math.max(0, Math.min(index, this.pages.length - 1));

    this.currentIndex = index;
    this.isTransitioning = true;

    // Always set transition, even if animating to same page (for snap-back)
    this.container.style.transition = animate 
      ? 'transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none';

    this.container.style.transform = `translateX(${-index * 100}%)`;

    this.updateProgress();

    const duration = animate ? 350 : 0;
    setTimeout(() => {
      this.isTransitioning = false;
    }, duration);
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  getTotalPages() {
    return this.pages.length;
  }

  destroy() {
    this.wrapper.removeEventListener('touchstart', this._onTouchStart);
    this.wrapper.removeEventListener('touchmove', this._onTouchMove);
    this.wrapper.removeEventListener('touchend', this._onTouchEnd);
    this.wrapper.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('keydown', this._onKeyDown);
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pagesSystem = new PagesSystem();
  });
} else {
  window.pagesSystem = new PagesSystem();
}
