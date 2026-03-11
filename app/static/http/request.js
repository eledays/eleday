/**
 * HTTP Request Builder
 * Safe educational tool for sending HTTP requests from the browser
 */

class HTTPRequestBuilder {
  constructor() {
    // Form elements
    this.methodSelect = document.getElementById('req-method');
    this.urlInput = document.getElementById('req-url');
    this.headersTextarea = document.getElementById('req-headers');
    this.bodyTextarea = document.getElementById('req-body');
    this.bodyGroup = document.getElementById('req-body-group');
    this.sendBtn = document.getElementById('req-send');

    // Result elements
    this.resultDiv = document.getElementById('req-result');
    this.loadingDiv = document.getElementById('req-loading');
    this.errorDiv = document.getElementById('req-error');
    this.statusCode = document.getElementById('req-status');
    this.responseHeaders = document.getElementById('req-response-headers');
    this.responseBody = document.getElementById('req-response-body');
    this.errorText = document.getElementById('req-error-text');

    this.init();
  }

  init() {
    // Show body field only for methods that typically have body
    this.methodSelect.addEventListener('change', () => this.updateBodyFieldVisibility());
    this.sendBtn.addEventListener('click', () => this.sendRequest());

    // Allow Enter to send if focused on URL
    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        this.sendRequest();
      }
    });

    // Обработка примеров
    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.loadExample(e.target));
    });

    this.updateBodyFieldVisibility();
  }

  loadExample(btn) {
    const method = btn.getAttribute('data-method');
    const url = btn.getAttribute('data-url');
    const body = btn.getAttribute('data-body');

    this.methodSelect.value = method;
    this.urlInput.value = url;
    
    if (body) {
      this.bodyTextarea.value = body;
    } else {
      this.bodyTextarea.value = '';
    }

    this.updateBodyFieldVisibility();
    
    // Автоматически отправляем запрос
    setTimeout(() => this.sendRequest(), 100);
  }

  updateBodyFieldVisibility() {
    const method = this.methodSelect.value;
    const shouldShowBody = ['POST', 'PUT', 'PATCH'].includes(method);
    this.bodyGroup.style.display = shouldShowBody ? 'block' : 'none';
  }

  /**
   * Validate URL for security
   */
  validateUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Security warnings
      const warnings = [];

      // Warn about localhost
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        warnings.push('⚠️ Это localhost. Убедись, что сервер запущен локально.');
      }

      // Warn about private IP ranges
      if (this.isPrivateIP(urlObj.hostname)) {
        warnings.push('⚠️ Это приватный IP-адрес. Запрос может быть заблокирован браузером.');
      }

      // Warn about HTTP
      if (urlObj.protocol === 'http:') {
        warnings.push('⚠️ Это HTTP (незащищённый). Используй HTTPS для чувствительных данных.');
      }

      if (warnings.length > 0) {
        console.warn('URL warnings:', warnings.join('\n'));
      }

      return true;
    } catch (e) {
      throw new Error(`Неверный URL: ${e.message}`);
    }
  }

  /**
   * Check if hostname is a private IP
   */
  isPrivateIP(hostname) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^::1$/,
      /^fc[0-9a-f]{2}:/i,
      /^fd[0-9a-f]{2}:/i,
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Parse headers from textarea
   */
  parseHeaders(text) {
    const headers = {};
    
    if (!text.trim()) return headers;

    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) {
        throw new Error(`Неверный формат заголовка: "${trimmed}". Используй "Имя: значение"`);
      }

      const name = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (!name) {
        throw new Error('Имя заголовка не может быть пустым');
      }

      headers[name] = value;
    }

    return headers;
  }

  /**
   * Show error message
   */
  showError(message) {
    this.hideResults();
    this.errorDiv.style.display = 'block';
    this.errorText.textContent = message;
    this.loadingDiv.style.display = 'none';
  }

  /**
   * Hide all result sections
   */
  hideResults() {
    this.resultDiv.style.display = 'none';
    this.errorDiv.style.display = 'none';
    this.loadingDiv.style.display = 'none';
  }

  /**
   * Format JSON for display
   */
  formatJSON(jsonString) {
    try {
      const obj = JSON.parse(jsonString);
      return JSON.stringify(obj, null, 2);
    } catch {
      // Not JSON, return as is
      return jsonString;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Build readable header string from object
   */
  formatHeaders(headers) {
    let result = '';
    for (const [key, value] of Object.entries(headers)) {
      result += `<div><strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}</div>`;
    }
    return result || '<p><em>Нет заголовков</em></p>';
  }

  /**
   * Send HTTP request
   */
  async sendRequest() {
    this.hideResults();
    this.loadingDiv.style.display = 'block';
    this.sendBtn.disabled = true;

    try {
      // Validate URL
      const url = this.urlInput.value.trim();
      if (!url) {
        throw new Error('Введи URL');
      }
      this.validateUrl(url);

      // Get method and body
      const method = this.methodSelect.value;
      let body = null;
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        const bodyText = this.bodyTextarea.value.trim();
        if (bodyText) {
          body = bodyText;
        }
      }

      // Parse headers
      const customHeaders = this.parseHeaders(this.headersTextarea.value);

      // Prepare fetch options
      const fetchOptions = {
        method,
        headers: customHeaders,
        mode: 'cors',
        timeout: 10000, // 10 second timeout
      };

      if (body) {
        fetchOptions.body = body;

        // Auto-detect content-type if not set
        if (!customHeaders['Content-Type']) {
          if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
            fetchOptions.headers['Content-Type'] = 'application/json';
          }
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      fetchOptions.signal = controller.signal;

      // Send request
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Get response body as text first
      const responseText = await response.text();

      // Format response
      this.loadingDiv.style.display = 'none';
      this.resultDiv.style.display = 'block';

      // Status
      this.statusCode.textContent = `${response.status} ${response.statusText}`;
      this.statusCode.className = response.ok ? 'status-ok' : 'status-error';

      // Headers
      const responseHeadersObj = {};
      for (const [key, value] of response.headers) {
        responseHeadersObj[key] = value;
      }
      this.responseHeaders.innerHTML = this.formatHeaders(responseHeadersObj);

      // Body
      const formattedBody = this.formatJSON(responseText);
      this.responseBody.textContent = formattedBody;

    } catch (error) {
      if (error.name === 'AbortError') {
        this.showError('Таймаут: сервер не ответил за 10 секунд');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        this.showError(
          `CORS ошибка или сетевая проблема.\n\n` +
          `Возможные причины:\n` +
          `• Сервер не поддерживает CORS\n` +
          `• Неверный URL\n` +
          `• Сервер недоступен\n\n` +
          `Детали: ${error.message}`
        );
      } else {
        this.showError(error.message || 'Неизвестная ошибка');
      }
    } finally {
      this.sendBtn.disabled = false;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.httpRequestBuilder = new HTTPRequestBuilder();
  });
} else {
  window.httpRequestBuilder = new HTTPRequestBuilder();
}
