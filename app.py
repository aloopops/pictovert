import os
import logging
from flask import Flask, render_template, request, jsonify, send_file
from gradio_client import Client
from PIL import Image
import io
import base64

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# Initialize Gradio client with the new model
client = Client("abdullahalioo/Text-to-Image_great")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_image():
    try:
        prompt = request.form.get('prompt')
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Generate images using gradio client with the specified model
        logger.debug(f"Generating images for prompt: {prompt}")
        result = client.predict(
            prompt,  # text prompt
            "Model 1 (Turbo Realism)",  # selected model
            api_name="/generate_images"
        )

        # Result is a tuple containing multiple image paths
        image_paths = result if isinstance(result, tuple) else [result]
        logger.debug(f"Generated image paths: {image_paths}")

        # Convert all images to base64
        images_base64 = []
        for image_path in image_paths:
            img = Image.open(image_path)
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            img_base64 = base64.b64encode(img_byte_arr).decode('utf-8')
            images_base64.append(img_base64)

        return jsonify({
            'success': True,
            'images': images_base64
        })

    except Exception as e:
        logger.error(f"Error generating images: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['POST'])
def download_image():
    try:
        image_data = request.form.get('image')
        if not image_data:
            return jsonify({'error': 'Image data is required'}), 400

        # Decode base64 image
        image_data = base64.b64decode(image_data.split(',')[1])

        # Create BytesIO object
        img_io = io.BytesIO(image_data)
        img_io.seek(0)

        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=True,
            download_name='generated_image.png'
        )

    except Exception as e:
        logger.error(f"Error downloading image: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)