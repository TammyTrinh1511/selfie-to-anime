import os
import time
import json
import logging
import requests
from io import BytesIO
from typing import Optional
from PIL import Image
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("debug.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize API keys
API_KEY = os.getenv("API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Check for API keys
if not API_KEY:
    logger.error("API_KEY environment variable not set")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable not set")

# Configure Gemini
try:
    genai.configure(api_key=GEMINI_API_KEY)
    LLM = genai.GenerativeModel("gemini-2.0-flash")
    logger.info("Gemini API configured successfully")
except Exception as e:
    logger.error(f"Error configuring Gemini API: {str(e)}")

# Create FastAPI app
app = FastAPI(title="Caricature Generator API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Create output directory if it doesn't exist
os.makedirs("output", exist_ok=True)

# Check for logo file
logo_path = "data/logo-lts.png"
if not os.path.exists(logo_path):
    os.makedirs("data", exist_ok=True)
    # Create a simple placeholder logo
    placeholder_logo = Image.new('RGBA', (100, 100), color=(255, 0, 0, 128))
    placeholder_logo.save(logo_path)
    logger.info(f"Created placeholder logo at {logo_path}")

@app.get("/")
async def root():
    return {"message": "Caricature Generator API is running"}

async def predict_gender(image_path):
    logger.debug(f"Predicting gender for image: {image_path}")
    try:
        img = Image.open(image_path)

        # Ask the model
        prompt = (
            "Based on the image, is the main person a man or a woman? "
            "Respond with exactly one word: either 'Man' or 'Woman'."
        )

        response = LLM.generate_content([prompt, img], stream=False)
        answer = response.text.strip().lower()
        logger.debug(f"Raw gender prediction: {answer}")

        # Normalize output
        if "man" in answer and "woman" not in answer:
            result = "Man"
        elif "woman" in answer:
            result = "Woman"
        else:
            result = "Man"
        logger.debug(f"Normalized gender prediction: {result}")
        return result
    except Exception as e:
        logger.error(f"Error predicting gender: {str(e)}", exc_info=True)
        # Default to Man if there's an error
        return "Man"

def convert_image_to_jpeg(input_path):
    logger.debug(f"Converting image to JPEG: {input_path}")
    try:
        with Image.open(input_path) as img:
            output_path = os.path.splitext(input_path)[0] + ".jpeg"
            img.convert("RGB").save(output_path, "JPEG")
        logger.debug(f"Image converted to JPEG: {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error converting image to JPEG: {str(e)}", exc_info=True)
        raise

def resize_to_under_2mb(image_path):
    logger.debug(f"Resizing image to under 2MB: {image_path}")
    try:
        max_size = 2 * 1024 * 1024  # 2MB
        img = Image.open(image_path)
        img.thumbnail((1024, 1024), Image.LANCZOS)

        quality = 95
        while quality > 10:
            img.save(image_path, "JPEG", quality=quality)
            size = os.path.getsize(image_path)
            logger.debug(f"Image size at quality {quality}: {size} bytes")
            if size <= max_size:
                break
            quality -= 5

        logger.debug(f"Image resized to {os.path.getsize(image_path)} bytes with quality {quality}")
        return image_path
    except Exception as e:
        logger.error(f"Error resizing image: {str(e)}", exc_info=True)
        raise

def upload_image(image_path):
    logger.debug(f"Uploading image: {image_path}")
    try:
        # Check file name has extension 'jpeg' or not
        if not image_path.lower().endswith(('.jpeg')):
            image_path = convert_image_to_jpeg(image_path)

        file_size = os.path.getsize(image_path)
        logger.debug(f"Image size: {file_size} bytes")

        # If size image > 2MB, downsize it to 2MB
        if file_size > 2 * 1024 * 1024:
            image_path = resize_to_under_2mb(image_path)

        # Define the endpoint and headers
        url = "https://api.lightxeditor.com/external/api/v2/uploadImageUrl"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        }

        # Specify the upload parameters
        data = {
            "uploadType": "file",
            "size": os.path.getsize(image_path),
            "contentType": "image/jpeg"
        }

        logger.debug(f"Requesting presigned URL from: {url}")
        # Make the request to get the presigned URL
        response = requests.post(url, headers=headers, json=data)
        logger.debug(f"Presigned URL response status: {response.status_code}")

        if response.status_code == 200:
            upload_info = response.json()["body"]
            upload_url = upload_info.get("uploadImage")
            file_url = upload_info.get("imageUrl")

            logger.debug(f"Got presigned URL: {upload_url}")
            logger.debug(f"File URL will be: {file_url}")

            with open(image_path, "rb") as file:
                logger.debug(f"Uploading file to presigned URL")
                upload_response = requests.put(upload_url, data=file, headers={"Content-Type": "image/jpeg"})
                logger.debug(f"Upload response status: {upload_response.status_code}")

            # Check the upload response
            if upload_response.status_code != 200:
                logger.error(f"Failed to upload image: {upload_response.text}")
                raise HTTPException(status_code=500, detail=f"Failed to upload image: {upload_response.text}")

            logger.debug(f"Image uploaded successfully")
            return file_url
        else:
            logger.error(f"Failed to get presigned URL: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to get presigned URL: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Error in upload_image: {str(e)}", exc_info=True)
        raise

def generate_caricature(file_url, style_url="", prompt=""):
    logger.debug(f"Generating caricature for image: {file_url}")
    logger.debug(f"Style URL: {style_url}")
    logger.debug(f"Prompt: {prompt}")

    try:
        caricature_url = "https://api.lightxeditor.com/external/api/v1/caricature"

        # Set up the request headers
        caricature_headers = {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
        }

        # Define the payload with the fileKey
        caricature_data = {
            "imageUrl": file_url,
            "styleImageUrl": style_url,
            "textPrompt": prompt
        }

        logger.debug(f"Sending caricature request to: {caricature_url}")
        # Make the request to generate the caricature
        caricature_response = requests.post(caricature_url, headers=caricature_headers, json=caricature_data)
        logger.debug(f"Caricature response status: {caricature_response.status_code}")

        # Check the response
        if caricature_response.status_code != 200:
            logger.error(f"Failed to generate caricature: {caricature_response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to generate caricature: {caricature_response.text}")

        result = caricature_response.json()
        orderID = result["body"]["orderId"]
        logger.debug(f"Caricature generation started with order ID: {orderID}")
        return orderID
    except Exception as e:
        logger.error(f"Error in generate_caricature: {str(e)}", exc_info=True)
        raise

def get_output_url(orderID):
    logger.debug(f"Getting output URL for order ID: {orderID}")
    try:
        payload = {"orderId": orderID}
        url = 'https://api.lightxeditor.com/external/api/v1/order-status'
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        }
        max_retries = 20

        for attempt in range(max_retries):
            logger.debug(f"Checking order status, attempt {attempt+1}/{max_retries}")
            time.sleep(1)
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            logger.debug(f"Order status response: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                logger.debug(f"Order status: {result}")

                if result["body"]["status"] == "active":
                    image_url = result["body"]["output"]
                    if image_url:
                        logger.debug(f"Got output URL: {image_url}")
                        return image_url
                    else:
                        logger.debug("Output URL is empty, will retry")

            # If we're on the last attempt and still no success
            if attempt == max_retries - 1:
                logger.error(f"Failed to get order status after {max_retries} attempts")
                raise HTTPException(status_code=500, detail=f"Failed to get order status after {max_retries} attempts")
    except Exception as e:
        logger.error(f"Error in get_output_url: {str(e)}", exc_info=True)
        raise

def download_and_add_logo(image_url, logo_path, output_path, position="top-left", logo_scale=0.1, padding=10):
    """
    Downloads an image from a URL, adds a logo, and saves the result.
    """
    logger.debug(f"Downloading image from: {image_url}")
    logger.debug(f"Logo path: {logo_path}")
    logger.debug(f"Output path: {output_path}")
    logger.debug(f"Logo position: {position}")

    try:
        # Handle position if it's a tuple
        if isinstance(position, tuple) and len(position) > 0:
            position = position[0]

        response = requests.get(image_url)
        if response.status_code != 200:
            logger.error(f"Failed to download image: {response.status_code}")
            raise HTTPException(status_code=500, detail=f"Failed to download image: {response.status_code}")

        main_img = Image.open(BytesIO(response.content)).convert("RGBA")
        logger.debug(f"Image downloaded, size: {main_img.size}")

        # Load and resize logo
        if not os.path.exists(logo_path):
            logger.error(f"Logo file not found: {logo_path}")
            raise HTTPException(status_code=500, detail=f"Logo file not found: {logo_path}")

        logo = Image.open(logo_path).convert("RGBA")
        main_width, main_height = main_img.size
        new_logo_width = int(main_width * logo_scale)
        aspect_ratio = logo.height / logo.width
        new_logo_height = int(new_logo_width * aspect_ratio)
        logo = logo.resize((new_logo_width, new_logo_height), Image.LANCZOS)
        logger.debug(f"Logo resized to: {new_logo_width}x{new_logo_height}")

        # Compute position
        positions = {
            "top-left": (padding, padding),
            "top-right": (main_width - new_logo_width - padding, padding),
            "bottom-left": (padding, main_height - new_logo_height - padding),
            "bottom-right": (main_width - new_logo_width - padding, main_height - new_logo_height - padding),
        }

        if position not in positions:
            logger.error(f"Invalid position: {position}")
            raise HTTPException(status_code=400, detail=f"Invalid position: {position}. Choose from: top-left, top-right, bottom-left, bottom-right.")

        # Add logo to image
        logo_pos = positions[position]
        logger.debug(f"Adding logo at position: {logo_pos}")
        main_img.paste(logo, logo_pos, mask=logo)

        if output_path.lower().endswith(('.jpg', '.jpeg')):
            main_img = main_img.convert("RGB")

        # Save image
        main_img.save(output_path)
        logger.debug(f"Image with logo saved to: {output_path}")

        return output_path
    except Exception as e:
        logger.error(f"Error in download_and_add_logo: {str(e)}", exc_info=True)
        raise

@app.post("/generate-caricature/")
async def caricature_pipeline(
    file: UploadFile = File(...),
    logo_position: str = "bottom-right",
    logo_scale: float = 0.1,
    logo_padding: int = 10
):
    """
    Generate a caricature from an uploaded image.
    """
    logger.info(f"Caricature request received for file: {file.filename}")

    # Save uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    logger.debug(f"Saving uploaded file to {temp_file_path}")

    with open(temp_file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        # Predict gender
        logger.debug("Predicting gender...")
        gender = await predict_gender(temp_file_path)
        logger.debug(f"Gender predicted: {gender}")

        # Upload image to service
        logger.debug("Uploading image...")
        file_url = upload_image(temp_file_path)
        logger.debug(f"Image uploaded, URL: {file_url}")

        # Set style and prompt based on gender
        if gender == "Woman":
            style_url = "https://d2v5dzhdg4zhx3.cloudfront.net/product_thumb/a8ff8c9a-13ec-4fe2-9a06-72c9570872d9.jpg"
            prompt = "((caricature style)), (full body, female), small body, big head (.8), caricature, caricature of a corporate employee, corporate employee outfit"
        else:
            style_url = "https://d2v5dzhdg4zhx3.cloudfront.net/product_thumb/7a12a146-a906-490b-8801-2cf7f3f565a5.jpg"
            prompt = "caricature, big head, small body, a politician with a costume"

        logger.debug(f"Using style URL: {style_url}")
        logger.debug(f"Using prompt: {prompt}")

        # Generate caricature
        logger.debug("Generating caricature...")
        orderID = generate_caricature(file_url=file_url, style_url=style_url, prompt=prompt)
        logger.debug(f"Caricature generated, order ID: {orderID}")

        # Get the output URL
        logger.debug("Getting output URL...")
        caricature_url = get_output_url(orderID)
        logger.debug(f"Output URL received: {caricature_url}")

        # Create a unique output filename
        timestamp = int(time.time())
        output_filename = f"output/caricature_{timestamp}.jpg"
        logger.debug(f"Output filename: {output_filename}")

        # Download and add logo
        logger.debug("Downloading and adding logo...")
        logo_path = "data/logo-lts.png"

        # Check if logo file exists
        if not os.path.exists(logo_path):
            logger.error(f"Logo file not found at {logo_path}")
            raise HTTPException(status_code=500, detail=f"Logo file not found at {logo_path}")

        output_path = download_and_add_logo(
            caricature_url, 
            logo_path, 
            output_filename,
            position=logo_position,
            logo_scale=logo_scale,
            padding=logo_padding
        )
        logger.debug(f"Logo added, output saved to {output_path}")

        # Return the processed image
        logger.debug("Returning file response...")
        return FileResponse(output_path, media_type="image/jpeg", filename=f"caricature_{timestamp}.jpg")

    except Exception as e:
        logger.error(f"Error in caricature pipeline: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            logger.debug(f"Cleaning up temporary file {temp_file_path}")
            os.remove(temp_file_path)

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, log_level="info")

