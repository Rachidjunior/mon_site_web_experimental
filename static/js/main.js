/**
 * Main JavaScript file for YOLOv8 Detection Application
 * Contains global functionality and utility functions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        if (!alert.classList.contains('alert-permanent')) {
            setTimeout(() => {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }, 5000);
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // File size formatter utility
    window.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Loading animation utilities
    window.showLoading = function(element, text = 'Loading...') {
        if (element) {
            element.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    ${text}
                </div>
            `;
            element.disabled = true;
        }
    };

    window.hideLoading = function(element, originalText) {
        if (element) {
            element.innerHTML = originalText;
            element.disabled = false;
        }
    };

    // Form validation utilities
    window.validateForm = function(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
                field.classList.add('is-valid');
            }
        });

        return isValid;
    };

    // Progress bar animation
    window.animateProgressBar = function(progressBar, targetWidth, duration = 1000) {
        let currentWidth = 0;
        const increment = targetWidth / (duration / 16); // 60fps

        const animate = () => {
            currentWidth += increment;
            if (currentWidth >= targetWidth) {
                currentWidth = targetWidth;
                progressBar.style.width = currentWidth + '%';
                progressBar.setAttribute('aria-valuenow', currentWidth);
                return;
            }
            
            progressBar.style.width = currentWidth + '%';
            progressBar.setAttribute('aria-valuenow', currentWidth);
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    };

    // Notification system
    window.showNotification = function(message, type = 'info', duration = 3000) {
        const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.marginBottom = '0.5rem';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        notificationContainer.appendChild(notification);

        // Auto-dismiss after duration
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(notification);
            bsAlert.close();
        }, duration);
    };

    function createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        container.style.maxWidth = '400px';
        document.body.appendChild(container);
        return container;
    }

    // Image preview utility
    window.createImagePreview = function(file, container) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'img-thumbnail';
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            container.innerHTML = '';
            container.appendChild(img);
        };
        reader.readAsDataURL(file);
    };

    // Video preview utility
    window.createVideoPreview = function(file, container) {
        const video = document.createElement('video');
        video.controls = true;
        video.className = 'img-thumbnail';
        video.style.maxWidth = '200px';
        video.style.maxHeight = '200px';
        
        const url = URL.createObjectURL(file);
        video.src = url;
        
        container.innerHTML = '';
        container.appendChild(video);
        
        // Clean up object URL when video is removed
        video.addEventListener('loadeddata', () => {
            URL.revokeObjectURL(url);
        });
    };

    // Detect file type
    window.getFileType = function(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
        
        if (imageExtensions.includes(extension)) {
            return 'image';
        } else if (videoExtensions.includes(extension)) {
            return 'video';
        } else {
            return 'unknown';
        }
    };

    // Debounce utility
    window.debounce = function(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    // Throttle utility
    window.throttle = function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // Copy to clipboard utility
    window.copyToClipboard = function(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(() => {
                showNotification('Copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                showNotification('Failed to copy to clipboard', 'error');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showNotification('Copied to clipboard!', 'success');
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
                showNotification('Failed to copy to clipboard', 'error');
            }
            document.body.removeChild(textArea);
        }
    };

    // API request utility with loading states
    window.apiRequest = function(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        return fetch(url, finalOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('API request failed:', error);
                showNotification('Request failed. Please try again.', 'danger');
                throw error;
            });
    };

    // Initialize page-specific functionality
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('upload')) {
        initializeUploadPage();
    } else if (currentPage.includes('loading')) {
        initializeLoadingPage();
    } else if (currentPage.includes('results')) {
        initializeResultsPage();
    }
});

// Page-specific initialization functions
function initializeUploadPage() {
    console.log('Upload page initialized');
    // Additional upload page functionality can be added here
}

function initializeLoadingPage() {
    console.log('Loading page initialized');
    // Additional loading page functionality can be added here
}

function initializeResultsPage() {
    console.log('Results page initialized');
    
    // Add image zoom functionality
    const images = document.querySelectorAll('.img-fluid');
    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function() {
            openImageModal(this.src, this.alt);
        });
    });
}

// Image modal for results page
function openImageModal(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${alt}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="${src}" alt="${alt}" class="img-fluid">
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Clean up modal after it's hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Could send error reports to a logging service here
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    // Could send error reports to a logging service here
});
