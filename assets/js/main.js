document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const menuIcon = document.getElementById('menuIcon');
    const menuLinks = document.querySelector('.menu-links');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const urlInput = document.getElementById('urlInput');
    const addUrlBtn = document.getElementById('addUrlBtn');
    const videoSection = document.getElementById('videoSection');
    const uploadedVideo = document.getElementById('uploadedVideo');
    const shareContainer = document.getElementById('shareContainer');
    const shareLink = document.getElementById('shareLink');
    const copyLink = document.getElementById('copyLink');
    const uploadModal = document.getElementById('uploadModal');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatus = document.getElementById('uploadStatus');

    // Toggle mobile menu
    menuIcon.addEventListener('click', () => {
        menuLinks.classList.toggle('active');
    });

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    function handleFile(file) {
        if (file && file.type.startsWith('video/')) {
            if (file.size <= 500 * 1024 * 1024) { // 500MB limit
                uploadFile(file);
            } else {
                alert('File size exceeds 500MB limit');
            }
        } else {
            alert('Please select a valid video file');
        }
    }

    function uploadFile(file) {
        uploadModal.style.display = 'flex';

        const formData = new FormData();
        formData.append('video', file);

        fetch('upload.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    uploadModal.style.display = 'none';
                    displayVideo(data.url, data.filename, data.share_url);
                } else {
                    alert('Upload failed: ' + data.message);
                    uploadModal.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Upload failed. Please try again.');
                uploadModal.style.display = 'none';
            });

        // Show upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress <= 90) { // Only go up to 90% until we get server response
                uploadProgress.style.width = `${progress}%`;
                uploadStatus.textContent = `Uploading: ${progress}%`;
            }
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
    }

    // URL input handling
    addUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            if (isValidVideoUrl(url)) {
                saveVideoUrl(url);
            } else {
                alert('Please enter a valid video URL (must end with .mp4, .webm, or .ogg)');
            }
        }
    });

    function saveVideoUrl(url) {
        const formData = new FormData();
        formData.append('url_mp4', url);
        formData.append('from_url', '1');

        fetch('save_url.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayVideo(data.url_mp4, data.titulo, data.share_url);
                    urlInput.value = '';
                } else {
                    alert('Failed to save video URL: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to save video URL. Please try again.');
            });
    }

    function isValidVideoUrl(url) {
        try {
            const urlObj = new URL(url);
            return url.match(/\.(mp4|webm|ogg)$/i) !== null;
        } catch {
            return false;
        }
    }

    function displayVideo(url, title, shareUrl) {
        uploadedVideo.style.display = 'block';
        uploadedVideo.src = url;
        shareContainer.style.display = 'block';
        shareLink.textContent = shareUrl;

        // Update social share buttons
        updateSocialLinks(shareUrl, title);

        // Scroll to video section
        videoSection.scrollIntoView({
            behavior: 'smooth'
        });
    }

    // Copy link functionality
    copyLink.addEventListener('click', () => {
        const link = shareLink.textContent;
        navigator.clipboard.writeText(link).then(() => {
            const originalText = copyLink.innerHTML;
            copyLink.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyLink.innerHTML = originalText;
            }, 2000);
        });
    });

    function updateSocialLinks(url, title) {
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);

        const socialButtons = document.querySelectorAll('.social-share a');
        socialButtons.forEach(button => {
            if (button.classList.contains('facebook')) {
                button.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            } else if (button.classList.contains('twitter')) {
                button.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
            } else if (button.classList.contains('whatsapp')) {
                button.href = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
            }
        });
    }
});