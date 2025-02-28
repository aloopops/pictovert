document.addEventListener('DOMContentLoaded', function() {
    const generateForm = document.getElementById('generateForm');
    const promptInput = document.getElementById('prompt');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const imageContainer = document.getElementById('imageContainer');
    const errorMessage = document.getElementById('errorMessage');

    generateForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Reset UI state
        errorMessage.classList.add('d-none');
        imageContainer.classList.add('d-none');
        loadingSpinner.classList.remove('d-none');

        const formData = new FormData();
        formData.append('prompt', promptInput.value);

        try {
            const response = await fetch('/generate', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate images');
            }

            // Clear previous images
            imageContainer.innerHTML = '<div class="row"></div>';
            const imageGrid = imageContainer.querySelector('.row');

            // Display all generated images
            data.images.forEach((imageBase64, index) => {
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-4';
                col.innerHTML = `
                    <div class="card">
                        <img src="data:image/png;base64,${imageBase64}" class="card-img-top" alt="Generated Image ${index + 1}">
                        <div class="card-body">
                            <button class="btn btn-success download-btn" data-image="data:image/png;base64,${imageBase64}">
                                <i class="fa fa-download me-2"></i>
                                Download Image
                            </button>
                        </div>
                    </div>
                `;
                imageGrid.appendChild(col);
            });

            imageContainer.classList.remove('d-none');

            // Add click handlers for download buttons
            imageContainer.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    try {
                        const formData = new FormData();
                        formData.append('image', this.dataset.image);

                        const response = await fetch('/download', {
                            method: 'POST',
                            body: formData
                        });

                        if (!response.ok) {
                            throw new Error('Failed to download image');
                        }

                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `generated_image_${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    } catch (error) {
                        errorMessage.textContent = error.message;
                        errorMessage.classList.remove('d-none');
                    }
                });
            });
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('d-none');
        } finally {
            loadingSpinner.classList.add('d-none');
        }
    });
});